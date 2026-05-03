const axios = require('axios');
const API = require('../models/api.model');
const APIKey = require('../models/apikey.model');
const UsageLog = require('../models/usagelog.model');
const { logAudit } = require('../services/audit.service');
const { errorResponse } = require('../utils/response');

/**
 * @desc    Proxy request to upstream API
 * @route   POST /gateway
 * @access  Private (API Key required)
 */
exports.proxyRequest = async (req, res) => {
  const { apiId, endpoint, method, data } = req.body;
  const startTime = Date.now();

  try {
    // 1. Look up the API document
    const api = await API.findById(apiId);
    if (!api) {
      return errorResponse(res, 'Target API not found', 404);
    }

    // 2. Verify API belongs to the apiKey owner
    if (api.userId.toString() !== req.apiOwner.toString()) {
      return errorResponse(res, 'Unauthorized access to this API', 403);
    }

    // 3. Forward request to: api.baseUrl + endpoint
    let response;
    let statusCode;
    try {
      // ✅ SECURITY: Use configurable timeout instead of hardcoded 10s
      const timeout = parseInt(process.env.GATEWAY_TIMEOUT || '30000');
      response = await axios({
        url: `${api.baseUrl}${endpoint}`,
        method: method || 'GET',
        data: data || {},
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': req.id, // Propagate request ID
        },
        timeout: timeout,
      });
      statusCode = response.status;
    } catch (axiosError) {
      // If upstream fails, we still want to log it
      statusCode = axiosError.response?.status || 502;
      response = { data: axiosError.response?.data || { error: 'Upstream API error' } };
      
      // ✅ SECURITY: Log gateway errors with context
      console.error('Gateway upstream error:', {
        requestId: req.id,
        userId: req.apiOwner,
        apiId: apiId,
        endpoint: endpoint,
        statusCode: statusCode,
        error: axiosError.message,
      });
    }

    const latencyMs = Date.now() - startTime;

    // 4. Save UsageLog
    await UsageLog.create({
      apiKeyId: req.apiKey._id,
      apiId: api._id,
      userId: req.apiOwner,
      endpoint,
      method: method || 'GET',
      statusCode,
      latencyMs,
    });

    // 5. Increment APIKey.totalRequests and update lastUsedAt
    await APIKey.findByIdAndUpdate(req.apiKey._id, {
      $inc: { totalRequests: 1 },
      lastUsedAt: new Date(),
    });

    // 6. Return proxied response
    return res.status(statusCode).json(response.data);

  } catch (error) {
    // ✅ SECURITY: Log error with full context (without sensitive data)
    const errorContext = {
      requestId: req.id,
      userId: req.apiOwner,
      apiId: apiId,
      endpoint: endpoint,
      method: method,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    };

    console.error('Gateway Error:', errorContext);

    // Log to audit
    await logAudit({
      userId: req.apiOwner,
      action: 'GATEWAY_REQUEST',
      resourceType: 'Gateway',
      resourceId: apiId,
      status: 'failure',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      errorMessage: error.message,
      details: { requestId: req.id, endpoint: endpoint },
    }).catch(err => console.error('Audit log error:', err));

    // Return generic error without exposing implementation details
    return res.status(500).json({
      success: false,
      message: 'Gateway processing failed',
      requestId: req.id, // For support debugging
    });
  }
};
