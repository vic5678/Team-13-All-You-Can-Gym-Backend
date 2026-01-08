'use strict';

import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Breakpoint test: Incrementally increase load to find exact breaking point
export const options = {
  stages: [
    { duration: '30s', target: 500 },
    { duration: '1m', target: 500 },
    { duration: '30s', target: 1000 },
    { duration: '1m', target: 1000 },
    { duration: '30s', target: 1500 },
    { duration: '1m', target: 1500 },
    { duration: '30s', target: 2000 },
    { duration: '1m', target: 2000 },
    { duration: '30s', target: 2500 },
    { duration: '1m', target: 2500 },
    { duration: '30s', target: 3000 },
    { duration: '1m', target: 3000 },
    { duration: '30s', target: 4000 },
    { duration: '1m', target: 4000 },
    { duration: '30s', target: 5000 },
    { duration: '1m', target: 5000 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.8'],  // Allow test to continue even with high errors
  },
};

export default function () {
  // No sleep - maximum sustained pressure
  const responses = http.batch([
    ['GET', `${BASE_URL}/api/gyms`],
    ['GET', `${BASE_URL}/api/sessions`],
    ['GET', `${BASE_URL}/api/subscriptions`],
  ]);
  
  responses.forEach((response, index) => {
    check(response, {
      [`Request ${index} completed`]: (r) => r.status !== undefined,
      [`Request ${index} successful`]: (r) => r.status === 200,
    });
  });
  
    sleep(Math.random() * 5);
}
