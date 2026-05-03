const express = require('express');
const { getLogs, getStats } = require('../controllers/usage.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/logs', getLogs);
router.get('/stats', getStats);

module.exports = router;
