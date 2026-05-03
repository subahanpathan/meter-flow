const Razorpay = require('razorpay');
const crypto = require('crypto');
const Billing = require('../models/billing.model');
const { generateInvoice } = require('../services/billing.service');
const { successResponse, errorResponse } = require('../utils/response');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * @desc    Get all billing history for user
 * @route   GET /api/billing
 * @access  Private
 */
exports.getBillingHistory = async (req, res) => {
  try {
    const history = await Billing.find({ userId: req.user._id })
      .sort({ periodStart: -1 });

    return successResponse(res, history, 'Billing history retrieved');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * @desc    Get current month bill (on-demand)
 * @route   GET /api/billing/current
 * @access  Private
 */
exports.getCurrentBill = async (req, res) => {
  try {
    const billing = await generateInvoice(req.user._id);
    return successResponse(res, billing, 'Current billing info retrieved');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * @desc    Initiate payment (Create Razorpay Order)
 * @route   POST /api/billing/pay
 * @access  Private
 */
exports.initiatePayment = async (req, res) => {
  const { billingId } = req.body;

  try {
    const billing = await Billing.findOne({ _id: billingId, userId: req.user._id });
    if (!billing) {
      return errorResponse(res, 'Billing record not found', 404);
    }

    if (billing.status === 'paid') {
      return errorResponse(res, 'This bill is already paid', 400);
    }

    const options = {
      amount: Math.round(billing.amount * 100), // Amount in paise
      currency: billing.currency,
      receipt: `receipt_${billing._id}`,
    };

    const order = await razorpay.orders.create(options);

    // Save order ID to billing record
    billing.razorpayOrderId = order.id;
    await billing.save();

    return successResponse(res, {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID
    }, 'Payment initiated');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * @desc    Verify payment signature
 * @route   POST /api/billing/verify
 * @access  Private
 */
exports.verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const sign = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSign = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(sign.toString())
    .digest("hex");

  if (razorpay_signature === expectedSign) {
    try {
      const billing = await Billing.findOne({ razorpayOrderId: razorpay_order_id });
      if (!billing) {
        return errorResponse(res, 'Billing record not found for this order', 404);
      }

      billing.status = 'paid';
      billing.razorpayPaymentId = razorpay_payment_id;
      await billing.save();

      return successResponse(res, billing, 'Payment verified successfully');
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  } else {
    return errorResponse(res, 'Invalid signature, payment failed', 400);
  }
};
