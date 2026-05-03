const express = require('express');
const { body } = require('express-validator');
const {
  createApi,
  getApis,
  getApiById,
  updateApi,
  deleteApi,
} = require('../controllers/api.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect); // All API routes are protected

// Mount nested API Key routes
router.use('/:apiId/keys', require('./apikey.routes'));

router.post(
  '/',
  [
    body('name').notEmpty().withMessage('API name is required'),
    body('baseUrl')
      .isURL()
      .withMessage('Please include a valid base URL'),
  ],
  createApi
);

router.get('/', getApis);
router.get('/:id', getApiById);
router.patch('/:id', updateApi);
router.delete('/:id', deleteApi);

module.exports = router;
