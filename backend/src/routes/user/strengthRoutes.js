const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const StrengthController = require('../../controllers/user/strengthController');

router.get('/payment-status', authenticate, StrengthController.getPaymentStatus);
router.get('/form-data', authenticate, StrengthController.getFormData);
router.post('/pay', authenticate, StrengthController.pay);
router.get('/results', authenticate, StrengthController.getResults);

module.exports = router;
