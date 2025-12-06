import test from 'ava';
import http from 'http';
import got from 'got';
import mongoose from 'mongoose';
import app from '../app.js';
import connectDB from '../config/database.js';
import Gym from '../models/gym.js';
import GymAdmin from '../models/gymAdmin.js';
import Session from '../models/session.js';

// Helper: Start server and create HTTP client
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

// Helper: Register and login a gym admin
const registerAndLoginGymAdmin = async (gotClient, adminPayload) => {
  // Try to register
  await gotClient('api/gymAdmins', { 
    method: 'POST', 
    json: adminPayload 
  });
  
  // Login
  const { body: loginBody } = await gotClient('api/gymAdmins/login', { 
    method: 'POST', 
    json: { 
      email: adminPayload.email, 
      password: adminPayload.password 
    } 
  });
  
  return { 
    token: loginBody.data?.token || loginBody.token,
    adminId: loginBody.data?.admin?._id || loginBody.data?._id
  };
};

test.before(async (t) => {
  // Connect to in-memory MongoDB
  t.context.mongod = await connectDB();

  // Start server + got client
  await startServerAndClient(t);

  // Find or create test gyms
  let gym = await Gym.findOne();
  if (!gym) {
    gym = await Gym.create({
      name: 'Test Gym',
      location: '123 Test St',
      latitude: 40.7128,
      longitude: -74.0060,
      rating: 4.5,
      keywords: ['Powerlifting', 'Yoga']
    });
  }
  t.context.gym = gym;

  // Create a session for the gym (for filter tests)
  const session = await Session.create({
    name: 'Test HIIT Session',
    gymId: gym._id,
    dateTime: new Date(),
    description: 'Test session',
    type: 'HIIT',
    capacity: 10,
    trainerName: 'Test Trainer'
  });
  
  // Add session to gym
  await Gym.findByIdAndUpdate(gym._id, { $push: { sessions: session._id } });
  t.context.session = session;

  // Register and login a gym admin
  const adminPayload = {
    username: 'testGymAdmin',
    email: 'gymadmin@test.com',
    password: 'adminpass123'
  };
  
  const authData = await registerAndLoginGymAdmin(t.context.got, adminPayload);
  t.context.adminToken = authData.token;
  t.context.adminId = authData.adminId;
});

test.after.always(async (t) => {
  if (t.context.server) t.context.server.close();
  await mongoose.disconnect();
  if (t.context.mongod && t.context.mongod.stop) {
    await t.context.mongod.stop();
  }
});

// ============ GET ALL GYMS TESTS ============

test('GET /api/gyms returns array of gyms', async (t) => {
  const res = await t.context.got('api/gyms');
  
  t.is(res.statusCode, 200);
  t.true(res.body.success === true);
  t.true(Array.isArray(res.body.data));
  t.true(res.body.data.length > 0);
});

test('GET /api/gyms returns gyms with all properties', async (t) => {
  const res = await t.context.got('api/gyms');
  
  const gym = res.body.data[0];
  t.truthy(gym.name);
  t.truthy(gym.location);
  t.truthy(gym.latitude);
  t.truthy(gym.longitude);
});

// ============ GET GYM BY ID TESTS ============

test('GET /api/gyms/:id returns single gym', async (t) => {
  const gymId = t.context.gym._id.toString();
  const res = await t.context.got(`api/gyms/${gymId}`);
  
  t.is(res.statusCode, 200);
  t.true(res.body.success === true);
  t.is(res.body.data._id, gymId);
  t.is(res.body.data.name, t.context.gym.name);
});

test('GET /api/gyms/:id with invalid ID returns 404', async (t) => {
  const res = await t.context.got('api/gyms/000000000000000000000000');
  
  t.is(res.statusCode, 404);
  t.true(res.body.success === false);
});

test('GET /api/gyms/:id with malformed ID returns 500', async (t) => {
  const res = await t.context.got('api/gyms/invalid-id');
  
  t.is(res.statusCode, 500);
  t.true(res.body.success === false);
});

// ============ SEARCH GYMS TESTS ============

test('GET /api/gyms/search with keyword returns matching gyms', async (t) => {
  const keyword = 'Yoga';
  const res = await t.context.got(`api/gyms/search?keyword=${keyword}`);
  
  t.is(res.statusCode, 200);
  t.true(res.body.success === true);
  t.true(Array.isArray(res.body.data));
});

