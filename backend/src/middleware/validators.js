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
    .withMessage('Please provide a valid phone number'),
  body('alternate_mobile_number')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Alternate mobile number must be less than 20 characters')
    .matches(/^[+]?[0-9\s\-()]{7,20}$/)
    .withMessage('Alternate mobile number must be a valid phone number'),
  body('nationality')
    .optional()
    .isIn(['Indian', 'Foreigner'])
    .withMessage('Nationality must be either Indian or Foreigner'),
  body('marital_status')
    .optional()
    .isIn(['Single', 'Unmarried', 'Divorced', 'Widowed', 'Separated'])
    .withMessage('Marital status must be Single, Unmarried, Divorced, Widowed, or Separated'),
  body('father_full_name')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Father\'s full name must be less than 255 characters'),
  body('mother_full_name')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Mother\'s full name must be less than 255 characters'),
  body('guardian_name')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Guardian name must be less than 255 characters')
];

/**
 * Validation rules for government identification
 */
const validateGovernmentIdentification = [
  body('aadhar_number')
    .optional()
    .trim()
    .isLength({ min: 12, max: 12 })
    .withMessage('Aadhar number must be exactly 12 digits')
    .matches(/^\d{12}$/)
    .withMessage('Aadhar number must contain only digits'),
  body('apaar_id')
    .notEmpty()
    .withMessage('APAAR ID is required')
    .trim()
    .isLength({ min: 12, max: 12 })
    .withMessage('APAAR ID must be exactly 12 digits')
    .matches(/^\d{12}$/)
    .withMessage('APAAR ID must contain only numbers')
];

/**
 * Validation rules for category and reservation
 */
const validateCategoryAndReservation = [
  body('category_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Category ID must be a valid integer'),
  body('ews_status')
    .optional()
    .isBoolean()
    .withMessage('EWS status must be a boolean'),
  body('pwbd_status')
    .optional()
    .isBoolean()
    .withMessage('PwBD/PWD status must be a boolean'),
  body('type_of_disability')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Type of disability must be less than 255 characters'),
  body('disability_percentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Disability percentage must be between 0 and 100'),
  body('udid_number')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('UDID number must be less than 255 characters'),
  body('minority_status')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Minority status must be less than 255 characters'),
  body('ex_serviceman_defence_quota')
    .optional()
    .isBoolean()
    .withMessage('Ex-serviceman/Defence quota must be a boolean'),
  body('kashmiri_migrant_regional_quota')
    .optional()
    .isBoolean()
    .withMessage('Kashmiri migrant/Regional quota must be a boolean'),
  body('state_domicile')
    .optional()
    .isBoolean()
    .withMessage('State domicile must be a boolean'),
  body('home_state_for_quota')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Home state for quota must be a string with max 100 characters')
];

/**
 * Validation rules for other personal details
 */
const validateOtherPersonalDetails = [
  body('religion')
    .optional()
    .isIn(['Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain', 'Jewish', 'Parsi (Zoroastrian)', 'Other', 'Prefer not to say'])
    .withMessage('Religion must be one of the allowed values'),
  body('mother_tongue')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Mother tongue must be less than 255 characters'),
  body('annual_family_income')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Annual family income must be a valid positive number'),
  body('occupation_of_father')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Occupation of father must be less than 255 characters'),
  body('occupation_of_mother')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Occupation of mother must be less than 255 characters')
];

/**
 * Validation rules for user address
 */
const validateUserAddress = [
  body('correspondence_address_line1')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Correspondence address line 1 must be less than 255 characters'),
  body('correspondence_address_line2')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Correspondence address line 2 must be less than 255 characters'),
  body('city_town_village')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('City/Town/Village must be less than 255 characters'),
  body('district')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('District must be less than 255 characters'),
  body('state')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('State must be less than 255 characters'),
  body('country')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Country must be less than 255 characters'),
  body('pincode')
    .optional()
    .trim()
    .isLength({ min: 6, max: 10 })
    .withMessage('Pincode must be between 6 and 10 characters')
    .matches(/^[0-9]+$/)
    .withMessage('Pincode must contain only digits'),
  body('permanent_address_same_as_correspondence')
    .optional()
    .isBoolean()
    .withMessage('Permanent address same as correspondence must be a boolean'),
  body('permanent_address')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Permanent address must be less than 1000 characters')
];

