const AuditLog = require('../models/auditlog.model');

/**
 * Service to log audit events
 */
const logAudit = async (options) => {
  try {
    const {
      userId,
      action,
      resourceType,
      resourceId,
      status = 'success',
      ipAddress,
      userAgent,
      details = {},
      errorMessage,
    } = options;

    await AuditLog.create({
      userId,
      action,
      resourceType,
      resourceId,
      status,
      ipAddress,
      userAgent,
      details,
      errorMessage,
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Don't throw - audit logging should not break the app
  }
};

/**
 * Get audit logs for a user
 */
const getAuditLogs = async (userId, filters = {}, pagination = {}) => {
  const { action, resourceType } = filters;
  const { page = 1, limit = 50 } = pagination;
  const skip = (page - 1) * limit;

  const query = { userId };
  if (action) query.action = action;
  if (resourceType) query.resourceType = resourceType;

  const logs = await AuditLog.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await AuditLog.countDocuments(query);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

module.exports = {
  logAudit,
  getAuditLogs,
};
