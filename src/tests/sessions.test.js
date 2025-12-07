import test from 'ava';
import http from 'http';
import got from 'got';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import app from '../app.js';
import connectDB from '../config/database.js';
import Gym from '../models/gym.js';
import Session from '../models/session.js';
import User from '../models/user.js';

// ----------------------
// Helpers
// ----------------------

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

// Same pattern as in your user tests
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

// ----------------------
// Hooks
// ----------------------

test.before(async (t) => {
  // Start DB and server
  t.context.mongod = await connectDB();
  await startServerAndClient(t);

  // Ensure a gym exists
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

  // Ensure a session exists for that gym
  let session = await Session.findOne({ gymId: gym._id });
  if (!session) {
    session = await Session.create({
      name: 'Seed Session For Tests',
      gymId: gym._id,
      dateTime: new Date(),
      description: 'seed',
      type: 'Test',
      capacity: 5,
      trainerName: 'T Tester',
      participants: [],
    });
  } else {
    // clear participants to make booking tests predictable
    session.participants = [];
    await session.save();
  }
  t.context.session = session;

  // Create a user for session booking tests (same idea as user.test)
  await User.deleteMany({ email: 'sessiontestuser@example.com' });

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('sessionpassword123', salt);

  const user = await User.create({
    username: 'sessiontester',
    email: 'sessiontestuser@example.com',
    password: hashedPassword,
    role: 'user',
  });

  // Ensure user starts with empty bookedSessions
  user.bookedSessions = [];
  await user.save();

  t.context.user = user;
  t.context.userPassword = 'sessionpassword123';
});

test.after.always(async (t) => {
  if (t.context.server) t.context.server.close();
  await mongoose.disconnect();
  if (t.context.mongod) await t.context.mongod.stop();
});

// ----------------------
// Basic session endpoints
// ----------------------

test('GET /api/sessions returns array', async (t) => {
  const res = await t.context.got('api/sessions');
  t.is(res.statusCode, 200);
  t.true(res.body.success === true);
  t.true(Array.isArray(res.body.data));
});

test('GET /api/sessions/:id returns single session', async (t) => {
  const id = t.context.session._id.toString();
  const res = await t.context.got(`api/sessions/${id}`);
  t.is(res.statusCode, 200);
  t.true(res.body.success === true);
  t.is(res.body.data._id, id);
});

test('GET /api/sessions/:id with not-found id returns 404', async (t) => {
  const res = await t.context.got('api/sessions/000000000000000000000000');
  t.is(res.statusCode, 404);
});

test('POST /api/sessions creates a valid session', async (t) => {
  const payload = {
    name: 'Created By Test',
    gymId: t.context.gym._id.toString(),
    dateTime: new Date().toISOString(),
    description: 'desc',
    type: 'Pilates',
    capacity: 3,
    trainerName: 'Alex',
  };
  const res = await t.context.got('api/sessions', {
    method: 'POST',
    json: payload,
  });
  t.is(res.statusCode, 201);
  t.truthy(res.body.data);
  t.is(res.body.data.name, payload.name);
});

test('POST /api/sessions with invalid payload returns 400', async (t) => {
  const res = await t.context.got('api/sessions', {
    method: 'POST',
    json: { name: '', capacity: 0 },
  });
  t.is(res.statusCode, 400);
  t.true(res.body.success === false);
});

test('GET /api/sessions/search returns filtered results', async (t) => {
  const keyword = encodeURIComponent('Yoga'); // matches seeded mock data
  const res = await t.context.got(`api/sessions/search?keyword=${keyword}`);
  t.is(res.statusCode, 200);
  t.true(res.body.success === true);
  t.true(Array.isArray(res.body.data));
});

test('PUT /api/sessions/:id without auth returns 401', async (t) => {
  const id = t.context.session._id.toString();
  const res = await t.context.got(`api/sessions/${id}`, {
    method: 'PUT',
    json: { name: 'Trying Update' },
  });
  t.is(res.statusCode, 401);
});

test('DELETE /api/sessions/:id without auth returns 401', async (t) => {
  const id = t.context.session._id.toString();
  const res = await t.context.got(`api/sessions/${id}`, { method: 'DELETE' });
  t.is(res.statusCode, 401);
});

// ----------------------
// Booking-related endpoints (with auth)
// Routes used:
//   POST   /api/users/:userId/sessions       -> book
//   DELETE /api/users/:userId/sessions/:sid  -> unbook
//   GET    /api/users/:userId/sessions       -> list booked
// ----------------------

test.serial('POST /api/users/:userId/sessions books user into a session', async (t) => {
  const { got, user, userPassword, session } = t.context;

  const userId = user._id.toString();
  const sessionId = session._id.toString();

  const token = await loginUser(got, user.email, userPassword);

  const res = await got(`api/users/${userId}/sessions`, {
    method: 'POST',
    json: { sessionId },
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  t.is(res.statusCode, 200);
  t.true(res.body.success === true);
  t.is(res.body.message, 'User successfully booked into session.');

  const updatedSession = await Session.findById(sessionId);
  const updatedUser = await User.findById(userId);

  t.true(updatedSession.participants.map(String).includes(userId));
  t.true(updatedUser.bookedSessions.map(String).includes(sessionId));
});

test.serial('POST /api/users/:userId/sessions does not allow double booking', async (t) => {
  const { got, user, userPassword, session } = t.context;

  const userId = user._id.toString();
  const sessionId = session._id.toString();

  const token = await loginUser(got, user.email, userPassword);

  // First booking
  await got(`api/users/${userId}/sessions`, {
    method: 'POST',
    json: { sessionId },
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  // Second booking should fail
  const res2 = await got(`api/users/${userId}/sessions`, {
    method: 'POST',
    json: { sessionId },
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  t.is(res2.statusCode, 400);
  t.true(res2.body.success === false);
  t.is(res2.body.message, 'User already booked in this session');
});

test.serial('DELETE /api/users/:userId/sessions/:sessionId unbooks user from session', async (t) => {
  const { got, user, userPassword, session } = t.context;

  const userId = user._id.toString();
  const sessionId = session._id.toString();

  const token = await loginUser(got, user.email, userPassword);

  // Make sure user is booked
  await got(`api/users/${userId}/sessions`, {
    method: 'POST',
    json: { sessionId },
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  // Unbook
  const res = await got(`api/users/${userId}/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  t.is(res.statusCode, 200);
  t.true(res.body.success === true);
  t.is(res.body.message, 'User successfully unbooked from session.');

  const sessionAfter = await Session.findById(sessionId);
  const userAfter = await User.findById(userId);

  t.false(sessionAfter.participants.map(String).includes(userId));
  t.false(userAfter.bookedSessions.map(String).includes(sessionId));
});

test.serial('GET /api/users/:userId/sessions returns user booked sessions', async (t) => {
  const { got, user, userPassword, session } = t.context;

  const userId = user._id.toString();
  const sessionId = session._id.toString();

  const token = await loginUser(got, user.email, userPassword);

  // Book
  await got(`api/users/${userId}/sessions`, {
    method: 'POST',
    json: { sessionId },
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  // Get booked sessions
  const res = await got(`api/users/${userId}/sessions`, {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  t.is(res.statusCode, 200);
  t.true(res.body.success === true);
  t.true(Array.isArray(res.body.data));

  const ids = res.body.data.map((s) => s._id.toString());
  t.true(ids.includes(sessionId));
});

