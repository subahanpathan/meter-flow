const { nanoid } = require('nanoid');

/**
 * Middleware to add request ID for tracing and correlation
 */
const requestIdMiddleware = (req, res, next) => {
  // Use existing request ID or generate new one
  req.id = req.get('x-request-id') || nanoid(12);
  res.set('x-request-id', req.id);
  next();
};

module.exports = requestIdMiddleware;
