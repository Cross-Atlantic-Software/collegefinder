const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const CreditController = require('../../controllers/credits/creditController');

// NOTE: POST /webhook is intentionally NOT defined here. It needs the raw request body
// for signature verification, so it is mounted directly in server.js BEFORE the global
// JSON body parser.

router.get('/wallet', authenticate, CreditController.getWallet);
router.get('/packs', authenticate, CreditController.getPacks);
router.post('/orders', authenticate, CreditController.createOrder);
router.post('/orders/verify', authenticate, CreditController.verifyOrder);
router.get('/transactions', authenticate, CreditController.getTransactions);
router.get('/orders/:id/receipt', authenticate, CreditController.getReceipt);

module.exports = router;
