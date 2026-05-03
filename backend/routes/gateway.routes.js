const express = require('express');
const { body } = require('express-validator');
const { proxyRequest } = require('../controllers/gateway.controller');
const validateApiKey = require('../middleware/validateApiKey.middleware');
const rateLimiter = require('../middleware/rateLimiter.middleware');
const validate = require('../middleware/validate.middleware');

const router = express.Router();

// ✅ SECURITY: Add input validation for gateway requests
router.post(
  '/',
  validateApiKey,
  rateLimiter,
  [
    body('apiId')
      .isMongoId()
      .withMessage('Invalid API ID'),
    body('endpoint')
      .notEmpty()
      .withMessage('Endpoint is required')
      .trim()
      .matches(/^\/[a-zA-Z0-9\-\/_]*$/)
      .withMessage('Invalid endpoint format - must start with / and contain only alphanumeric, hyphens, underscores, and slashes'),
    body('method')
      .isIn(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'])
      .withMessage('Invalid HTTP method'),
    body('data')
      .optional()
      .isObject()
      .withMessage('Data must be an object if provided'),
  ],
  validate,
  proxyRequest
);

module.exports = router;
