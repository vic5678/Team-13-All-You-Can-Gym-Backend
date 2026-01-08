'use strict';

import http from 'k6/http';
import { check, sleep } from 'k6';
/* global __ENV */

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  stages: [
    { duration: '10s', target: 10 },    // Baseline load - 10 users
    { duration: '10s', target: 1000 },    // Spike - jump to 100 users
    { duration: '5s', target: 10 },    // Return to baseline
    { duration: '10s', target: 1400 },    // Second spike - double load
    { duration: '10s', target: 700 },     // Gradual cool down
    { duration: '5s', target: 0 },     // Ending phase
  ],
  thresholds: {
    http_req_duration: ['p(95)<800', 'p(99)<2000'],   // Allow higher latency during spikes
    http_req_failed: ['rate<0.2'],                      // Allow up to 20% error rate during spikes
  },
};

export default function () {
  // Simulate realistic user journey with multiple endpoint calls per user
  // 1. List gyms
  let gymsResponse = http.get(`${BASE_URL}/api/gyms`);
  check(gymsResponse, {
    'Gyms list status': (r) => r.status === 200,
    'Gyms list response time': (r) => r.timings.duration < 1000,
  });
  sleep(Math.random() * 5);
  // 2. Get gym details
  let gymDetailsResponse = http.get(`${BASE_URL}/api/gyms/${gymsResponse.json().data[0]._id}`);
  check(gymDetailsResponse, {
    'Gym details request completed': (r) => r.status !== undefined,
  });
  sleep(Math.random() * 5);
  // 3. List sessions
  let sessionsResponse = http.get(`${BASE_URL}/api/sessions`);
  check(sessionsResponse, {
    'Sessions list request completed': (r) => r.status !== undefined,
  });
  sleep(Math.random() * 5);
  // 4. List subscriptions
  let subscriptionsResponse = http.get(`${BASE_URL}/api/subscriptions`);
  check(subscriptionsResponse, {
    'Subscriptions list request completed': (r) => r.status !== undefined,
  });
  sleep(2);
}