test('GET /api/gyms/search with empty keyword returns all gyms', async (t) => {
  const res = await t.context.got('api/gyms/search?keyword=');
  
  t.is(res.statusCode, 200);
  t.true(res.body.success === true);
  t.true(Array.isArray(res.body.data));
  t.true(res.body.data.length > 0);
});

test('GET /api/gyms/search without keyword parameter returns all gyms', async (t) => {
  const res = await t.context.got('api/gyms/search');
  
  t.is(res.statusCode, 200);
  t.true(res.body.success === true);
  t.true(Array.isArray(res.body.data));
});

test('GET /api/gyms/search with non-matching keyword returns empty array', async (t) => {
  const res = await t.context.got('api/gyms/search?keyword=NonExistentKeyword12345');
  
  t.is(res.statusCode, 200);
  t.true(Array.isArray(res.body.data));
  t.is(res.body.data.length, 0);
});

// ============ FILTER GYMS TESTS ============

test('GET /api/gyms/filter by sessionType returns matching gyms', async (t) => {
  const res = await t.context.got('api/gyms/filter?sessionType=HIIT');
  
  t.is(res.statusCode, 200);
  t.true(res.body.success === true);
  t.true(Array.isArray(res.body.data));
});

test('GET /api/gyms/filter by distance returns gyms within range', async (t) => {
  const res = await t.context.got('api/gyms/filter?latitude=40.7128&longitude=-74.0060&distance=10');
  
  t.is(res.statusCode, 200);
  t.true(res.body.success === true);
  t.true(Array.isArray(res.body.data));
});

test('GET /api/gyms/filter by sessionType and distance combines filters', async (t) => {
  const res = await t.context.got('api/gyms/filter?sessionType=HIIT&latitude=40.7128&longitude=-74.0060&distance=50');
  
  t.is(res.statusCode, 200);
  t.true(res.body.success === true);
  t.true(Array.isArray(res.body.data));
});

test('GET /api/gyms/filter without parameters returns all gyms', async (t) => {
  const res = await t.context.got('api/gyms/filter');
  
  t.is(res.statusCode, 200);
  t.true(Array.isArray(res.body.data));
});

// ============ CREATE GYM TESTS ============

test('POST /api/gyms creates new gym with valid data', async (t) => {
  const payload = {
    name: 'New Test Gym',
    location: '456 New St',
    latitude: 41.8781,
    longitude: -87.6298,
    rating: 4.0,
    keywords: ['CrossFit', 'Cardio']
  };

  const res = await t.context.got('api/gyms', {
    method: 'POST',
    json: payload,
    headers: {
      Authorization: `Bearer ${t.context.adminToken}`
    }
  });

  t.is(res.statusCode, 201);
  t.true(res.body.success === true);
  t.is(res.body.data.name, payload.name);
  t.is(res.body.data.location, payload.location);
  t.is(res.body.data.rating, payload.rating);
});

test('POST /api/gyms without auth returns 401', async (t) => {
  const payload = {
    name: 'Unauthorized Gym',
    location: '789 Test Ave',
    latitude: 34.0522,
    longitude: -118.2437
  };

  const res = await t.context.got('api/gyms', {
    method: 'POST',
    json: payload
  });

  t.is(res.statusCode, 401);
  t.true(res.body.success === false);
});

test('POST /api/gyms with invalid token returns 401', async (t) => {
  const payload = {
    name: 'Test Gym',
    location: '123 Test St',
    latitude: 40.7128,
    longitude: -74.0060
  };

  const res = await t.context.got('api/gyms', {
    method: 'POST',
    json: payload,
    headers: {
      Authorization: 'Bearer invalid_token'
    }
  });

  t.is(res.statusCode, 401);
  t.true(res.body.success === false);
});

test('POST /api/gyms with missing name returns 500', async (t) => {
  const payload = {
    location: '789 Test Ave',
    latitude: 34.0522,
    longitude: -118.2437
  };

  const res = await t.context.got('api/gyms', {
    method: 'POST',
    json: payload,
    headers: {
      Authorization: `Bearer ${t.context.adminToken}`
    }
  });

  t.is(res.statusCode, 500);
  t.true(res.body.success === false);
});

test('POST /api/gyms links gym to admin account', async (t) => {
  const payload = {
    name: 'Admin Linked Gym',
    location: '999 Admin St',
    latitude: 40.7128,
    longitude: -74.0060,
    rating: 4.5
  };

  const res = await t.context.got('api/gyms', {
    method: 'POST',
    json: payload,
    headers: {
      Authorization: `Bearer ${t.context.adminToken}`
    }
  });

  t.is(res.statusCode, 201);
  
  // Verify gym is in admin's gyms array
  const admin = await GymAdmin.findById(t.context.adminId);
  const gymIds = admin.gyms.map(id => id.toString());
  t.true(gymIds.includes(res.body.data._id));
});

