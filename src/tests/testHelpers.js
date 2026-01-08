import http from 'http';
import got from 'got';

/**
 * Start test server and create got HTTP client
 * @param {Object} t - Ava test context
 * @param {Object} app - Express app instance
 */
export const startServerAndClient = async (t, app) => {
  t.context.server = http.createServer(app);
  const server = t.context.server.listen();
  const { port } = server.address();
  t.context.got = got.extend({
    responseType: 'json',
    prefixUrl: `http://localhost:${port}`,
    throwHttpErrors: false,
  });
};

/**
 * Login a regular user and return token
 * @param {Object} gotClient - Got HTTP client
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<string>} - Auth token
 */
export const loginUser = async (gotClient, email, password) => {
  const res = await gotClient('api/users/login', {
    method: 'POST',
    json: { email, password },
  });
  if (res.statusCode === 200 && res.body.data) {
    return res.body.data.token;
  }
  throw new Error(`Login failed with status ${res.statusCode}`);
};

/**
 * Login a gym admin and return token
 * @param {Object} gotClient - Got HTTP client
 * @param {string} email - Admin email
 * @param {string} password - Admin password
 * @returns {Promise<string>} - Auth token
 */
export const loginGymAdmin = async (gotClient, email, password) => {
  const res = await gotClient('api/gymAdmins/login', {
    method: 'POST',
    json: { email, password },
  });
  if (res.statusCode === 200 && res.body.data) {
    return res.body.data.token;
  }
  throw new Error(`Login failed with status ${res.statusCode}`);
};

/**
 * Register a user and login to get token
 * @param {Object} gotClient - Got HTTP client
 * @param {Object} userPayload - User data {username, email, password}
 * @returns {Promise<Object>} - {token, userId}
 */
export const registerAndLogin = async (gotClient, userPayload) => {
  // Try to register (may already exist from seeding)
  await gotClient('api/users/register', {
    method: 'POST',
    json: userPayload,
  });

  // Login
  const { body: loginBody } = await gotClient('api/users/login', {
    method: 'POST',
    json: {
      email: userPayload.email,
      password: userPayload.password,
    },
  });

  return {
    token: loginBody.data?.token || loginBody.token,
    userId: loginBody.data?.user?._id || loginBody.data?._id,
  };
};

/**
 * Register a gym admin and login to get token
 * @param {Object} gotClient - Got HTTP client
 * @param {Object} adminPayload - Admin data {email, password}
 * @returns {Promise<Object>} - {token, adminId}
 */
export const registerAndLoginGymAdmin = async (gotClient, adminPayload) => {
  // Try to register
  await gotClient('api/gymAdmins', {
    method: 'POST',
    json: adminPayload,
  });

  // Login
  const { body: loginBody } = await gotClient('api/gymAdmins/login', {
    method: 'POST',
    json: {
      email: adminPayload.email,
      password: adminPayload.password,
    },
  });

  return {
    token: loginBody.data?.token || loginBody.token,
    adminId: loginBody.data?.admin?._id || loginBody.data?._id,
  };
};
