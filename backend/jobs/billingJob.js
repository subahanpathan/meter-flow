const { Queue, Worker } = require('bullmq');
const User = require('../models/user.model');
const { generateInvoice } = require('../services/billing.service');
const { redis } = require('../services/redis.service');

let billingQueue;
let billingWorker;

/**
 * Initialize billing jobs only if Redis is a real instance and connected
 */
const initBillingJobs = () => {
  // Check if it's a real ioredis instance and not our mock
  const isMock = redis.constructor.name === 'RedisMock';
  
  if (isMock) {
    console.warn('⚠️  Skipping billing job initialization (Redis not available).');
    return;
  }

  try {
    billingQueue = new Queue('billing', { connection: redis });

    billingWorker = new Worker('billing', async (job) => {
      console.log('Starting daily billing job...');
      
      const users = await User.find({ role: 'owner' });
      
      for (const user of users) {
        try {
          await generateInvoice(user._id);
          console.log(`Invoice updated for user: ${user.email}`);
        } catch (error) {
          console.error(`Failed to generate invoice for ${user.email}:`, error);
        }
      }
      
      console.log('Daily billing job completed.');
    }, { connection: redis });

    console.log('✅ Billing worker initialized.');
  } catch (error) {
    console.error('Failed to initialize BullMQ:', error.message);
  }
};

// Call initialization
initBillingJobs();

/**
 * Schedule the billing job to run daily at midnight
 */
const scheduleBillingJob = async () => {
  if (!billingQueue) return;

  try {
    // Remove existing repeatable jobs to avoid duplicates
    const repeatableJobs = await billingQueue.getRepeatableJobs();
    for (const job of repeatableJobs) {
      await billingQueue.removeRepeatableByKey(job.key);
    }

    await billingQueue.add('daily-billing', {}, {
      repeat: {
        pattern: '0 0 * * *' // Daily at midnight
      }
    });
    console.log('✅ Daily billing job scheduled.');
  } catch (error) {
    console.error('Failed to schedule billing job:', error.message);
  }
};

module.exports = {
  billingQueue,
  scheduleBillingJob
};
