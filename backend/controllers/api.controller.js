const API = require('../models/api.model');
const APIKey = require('../models/apikey.model');
const { validationResult } = require('express-validator');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * @desc    Create a new API
 * @route   POST /api/apis
 * @access  Private (Owner)
 */
exports.createApi = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 'Validation error', 422, errors.array());
  }

  const { name, description, baseUrl } = req.body;

  try {
    const api = await API.create({
      userId: req.user._id,
      name,
      description,
      baseUrl,
    });

    return successResponse(res, api, 'API created successfully', 201);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * @desc    Get all APIs for current user
 * @route   GET /api/apis
 * @access  Private (Owner)
 */
exports.getApis = async (req, res) => {
  try {
    const apis = await API.find({ userId: req.user._id, isActive: true });
    
    // Add key counts for each API
    const apisWithKeyCounts = await Promise.all(
      apis.map(async (api) => {
        const keyCount = await APIKey.countDocuments({ 
          apiId: api._id, 
          status: 'active' 
        });
        return { ...api._doc, keyCount };
      })
    );

    return successResponse(res, apisWithKeyCounts, 'APIs retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * @desc    Get single API by ID
 * @route   GET /api/apis/:id
 * @access  Private (Owner)
 */
exports.getApiById = async (req, res) => {
  try {
    const api = await API.findOne({ _id: req.params.id, userId: req.user._id });
    if (!api) {
      return errorResponse(res, 'API not found', 404);
    }

    const keys = await APIKey.find({ apiId: api._id })
      .select('-keyHash')
      .sort('-createdAt');

    return successResponse(res, { api, keys }, 'API retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * @desc    Update API details
 * @route   PATCH /api/apis/:id
 * @access  Private (Owner)
 */
exports.updateApi = async (req, res) => {
  const { name, description, baseUrl, isActive } = req.body;

  try {
    let api = await API.findOne({ _id: req.params.id, userId: req.user._id });
    if (!api) {
      return errorResponse(res, 'API not found', 404);
    }

    api = await API.findByIdAndUpdate(
      req.params.id,
      { name, description, baseUrl, isActive },
      { new: true, runValidators: true }
    );

    return successResponse(res, api, 'API updated successfully');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * @desc    Delete API (Soft delete)
 * @route   DELETE /api/apis/:id
 * @access  Private (Owner)
 */
exports.deleteApi = async (req, res) => {
  try {
    const api = await API.findOne({ _id: req.params.id, userId: req.user._id });
    if (!api) {
      return errorResponse(res, 'API not found', 404);
    }

    // Soft delete API
    api.isActive = false;
    await api.save();

    // Revoke all active keys for this API
    await APIKey.updateMany(
      { apiId: api._id, status: 'active' },
      { status: 'revoked' }
    );

    return successResponse(res, null, 'API and its keys revoked successfully');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};
