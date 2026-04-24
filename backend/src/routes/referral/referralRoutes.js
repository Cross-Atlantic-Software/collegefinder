const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const ReferralController = require('../../controllers/referral/referralController');

/**
 * @route   GET /api/referral/my-code
 * @desc    Get the authenticated user's referral code, QR data URL, and share URL
 * @access  Private (User)
 */
router.get('/my-code', authenticate, ReferralController.getMyCode);

/**
 * @route   POST /api/referral/generate-my-code
 * @desc    Explicitly generate/save authenticated user's referral code
 * @access  Private (User)
 */
router.post('/generate-my-code', authenticate, ReferralController.generateMyCode);

/**
 * @route   POST /api/referral/send-invite
 * @desc    Send referral invite email(s) via nodemailer to given recipient(s)
 * @body    { recipients: string[] }
 * @access  Private (User)
 */
router.post('/send-invite', authenticate, ReferralController.sendInvite);

/**
 * @route   GET /api/referral/my-uses
 * @desc    Get the list of users who signed up using the authenticated user's referral code
 * @access  Private (User)
 */
router.get('/my-uses', authenticate, ReferralController.getMyUses);

module.exports = router;
