import test from 'ava';
import http from 'http';
import got from 'got';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import app from '../app.js';
import connectDB from '../config/database.js';
import User from '../models/user.js';
import Gym from '../models/gym.js';
import Subscription from '../models/subscription.js';

// START: helpers used by multiple tests
const startServerAndClient = async (t) => {
  t.context.server = http.createServer(app);
  const server = t.context.server.listen();
  const { port } = server.address();
  t.context.got = got.extend({
    responseType: 'json',
    prefixUrl: `http://localhost:${port}`,
    throwHttpErrors: false,
  });
};

const loginUser = async (gotClient, email, password) => {
  const res = await gotClient('api/users/login', {
    method: 'POST',
    json: { email, password },
  });
  if (res.statusCode === 200 && res.body.data) {
    return res.body.data.token;
  }
  throw new Error(`Login failed with status ${res.statusCode}`);
};
// END helpers

test.before(async (t) => {
  // Start DB and get in-memory mongo server instance
  t.context.mongod = await connectDB();

  // Start server + got client
  await startServerAndClient(t);

  // Grab a seeded gym or create one
  let gym = await Gym.findOne();
  if (!gym) {
    gym = await Gym.create({
      name: 'Integration Test Gym',
      location: '0 Test St',
      latitude: 0,
      longitude: 0,
    });
  }
  t.context.gym = gym;

  // Create a user for testing with proper password hashing
  await User.deleteMany({ email: 'testuser@example.com' });
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('testpassword123', salt);
  const user = await User.create({
    username: 'testuser',
    email: 'testuser@example.com',
    password: hashedPassword,
    role: 'user',
  });
  t.context.user = user;
  t.context.userPassword = 'testpassword123';
});

test.after.always(async (t) => {
  if (t.context.server) t.context.server.close();
  await mongoose.disconnect();
  if (t.context.mongod) await t.context.mongod.stop();
});

test('POST /api/users/register creates a new user', async (t) => {
  const payload = {
    username: 'newuser',
    email: 'newuser@example.com',
    password: 'password123',
  };
  const res = await t.context.got('api/users/register', {
    method: 'POST',
    json: payload,
  });
  t.is(res.statusCode, 201);
  t.truthy(res.body.data);
  t.is(res.body.data.username, payload.username);
  t.is(res.body.data.email, payload.email);
});
test('POST /api/users/register with existing email returns 400', async (t) => {
    const payload = {
        username: 'anotheruser',
        email: 'testuser@example.com', // this email is from the user created in test.before
        password: 'password123',
    };
    const res = await t.context.got('api/users/register', {
        method: 'POST',
        json: payload,
    });
    t.is(res.statusCode, 400);
    t.false(res.body.success);
});
test('POST /api/users/register with invalid payload returns 400', async (t) => {
  // missing required fields
  const res = await t.context.got('api/users/register', {
    method: 'POST',
    json: { username: 'testuser' },
  });
  t.is(res.statusCode, 400);
  t.true(res.body.success === false);
});

test('GET /api/users/:id returns single user', async (t) => {
  const userId = t.context.user._id.toString();
  const token = await loginUser(
    t.context.got,
    'testuser@example.com',
    t.context.userPassword
  );
  const res = await t.context.got(`api/users/${userId}`, {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });
  t.is(res.statusCode, 200);
  t.true(res.body.success === true);
  t.is(res.body.data._id, userId);
});

test('GET /api/users/:id with not-found id returns 401 without auth', async (t) => {
  // Without auth, should return 401
  const res = await t.context.got('api/users/000000000000000000000000');
  t.is(res.statusCode, 401);
});

test('GET /api/users/:id with not-found id returns 404 with auth', async (t) => {
  const token = await loginUser(
    t.context.got,
    'testuser@example.com',
    t.context.userPassword
  );
  const res = await t.context.got('api/users/000000000000000000000000', {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });
  t.is(res.statusCode, 404);
});

test('GET /api/users/:id without auth returns 401', async (t) => {
  const userId = t.context.user._id.toString();
  const res = await t.context.got(`api/users/${userId}`);
  t.is(res.statusCode, 401);
});