/**
 * Validation rules for sending email OTP (for profile email update)
 */
const validateSendEmailOTP = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
];

/**
 * Validation rules for verifying email OTP (for profile email update)
 */
const validateVerifyEmailOTP = [
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
    .trim()
    .isLength({ max: 100 })
    .withMessage('Stream must be less than 100 characters'),
  body('stream_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Stream ID must be a positive integer'),
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

/**
 * Validation rules for creating blog
 */
const validateCreateBlog = [
  body('slug')
    .notEmpty()
    .withMessage('Slug is required')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Slug must be between 1 and 255 characters')
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage('Slug must be lowercase alphanumeric with hyphens (e.g., my-blog-post)'),
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Title must be between 1 and 500 characters'),
  body('content_type')
    .notEmpty()
    .withMessage('Content type is required')
    .isIn(['TEXT', 'VIDEO'])
    .withMessage('Content type must be either TEXT or VIDEO'),
  body('is_featured')
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (value === undefined || value === null || value === '') return true;
      if (value === 'true' || value === true) return true;
      if (value === 'false' || value === false) return true;
      return false;
    })
    .withMessage('is_featured must be a boolean'),
  body('teaser')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Teaser must be less than 1000 characters'),
  body('summary')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Summary must be less than 2000 characters'),
  body('first_part')
    .optional({ checkFalsy: true })
    .trim(),
  body('second_part')
    .optional({ checkFalsy: true })
    .trim()
];

/**
 * Validation rules for updating blog
 */
const validateUpdateBlog = [
  body('slug')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Slug must be between 1 and 255 characters')
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage('Slug must be lowercase alphanumeric with hyphens (e.g., my-blog-post)'),
  body('title')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Title must be between 1 and 500 characters'),
  body('content_type')
    .optional({ checkFalsy: true })
    .isIn(['TEXT', 'VIDEO'])
    .withMessage('Content type must be either TEXT or VIDEO'),
  body('is_featured')
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (value === undefined || value === null || value === '') return true;
      if (value === 'true' || value === true) return true;
      if (value === 'false' || value === false) return true;
      return false;
    })
    .withMessage('is_featured must be a boolean'),
  body('teaser')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Teaser must be less than 1000 characters'),
  body('summary')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Summary must be less than 2000 characters'),
  body('first_part')
    .optional({ checkFalsy: true })
    .trim(),
  body('second_part')
    .optional({ checkFalsy: true })
    .trim()
];

/**
 * Validation rules for creating subject
 */
const validateCreateSubject = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters'),
  body('status')
    .optional()
    .isBoolean()
    .withMessage('Status must be a boolean')
];

/**
 * Validation rules for updating subject
 */
const validateUpdateSubject = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters'),
  body('status')
    .optional()
    .isBoolean()
    .withMessage('Status must be a boolean')
];

/**
 * Validation rules for creating stream
 */
const validateCreateStream = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters'),
  body('status')
    .optional()
    .isBoolean()
    .withMessage('Status must be a boolean')
];

/**
 * Validation rules for updating stream
 */
const validateUpdateStream = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters'),
  body('status')
    .optional()
    .isBoolean()
    .withMessage('Status must be a boolean')
];

/**
 * Validation rules for creating career
 */
const validateCreateCareer = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters'),
  body('status')
    .optional()
    .isBoolean()
    .withMessage('Status must be a boolean')
];

/**
 * Validation rules for updating career
 */
const validateUpdateCareer = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters'),
  body('status')
    .optional()
    .isBoolean()
    .withMessage('Status must be a boolean')
];

/**
 * Validation rules for creating topic
 */
