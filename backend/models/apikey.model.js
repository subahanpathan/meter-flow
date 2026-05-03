const mongoose = require('mongoose');

const apiKeySchema = new mongoose.Schema(
  {
    apiId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'API',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    keyHash: {
      type: String,
      required: true,
    },
    keyPrefix: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'revoked'],
      default: 'active',
    },
    totalRequests: {
      type: Number,
      default: 0,
    },
    lastUsedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes for fast lookup and filtering
apiKeySchema.index({ keyHash: 1 });
apiKeySchema.index({ userId: 1 });

module.exports = mongoose.model('APIKey', apiKeySchema);