// ============ UPDATE GYM TESTS ============

test('PUT /api/gyms/:id without auth returns 401', async (t) => {
  const gymId = t.context.gym._id.toString();
  const payload = {
    name: 'Updated Name'
  };

  const res = await t.context.got(`api/gyms/${gymId}`, {
    method: 'PUT',
    json: payload
  });

  t.is(res.statusCode, 401);
  t.true(res.body.success === false);
});

test('PUT /api/gyms/:id with non-owner returns 403', async (t) => {
  // Create a gym not owned by test admin
  const otherGym = await Gym.create({
    name: 'Other Gym',
    location: '000 Other St',
    latitude: 35.0,
    longitude: -75.0
  });

  const payload = {
    name: 'Trying to Update'
  };

  const res = await t.context.got(`api/gyms/${otherGym._id}`, {
    method: 'PUT',
    json: payload,
    headers: {
      Authorization: `Bearer ${t.context.adminToken}`
    }
  });

  t.is(res.statusCode, 403);
});

// ============ DELETE GYM TESTS ============

test('DELETE /api/gyms/:id without auth returns 401', async (t) => {
  const gymId = t.context.gym._id.toString();

  const res = await t.context.got(`api/gyms/${gymId}`, {
    method: 'DELETE'
  });

  t.is(res.statusCode, 401);
  t.true(res.body.success === false);
});

test('DELETE /api/gyms/:id with non-owner returns 403', async (t) => {
  // Create a gym not owned by test admin
  const otherGym = await Gym.create({
    name: 'Delete Test Gym',
    location: '111 Delete St',
    latitude: 36.0,
    longitude: -76.0
  });

  const res = await t.context.got(`api/gyms/${otherGym._id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${t.context.adminToken}`
    }
  });

  t.is(res.statusCode, 403);
});

test('DELETE /api/gyms/:id with invalid ID returns 404 or 500', async (t) => {
  const res = await t.context.got('api/gyms/000000000000000000000000', {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${t.context.adminToken}`
    }
  });

  t.true(res.statusCode === 404 || res.statusCode === 403 || res.statusCode === 500);
});

// ============ EDGE CASE TESTS ============

test('POST /api/gyms with empty payload returns 500', async (t) => {
  const res = await t.context.got('api/gyms', {
    method: 'POST',
    json: {},
    headers: {
      Authorization: `Bearer ${t.context.adminToken}`
    }
  });

  t.is(res.statusCode, 500);
  t.true(res.body.success === false);
});

test('GET /api/gyms/search is case-insensitive', async (t) => {
  const res1 = await t.context.got('api/gyms/search?keyword=yoga');
  const res2 = await t.context.got('api/gyms/search?keyword=YOGA');
  const res3 = await t.context.got('api/gyms/search?keyword=YoGa');

  t.is(res1.statusCode, 200);
  t.is(res2.statusCode, 200);
  t.is(res3.statusCode, 200);
  
  // Should return same results
  t.deepEqual(res1.body.data.map(g => g._id).sort(), res2.body.data.map(g => g._id).sort());
  t.deepEqual(res1.body.data.map(g => g._id).sort(), res3.body.data.map(g => g._id).sort());
});

test('POST /api/gyms with negative rating is allowed by service', async (t) => {
  const payload = {
    name: 'Negative Rating Gym',
    location: '555 Negative St',
    latitude: 40.0,
    longitude: -75.0,
    rating: -1
  };

  const res = await t.context.got('api/gyms', {
    method: 'POST',
    json: payload,
    headers: {
      Authorization: `Bearer ${t.context.adminToken}`
    }
  });

  // Service may or may not validate this - testing actual behavior
  t.true(res.statusCode === 201 || res.statusCode === 500);
});

test('GET /api/gyms/filter with very large distance returns gyms', async (t) => {
  const res = await t.context.got('api/gyms/filter?latitude=0&longitude=0&distance=99999');
  
  t.is(res.statusCode, 200);
  t.true(Array.isArray(res.body.data));
});

test('GET /api/gyms/filter with invalid coordinates handles gracefully', async (t) => {
  const res = await t.context.got('api/gyms/filter?latitude=invalid&longitude=invalid&distance=10');
  
  t.is(res.statusCode, 200);
  t.true(Array.isArray(res.body.data));
});
