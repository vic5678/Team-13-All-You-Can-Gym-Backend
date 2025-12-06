import test from 'ava';
import http from 'http';
import got from 'got';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import app from '../app.js';
import connectDB from '../config/database.js';
import GymAdmin from '../models/gymAdmin.js';
import Gym from '../models/gym.js';

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

const loginGymAdmin = async (gotClient, email, password) => {
  const res = await gotClient('api/gymAdmins/login', {
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

  // Create a gym admin for testing with proper password hashing
  await GymAdmin.deleteMany({ email: 'testadmin@gym.com' });
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('testpassword123', salt);
  const admin = await GymAdmin.create({
    username: 'testadmin',
    email: 'testadmin@gym.com',
    password: hashedPassword,
    gyms: [gym._id],
  });
  t.context.admin = admin;
  t.context.adminPassword = 'testpassword123';
});

test.after.always(async (t) => {
  if (t.context.server) t.context.server.close();
  await mongoose.disconnect();
  if (t.context.mongod) await t.context.mongod.stop();
});

test('POST /api/gymAdmins creates a new gym admin', async (t) => {
  const payload = {
    username: 'newadmin',
    email: 'newadmin@gym.com',
    password: 'password123',
  };
  const res = await t.context.got('api/gymAdmins', {
    method: 'POST',
    json: payload,
  });
  t.is(res.statusCode, 201);
  t.truthy(res.body.data);
  t.is(res.body.data.username, payload.username);
  t.is(res.body.data.email, payload.email);
});

test('POST /api/gymAdmins with invalid payload returns 500', async (t) => {
  // missing required fields
  const res = await t.context.got('api/gymAdmins', {
    method: 'POST',
    json: { username: 'testuser' },
  });
  t.is(res.statusCode, 500);
  t.true(res.body.success === false);
});

test('GET /api/gymAdmins/:id returns single gym admin', async (t) => {
  const adminId = t.context.admin._id.toString();
  const token = await loginGymAdmin(
    t.context.got,
    'testadmin@gym.com',
    t.context.adminPassword
  );
  const res = await t.context.got(`api/gymAdmins/${adminId}`, {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });
  t.is(res.statusCode, 200);
  t.true(res.body.success === true);
  t.is(res.body.data._id, adminId);
});

test('GET /api/gymAdmins/:id with not-found id returns 401 without auth', async (t) => {
  // Without auth, should return 401
  const res = await t.context.got('api/gymAdmins/000000000000000000000000');
  t.is(res.statusCode, 401);
});

test('GET /api/gymAdmins/:id with not-found id returns 404 with auth', async (t) => {
  const token = await loginGymAdmin(
    t.context.got,
    'testadmin@gym.com',
    t.context.adminPassword
  );
  const res = await t.context.got('api/gymAdmins/000000000000000000000000', {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });
  t.is(res.statusCode, 404);
});

test('GET /api/gymAdmins/:id without auth returns 401', async (t) => {
  const adminId = t.context.admin._id.toString();
  const res = await t.context.got(`api/gymAdmins/${adminId}`);
  t.is(res.statusCode, 401);
});

test('POST /api/gymAdmins/login with valid credentials returns token', async (t) => {
  const res = await t.context.got('api/gymAdmins/login', {
    method: 'POST',
    json: {
      email: 'testadmin@gym.com',
      password: t.context.adminPassword,
    },
  });
  t.is(res.statusCode, 200);
  t.true(res.body.success === true);
  t.truthy(res.body.data.token);
});

test('POST /api/gymAdmins/login with invalid credentials returns 401', async (t) => {
  const res = await t.context.got('api/gymAdmins/login', {
    method: 'POST',
    json: {
      email: 'testadmin@gym.com',
      password: 'wrongpassword',
    },
  });
  t.is(res.statusCode, 401);
});

test('POST /api/gymAdmins/login without required fields returns 400', async (t) => {
  const res = await t.context.got('api/gymAdmins/login', {
    method: 'POST',
    json: { email: 'testadmin@gym.com' },
  });
  t.is(res.statusCode, 400);
});

test('POST /api/gymAdmins/:adminId/gyms adds gym to admin', async (t) => {
  const adminId = t.context.admin._id.toString();
  const gymId = t.context.gym._id.toString();
  const token = await loginGymAdmin(
    t.context.got,
    'testadmin@gym.com',
    t.context.adminPassword
  );
  const res = await t.context.got(`api/gymAdmins/${adminId}/gyms`, {
    method: 'POST',
    json: { gymId },
    headers: {
      authorization: `Bearer ${token}`,
    },
  });
  t.is(res.statusCode, 200);
  t.true(res.body.success === true);
  t.truthy(res.body.data.gyms);
});

test('POST /api/gymAdmins/:adminId/gyms without auth returns 401', async (t) => {
  const adminId = t.context.admin._id.toString();
  const gymId = t.context.gym._id.toString();
  const res = await t.context.got(`api/gymAdmins/${adminId}/gyms`, {
    method: 'POST',
    json: { gymId },
  });
  t.is(res.statusCode, 401);
});

test('POST /api/gymAdmins/:adminId/gyms with invalid admin id returns error', async (t) => {
  const gymId = t.context.gym._id.toString();
  const token = await loginGymAdmin(
    t.context.got,
    'testadmin@gym.com',
    t.context.adminPassword
  );
  const res = await t.context.got('api/gymAdmins/000000000000000000000000/gyms', {
    method: 'POST',
    json: { gymId },
    headers: {
      authorization: `Bearer ${token}`,
    },
  });
  // Invalid admin ID should return an error status
  t.true(res.statusCode >= 400);
});

test('GET /api/gymAdmins/:id with invalid ID format returns 500', async (t) => {
  const token = await loginGymAdmin(
    t.context.got,
    'testadmin@gym.com',
    t.context.adminPassword
  );
  const res = await t.context.got('api/gymAdmins/invalididformat', {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });
  t.is(res.statusCode, 500);
});
