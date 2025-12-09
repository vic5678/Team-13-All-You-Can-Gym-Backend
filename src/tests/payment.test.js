import test from 'ava';
import http from 'http';
import got from 'got';
import mongoose from 'mongoose';
import app from '../app.js';
import connectDB from '../config/database.js';
import User from '../models/user.js';
import Payment from '../models/payment.js';
import SubscriptionPackage from '../models/subscriptionPackage.js';

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

// Helper: Register and login a user
const registerAndLogin = async (gotClient, userPayload) => {
  // Try to register (may already exist from seeding)
  await gotClient('api/users/register', { 
    method: 'POST', 
    json: userPayload 
  });
  
  // Login
  const { body: loginBody } = await gotClient('api/users/login', { 
    method: 'POST', 
    json: { 
      email: userPayload.email, 
      password: userPayload.password 
    } 
  });
  
  return { 
    token: loginBody.data?.token || loginBody.token,
    userId: loginBody.data?.user?._id || loginBody.data?._id
  };
};

test.before(async (t) => {
  // Connect to in-memory MongoDB
  t.context.mongod = await connectDB();

  // Start server + got client
  await startServerAndClient(t);

  // Find or create a subscription package for testing
  let pkg = await SubscriptionPackage.findOne({ id: 'basic_monthly' });
  if (!pkg) {
    pkg = await SubscriptionPackage.create({
      id: 'basic_monthly',
      name: 'Basic Monthly',
      description: 'Test package',
      price: 29.99,
      durationDays: 30,
      sessionLimit: 10,
      gymLimit: 'unlimited'
    });
  }
  t.context.package = pkg;

  // Register and login a test user
  const userPayload = {
    username: 'paymentTestUser',
    email: 'payment@test.com',
    password: 'testpass123'
  };
  
  const authData = await registerAndLogin(t.context.got, userPayload);
  t.context.token = authData.token;
  t.context.userId = authData.userId;
});

test.after.always(async (t) => {
  if (t.context.server) t.context.server.close();
  await mongoose.disconnect();
  if (t.context.mongod && t.context.mongod.stop) {
    await t.context.mongod.stop();
  }
});

// ============ HAPPY PATH TESTS ============

test('POST /api/payments/checkout/:packageId processes valid payment', async (t) => {
  const packageId = t.context.package.id; // Use string id (e.g., 'basic_monthly')
  const payload = {
    cardNumber: '4111111111111111',
    expiryDate: '12/25',
    cvv: '123'
  };

  const res = await t.context.got(`api/payments/checkout/${packageId}`, {
    method: 'POST',
    json: payload,
    headers: {
      Authorization: `Bearer ${t.context.token}`
    }
  });

  t.is(res.statusCode, 200);
  t.true(res.body.success === true);
  t.truthy(res.body.data);
  t.truthy(res.body.data.transactionId);
  t.is(res.body.data.status, 'success');
  t.is(res.body.data.amount, t.context.package.price);
});

test('Payment is saved in database after successful processing', async (t) => {
  const packageId = t.context.package.id;
  const payload = {
    cardNumber: '4111111111111111',
    expiryDate: '12/26',
    cvv: '456'
  };

  await t.context.got(`api/payments/checkout/${packageId}`, {
    method: 'POST',
    json: payload,
    headers: {
      Authorization: `Bearer ${t.context.token}`
    }
  });

  // Check database for payment record
  const payment = await Payment.findOne({ 
    userId: t.context.userId,
    amount: t.context.package.price 
  }).sort({ createdAt: -1 });

  t.truthy(payment);
  t.is(payment.status, 'success');
  t.is(payment.amount, t.context.package.price);
  t.truthy(payment.transactionId);
});

// ============ ERROR PATH TESTS ============

test('POST /api/payments/checkout/:packageId without auth returns 401', async (t) => {
  const packageId = t.context.package.id;
  const payload = {
    cardNumber: '4111111111111111',
    expiryDate: '12/25',
    cvv: '123'
  };

  const res = await t.context.got(`api/payments/checkout/${packageId}`, {
    method: 'POST',
    json: payload
    // No Authorization header
  });

  t.is(res.statusCode, 401);
  t.true(res.body.success === false);
});

test('POST /api/payments/checkout/:packageId with invalid package returns 404', async (t) => {
  const payload = {
    cardNumber: '4111111111111111',
    expiryDate: '12/25',
    cvv: '123'
  };

  const res = await t.context.got('api/payments/checkout/invalid_package_id', {
    method: 'POST',
    json: payload,
    headers: {
      Authorization: `Bearer ${t.context.token}`
    }
  });

  t.is(res.statusCode, 404);
  t.true(res.body.success === false);
});

test('POST /api/payments/checkout/:packageId with missing cardNumber returns 400', async (t) => {
  const packageId = t.context.package.id;
  const payload = {
    // Missing cardNumber
    expiryDate: '12/25',
    cvv: '123'
  };

  const res = await t.context.got(`api/payments/checkout/${packageId}`, {
    method: 'POST',
    json: payload,
    headers: {
      Authorization: `Bearer ${t.context.token}`
    }
  });

  t.is(res.statusCode, 400);
  t.true(res.body.success === false);
});

