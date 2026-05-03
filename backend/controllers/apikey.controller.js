const APIKey = require('../models/apikey.model');
const API = require('../models/api.model');
const { generateApiKey } = require('../utils/generateKey');
const { hashKey } = require('../utils/hashKey');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * @desc    Generate a new API key for an API
 * @route   POST /api/apis/:apiId/keys
 * @access  Private (Owner)
 */
exports.generateKey = async (req, res) => {
  const { apiId } = req.params;
  const { label } = req.body;

  try {
    // Verify API belongs to user
    const api = await API.findOne({ _id: apiId, userId: req.user._id });
    if (!api) {
      return errorResponse(res, 'API not found', 404);
    }

    // Generate key
    const rawKey = generateApiKey();
    const hashedKey = hashKey(rawKey);
    const keyPrefix = rawKey.substring(0, 8);

    const apiKey = await APIKey.create({
      apiId,
      userId: req.user._id,
      keyHash: hashedKey,
      keyPrefix,
      label: label || 'Default Key',
    });

    return successResponse(
      res,
      {
        rawKey, // RETURNED ONLY ONCE
        keyPrefix: apiKey.keyPrefix,
        label: apiKey.label,
        createdAt: apiKey.createdAt,
      },
      "Save this key — it won't be shown again",
      201
    );
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * @desc    Get all keys for a specific API
 * @route   GET /api/apis/:apiId/keys
 * @access  Private (Owner)
 */
exports.getKeys = async (req, res) => {
  const { apiId } = req.params;

  try {
    const keys = await APIKey.find({ apiId, userId: req.user._id })
      .select('-keyHash')
      .sort('-createdAt');

    return successResponse(res, keys, 'API keys retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * @desc    Revoke an API key
 * @route   PATCH /api/apis/:apiId/keys/:keyId/revoke
 * @access  Private (Owner)
 */
exports.revokeKey = async (req, res) => {
  const { keyId } = req.params;

  try {
    const key = await APIKey.findOne({ _id: keyId, userId: req.user._id });
    if (!key) {
      return errorResponse(res, 'API key not found', 404);
    }

    key.status = 'revoked';
    await key.save();

    return successResponse(res, key, 'API key revoked successfully');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * @desc    Rotate an API key (Revoke old, generate new)
 * @route   PATCH /api/apis/:apiId/keys/:keyId/rotate
 * @access  Private (Owner)
 */
exports.rotateKey = async (req, res) => {
  const { apiId, keyId } = req.params;

  try {
    const oldKey = await APIKey.findOne({ _id: keyId, userId: req.user._id });
    if (!oldKey) {
      return errorResponse(res, 'API key not found', 404);
    }

    // Revoke old key
    oldKey.status = 'revoked';
    await oldKey.save();

    // Generate new key
    const rawKey = generateApiKey();
    const hashedKey = hashKey(rawKey);
    const keyPrefix = rawKey.substring(0, 8);

    const newKey = await APIKey.create({
      apiId,
      userId: req.user._id,
      keyHash: hashedKey,
      keyPrefix,
      label: oldKey.label + ' (Rotated)',
    });

    return successResponse(
      res,
      {
        rawKey, // RETURNED ONLY ONCE
        keyPrefix: newKey.keyPrefix,
        label: newKey.label,
        createdAt: newKey.createdAt,
      },
      "New key generated. Save it — it won't be shown again",
      201
    );
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};
