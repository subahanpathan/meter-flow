const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      enum: [
        'USER_LOGIN',
        'USER_LOGOUT',
        'USER_REGISTER',
        'USER_UPDATE',
        'API_CREATE',
        'API_UPDATE',
        'API_DELETE',
        'APIKEY_CREATE',
        'APIKEY_REVOKE',
        'APIKEY_EXPIRE',
        'PAYMENT_INITIATED',
        'PAYMENT_COMPLETED',
        'PAYMENT_FAILED',
        'BILLING_GENERATED',
        'GATEWAY_REQUEST',
        'AUTH_FAILED',
        'RATE_LIMIT_EXCEEDED',
        'INVALID_KEY',
      ],
      required: true,
    },
    resourceType: {
      type: String,
      enum: ['User', 'API', 'APIKey', 'Billing', 'Payment', 'Gateway'],
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    status: {
      type: String,
      enum: ['success', 'failure', 'pending'],
      default: 'success',
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    errorMessage: {
      type: String,
    },
  },
  {
    timestamps: true,
    indexes: [
      { userId: 1, createdAt: -1 },
      { action: 1, createdAt: -1 },
      { resourceType: 1, resourceId: 1 },
    ],
  }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