const validateCreateTopic = [
  body('sub_id')
    .notEmpty()
    .withMessage('Subject ID is required')
    .isInt({ min: 1 })
    .withMessage('Subject ID must be a positive integer'),
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters'),
  body('home_display')
    .optional()
    .isBoolean()
    .withMessage('Home display must be a boolean'),
  body('status')
    .optional()
    .isBoolean()
    .withMessage('Status must be a boolean'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must be less than 2000 characters'),
  body('sort_order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sort order must be a non-negative integer')
];

/**
 * Validation rules for updating topic
 */
const validateUpdateTopic = [
  body('sub_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Subject ID must be a positive integer'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters'),
  body('home_display')
    .optional()
    .isBoolean()
    .withMessage('Home display must be a boolean'),
  body('status')
    .optional()
    .isBoolean()
    .withMessage('Status must be a boolean'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must be less than 2000 characters'),
  body('sort_order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sort order must be a non-negative integer')
];

/**
 * Validation rules for creating subtopic
 */
const validateCreateSubtopic = [
  body('topic_id')
    .notEmpty()
    .withMessage('Topic ID is required')
    .isInt({ min: 1 })
    .withMessage('Topic ID must be a positive integer'),
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters'),
  body('status')
    .optional()
    .isBoolean()
    .withMessage('Status must be a boolean'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must be less than 2000 characters'),
  body('sort_order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sort order must be a non-negative integer')
];

/**
 * Validation rules for updating subtopic
 */
const validateUpdateSubtopic = [
  body('topic_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Topic ID must be a positive integer'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters'),
  body('status')
    .optional()
    .isBoolean()
    .withMessage('Status must be a boolean'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must be less than 2000 characters'),
  body('sort_order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sort order must be a non-negative integer')
];

/**
 * Validation rules for creating lecture
 */
const validateCreateLecture = [
  body('subtopic_id')
    .notEmpty()
    .withMessage('Subtopic ID is required')
    .isInt({ min: 1 })
    .withMessage('Subtopic ID must be a positive integer'),
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters'),
  body('content_type')
    .optional()
    .isIn(['VIDEO', 'ARTICLE'])
    .withMessage('Content type must be VIDEO or ARTICLE'),
  body('article_content')
    .optional()
    .isString()
    .withMessage('Article content must be a string')
    .trim(),
  body('status')
    .optional()
    .isBoolean()
    .withMessage('Status must be a boolean'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must be less than 2000 characters'),
  body('sort_order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sort order must be a non-negative integer')
];

/**
 * Validation rules for updating lecture
 */
const validateUpdateLecture = [
  body('subtopic_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Subtopic ID must be a positive integer'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters'),
  body('content_type')
    .optional()
    .isIn(['VIDEO', 'ARTICLE'])
    .withMessage('Content type must be VIDEO or ARTICLE'),
  body('article_content')
    .optional()
    .isString()
    .withMessage('Article content must be a string')
    .trim(),
  body('status')
    .optional()
    .isBoolean()
    .withMessage('Status must be a boolean'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must be less than 2000 characters'),
  body('sort_order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sort order must be a non-negative integer')
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
  validateUpdateCareerGoals,
  validateCreateBlog,
  validateUpdateBlog,
  validateCreateSubject,
  validateUpdateSubject,
  validateCreateStream,
  validateUpdateStream,
  validateCreateCareer,
  validateUpdateCareer,
  validateCreateTopic,
  validateUpdateTopic,
  validateCreateSubtopic,
  validateUpdateSubtopic,
  validateCreateLecture,
  validateUpdateLecture
};

/**
 * Validation rules for creating purpose
 */
const validateCreatePurpose = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters'),
  body('status')
    .optional()
    .isBoolean()
    .withMessage('Status must be a boolean')
];

/**
 * Validation rules for updating purpose
 */
const validateUpdatePurpose = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters'),
  body('status')
    .optional()
    .isBoolean()
    .withMessage('Status must be a boolean')
];

/**
 * Validation rules for creating level
 */
const validateCreateLevel = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters'),
  body('status')
    .optional()
    .isBoolean()
    .withMessage('Status must be a boolean')
];

/**
 * Validation rules for updating level
 */
const validateUpdateLevel = [
  body('name')
    .optional()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters'),
  body('status')
    .optional()
    .isBoolean()
    .withMessage('Status must be a boolean')
];

/**
 * Validation rules for creating program
 */
const validateCreateProgram = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters'),
  body('status')
    .optional()
    .isBoolean()
    .withMessage('Status must be a boolean')
];

/**
 * Validation rules for updating program
 */
const validateUpdateProgram = [
  body('name')
    .optional()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters'),
  body('status')
    .optional()
    .isBoolean()
    .withMessage('Status must be a boolean')
];

/**
 * Validation rules for creating exam city
 */
const validateCreateExamCity = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters'),
  body('status')
    .optional()
    .isBoolean()
    .withMessage('Status must be a boolean')
];

/**
 * Validation rules for updating exam city
 */
const validateUpdateExamCity = [
  body('name')
    .optional()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters'),
  body('status')
    .optional()
    .isBoolean()
    .withMessage('Status must be a boolean')
];

/**
 * Validation rules for creating category
 */
const validateCreateCategory = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters')
];

/**
 * Validation rules for updating category
 */
const validateUpdateCategory = [
  body('name')
    .optional()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters')
];

/**
 * Validation rules for creating college
 */
const validateCreateCollege = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters'),
  body('ranking')
    .optional({ nullable: true, checkFalsy: true })
    .customSanitizer((value) => {
      if (value === '' || value === null || value === undefined) return null;
      return value;
    })
    .isInt({ min: 1 })
    .withMessage('Ranking must be a positive integer')
    .toInt(),
  body('description')
    .optional({ nullable: true, checkFalsy: true })
    .customSanitizer((value) => {
      if (value === '' || value === null || value === undefined) return null;
      return value;
    })
    .isString()
    .withMessage('Description must be a string'),
  body('logo_url')
    .optional({ nullable: true, checkFalsy: true })
    .isURL()
    .withMessage('Logo URL must be a valid URL')
    .isLength({ max: 500 })
    .withMessage('Logo URL must be less than 500 characters')
];

/**
 * Validation rules for updating college
 */
const validateUpdateCollege = [
  body('name')
    .optional()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters'),
  body('ranking')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Ranking must be a positive integer'),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string'),
  body('logo_url')
    .optional()
    .isURL()
    .withMessage('Logo URL must be a valid URL')
    .isLength({ max: 500 })
    .withMessage('Logo URL must be less than 500 characters')
];

/**
 * Validation rules for creating college location
 */
const validateCreateCollegeLocation = [
  body('college_id')
    .notEmpty()
    .withMessage('College ID is required')
    .isInt({ min: 1 })
    .withMessage('College ID must be a positive integer'),
  body('state')
    .notEmpty()
    .withMessage('State is required')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('State must be between 1 and 255 characters'),
  body('city')
    .notEmpty()
    .withMessage('City is required')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('City must be between 1 and 255 characters'),
  body('google_map_url')
    .optional()
    .isURL()
    .withMessage('Google Map URL must be a valid URL')
    .isLength({ max: 500 })
    .withMessage('Google Map URL must be less than 500 characters')
];

/**
 * Validation rules for updating college location
 */
const validateUpdateCollegeLocation = [
  body('college_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('College ID must be a positive integer'),
  body('state')
    .optional()
    .notEmpty()
    .withMessage('State cannot be empty')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('State must be between 1 and 255 characters'),
  body('city')
    .optional()
    .notEmpty()
    .withMessage('City cannot be empty')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('City must be between 1 and 255 characters'),
  body('google_map_url')
    .optional()
    .isURL()
    .withMessage('Google Map URL must be a valid URL')
    .isLength({ max: 500 })
    .withMessage('Google Map URL must be less than 500 characters')
];

/**
 * Validation rules for creating college gallery
 */
const validateCreateCollegeGallery = [
  body('college_id')
    .trim()
    .notEmpty()
    .withMessage('College ID is required')
    .isInt({ min: 1 })
    .withMessage('College ID must be a positive integer')
    .toInt(),
  body('image_url')
    .optional({ nullable: true, checkFalsy: true })
    .isURL()
    .withMessage('Image URL must be a valid URL')
    .isLength({ max: 500 })
    .withMessage('Image URL must be less than 500 characters'),
  body('caption')
    .optional({ nullable: true, checkFalsy: true })
    .customSanitizer((value) => {
      if (value === '' || value === null || value === undefined) return null;
      return value;
    })
    .isString()
    .isLength({ max: 500 })
    .withMessage('Caption must be less than 500 characters'),
  body('sort_order')
    .optional({ nullable: true, checkFalsy: true })
    .customSanitizer((value) => {
      if (value === '' || value === null || value === undefined) return 0;
      return value;
    })
    .isInt({ min: 0 })
    .withMessage('Sort order must be a non-negative integer')
    .toInt(),
  body().custom((value, { req }) => {
    // Either image file or image_url must be provided
    if (!req.file && !value.image_url) {
      throw new Error('Either image file or image URL is required');
    }
    return true;
  })
];

/**
 * Validation rules for updating college gallery
 */
const validateUpdateCollegeGallery = [
  body('college_id')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage('College ID must be a positive integer')
    .toInt(),
  body('image_url')
    .optional({ nullable: true, checkFalsy: true })
    .isURL()
    .withMessage('Image URL must be a valid URL')
    .isLength({ max: 500 })
    .withMessage('Image URL must be less than 500 characters'),
  body('caption')
    .optional({ nullable: true, checkFalsy: true })
    .customSanitizer((value) => {
      if (value === '' || value === null || value === undefined) return null;
      return value;
    })
    .isString()
    .isLength({ max: 500 })
    .withMessage('Caption must be less than 500 characters'),
  body('sort_order')
    .optional({ nullable: true, checkFalsy: true })
    .customSanitizer((value) => {
      if (value === '' || value === null || value === undefined) return undefined;
      return value;
    })
    .isInt({ min: 0 })
    .withMessage('Sort order must be a non-negative integer')
    .toInt()
];

/**
 * Validation rules for creating college review
 */
const validateCreateCollegeReview = [
  body('college_id')
    .notEmpty()
    .withMessage('College ID is required')
    .isInt({ min: 1 })
    .withMessage('College ID must be a positive integer'),
  body('user_id')
    .notEmpty()
    .withMessage('User ID is required')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer'),
  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('review_text')
    .optional()
    .isString()
    .withMessage('Review text must be a string'),
  body('is_approved')
    .optional()
    .isBoolean()
    .withMessage('Is approved must be a boolean')
];

/**
 * Validation rules for updating college review
 */
const validateUpdateCollegeReview = [
  body('college_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('College ID must be a positive integer'),
  body('user_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer'),
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('review_text')
    .optional()
    .isString()
    .withMessage('Review text must be a string'),
  body('is_approved')
    .optional()
    .isBoolean()
    .withMessage('Is approved must be a boolean')
];

/**
 * Validation rules for creating college news
 */
const validateCreateCollegeNews = [
  body('college_id')
    .notEmpty()
    .withMessage('College ID is required')
    .isInt({ min: 1 })
    .withMessage('College ID must be a positive integer'),
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be between 1 and 255 characters'),
  body('teaser')
    .notEmpty()
    .withMessage('Teaser is required')
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Teaser must be between 1 and 30 characters'),
  body('url')
    .notEmpty()
    .withMessage('URL is required')
    .isURL()
    .withMessage('URL must be a valid URL')
    .isLength({ max: 500 })
    .withMessage('URL must be less than 500 characters'),
  body('source_name')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Source name must be less than 255 characters')
];

/**
 * Validation rules for updating college news
 */
const validateUpdateCollegeNews = [
  body('college_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('College ID must be a positive integer'),
  body('title')
    .optional()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be between 1 and 255 characters'),
  body('teaser')
    .optional()
    .notEmpty()
    .withMessage('Teaser cannot be empty')
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Teaser must be between 1 and 30 characters'),
  body('url')
    .optional()
    .notEmpty()
    .withMessage('URL cannot be empty')
    .isURL()
    .withMessage('URL must be a valid URL')
    .isLength({ max: 500 })
    .withMessage('URL must be less than 500 characters'),
  body('source_name')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Source name must be less than 255 characters')
];

/**
 * Validation rules for creating college course
 */
const validateCreateCollegeCourse = [
  body('college_id')
    .notEmpty()
    .withMessage('College ID is required')
    .isInt({ min: 1 })
    .withMessage('College ID must be a positive integer'),
  body('stream_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Stream ID must be a positive integer'),
  body('level_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Level ID must be a positive integer'),
  body('program_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Program ID must be a positive integer'),
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be between 1 and 255 characters'),
  body('summary')
    .optional()
    .isString()
    .withMessage('Summary must be a string'),
  body('duration')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Duration must be less than 100 characters'),
  body('curriculum_detail')
    .optional()
    .isString()
    .withMessage('Curriculum detail must be a string'),
  body('admission_process')
    .optional()
    .isString()
    .withMessage('Admission process must be a string'),
  body('eligibility')
    .optional()
    .isString()
    .withMessage('Eligibility must be a string'),
  body('placements')
    .optional()
    .isString()
    .withMessage('Placements must be a string'),
  body('scholarship')
    .optional()
    .isString()
    .withMessage('Scholarship must be a string'),
  body('brochure_url')
    .optional({ nullable: true, checkFalsy: true })
    .customSanitizer((value) => {
      if (value === '' || value === null || value === undefined) return null;
      return value;
    })
    .isURL()
    .withMessage('Brochure URL must be a valid URL')
    .isLength({ max: 500 })
    .withMessage('Brochure URL must be less than 500 characters'),
  body('fee_per_sem')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Fee per semester must be a non-negative number'),
  body('total_fee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Total fee must be a non-negative number')
];

/**
 * Validation rules for updating college course
 */
const validateUpdateCollegeCourse = [
  body('college_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('College ID must be a positive integer'),
  body('stream_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Stream ID must be a positive integer'),
  body('level_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Level ID must be a positive integer'),
  body('program_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Program ID must be a positive integer'),
  body('title')
    .optional()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be between 1 and 255 characters'),
  body('summary')
    .optional()
    .isString()
    .withMessage('Summary must be a string'),
  body('duration')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Duration must be less than 100 characters'),
  body('curriculum_detail')
    .optional()
    .isString()
    .withMessage('Curriculum detail must be a string'),
  body('admission_process')
    .optional()
    .isString()
    .withMessage('Admission process must be a string'),
  body('eligibility')
    .optional()
    .isString()
    .withMessage('Eligibility must be a string'),
  body('placements')
    .optional()
    .isString()
    .withMessage('Placements must be a string'),
  body('scholarship')
    .optional()
    .isString()
    .withMessage('Scholarship must be a string'),
  body('brochure_url')
    .optional({ nullable: true, checkFalsy: true })
    .customSanitizer((value) => {
      if (value === '' || value === null || value === undefined) return null;
      return value;
    })
    .isURL()
    .withMessage('Brochure URL must be a valid URL')
    .isLength({ max: 500 })
    .withMessage('Brochure URL must be less than 500 characters'),
  body('fee_per_sem')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Fee per semester must be a non-negative number'),
  body('total_fee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Total fee must be a non-negative number')
];

/**
 * Validation rules for creating course exam
 */
const validateCreateCourseExam = [
  body('course_id')
    .notEmpty()
    .withMessage('Course ID is required')
    .isInt({ min: 1 })
    .withMessage('Course ID must be a positive integer'),
  body('exam_name')
    .notEmpty()
    .withMessage('Exam name is required')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Exam name must be between 1 and 255 characters')
];

/**
 * Validation rules for updating course exam
 */
const validateUpdateCourseExam = [
  body('course_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Course ID must be a positive integer'),
  body('exam_name')
    .optional()
    .notEmpty()
    .withMessage('Exam name cannot be empty')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Exam name must be between 1 and 255 characters')
];

/**
 * Validation rules for creating course cutoff
 */
const validateCreateCourseCutoff = [
  body('course_id')
    .notEmpty()
    .withMessage('Course ID is required')
    .isInt({ min: 1 })
    .withMessage('Course ID must be a positive integer'),
  body('exam_id')
    .notEmpty()
    .withMessage('Exam ID is required')
    .isInt({ min: 1 })
    .withMessage('Exam ID must be a positive integer'),
  body('year')
    .notEmpty()
    .withMessage('Year is required')
    .isInt({ min: 2000, max: 2100 })
    .withMessage('Year must be between 2000 and 2100'),
  body('category_id')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage('Category ID must be a positive integer')
    .toInt(),
  body('cutoff_value')
    .notEmpty()
    .withMessage('Cutoff value is required')
    .isFloat({ min: 0 })
    .withMessage('Cutoff value must be a non-negative number')
];

/**
 * Validation rules for updating course cutoff
 */
const validateUpdateCourseCutoff = [
  body('course_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Course ID must be a positive integer'),
  body('exam_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Exam ID must be a positive integer'),
  body('year')
    .optional()
    .isInt({ min: 2000, max: 2100 })
    .withMessage('Year must be between 2000 and 2100'),
  body('category_id')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage('Category ID must be a positive integer')
    .toInt(),
  body('cutoff_value')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Cutoff value must be a non-negative number')
];

/**
 * Validation rules for creating course subject
 */
const validateCreateCourseSubject = [
  body('course_id')
    .notEmpty()
    .withMessage('Course ID is required')
    .isInt({ min: 1 })
    .withMessage('Course ID must be a positive integer'),
  body('subject_id')
    .notEmpty()
    .withMessage('Subject ID is required')
    .isInt({ min: 1 })
    .withMessage('Subject ID must be a positive integer')
];

/**
 * Validation rules for updating course subject
 */
const validateUpdateCourseSubject = [
  body('course_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Course ID must be a positive integer'),
  body('subject_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Subject ID must be a positive integer')
];

/**
 * Validation rules for creating college FAQ
 */
const validateCreateCollegeFAQ = [
  body('college_id')
    .notEmpty()
    .withMessage('College ID is required')
    .isInt({ min: 1 })
    .withMessage('College ID must be a positive integer'),
  body('question')
    .notEmpty()
    .withMessage('Question is required')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Question cannot be empty'),
  body('answer')
    .notEmpty()
    .withMessage('Answer is required')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Answer cannot be empty')
];

/**
 * Validation rules for updating college FAQ
 */
const validateUpdateCollegeFAQ = [
  body('college_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('College ID must be a positive integer'),
  body('question')
    .optional()
    .notEmpty()
    .withMessage('Question cannot be empty')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Question cannot be empty'),
  body('answer')
    .optional()
    .notEmpty()
    .withMessage('Answer cannot be empty')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Answer cannot be empty')
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
  validateSendEmailOTP,
  validateVerifyEmailOTP,
  validateUpdateAcademics,
  validateUpdateCareerGoals,
  validateCreateBlog,
  validateUpdateBlog,
  validateCreateSubject,
  validateUpdateSubject,
  validateCreateStream,
  validateUpdateStream,
  validateCreateCareer,
  validateUpdateCareer,
  validateCreateTopic,
  validateUpdateTopic,
  validateCreateSubtopic,
  validateUpdateSubtopic,
  validateCreateLecture,
  validateUpdateLecture,
  validateCreatePurpose,
  validateUpdatePurpose,
  validateCreateLevel,
  validateUpdateLevel,
  validateCreateProgram,
  validateUpdateProgram,
  validateCreateExamCity,
  validateUpdateExamCity,
  validateCreateCategory,
  validateUpdateCategory,
  validateCreateCollege,
  validateUpdateCollege,
  validateCreateCollegeLocation,
  validateUpdateCollegeLocation,
  validateCreateCollegeGallery,
  validateUpdateCollegeGallery,
  validateCreateCollegeReview,
  validateUpdateCollegeReview,
  validateCreateCollegeNews,
  validateUpdateCollegeNews,
  validateCreateCollegeCourse,
  validateUpdateCollegeCourse,
  validateCreateCourseExam,
  validateUpdateCourseExam,
  validateCreateCourseCutoff,
  validateUpdateCourseCutoff,
  validateCreateCourseSubject,
  validateUpdateCourseSubject,
  validateCreateCollegeFAQ,
  validateUpdateCollegeFAQ,
  validateGovernmentIdentification,
  validateCategoryAndReservation,
  validateOtherPersonalDetails,
  validateUserAddress
};

