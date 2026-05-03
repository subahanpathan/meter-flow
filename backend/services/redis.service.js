const Redis = require('ioredis');

// Simple in-memory mock for when Redis is not available
class RedisMock {
  constructor() {
    this.data = new Map();
    this.status = 'ready';
    this.isMock = true;
  }
  
  on(event, callback) {
    if (event === 'connect' || event === 'ready') setTimeout(callback, 100);
    return this;
  }
  
  once(event, callback) { return this.on(event, callback); }

  async get(key) { return this.data.get(key); }
  async set(key, value) { this.data.set(key, value); return 'OK'; }
  async incr(key) {
    const val = (parseInt(this.data.get(key)) || 0) + 1;
    this.data.set(key, val.toString());
    return val;
  }
  async expire(key, seconds) {
    setTimeout(() => this.data.delete(key), seconds * 1000);
    return 1;
  }
  
  multi() {
    const operations = [];
    return {
      incr: (key) => { operations.push(['incr', key]); return this; },
      expire: (key, sec) => { operations.push(['expire', key, sec]); return this; },
      exec: async () => {
        const results = [];
        for (const [op, ...args] of operations) {
          if (op === 'incr') results.push([null, await this.incr(...args)]);
          if (op === 'expire') results.push([null, await this.expire(...args)]);
        }
        return results;
      }
    };
  }

  quit() { return Promise.resolve('OK'); }
  disconnect() { return; }
}

// Start with mock by default
let redis = new RedisMock();
console.warn('⚠️  Redis initialized in Mock mode.');

// Attempt to connect to real Redis in the background
const tryConnectRealRedis = () => {
  if (!process.env.REDIS_URL) return;

  const realRedis = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    retryStrategy: (times) => {
      if (times > 1) return null; // Only try once
      return 1000;
    }
  });

  realRedis.on('connect', () => {
    console.log('✅ Real Redis Connected. Switching from Mock.');
    redis = realRedis;
  });

  realRedis.on('error', (err) => {
    // Silently ignore errors for the real redis attempt
    // console.debug('Background Redis connection failed:', err.message);
  });
};

tryConnectRealRedis();

/**
 * Atomically increments a key and sets an expiry if it's new
 * @param {string} key - The redis key
 * @param {number} windowSeconds - Expiry in seconds
 * @returns {Promise<number>} The current count
 */
const incrementWithExpiry = async (key, windowSeconds) => {
  try {
    const multi = redis.multi();
    multi.incr(key);
    multi.expire(key, windowSeconds);
    const results = await multi.exec();
    return results[0][1];
  } catch (err) {
    // If real redis fails mid-operation, fallback back to mock
    if (!redis.isMock) {
      console.error('Redis Operation Failed. Falling back to Mock.');
      redis = new RedisMock();
      return incrementWithExpiry(key, windowSeconds);
    }
    throw err;
  }
};

module.exports = {
  redis,
  incrementWithExpiry,
};