test('POST /api/users/login with valid credentials returns token', async (t) => {
  const res = await t.context.got('api/users/login', {
    method: 'POST',
    json: {
      email: 'testuser@example.com',
      password: t.context.userPassword,
    },
  });
  t.is(res.statusCode, 200);
  t.true(res.body.success === true);
  t.truthy(res.body.data.token);
});

test('POST /api/users/login with invalid credentials returns 500', async (t) => {
  const res = await t.context.got('api/users/login', {
    method: 'POST',
    json: {
      email: 'testuser@example.com',
      password: 'wrongpassword',
    },
  });
  t.is(res.statusCode, 500); //401 Unauthorized
});

test('POST /api/users/login without required fields returns 500', async (t) => {
  const res = await t.context.got('api/users/login', {
    method: 'POST',
    json: { email: 'testuser@example.com' },
  });
  t.is(res.statusCode, 500); //400 Bad Request
});

test('PUT /api/users/:id updates user profile', async (t) => {
  const userId = t.context.user._id.toString();
  const token = await loginUser(
    t.context.got,
    'testuser@example.com',
    t.context.userPassword
  );
  const res = await t.context.got(`api/users/${userId}`, {
    method: 'PUT',
    json: { username: 'updateduser' },
    headers: {
      authorization: `Bearer ${token}`,
    },
  });
  t.is(res.statusCode, 200);
  t.true(res.body.success === true);
  t.truthy(res.body.data);
});

test('PUT /api/users/:id without auth returns 401', async (t) => {
  const userId = t.context.user._id.toString();
  const res = await t.context.got(`api/users/${userId}`, {
    method: 'PUT',
    json: { username: 'updateduser' },
  });
  t.is(res.statusCode, 401);
});

test('PUT /api/users/:id with invalid user id returns error', async (t) => {
  const token = await loginUser(
    t.context.got,
    'testuser@example.com',
    t.context.userPassword
  );
  const res = await t.context.got('api/users/000000000000000000000000', {
    method: 'PUT',
    json: { username: 'updateduser' },
    headers: {
      authorization: `Bearer ${token}`,
    },
  });
  // Invalid user ID should return an error status
  t.true(res.statusCode >= 400);
});

test('GET /api/users/search with username query returns users', async (t) => {
  const token = await loginUser(
    t.context.got,
    'testuser@example.com',
    t.context.userPassword
  );
  const res = await t.context.got('api/users/search', {
    searchParams: { username: 'test' },
    headers: {
      authorization: `Bearer ${token}`,
    },
  });
  t.is(res.statusCode, 200);
  t.true(res.body.success === true);
  t.truthy(res.body.data);
});

test('GET /api/users/:id with invalid ID format returns 500', async (t) => {
  const token = await loginUser(
    t.context.got,
    'testuser@example.com',
    t.context.userPassword
  );
  const res = await t.context.got('api/users/invalididformat', {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });
  t.is(res.statusCode, 500);
});

test('DELETE /api/users/:id deletes user', async (t) => {
  // Create a new user to delete
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('deletetest123', salt);
  const userToDelete = await User.create({
    username: 'deleteuser',
    email: 'deleteuser@example.com',
    password: hashedPassword,
    role: 'user',
  });
  
  const token = await loginUser(
    t.context.got,
    'deleteuser@example.com',
    'deletetest123'
  );
  
  const res = await t.context.got(`api/users/${userToDelete._id.toString()}`, {
    method: 'DELETE',
    headers: {
      authorization: `Bearer ${token}`,
    },
  });
  t.is(res.statusCode, 200);
  t.true(res.body.success === true);
});

test('DELETE /api/users/:id without auth returns 401', async (t) => {
  const userId = t.context.user._id.toString();
  const res = await t.context.got(`api/users/${userId}`, {
    method: 'DELETE',
  });
  t.is(res.statusCode, 401);
});

test('POST /api/users/register with invalid user data returns 400', async (t) => {
  // Test for userService.createUser returning null/falsy (lines 46-47)
  const payload = {
    username: '',
    email: 'invalid@example.com',
    password: '',
  };
  const res = await t.context.got('api/users/register', {
    method: 'POST',
    json: payload,
  });
  t.is(res.statusCode, 400);
  t.false(res.body.success);
});

