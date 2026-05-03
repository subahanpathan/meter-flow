const APIKey = require('../models/apikey.model');
const { hashKey } = require('../utils/hashKey');
const { errorResponse } = require('../utils/response');

/**
 * Validates the API key from the x-api-key header
 */
const validateApiKey = async (req, res, next) => {
  const apiKeyRaw = req.headers['x-api-key'];

  if (!apiKeyRaw) {
    return errorResponse(res, 'API key required', 401);
  }

  try {
    const keyHash = hashKey(apiKeyRaw);
    
    const apiKey = await APIKey.findOne({ keyHash });

    if (!apiKey) {
      return errorResponse(res, 'Invalid API key', 401);
    }

    if (apiKey.status === 'revoked') {
      return errorResponse(res, 'API key has been revoked', 403);
    }

    // ✅ SECURITY: Check if API key has expired
    if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
      return errorResponse(res, 'API key has expired', 401);
    }

    // Attach key and owner info to request
    req.apiKey = apiKey;
    req.apiOwner = apiKey.userId;

    next();
  } catch (error) {
    return errorResponse(res, 'Error validating API key', 500);
  }
};

module.exports = validateApiKey;
