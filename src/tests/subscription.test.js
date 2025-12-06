import test from 'ava';
import http from 'http';
import got from 'got';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import app from '../app.js';
import connectDB from '../config/database.js';
import User from '../models/user.js';
import Subscription from '../models/subscription.js';
import SubscriptionPackage from '../models/subscriptionPackage.js';

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

  // Create test user
  await User.deleteMany({ email: 'subtest@example.com' });
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('testpassword123', salt);
  const user = await User.create({
    username: 'subtest',
    email: 'subtest@example.com',
    password: hashedPassword,
    role: 'user',
    isSubscribed: false,
  });
  t.context.user = user;
  t.context.userPassword = 'testpassword123';

  // Create test subscription packages
  await SubscriptionPackage.deleteMany({});
  const package1 = await SubscriptionPackage.create({
    id: 'basic-monthly',
    name: 'Basic Monthly',
    description: 'Basic monthly subscription',
    price: 29.99,
    durationDays: 30,
    sessionLimit: 10,
    gymLimit: '1',
  });
  const package2 = await SubscriptionPackage.create({
    id: 'premium-monthly',
    name: 'Premium Monthly',
    description: 'Premium monthly subscription',
    price: 49.99,
    durationDays: 30,
    sessionLimit: 20,
    gymLimit: 'unlimited',
  });
  t.context.package1 = package1;
  t.context.package2 = package2;
});

test.after.always(async (t) => {
  if (t.context.server) t.context.server.close();
  await mongoose.disconnect();
  if (t.context.mongod) await t.context.mongod.stop();
});

test('GET /api/subscriptions returns all subscription packages', async (t) => {
  const token = await loginUser(
    t.context.got,
    'subtest@example.com',
    t.context.userPassword
  );
  const res = await t.context.got('api/subscriptions', {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });
  t.is(res.statusCode, 200);
  t.true(res.body.success);
  t.true(Array.isArray(res.body.data));
  t.true(res.body.data.length >= 2);
});

test('GET /api/subscriptions/:id returns single package', async (t) => {
  const token = await loginUser(
    t.context.got,
    'subtest@example.com',
    t.context.userPassword
  );
  const packageId = t.context.package1._id.toString();
  const res = await t.context.got(`api/subscriptions/${packageId}`, {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });
  t.is(res.statusCode, 200);
  t.true(res.body.success);
  t.is(res.body.data._id, packageId);
});

test('GET /api/subscriptions/:id with invalid id returns 404', async (t) => {
  const token = await loginUser(
    t.context.got,
    'subtest@example.com',
    t.context.userPassword
  );
  const res = await t.context.got('api/subscriptions/000000000000000000000000', {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });
  t.is(res.statusCode, 404);
  t.false(res.body.success);
});

test('GET /api/subscriptions/packages/:id handles server error', async (t) => {
  const token = await loginUser(
    t.context.got,
    'subtest@example.com',
    t.context.userPassword
  );
  const res = await t.context.got('api/subscriptions/invalid-id-format', {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });
  t.true(res.statusCode >= 400);
});

test('POST /api/users/:userid/subscription creates a new subscription', async (t) => {
  const token = await loginUser(
    t.context.got,
    'subtest@example.com',
    t.context.userPassword
  );
  const payload = {
    userId: t.context.user._id.toString(), // check this
    subscriptionPackageId: t.context.package1._id.toString(),
    startDate: new Date().toISOString(),
  };
  const res = await t.context.got(`api/users/${t.context.user._id.toString()}/subscription`, {
    method: 'POST',
    json: payload,
    headers: {
      authorization: `Bearer ${token}`,
    },
  });
  t.is(res.statusCode, 201);
  t.true(res.body.success);
  t.truthy(res.body.data);
  t.is(res.body.data.userId, payload.userId);
  t.context.subscription = res.body.data;
});

test('POST /api/users/:userid/subscription with invalid package id returns 404', async (t) => {
  const token = await loginUser(
    t.context.got,
    'subtest@example.com',
    t.context.userPassword
  );
  const payload = {
    userId: t.context.user._id.toString(),
    subscriptionPackageId: '000000000000000000000000',
    startDate: new Date().toISOString(),
  };
  const res = await t.context.got(`api/users/${t.context.user._id.toString()}/subscription`, {
    method: 'POST',
    json: payload,
    headers: {
      authorization: `Bearer ${token}`,
    },
  });
  t.is(res.statusCode, 404);
  t.false(res.body.success);
});

test('POST /api/users/:userId/subscription handles server error', async (t) => {
  const token = await loginUser(
    t.context.got,
    'subtest@example.com',
    t.context.userPassword
  );
  const payload = {
    userId: 'invalid-user-id',
    subscriptionPackageId: t.context.package1._id.toString(),
    startDate: new Date().toISOString(),
  };
  const res = await t.context.got(`api/users/${payload.userId}/subscription`, {
    method: 'POST',
    json: payload,
    headers: {
      authorization: `Bearer ${token}`,
    },
  });
  t.true(res.statusCode >= 400);
  t.false(res.body.success);
});

