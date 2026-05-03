const mongoose = require('mongoose');

const usageLogSchema = new mongoose.Schema(
  {
    apiKeyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'APIKey',
      required: true,
    },
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
    endpoint: {
      type: String,
      required: true,
    },
    method: {
      type: String,
      required: true,
    },
    statusCode: {
      type: Number,
      required: true,
    },
    latencyMs: {
      type: Number,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // Using custom timestamp field
  }
);

// Compound index for fast billing queries and analytics
usageLogSchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('UsageLog', usageLogSchema);
