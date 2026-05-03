const express = require('express');
const {
  getBillingHistory,
  getCurrentBill,
  initiatePayment,
  verifyPayment,
} = require('../controllers/billing.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/', getBillingHistory);
router.get('/current', getCurrentBill);
router.post('/pay', initiatePayment);
router.post('/verify', verifyPayment);

module.exports = router;
