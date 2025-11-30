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

/**
 * Validation rules for admin login
 */
const validateAdminLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
];

/**
 * Validation rules for creating admin user
 */
const validateCreateAdmin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('type')
    .optional()
    .isIn(['user', 'super_admin'])
    .withMessage('Type must be either "user" or "super_admin"')
];

/**
 * Validation rules for updating admin user
 */
const validateUpdateAdmin = [
  body('type')
    .optional()
    .isIn(['user', 'super_admin'])
    .withMessage('Type must be either "user" or "super_admin"'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean')
];

/**
 * Validation rules for creating email template
 */
const validateCreateEmailTemplate = [
  body('type')
    .notEmpty()
    .withMessage('Type is required')
    .trim()
    .matches(/^[A-Z_]+$/)
    .withMessage('Type must be uppercase with underscores (e.g., OTP_VERIFICATION)'),
  body('subject')
    .notEmpty()
    .withMessage('Subject is required')
    .trim()
    .isLength({ max: 255 })
    .withMessage('Subject must be less than 255 characters'),
  body('body_html')
    .notEmpty()
    .withMessage('Body HTML is required')
    .trim()
];

/**
 * Validation rules for updating email template
 */
const validateUpdateEmailTemplate = [
  body('subject')
    .notEmpty()
    .withMessage('Subject is required')
    .trim()
    .isLength({ max: 255 })
    .withMessage('Subject must be less than 255 characters'),
  body('body_html')
    .notEmpty()
    .withMessage('Body HTML is required')
    .trim()
];

module.exports = {
  validateSendOTP,
  validateVerifyOTP,
  validateResendOTP,
  validateAdminLogin,
  validateCreateAdmin,
  validateUpdateAdmin,
  validateCreateEmailTemplate,
  validateUpdateEmailTemplate
};

