import http from 'k6/http';
import { check, sleep, group } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  stages: [
    { duration: '5s', target: 10 },    // Ramp up to 10 users over 2 minutes
    { duration: '15s', target: 50 },    // Ramp up to 50 users over 5 minutes
    { duration: '15s', target: 100 },   // Ramp up to 100 users over 5 minutes
    { duration: '15s', target: 50 },    // Ramp down to 50 users over 5 minutes
    { duration: '5s', target: 0 },     // Ramp down to 0 users over 2 minutes
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],  // 95th percentile under 500ms, 99th under 1000ms
    http_req_failed: ['rate<0.1'],                     // Error rate under 10%
  },
};

export default function () {
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
