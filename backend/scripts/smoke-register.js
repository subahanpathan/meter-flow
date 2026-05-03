const axios = require('axios');
const crypto = require('crypto');

const BASE = process.env.BASE_URL || 'http://localhost:5000';
const ENDPOINT = `${BASE}/api/auth/register`;

const makePayload = (i) => ({
  name: `Smoke User ${i}`,
  email: `smoke-${Date.now()}-${i}@example.com`,
  password: 'Password@123'
});

const run = async () => {
  const attempts = 8; // send 8 quick attempts (limit is 5 per 15min)
  const promises = [];

  for (let i = 0; i < attempts; i++) {
    const payload = makePayload(i);
    promises.push(
      axios
        .post(ENDPOINT, payload, { timeout: 5000 })
        .then((res) => ({ ok: true, status: res.status, data: res.data }))
        .catch((err) => {
          if (err.response) return { ok: false, status: err.response.status, data: err.response.data };
          return { ok: false, status: null, data: err.message };
        })
    );
  }

  const results = await Promise.all(promises);

  results.forEach((r, idx) => {
    console.log(`Attempt ${idx + 1}:`, r.status, r.data && (r.data.message || JSON.stringify(r.data)));
  });
};

run().catch((e) => console.error('Smoke test failed:', e));
