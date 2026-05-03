const crypto = require('crypto');

/**
 * Generates a secure random API key
 * Format: mf_live_{32 random hex chars}
 * @returns {string} The raw API key
 */
const generateApiKey = () => {
  const randomChars = crypto.randomBytes(16).toString('hex');
  return `mf_live_${randomChars}`;
};

module.exports = {
  generateApiKey,
};
