const express = require('express');
const {
  generateKey,
  getKeys,
  revokeKey,
  rotateKey,
} = require('../controllers/apikey.controller');
const { protect } = require('../middleware/auth.middleware');

// Merge params to access apiId from parent router
const router = express.Router({ mergeParams: true });

router.use(protect);

router.post('/', generateKey);
router.get('/', getKeys);
router.patch('/:keyId/revoke', revokeKey);
router.patch('/:keyId/rotate', rotateKey);

module.exports = router;
