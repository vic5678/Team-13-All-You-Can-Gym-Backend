import test from 'ava';
import http from 'http';
import got from 'got';
import mongoose from 'mongoose';
import app from '../app.js';
import connectDB from '../config/database.js';
import Gym from '../models/gym.js';
import Session from '../models/session.js';

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

const registerAndLogin = async (gotClient, userPayload) => {
  // Register user
  const reg = await gotClient('api/users/register', { method: 'POST', json: userPayload });
  if (reg.statusCode !== 201 && reg.statusCode !== 200) {
    // If already exists, try login
  }
  // Login
  const { body: loginBody } = await gotClient('api/users/login', { method: 'POST', json: { email: userPayload.email, password: userPayload.password } });
  return { token: loginBody.data?.token || loginBody.data?.token || loginBody.token || (loginBody.data && loginBody.data.token) };
};
// END helpers

test.before(async (t) => {
  // Start DB and get in-memory mongo server instance
  t.context.mongod = await connectDB();

  // Start server + got client
  await startServerAndClient(t);

  // Grab a seeded gym and session (from your database mock in connectDB)
  // If none exist, create minimal ones
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

  // Ensure at least one session exists
  let session = await Session.findOne({ gymId: gym._id });
  if (!session) {
    session = await Session.create({
      name: 'Seed Session For Tests',
      gymId: gym._id,
      dateTime: new Date(),
      description: 'seed',
      type: 'Test',
      capacity: 5,
      trainerName: 'T Tester'
    });
  }
  t.context.session = session;
});

test.after.always(async (t) => {
  if (t.context.server) t.context.server.close();
  await mongoose.disconnect();
  if (t.context.mongod) await t.context.mongod.stop();
});

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
    trainerName: 'Alex'
  };
  const res = await t.context.got('api/sessions', { method: 'POST', json: payload });
  t.is(res.statusCode, 201);
  t.truthy(res.body.data);
  t.is(res.body.data.name, payload.name);
});

test('POST /api/sessions with invalid payload returns 400', async (t) => {
  // missing gymId & required fields
  const res = await t.context.got('api/sessions', { method: 'POST', json: { name: '', capacity: 0 } });
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
  const res = await t.context.got(`api/sessions/${id}`, { method: 'PUT', json: { name: 'Trying Update' } });
  t.is(res.statusCode, 401);
});

test('DELETE /api/sessions/:id without auth returns 401', async (t) => {
  const id = t.context.session._id.toString();
  const res = await t.context.got(`api/sessions/${id}`, { method: 'DELETE' });
  t.is(res.statusCode, 401);
});


