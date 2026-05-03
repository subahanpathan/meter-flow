/**
 * Compute billing fields from totalRequests (pure function)
 * @param {number} totalRequests
 */
function computeBillingFromTotal(totalRequests) {
  const freeRequests = 1000;
  const billableRequests = Math.max(0, totalRequests - freeRequests);
  const ratePerHundred = 0.50;
  const amount = (billableRequests / 100) * ratePerHundred;

  return {
    totalRequests,
    freeRequests,
    billableRequests,
    amount: parseFloat(amount.toFixed(2)),
  };
}

module.exports = { computeBillingFromTotal };