test('POST /api/payments/checkout/:packageId with missing expiryDate returns 400', async (t) => {
  const packageId = t.context.package.id;
  const payload = {
    cardNumber: '4111111111111111',
    // Missing expiryDate
    cvv: '123'
  };

  const res = await t.context.got(`api/payments/checkout/${packageId}`, {
    method: 'POST',
    json: payload,
    headers: {
      Authorization: `Bearer ${t.context.token}`
    }
  });

  t.is(res.statusCode, 400);
  t.true(res.body.success === false);
});

test('POST /api/payments/checkout/:packageId with missing cvv returns 400', async (t) => {
  const packageId = t.context.package.id;
  const payload = {
    cardNumber: '4111111111111111',
    expiryDate: '12/25'
    // Missing cvv
  };

  const res = await t.context.got(`api/payments/checkout/${packageId}`, {
    method: 'POST',
    json: payload,
    headers: {
      Authorization: `Bearer ${t.context.token}`
    }
  });

  t.is(res.statusCode, 400);
  t.true(res.body.success === false);
});

test('POST /api/payments/checkout/:packageId with invalid cardNumber returns 400', async (t) => {
  const packageId = t.context.package.id;
  const payload = {
    cardNumber: '1234', // Too short
    expiryDate: '12/25',
    cvv: '123'
  };

  const res = await t.context.got(`api/payments/checkout/${packageId}`, {
    method: 'POST',
    json: payload,
    headers: {
      Authorization: `Bearer ${t.context.token}`
    }
  });

  t.is(res.statusCode, 400);
  t.true(res.body.success === false);
});

test('POST /api/payments/checkout/:packageId with expired card returns 400', async (t) => {
  const packageId = t.context.package.id;
  const payload = {
    cardNumber: '4111111111111111',
    expiryDate: '12/20', // Expired date
    cvv: '123'
  };

  const res = await t.context.got(`api/payments/checkout/${packageId}`, {
    method: 'POST',
    json: payload,
    headers: {
      Authorization: `Bearer ${t.context.token}`
    }
  });

  t.is(res.statusCode, 400);
  t.true(res.body.success === false);
});

test('POST /api/payments/checkout/:packageId with invalid CVV returns 400', async (t) => {
  const packageId = t.context.package.id;
  const payload = {
    cardNumber: '4111111111111111',
    expiryDate: '12/25',
    cvv: '12' // Too short
  };

  const res = await t.context.got(`api/payments/checkout/${packageId}`, {
    method: 'POST',
    json: payload,
    headers: {
      Authorization: `Bearer ${t.context.token}`
    }
  });

  t.is(res.statusCode, 400);
  t.true(res.body.success === false);
});

// ============ EDGE CASE TESTS ============

test('POST /api/payments/checkout/:packageId with empty payload returns 400', async (t) => {
  const packageId = t.context.package.id;
  
  const res = await t.context.got(`api/payments/checkout/${packageId}`, {
    method: 'POST',
    json: {},
    headers: {
      Authorization: `Bearer ${t.context.token}`
    }
  });

  t.is(res.statusCode, 400);
  t.true(res.body.success === false);
});

test('POST /api/payments/checkout/:packageId with invalid token returns 401', async (t) => {
  const packageId = t.context.package.id;
  const payload = {
    cardNumber: '4111111111111111',
    expiryDate: '12/25',
    cvv: '123'
  };

  const res = await t.context.got(`api/payments/checkout/${packageId}`, {
    method: 'POST',
    json: payload,
    headers: {
      Authorization: 'Bearer invalid_token_xyz'
    }
  });

  t.is(res.statusCode, 401);
  t.true(res.body.success === false);
});

test('POST /api/payments/checkout/:packageId amount is set server-side', async (t) => {
  const packageId = t.context.package.id;
  const payload = {
    cardNumber: '4111111111111111',
    expiryDate: '12/25',
    cvv: '123',
    amount: 999.99 // Attempting to override amount (should be ignored)
  };

  const res = await t.context.got(`api/payments/checkout/${packageId}`, {
    method: 'POST',
    json: payload,
    headers: {
      Authorization: `Bearer ${t.context.token}`
    }
  });

  t.is(res.statusCode, 200);
  // Verify amount matches package price, not user-supplied value
  t.is(res.body.data.amount, t.context.package.price);
  t.not(res.body.data.amount, 999.99);
});

test('Multiple payments can be processed for same user', async (t) => {
  const packageId = t.context.package.id;
  const payload = {
    cardNumber: '4111111111111111',
    expiryDate: '12/25',
    cvv: '123'
  };

  // Process first payment
  const res1 = await t.context.got(`api/payments/checkout/${packageId}`, {
    method: 'POST',
    json: payload,
    headers: {
      Authorization: `Bearer ${t.context.token}`
    }
  });

  // Process second payment
  const res2 = await t.context.got(`api/payments/checkout/${packageId}`, {
    method: 'POST',
    json: payload,
    headers: {
      Authorization: `Bearer ${t.context.token}`
    }
  });

  t.is(res1.statusCode, 200);
  t.is(res2.statusCode, 200);
  t.not(res1.body.data.transactionId, res2.body.data.transactionId);
});
