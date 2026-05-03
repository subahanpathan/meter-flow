const crypto = require('crypto');

/**
 * Creates a SHA-256 hash of a raw API key
 * @param {string} rawKey - The raw API key
 * @returns {string} The hashed key
 */
const hashKey = (rawKey) => {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
};

/**
 * Compares a raw key against a stored hash
 * @param {string} rawKey - The raw API key
 * @param {string} hash - The stored hash
 * @returns {boolean}
 */
const compareKey = (rawKey, hash) => {
  const incomingHash = hashKey(rawKey);
  return crypto.timingSafeEqual(Buffer.from(incomingHash), Buffer.from(hash));
};

module.exports = {
  hashKey,
  compareKey,
};
