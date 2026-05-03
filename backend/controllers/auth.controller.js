const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const { validationResult } = require('express-validator');
const { nanoid } = require('nanoid');
const User = require('../models/user.model');
const RefreshToken = require('../models/refreshToken.model');
const { logAudit } = require('../services/audit.service');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Generate Access Token
 * @param {string} id - User ID
 */
const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

/**
 * Generate Refresh Token
 * @param {string} id - User ID
 */
const createAndStoreRefreshToken = async (userId, req) => {
  const jti = nanoid(20);
  // sign token with jti
  const token = jwt.sign({ id: userId, jti }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  });

  // decode to get exp claim
  const decoded = jwt.decode(token);
  const expiresAt = decoded && decoded.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 7 * 24 * 3600 * 1000);

  // store refresh token record
  await RefreshToken.create({
    jti,
    userId,
    expiresAt,
    revoked: false,
    ipAddress: req?.ip,
    userAgent: req?.get('user-agent'),
  });

  return token;
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 'Validation error', 422, errors.array());
  }

  const { name, email, password } = req.body;

  try {
    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      // ✅ SECURITY: Log failed registration attempt
      await logAudit({
        userId: new mongoose.Types.ObjectId(), // Placeholder for failed attempt

        action: 'USER_REGISTER',
        status: 'failure',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        errorMessage: 'Email already registered',
        details: { email: email.substring(0, 3) + '***' }, // Mask email
      }).catch(err => console.error('Audit log error:', err));

      return errorResponse(res, 'User already exists', 400);
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
    });

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = await createAndStoreRefreshToken(user._id, req);

    // ✅ SECURITY: Log successful registration
    await logAudit({
      userId: user._id,
      action: 'USER_REGISTER',
      resourceType: 'User',
      resourceId: user._id,
      status: 'success',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: { email: email },
    }).catch(err => console.error('Audit log error:', err));

    return successResponse(
      res,
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          plan: user.plan,
        },
        accessToken,
        refreshToken,
      },
      'User registered successfully',
      201
    );
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 'Validation error', 422, errors.array());
  }

  const { email, password } = req.body;

  try {
    // Check user & password
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      // ✅ SECURITY: Log failed login attempt
      await logAudit({
        userId: user?._id || new mongoose.Types.ObjectId(),

        action: 'USER_LOGIN',
        status: 'failure',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        errorMessage: 'Invalid credentials',
        details: { email: email.substring(0, 3) + '***' }, // Mask email
      }).catch(err => console.error('Audit log error:', err));

      return errorResponse(res, 'Invalid credentials', 401);
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = await createAndStoreRefreshToken(user._id, req);

    // ✅ SECURITY: Log successful login
    await logAudit({
      userId: user._id,
      action: 'USER_LOGIN',
      resourceType: 'User',
      resourceId: user._id,
      status: 'success',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    }).catch(err => console.error('Audit log error:', err));

    return successResponse(
      res,
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          plan: user.plan,
        },
        accessToken,
        refreshToken,
      },
      'Logged in successfully'
    );
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh
 * @access  Public
 */
exports.refresh = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return errorResponse(res, 'Refresh token is required', 400);
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const { id: userId, jti } = decoded;

    // Find stored token
    const stored = await RefreshToken.findOne({ jti, userId });
    if (!stored || stored.revoked || new Date(stored.expiresAt) < new Date()) {
      return errorResponse(res, 'Invalid or expired refresh token', 401);
    }

    // Rotate: revoke current and issue new one
    const newJti = nanoid(20);
    const newToken = jwt.sign({ id: userId, jti: newJti }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
    });

    const newDecoded = jwt.decode(newToken);
    const newExpiresAt = newDecoded && newDecoded.exp ? new Date(newDecoded.exp * 1000) : new Date(Date.now() + 7 * 24 * 3600 * 1000);

    // Mark old token revoked and set replacedBy
    stored.revoked = true;
    stored.replacedBy = newJti;
    await stored.save();

    // Store new token
    await RefreshToken.create({
      jti: newJti,
      userId,
      expiresAt: newExpiresAt,
      revoked: false,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Issue new access token
    const accessToken = generateAccessToken(userId);

    // Log audit event
    await logAudit({
      userId,
      action: 'USER_LOGIN',
      resourceType: 'User',
      resourceId: userId,
      status: 'success',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: { rotated: true },
    }).catch(err => console.error('Audit log error:', err));

    return successResponse(res, { accessToken, refreshToken: newToken }, 'Token refreshed successfully');
  } catch (error) {
    return errorResponse(res, 'Invalid or expired refresh token', 401);
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res) => {
  return successResponse(res, { user: req.user }, 'User profile retrieved');
};

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Public
 */
exports.logout = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return successResponse(res, null, 'Logged out successfully');
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const { id: userId, jti } = decoded;

    const stored = await RefreshToken.findOne({ jti, userId });
    if (stored) {
      stored.revoked = true;
      await stored.save();

      await logAudit({
        userId,
        action: 'USER_LOGOUT',
        resourceType: 'User',
        resourceId: userId,
        status: 'success',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      }).catch(err => console.error('Audit log error:', err));
    }

    return successResponse(res, null, 'Logged out successfully');
  } catch (error) {
    return successResponse(res, null, 'Logged out');
  }
};