test('GET /api/users/:userId/subscription returns user subscriptions', async (t) => {
  const token = await loginUser(
    t.context.got,
    'subtest@example.com',
    t.context.userPassword
  );
  const userId = t.context.user._id.toString();
  const res = await t.context.got(`api/users/${userId}/subscription`, {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });
  t.is(res.statusCode, 200);
  t.true(res.body.success);
  t.true(Array.isArray(res.body.data));
});

test('GET /api/users/:userId/subscription without auth returns 401', async (t) => {
  const userId = t.context.user._id.toString();
  const res = await t.context.got(`api/users/${userId}/subscription`);
  t.is(res.statusCode, 401);
});


test('PUT /api/users/:userId/subscription/:subscriptionId updates subscription', async (t) => {
  // Create a subscription first
  const subscription = await Subscription.create({
    userId: t.context.user._id,
    packageId: t.context.package1._id,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    isActive: true,
  });

  const token = await loginUser(
    t.context.got,
    'subtest@example.com',
    t.context.userPassword
  );

  const userId = t.context.user._id.toString();
  const subscriptionId = subscription._id.toString();
  const res = await t.context.got(`api/users/${userId}/subscription/${subscriptionId}`, {
    method: 'PUT',
    json: { isActive: false },
    headers: {
      authorization: `Bearer ${token}`,
    },
  });
  t.is(res.statusCode, 200);
  t.true(res.body.success);
  t.is(res.body.data.isActive, false);
});

test('PUT /api/users/:userId/:subscriptionId with invalid id returns 404', async (t) => {
  const token = await loginUser(
    t.context.got,
    'subtest@example.com',
    t.context.userPassword
  );
  const userId = t.context.user._id.toString();
  const res = await t.context.got(`api/users/${userId}/subscription/000000000000000000000000`, {
    method: 'PUT',
    json: { isActive: false },
    headers: {
      authorization: `Bearer ${token}`,
    },
  });
  t.is(res.statusCode, 404);
  t.false(res.body.success);
});

test('PUT /api/users/:userId/:subscriptionId handles server error', async (t) => {
  const token = await loginUser(
    t.context.got,
    'subtest@example.com',
    t.context.userPassword
  );
  const userId = t.context.user._id.toString();
  const res = await t.context.got(`api/users/${userId}/subscription/invalid-id`, {
    method: 'PUT',
    json: { isActive: false },
    headers: {
      authorization: `Bearer ${token}`,
    },
  });
  t.true(res.statusCode >= 400);
});

test('DELETE /api/users/:userId/subscription/:subscriptionId cancels subscription', async (t) => {
    const token = await loginUser(
        t.context.got,
        'subtest@example.com',
        t.context.userPassword
    );

    const userId = t.context.user._id.toString();
    
    // Create a subscription first via the API
    const createPayload = {
        userId: userId,
        subscriptionPackageId: t.context.package1._id.toString(),
        startDate: new Date().toISOString(),
    };
    const createRes = await t.context.got(`api/users/${userId}/subscription`, {
        method: 'POST',
        json: createPayload,
        headers: {
            authorization: `Bearer ${token}`,
        },
    });
    t.is(createRes.statusCode, 201, 'Failed to create subscription before deleting');
    const subscriptionId = createRes.body.data._id;
    console.log('Created subscription ID for deletion:', subscriptionId);
    // Test the delete endpoint
    const res = await t.context.got(`api/users/${userId}/subscription/${subscriptionId}`, {
        method: 'DELETE',
        headers: {
            authorization: `Bearer ${token}`,
        },
    });
    t.is(res.statusCode, 200);
    t.true(res.body.success);
});

test('DELETE /api/users/:userId/subscription/:subscriptionId with invalid id returns 404', async (t) => {
  const token = await loginUser(
    t.context.got,
    'subtest@example.com',
    t.context.userPassword
  );
  const userId = t.context.user._id.toString();
  const res = await t.context.got(`api/users/${userId}/subscription/000000000000000000000000`, {
    method: 'DELETE',
    headers: {
      authorization: `Bearer ${token}`,
    },
  });
  t.is(res.statusCode, 404);
  t.false(res.body.success);
});

test('DELETE /api/users/:userId/subscription/:subscriptionId without auth returns 401', async (t) => {
  const userId = t.context.user._id.toString();
  const subscriptionId = '000000000000000000000000';
  const res = await t.context.got(`api/users/${userId}/subscription/${subscriptionId}`, {
    method: 'DELETE',
  });
  console.log(res.statusCode, res.body);
  t.is(res.statusCode, 401);
});

test('DELETE /api/users/:userId/subscription/:subscriptionId handles server error', async (t) => {
  const token = await loginUser(
    t.context.got,
    'subtest@example.com',
    t.context.userPassword
  );
  const userId = t.context.user._id.toString();
  const res = await t.context.got(`api/users/${userId}/subscription/invalid-id`, {
    method: 'DELETE',
    headers: {
      authorization: `Bearer ${token}`,
    },
  });
  t.true(res.statusCode >= 400);
});
