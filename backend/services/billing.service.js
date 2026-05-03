const UsageLog = require('../models/usagelog.model');
const Billing = require('../models/billing.model');
const User = require('../models/user.model');

/**
 * Calculates billing stats for a user in a given period
 * @param {string} userId 
 * @param {Date} periodStart 
 * @param {Date} periodEnd 
 */
const calculateBilling = async (userId, periodStart, periodEnd) => {
  const stats = await UsageLog.aggregate([
    {
      $match: {
        userId,
        timestamp: { $gte: periodStart, $lte: periodEnd }
      }
    },
    {
      $group: {
        _id: '$userId',
        totalRequests: { $sum: 1 }
      }
    }
  ]);

  const totalRequests = stats[0]?.totalRequests || 0;
  // Consider user plan for free requests
  const user = await User.findById(userId).select('plan');
  const freeRequests = user && user.plan === 'pro' ? 5000 : 1000;
  const billableRequests = Math.max(0, totalRequests - freeRequests);
  const ratePerHundred = 0.50; // ₹0.50 per 100 requests
  const amount = (billableRequests / 100) * ratePerHundred;

  return {
    totalRequests,
    freeRequests,
    billableRequests,
    amount: parseFloat(amount.toFixed(2)),
  };
};

/**
 * Generates or updates an invoice for the current month
 * @param {string} userId 
 */
const generateInvoice = async (userId) => {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const billingData = await calculateBilling(userId, periodStart, periodEnd);
  // Use atomic upsert to avoid race conditions
  const filter = { userId, periodStart, periodEnd };
  const update = {
    $set: {
      totalRequests: billingData.totalRequests,
      billableRequests: billingData.billableRequests,
      amount: billingData.amount,
      freeRequests: billingData.freeRequests,
      currency: 'INR',
      status: 'pending',
    },
    $setOnInsert: {
      userId,
      periodStart,
      periodEnd,
      createdAt: new Date(),
    },
  };

  const options = { upsert: true, new: true, setDefaultsOnInsert: true };

  const billing = await Billing.findOneAndUpdate(filter, update, options).exec();

  return billing;
};

module.exports = {
  calculateBilling,
  generateInvoice
};
