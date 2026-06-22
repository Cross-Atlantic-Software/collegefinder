const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const creditController = require('../../controllers/user/creditController');

router.get('/balance', authenticate, creditController.getBalance);
router.get('/transactions', authenticate, creditController.getTransactions);
router.post('/purchase', authenticate, creditController.purchaseCredits);
router.post('/deduct-for-registration', authenticate, creditController.deductForRegistration);
router.post('/refund-for-registration', authenticate, creditController.refundForRegistration);

module.exports = router;
