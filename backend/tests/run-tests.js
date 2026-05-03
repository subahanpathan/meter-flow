const assert = require('assert');
const { computeBillingFromTotal } = require('../services/billing.utils');

function test_computeBilling() {
  // No usage
  let res = computeBillingFromTotal(0);
  assert.strictEqual(res.totalRequests, 0);
  assert.strictEqual(res.freeRequests, 1000);
  assert.strictEqual(res.billableRequests, 0);
  assert.strictEqual(res.amount, 0);

  // Exactly at free tier
  res = computeBillingFromTotal(1000);
  assert.strictEqual(res.billableRequests, 0);
  assert.strictEqual(res.amount, 0);

  // Some billable traffic
  res = computeBillingFromTotal(1600);
  // 600 billable -> 600/100 * 0.5 = 3.0
  assert.strictEqual(res.billableRequests, 600);
  assert.strictEqual(res.amount, 3.0);

  console.log('computeBillingFromTotal tests passed');
}

function run() {
  try {
    test_computeBilling();
    console.log('\nAll tests passed');
    process.exit(0);
  } catch (err) {
    console.error('Test failure:', err);
    process.exit(1);
  }
}

run();