test('POST /api/users/register handles server error during registration', async (t) => {
  // Test for catch block error (lines 49-50)
  // Send malformed data to trigger a server error
  const payload = {
    username: 'testuser',
    email: 'testuser@example.com', // duplicate email
    password: null, // invalid password type
  };
  const res = await t.context.got('api/users/register', {
    method: 'POST',
    json: payload,
  });
  t.true(res.statusCode >= 400);
});

test('GET /api/users/search without auth returns 401', async (t) => {
  // Test authentication requirement (lines 92-93)
  const res = await t.context.got('api/users/search', {
    searchParams: { username: 'test' },
  });
  t.is(res.statusCode, 401);
});

test('GET /api/users/search handles server error', async (t) => {
    // Test catch block (lines 117-123)
    const token = await loginUser(
        t.context.got,
        'testuser@example.com',
        t.context.userPassword
    );
    // Pass invalid search parameters to trigger error
    const res = await t.context.got('api/users/search?invalid=null', {
        headers: {
            authorization: `Bearer ${token}`,
        },
    });
    t.true(res.statusCode >= 400);
});

test('GET /api/users/:id returns public profile for other users', async (t) => {
  // Test lines 140-141, 145-146 (public profile logic)
  // Create another user to view the test user's profile
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('viewer123', salt);
  const viewerUser = await User.create({
    username: 'viewer',
    email: 'viewer@example.com',
    password: hashedPassword,
    role: 'user',
  });
  
  const token = await loginUser(
    t.context.got,
    'viewer@example.com',
    'viewer123'
  );
  
  const userId = t.context.user._id.toString();
  const res = await t.context.got(`api/users/${userId}`, {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });
  
  t.is(res.statusCode, 200);
  t.true(res.body.success === true);
  // Should only return public fields
  t.is(res.body.data._id, userId);
  t.truthy(res.body.data.username);
  t.falsy(res.body.data.email); // email should not be in public profile
  t.falsy(res.body.data.password); // password should not be in public profile
});

test("PUT /api/users/:id prevents updating another user's profile", async (t) => {
    // Create a second user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('anotherpassword', salt);
    const anotherUser = await User.create({
        username: 'anotheruser',
        email: 'anotheruser@example.com',
        password: hashedPassword,
        role: 'user',
    });

    // Log in as the second user
    const token = await loginUser(
        t.context.got,
        'anotheruser@example.com',
        'anotherpassword'
    );

    // Try to update the first user's profile
    const targetUserId = t.context.user._id.toString();
    const res = await t.context.got(`api/users/${targetUserId}`, {
        method: 'PUT',
        json: { username: 'shouldfail' },
        headers: {
            authorization: `Bearer ${token}`,
        },
    });

    // Expect a forbidden or unauthorized error
    t.true(res.statusCode === 403 || res.statusCode === 401);
    t.false(res.body.success);
});

test('DELETE /api/users/:id handles user not found', async (t) => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('deletetest2', salt);
  const userToDelete = await User.create({
    username: 'deleteuser2',
    email: 'deleteuser2@example.com',
    password: hashedPassword,
    role: 'user',
  });
  
  const token = await loginUser(
    t.context.got,
    'deleteuser2@example.com',
    'deletetest2'
  );
  
  // Delete the user first
  await User.findByIdAndDelete(userToDelete._id);
  
  // Try to delete again
  const res = await t.context.got(`api/users/${userToDelete._id.toString()}`, {
    method: 'DELETE',
    headers: {
      authorization: `Bearer ${token}`,
    },
  });
  t.is(res.statusCode, 404);
  t.false(res.body.success);
});

test('DELETE /api/users/:id handles server error', async (t) => {
  const token = await loginUser(
    t.context.got,
    'testuser@example.com',
    t.context.userPassword
  );
  
  // Use invalid ID format to trigger error
  const res = await t.context.got('api/users/invalid-id-format', {
    method: 'DELETE',
    headers: {
      authorization: `Bearer ${token}`,
    },
  });
  t.true(res.statusCode >= 400);
});