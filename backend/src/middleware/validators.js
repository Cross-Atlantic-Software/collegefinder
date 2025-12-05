const { body } = require('express-validator');

/**
 * Validation rules for sending OTP
 */
const validateSendOTP = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
];

/**
 * Validation rules for verifying OTP
 */
const validateVerifyOTP = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address'),
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
];

/**
 * Validation rules for updating user profile
 */
const validateUpdateProfile = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters')
];

/**
 * Validation rules for admin login
 */
const validateAdminLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address'),
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
    .withMessage('Please provide a valid email address'),
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
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
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

/**
 * Validation rules for updating basic info
 */
const validateUpdateBasicInfo = [
  body('name')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Name must be less than 255 characters'),
  body('first_name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('First name must be less than 100 characters'),
  body('last_name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Last name must be less than 100 characters'),
  body('date_of_birth')
    .optional()
    .isISO8601()
    .withMessage('Date of birth must be a valid date'),
  body('gender')
    .optional()
    .isIn(['Male', 'Female', 'Prefer not to say'])
    .withMessage('Gender must be Male, Female, or Prefer not to say'),
  body('state')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('State must be less than 100 characters'),
  body('district')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('District must be less than 100 characters'),
  body('phone_number')
    .optional()
    .trim()
    .isLength({ max: 25 })
    .withMessage('Phone number must be less than 25 characters')
    .matches(/^[+]?[0-9\s\-()]{7,25}$/)
    .withMessage('Please provide a valid phone number')
];

/**
 * Validation rules for updating academics
 */
const validateUpdateAcademics = [
  // Matric (10th) fields
  body('matric_board')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Matric board must be less than 100 characters'),
  body('matric_school_name')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Matric school name must be less than 255 characters'),
  body('matric_passing_year')
    .optional()
    .isInt({ min: 1950, max: new Date().getFullYear() + 1 })
    .withMessage('Matric passing year must be a valid year'),
  body('matric_roll_number')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Matric roll number must be less than 50 characters'),
  body('matric_total_marks')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Matric total marks must be a positive number'),
  body('matric_obtained_marks')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Matric obtained marks must be a positive number'),
  body('matric_percentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Matric percentage must be between 0 and 100'),
  // Post-Matric (12th) fields
  body('postmatric_board')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Post-matric board must be less than 100 characters'),
  body('postmatric_school_name')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Post-matric school name must be less than 255 characters'),
  body('postmatric_passing_year')
    .optional()
    .isInt({ min: 1950, max: new Date().getFullYear() + 1 })
    .withMessage('Post-matric passing year must be a valid year'),
  body('postmatric_roll_number')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Post-matric roll number must be less than 50 characters'),
  body('postmatric_total_marks')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Post-matric total marks must be a positive number'),
  body('postmatric_obtained_marks')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Post-matric obtained marks must be a positive number'),
  body('postmatric_percentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Post-matric percentage must be between 0 and 100'),
  body('stream')
    .optional()
    .isIn(['PCM', 'PCB', 'Commerce', 'Humanities/Arts', 'Others'])
    .withMessage('Stream must be PCM, PCB, Commerce, Humanities/Arts, or Others'),
  body('subjects')
    .optional()
    .isArray()
    .withMessage('Subjects must be an array'),
  body('subjects.*.name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Subject name must be between 1 and 100 characters'),
  body('subjects.*.percent')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Subject percentage must be between 0 and 100')
];

/**
 * Validation rules for updating career goals
 */
const validateUpdateCareerGoals = [
  body('interests')
    .optional()
    .isArray()
    .withMessage('Interests must be an array'),
  body('interests.*')
    .optional()
    .isIn(['tech', 'design', 'medical', 'engineering', 'business', 'science'])
    .withMessage('Invalid interest value')
];

module.exports = {
  validateSendOTP,
  validateVerifyOTP,
  validateResendOTP,
  validateUpdateProfile,
  validateAdminLogin,
  validateCreateAdmin,
  validateUpdateAdmin,
  validateCreateEmailTemplate,
  validateUpdateEmailTemplate,
  validateUpdateBasicInfo,
  validateUpdateAcademics,
  validateUpdateCareerGoals
};

