const mongoose = require('mongoose');

const billingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    periodStart: {
      type: Date,
      required: true,
    },
    periodEnd: {
      type: Date,
      required: true,
    },
    totalRequests: {
      type: Number,
      default: 0,
    },
    freeRequests: {
      type: Number,
      default: 1000,
    },
    billableRequests: {
      type: Number,
      default: 0,
    },
    ratePerHundred: {
      type: Number,
      default: 0.5,
    },
    amount: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    razorpayOrderId: {
      type: String,
    },
    razorpayPaymentId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Add index for fast retrieval of user billing history
billingSchema.index({ userId: 1, periodStart: -1 });

module.exports = mongoose.model('Billing', billingSchema);
