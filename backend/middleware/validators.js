const { body } = require('express-validator');

/**
 * Validation rules for sending OTP
 */
const validateSendOTP = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
];

/**
 * Validation rules for verifying OTP
 */
const validateVerifyOTP = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('code')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP code must be 6 digits')
    .isNumeric()
    .withMessage('OTP code must contain only numbers')
];

/**
 * Validation rules for resending OTP
 */
const validateResendOTP = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
];

module.exports = {
  validateSendOTP,
  validateVerifyOTP,
  validateResendOTP
};

