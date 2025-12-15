const express = require('express');
const router = express.Router();
const multer = require('multer');
const AdminController = require('../../controllers/admin/adminController');
const AdminUsersController = require('../../controllers/admin/adminUsersController');
const CareerGoalsController = require('../../controllers/profile/careerGoalsController');
const ExamsController = require('../../controllers/profile/examsController');
const SubjectController = require('../../controllers/admin/subjectController');
const StreamController = require('../../controllers/admin/streamController');
const CareerController = require('../../controllers/admin/careerController');
const TopicController = require('../../controllers/admin/topicController');
const SubtopicController = require('../../controllers/admin/subtopicController');
const LectureController = require('../../controllers/admin/lectureController');
const PurposeController = require('../../controllers/admin/purposeController');
const LevelController = require('../../controllers/admin/levelController');
const ProgramController = require('../../controllers/admin/programController');
const CategoryController = require('../../controllers/admin/categoryController');
const { CollegeController, upload: logoUpload } = require('../../controllers/admin/collegeController');
const CollegeLocationController = require('../../controllers/admin/collegeLocationController');
const { CollegeGalleryController, upload: imageUpload } = require('../../controllers/admin/collegeGalleryController');
const CollegeReviewController = require('../../controllers/admin/collegeReviewController');
const CollegeNewsController = require('../../controllers/admin/collegeNewsController');
const { CollegeCourseController, upload: courseUpload } = require('../../controllers/admin/collegeCourseController');
const CourseExamController = require('../../controllers/admin/courseExamController');
const CourseCutoffController = require('../../controllers/admin/courseCutoffController');
const CourseSubjectController = require('../../controllers/admin/courseSubjectController');
const CollegeFAQController = require('../../controllers/admin/collegeFAQController');
const { authenticateAdmin, requireSuperAdmin } = require('../../middleware/adminAuth');
const {
  validateAdminLogin,
  validateCreateAdmin,
  validateUpdateAdmin,
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
  validateUpdateCollegeFAQ
} = require('../../middleware/validators');

// Configure multer for memory storage (for S3 upload)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

/**
 * @route   POST /api/admin/login
 * @desc    Admin login
 * @access  Public
 */
router.post('/login', validateAdminLogin, AdminController.login);

/**
 * @route   GET /api/admin/me
 * @desc    Get current authenticated admin
 * @access  Private (Admin)
 */
router.get('/me', authenticateAdmin, AdminController.getMe);

/**
 * IMPORTANT: More specific routes must come BEFORE general routes
 * Otherwise Express will match the general route first
 */

/**
 * @route   GET /api/admin/users/basic-info
 * @desc    Get all users with basic info
 * @access  Private (Admin)
 */
router.get('/users/basic-info', authenticateAdmin, AdminUsersController.getAllUsersBasicInfo);

/**
 * @route   GET /api/admin/users/academics
 * @desc    Get all users with academics
 * @access  Private (Admin)
 */
router.get('/users/academics', authenticateAdmin, AdminUsersController.getAllUsersAcademics);

/**
 * @route   GET /api/admin/users/career-goals
 * @desc    Get all users with career goals
 * @access  Private (Admin)
 */
router.get('/users/career-goals', authenticateAdmin, AdminUsersController.getAllUsersCareerGoals);

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get single user with complete details (basic + academics + career goals)
 * @access  Private (Admin)
 */
router.get('/users/:id', authenticateAdmin, AdminUsersController.getUserDetails);

/**
 * @route   GET /api/admin/users
 * @desc    Get all registered users
 * @access  Private (Admin)
 */
router.get('/users', authenticateAdmin, AdminController.getAllUsers);

/**
 * @route   GET /api/admin/admins
 * @desc    Get all admin users
 * @access  Private (Super Admin)
 */
router.get('/admins', authenticateAdmin, requireSuperAdmin, AdminController.getAllAdmins);

/**
 * @route   POST /api/admin/admins
 * @desc    Create new admin user
 * @access  Private (Super Admin)
 */
router.post('/admins', authenticateAdmin, requireSuperAdmin, validateCreateAdmin, AdminController.createAdmin);

/**
 * @route   PUT /api/admin/admins/:id
 * @desc    Update admin user
 * @access  Private (Super Admin)
 */
router.put('/admins/:id', authenticateAdmin, requireSuperAdmin, validateUpdateAdmin, AdminController.updateAdmin);

/**
 * @route   DELETE /api/admin/admins/:id
 * @desc    Delete admin user
 * @access  Private (Super Admin)
 */
router.delete('/admins/:id', authenticateAdmin, requireSuperAdmin, AdminController.deleteAdmin);

/**
 * Career Goals Taxonomy Routes
 */

/**
 * @route   GET /api/admin/career-goals
 * @desc    Get all career goals (for admin)
 * @access  Private (Admin)
 */
router.get('/career-goals', authenticateAdmin, CareerGoalsController.getAllAdmin);

/**
 * @route   POST /api/admin/career-goals/upload-image
 * @desc    Upload logo to S3
 * @access  Private (Admin)
 * IMPORTANT: This route must come BEFORE /career-goals/:id to avoid route conflicts
 */
router.post('/career-goals/upload-image', authenticateAdmin, upload.single('image'), CareerGoalsController.uploadImage);

/**
 * @route   POST /api/admin/career-goals
 * @desc    Create new career goal
 * @access  Private (Admin)
 */
router.post('/career-goals', authenticateAdmin, CareerGoalsController.create);

/**
 * @route   GET /api/admin/career-goals/:id
 * @desc    Get career goal by ID
 * @access  Private (Admin)
 */
router.get('/career-goals/:id', authenticateAdmin, CareerGoalsController.getById);

/**
 * @route   PUT /api/admin/career-goals/:id
 * @desc    Update career goal
 * @access  Private (Admin)
 */
router.put('/career-goals/:id', authenticateAdmin, CareerGoalsController.update);

/**
 * @route   DELETE /api/admin/career-goals/:id
 * @desc    Delete career goal
 * @access  Private (Admin)
 */
router.delete('/career-goals/:id', authenticateAdmin, CareerGoalsController.delete);

/**
 * Subjects Taxonomy Routes
 */

/**
 * @route   GET /api/admin/subjects
 * @desc    Get all subjects (for admin)
 * @access  Private (Admin)
 */
router.get('/subjects', authenticateAdmin, SubjectController.getAllSubjects);

/**
 * @route   GET /api/admin/subjects/:id
 * @desc    Get subject by ID
 * @access  Private (Admin)
 */
router.get('/subjects/:id', authenticateAdmin, SubjectController.getSubjectById);

/**
 * @route   POST /api/admin/subjects
 * @desc    Create new subject
 * @access  Private (Admin)
 */
router.post('/subjects', authenticateAdmin, validateCreateSubject, SubjectController.createSubject);

/**
 * @route   PUT /api/admin/subjects/:id
 * @desc    Update subject
 * @access  Private (Admin)
 */
router.put('/subjects/:id', authenticateAdmin, validateUpdateSubject, SubjectController.updateSubject);

/**
 * @route   DELETE /api/admin/subjects/:id
 * @desc    Delete subject
 * @access  Private (Admin)
 */
router.delete('/subjects/:id', authenticateAdmin, SubjectController.deleteSubject);

/**
 * Streams Taxonomy Routes
 */

/**
 * @route   GET /api/admin/streams
 * @desc    Get all streams (for admin)
 * @access  Private (Admin)
 */
router.get('/streams', authenticateAdmin, StreamController.getAllStreams);

/**
 * @route   GET /api/admin/streams/:id
 * @desc    Get stream by ID
 * @access  Private (Admin)
 */
router.get('/streams/:id', authenticateAdmin, StreamController.getStreamById);

/**
 * @route   POST /api/admin/streams
 * @desc    Create new stream
 * @access  Private (Admin)
 */
router.post('/streams', authenticateAdmin, validateCreateStream, StreamController.createStream);

/**
 * @route   PUT /api/admin/streams/:id
 * @desc    Update stream
 * @access  Private (Admin)
 */
router.put('/streams/:id', authenticateAdmin, validateUpdateStream, StreamController.updateStream);

/**
 * @route   DELETE /api/admin/streams/:id
 * @desc    Delete stream
 * @access  Private (Admin)
 */
router.delete('/streams/:id', authenticateAdmin, StreamController.deleteStream);

/**
 * Careers Taxonomy Routes
 */

/**
 * @route   GET /api/admin/careers
 * @desc    Get all careers (for admin)
 * @access  Private (Admin)
 */
router.get('/careers', authenticateAdmin, CareerController.getAllCareers);

/**
 * @route   GET /api/admin/careers/:id
 * @desc    Get career by ID
 * @access  Private (Admin)
 */
router.get('/careers/:id', authenticateAdmin, CareerController.getCareerById);

/**
 * @route   POST /api/admin/careers
 * @desc    Create new career
 * @access  Private (Admin)
 */
router.post('/careers', authenticateAdmin, validateCreateCareer, CareerController.createCareer);

/**
 * @route   PUT /api/admin/careers/:id
 * @desc    Update career
 * @access  Private (Admin)
 */
router.put('/careers/:id', authenticateAdmin, validateUpdateCareer, CareerController.updateCareer);

/**
 * @route   DELETE /api/admin/careers/:id
 * @desc    Delete career
 * @access  Private (Admin)
 */
router.delete('/careers/:id', authenticateAdmin, CareerController.deleteCareer);

/**
 * Exams Taxonomy Routes
 */

/**
 * @route   GET /api/admin/exams
 * @desc    Get all exams (for admin)
 * @access  Private (Admin)
 */
router.get('/exams', authenticateAdmin, ExamsController.getAllAdmin);

/**
 * @route   POST /api/admin/exams
 * @desc    Create new exam (for admin)
 * @access  Private (Admin)
 */
router.post('/exams', authenticateAdmin, ExamsController.create);

/**
 * @route   GET /api/admin/exams/:id
 * @desc    Get exam by ID (for admin)
 * @access  Private (Admin)
 */
router.get('/exams/:id', authenticateAdmin, ExamsController.getById);

/**
 * @route   PUT /api/admin/exams/:id
 * @desc    Update exam (for admin)
 * @access  Private (Admin)
 */
router.put('/exams/:id', authenticateAdmin, ExamsController.update);

/**
 * @route   DELETE /api/admin/exams/:id
 * @desc    Delete exam (for admin)
 * @access  Private (Admin)
 */
router.delete('/exams/:id', authenticateAdmin, ExamsController.delete);

/**
 * Topics Routes
 */

/**
 * @route   GET /api/admin/topics
 * @desc    Get all topics
 * @access  Private (Admin)
 */
router.get('/topics', authenticateAdmin, TopicController.getAllTopics);

/**
 * @route   GET /api/admin/topics/:id
 * @desc    Get topic by ID
 * @access  Private (Admin)
 */
router.get('/topics/:id', authenticateAdmin, TopicController.getTopicById);

/**
 * @route   POST /api/admin/topics
 * @desc    Create new topic
 * @access  Private (Admin)
 */
router.post('/topics', authenticateAdmin, TopicController.upload.single('thumbnail'), validateCreateTopic, TopicController.createTopic);

/**
 * @route   PUT /api/admin/topics/:id
 * @desc    Update topic
 * @access  Private (Admin)
 */
router.put('/topics/:id', authenticateAdmin, TopicController.upload.single('thumbnail'), validateUpdateTopic, TopicController.updateTopic);

/**
 * @route   DELETE /api/admin/topics/:id
 * @desc    Delete topic
 * @access  Private (Admin)
 */
router.delete('/topics/:id', authenticateAdmin, TopicController.deleteTopic);

/**
 * @route   POST /api/admin/topics/upload-thumbnail
 * @desc    Upload topic thumbnail
 * @access  Private (Admin)
 */
router.post('/topics/upload-thumbnail', authenticateAdmin, TopicController.upload.single('thumbnail'), TopicController.uploadThumbnail);

/**
 * Subtopics Routes
 */

/**
 * @route   GET /api/admin/subtopics
 * @desc    Get all subtopics
 * @access  Private (Admin)
 */
router.get('/subtopics', authenticateAdmin, SubtopicController.getAllSubtopics);

/**
 * @route   GET /api/admin/subtopics/topic/:topicId
 * @desc    Get subtopics by topic ID
 * @access  Private (Admin)
 */
router.get('/subtopics/topic/:topicId', authenticateAdmin, SubtopicController.getSubtopicsByTopicId);

/**
 * @route   GET /api/admin/subtopics/:id
 * @desc    Get subtopic by ID
 * @access  Private (Admin)
 */
router.get('/subtopics/:id', authenticateAdmin, SubtopicController.getSubtopicById);

/**
 * @route   POST /api/admin/subtopics
 * @desc    Create new subtopic
 * @access  Private (Admin)
 */
router.post('/subtopics', authenticateAdmin, validateCreateSubtopic, SubtopicController.createSubtopic);

/**
 * @route   PUT /api/admin/subtopics/:id
 * @desc    Update subtopic
 * @access  Private (Admin)
 */
router.put('/subtopics/:id', authenticateAdmin, validateUpdateSubtopic, SubtopicController.updateSubtopic);

/**
 * @route   DELETE /api/admin/subtopics/:id
 * @desc    Delete subtopic
 * @access  Private (Admin)
 */
router.delete('/subtopics/:id', authenticateAdmin, SubtopicController.deleteSubtopic);

/**
 * Lectures Routes
 */

/**
 * @route   GET /api/admin/lectures
 * @desc    Get all lectures
 * @access  Private (Admin)
 */
router.get('/lectures', authenticateAdmin, LectureController.getAllLectures);

/**
 * @route   GET /api/admin/lectures/subtopic/:subtopicId
 * @desc    Get lectures by subtopic ID
 * @access  Private (Admin)
 */
router.get('/lectures/subtopic/:subtopicId', authenticateAdmin, LectureController.getLecturesBySubtopicId);

/**
 * @route   GET /api/admin/lectures/:id
 * @desc    Get lecture by ID
 * @access  Private (Admin)
 */
router.get('/lectures/:id', authenticateAdmin, LectureController.getLectureById);

/**
 * @route   POST /api/admin/lectures
 * @desc    Create new lecture
 * @access  Private (Admin)
 */
router.post('/lectures', authenticateAdmin, LectureController.upload.fields([
  { name: 'video_file', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), validateCreateLecture, LectureController.createLecture);

/**
 * @route   PUT /api/admin/lectures/:id
 * @desc    Update lecture
 * @access  Private (Admin)
 */
router.put('/lectures/:id', authenticateAdmin, LectureController.upload.fields([
  { name: 'video_file', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), validateUpdateLecture, LectureController.updateLecture);

/**
 * @route   DELETE /api/admin/lectures/:id
 * @desc    Delete lecture
 * @access  Private (Admin)
 */
router.delete('/lectures/:id', authenticateAdmin, LectureController.deleteLecture);

/**
 * Purposes Taxonomy Routes
 */

/**
 * @route   GET /api/admin/purposes
 * @desc    Get all purposes (for admin)
 * @access  Private (Admin)
 */
router.get('/purposes', authenticateAdmin, PurposeController.getAllPurposes);

/**
 * @route   GET /api/admin/purposes/:id
 * @desc    Get purpose by ID
 * @access  Private (Admin)
 */
router.get('/purposes/:id', authenticateAdmin, PurposeController.getPurposeById);

/**
 * @route   POST /api/admin/purposes
 * @desc    Create new purpose
 * @access  Private (Admin)
 */
router.post('/purposes', authenticateAdmin, validateCreatePurpose, PurposeController.createPurpose);

/**
 * @route   PUT /api/admin/purposes/:id
 * @desc    Update purpose
 * @access  Private (Admin)
 */
router.put('/purposes/:id', authenticateAdmin, validateUpdatePurpose, PurposeController.updatePurpose);

/**
 * @route   DELETE /api/admin/purposes/:id
 * @desc    Delete purpose
 * @access  Private (Admin)
 */
router.delete('/purposes/:id', authenticateAdmin, PurposeController.deletePurpose);

/**
 * @route   GET /api/admin/levels
 * @desc    Get all levels (for admin)
 * @access  Private (Admin)
 */
router.get('/levels', authenticateAdmin, LevelController.getAllLevels);

/**
 * @route   GET /api/admin/levels/:id
 * @desc    Get level by ID
 * @access  Private (Admin)
 */
router.get('/levels/:id', authenticateAdmin, LevelController.getLevelById);

/**
 * @route   POST /api/admin/levels
 * @desc    Create new level
 * @access  Private (Admin)
 */
router.post('/levels', authenticateAdmin, validateCreateLevel, LevelController.createLevel);

/**
 * @route   PUT /api/admin/levels/:id
 * @desc    Update level
 * @access  Private (Admin)
 */
router.put('/levels/:id', authenticateAdmin, validateUpdateLevel, LevelController.updateLevel);

/**
 * @route   DELETE /api/admin/levels/:id
 * @desc    Delete level
 * @access  Private (Admin)
 */
router.delete('/levels/:id', authenticateAdmin, LevelController.deleteLevel);

/**
 * @route   GET /api/admin/programs
 * @desc    Get all programs (for admin)
 * @access  Private (Admin)
 */
router.get('/programs', authenticateAdmin, ProgramController.getAllPrograms);

/**
 * @route   GET /api/admin/programs/:id
 * @desc    Get program by ID
 * @access  Private (Admin)
 */
router.get('/programs/:id', authenticateAdmin, ProgramController.getProgramById);

/**
 * @route   POST /api/admin/programs
 * @desc    Create new program
 * @access  Private (Admin)
 */
router.post('/programs', authenticateAdmin, validateCreateProgram, ProgramController.createProgram);

/**
 * @route   PUT /api/admin/programs/:id
 * @desc    Update program
 * @access  Private (Admin)
 */
router.put('/programs/:id', authenticateAdmin, validateUpdateProgram, ProgramController.updateProgram);

/**
 * @route   DELETE /api/admin/programs/:id
 * @desc    Delete program
 * @access  Private (Admin)
 */
router.delete('/programs/:id', authenticateAdmin, ProgramController.deleteProgram);

/**
 * @route   GET /api/admin/categories
 * @desc    Get all categories
 * @access  Private (Admin)
 */
router.get('/categories', authenticateAdmin, CategoryController.getAllCategories);

/**
 * @route   GET /api/admin/categories/:id
 * @desc    Get category by ID
 * @access  Private (Admin)
 */
router.get('/categories/:id', authenticateAdmin, CategoryController.getCategoryById);

/**
 * @route   POST /api/admin/categories
 * @desc    Create new category
 * @access  Private (Admin)
 */
router.post('/categories', authenticateAdmin, validateCreateCategory, CategoryController.createCategory);

/**
 * @route   PUT /api/admin/categories/:id
 * @desc    Update category
 * @access  Private (Admin)
 */
router.put('/categories/:id', authenticateAdmin, validateUpdateCategory, CategoryController.updateCategory);

/**
 * @route   DELETE /api/admin/categories/:id
 * @desc    Delete category
 * @access  Private (Admin)
 */
router.delete('/categories/:id', authenticateAdmin, CategoryController.deleteCategory);

/**
 * @route   GET /api/admin/colleges
 * @desc    Get all colleges (for admin)
 * @access  Private (Admin)
 */
router.get('/colleges', authenticateAdmin, CollegeController.getAllColleges);

/**
 * @route   GET /api/admin/colleges/:id
 * @desc    Get college by ID
 * @access  Private (Admin)
 */
router.get('/colleges/:id', authenticateAdmin, CollegeController.getCollegeById);

/**
 * @route   POST /api/admin/colleges
 * @desc    Create new college
 * @access  Private (Admin)
 */
router.post('/colleges', authenticateAdmin, logoUpload.single('logo'), validateCreateCollege, CollegeController.createCollege);

/**
 * @route   PUT /api/admin/colleges/:id
 * @desc    Update college
 * @access  Private (Admin)
 */
router.put('/colleges/:id', authenticateAdmin, logoUpload.single('logo'), validateUpdateCollege, CollegeController.updateCollege);

/**
 * @route   DELETE /api/admin/colleges/:id
 * @desc    Delete college
 * @access  Private (Admin)
 */
router.delete('/colleges/:id', authenticateAdmin, CollegeController.deleteCollege);

/**
 * @route   GET /api/admin/college-locations
 * @desc    Get all college locations (for admin)
 * @access  Private (Admin)
 */
router.get('/college-locations', authenticateAdmin, CollegeLocationController.getAllCollegeLocations);

/**
 * @route   GET /api/admin/college-locations/:id
 * @desc    Get college location by ID
 * @access  Private (Admin)
 */
router.get('/college-locations/:id', authenticateAdmin, CollegeLocationController.getCollegeLocationById);

/**
 * @route   POST /api/admin/college-locations
 * @desc    Create new college location
 * @access  Private (Admin)
 */
router.post('/college-locations', authenticateAdmin, validateCreateCollegeLocation, CollegeLocationController.createCollegeLocation);

/**
 * @route   PUT /api/admin/college-locations/:id
 * @desc    Update college location
 * @access  Private (Admin)
 */
router.put('/college-locations/:id', authenticateAdmin, validateUpdateCollegeLocation, CollegeLocationController.updateCollegeLocation);

/**
 * @route   DELETE /api/admin/college-locations/:id
 * @desc    Delete college location
 * @access  Private (Admin)
 */
router.delete('/college-locations/:id', authenticateAdmin, CollegeLocationController.deleteCollegeLocation);

/**
 * @route   GET /api/admin/college-gallery
 * @desc    Get all college gallery images (for admin)
 * @access  Private (Admin)
 */
router.get('/college-gallery', authenticateAdmin, CollegeGalleryController.getAllCollegeGallery);

/**
 * @route   GET /api/admin/college-gallery/:id
 * @desc    Get gallery image by ID
 * @access  Private (Admin)
 */
router.get('/college-gallery/:id', authenticateAdmin, CollegeGalleryController.getCollegeGalleryById);

/**
 * @route   POST /api/admin/college-gallery
 * @desc    Create new gallery image
 * @access  Private (Admin)
 */
router.post('/college-gallery', authenticateAdmin, imageUpload.single('image'), validateCreateCollegeGallery, CollegeGalleryController.createCollegeGallery);

/**
 * @route   PUT /api/admin/college-gallery/:id
 * @desc    Update gallery image
 * @access  Private (Admin)
 */
router.put('/college-gallery/:id', authenticateAdmin, imageUpload.single('image'), validateUpdateCollegeGallery, CollegeGalleryController.updateCollegeGallery);

/**
 * @route   DELETE /api/admin/college-gallery/:id
 * @desc    Delete gallery image
 * @access  Private (Admin)
 */
router.delete('/college-gallery/:id', authenticateAdmin, CollegeGalleryController.deleteCollegeGallery);

/**
 * @route   GET /api/admin/college-reviews
 * @desc    Get all college reviews (for admin)
 * @access  Private (Admin)
 */
router.get('/college-reviews', authenticateAdmin, CollegeReviewController.getAllCollegeReviews);

/**
 * @route   GET /api/admin/college-reviews/:id
 * @desc    Get review by ID
 * @access  Private (Admin)
 */
router.get('/college-reviews/:id', authenticateAdmin, CollegeReviewController.getCollegeReviewById);

/**
 * @route   POST /api/admin/college-reviews
 * @desc    Create new review
 * @access  Private (Admin)
 */
router.post('/college-reviews', authenticateAdmin, validateCreateCollegeReview, CollegeReviewController.createCollegeReview);

/**
 * @route   PUT /api/admin/college-reviews/:id
 * @desc    Update review
 * @access  Private (Admin)
 */
router.put('/college-reviews/:id', authenticateAdmin, validateUpdateCollegeReview, CollegeReviewController.updateCollegeReview);

/**
 * @route   DELETE /api/admin/college-reviews/:id
 * @desc    Delete review
 * @access  Private (Admin)
 */
router.delete('/college-reviews/:id', authenticateAdmin, CollegeReviewController.deleteCollegeReview);

/**
 * @route   GET /api/admin/college-news
 * @desc    Get all college news (for admin)
 * @access  Private (Admin)
 */
router.get('/college-news', authenticateAdmin, CollegeNewsController.getAllCollegeNews);

/**
 * @route   GET /api/admin/college-news/:id
 * @desc    Get news by ID
 * @access  Private (Admin)
 */
router.get('/college-news/:id', authenticateAdmin, CollegeNewsController.getCollegeNewsById);

/**
 * @route   POST /api/admin/college-news
 * @desc    Create new news article
 * @access  Private (Admin)
 */
router.post('/college-news', authenticateAdmin, validateCreateCollegeNews, CollegeNewsController.createCollegeNews);

/**
 * @route   PUT /api/admin/college-news/:id
 * @desc    Update news article
 * @access  Private (Admin)
 */
router.put('/college-news/:id', authenticateAdmin, validateUpdateCollegeNews, CollegeNewsController.updateCollegeNews);

/**
 * @route   DELETE /api/admin/college-news/:id
 * @desc    Delete news article
 * @access  Private (Admin)
 */
router.delete('/college-news/:id', authenticateAdmin, CollegeNewsController.deleteCollegeNews);

/**
 * @route   GET /api/admin/college-courses
 * @desc    Get all college courses (for admin)
 * @access  Private (Admin)
 */
router.get('/college-courses', authenticateAdmin, CollegeCourseController.getAllCollegeCourses);

/**
 * @route   GET /api/admin/college-courses/:id
 * @desc    Get course by ID
 * @access  Private (Admin)
 */
router.get('/college-courses/:id', authenticateAdmin, CollegeCourseController.getCollegeCourseById);

/**
 * @route   POST /api/admin/college-courses
 * @desc    Create new course
 * @access  Private (Admin)
 */
router.post('/college-courses', authenticateAdmin, courseUpload.single('brochure'), validateCreateCollegeCourse, CollegeCourseController.createCollegeCourse);

/**
 * @route   PUT /api/admin/college-courses/:id
 * @desc    Update course
 * @access  Private (Admin)
 */
router.put('/college-courses/:id', authenticateAdmin, courseUpload.single('brochure'), validateUpdateCollegeCourse, CollegeCourseController.updateCollegeCourse);

/**
 * @route   DELETE /api/admin/college-courses/:id
 * @desc    Delete course
 * @access  Private (Admin)
 */
router.delete('/college-courses/:id', authenticateAdmin, CollegeCourseController.deleteCollegeCourse);

/**
 * @route   GET /api/admin/course-exams
 * @desc    Get all course exams
 * @access  Private (Admin)
 */
router.get('/course-exams', authenticateAdmin, CourseExamController.getAllCourseExams);

/**
 * @route   GET /api/admin/course-exams/:id
 * @desc    Get exam by ID
 * @access  Private (Admin)
 */
router.get('/course-exams/:id', authenticateAdmin, CourseExamController.getCourseExamById);

/**
 * @route   POST /api/admin/course-exams
 * @desc    Create new exam
 * @access  Private (Admin)
 */
router.post('/course-exams', authenticateAdmin, validateCreateCourseExam, CourseExamController.createCourseExam);

/**
 * @route   PUT /api/admin/course-exams/:id
 * @desc    Update exam
 * @access  Private (Admin)
 */
router.put('/course-exams/:id', authenticateAdmin, validateUpdateCourseExam, CourseExamController.updateCourseExam);

/**
 * @route   DELETE /api/admin/course-exams/:id
 * @desc    Delete exam
 * @access  Private (Admin)
 */
router.delete('/course-exams/:id', authenticateAdmin, CourseExamController.deleteCourseExam);

/**
 * @route   GET /api/admin/course-cutoffs
 * @desc    Get all course cutoffs
 * @access  Private (Admin)
 */
router.get('/course-cutoffs', authenticateAdmin, CourseCutoffController.getAllCourseCutoffs);

/**
 * @route   GET /api/admin/course-cutoffs/:id
 * @desc    Get cutoff by ID
 * @access  Private (Admin)
 */
router.get('/course-cutoffs/:id', authenticateAdmin, CourseCutoffController.getCourseCutoffById);

/**
 * @route   POST /api/admin/course-cutoffs
 * @desc    Create new cutoff
 * @access  Private (Admin)
 */
router.post('/course-cutoffs', authenticateAdmin, validateCreateCourseCutoff, CourseCutoffController.createCourseCutoff);

/**
 * @route   PUT /api/admin/course-cutoffs/:id
 * @desc    Update cutoff
 * @access  Private (Admin)
 */
router.put('/course-cutoffs/:id', authenticateAdmin, validateUpdateCourseCutoff, CourseCutoffController.updateCourseCutoff);

/**
 * @route   DELETE /api/admin/course-cutoffs/:id
 * @desc    Delete cutoff
 * @access  Private (Admin)
 */
router.delete('/course-cutoffs/:id', authenticateAdmin, CourseCutoffController.deleteCourseCutoff);

/**
 * @route   GET /api/admin/course-subjects
 * @desc    Get all course subjects
 * @access  Private (Admin)
 */
router.get('/course-subjects', authenticateAdmin, CourseSubjectController.getAllCourseSubjects);

/**
 * @route   GET /api/admin/course-subjects/:id
 * @desc    Get subject by ID
 * @access  Private (Admin)
 */
router.get('/course-subjects/:id', authenticateAdmin, CourseSubjectController.getCourseSubjectById);

/**
 * @route   POST /api/admin/course-subjects
 * @desc    Create new course subject
 * @access  Private (Admin)
 */
router.post('/course-subjects', authenticateAdmin, validateCreateCourseSubject, CourseSubjectController.createCourseSubject);

/**
 * @route   PUT /api/admin/course-subjects/:id
 * @desc    Update course subject
 * @access  Private (Admin)
 */
router.put('/course-subjects/:id', authenticateAdmin, validateUpdateCourseSubject, CourseSubjectController.updateCourseSubject);

/**
 * @route   DELETE /api/admin/course-subjects/:id
 * @desc    Delete course subject
 * @access  Private (Admin)
 */
router.delete('/course-subjects/:id', authenticateAdmin, CourseSubjectController.deleteCourseSubject);

/**
 * @route   GET /api/admin/college-faqs
 * @desc    Get all college FAQs
 * @access  Private (Admin)
 */
router.get('/college-faqs', authenticateAdmin, CollegeFAQController.getAllCollegeFAQs);

/**
 * @route   GET /api/admin/college-faqs/:id
 * @desc    Get FAQ by ID
 * @access  Private (Admin)
 */
router.get('/college-faqs/:id', authenticateAdmin, CollegeFAQController.getCollegeFAQById);

/**
 * @route   POST /api/admin/college-faqs
 * @desc    Create new FAQ
 * @access  Private (Admin)
 */
router.post('/college-faqs', authenticateAdmin, validateCreateCollegeFAQ, CollegeFAQController.createCollegeFAQ);

/**
 * @route   PUT /api/admin/college-faqs/:id
 * @desc    Update FAQ
 * @access  Private (Admin)
 */
router.put('/college-faqs/:id', authenticateAdmin, validateUpdateCollegeFAQ, CollegeFAQController.updateCollegeFAQ);

/**
 * @route   DELETE /api/admin/college-faqs/:id
 * @desc    Delete FAQ
 * @access  Private (Admin)
 */
router.delete('/college-faqs/:id', authenticateAdmin, CollegeFAQController.deleteCollegeFAQ);

/**
 * @route   POST /api/admin/lectures/upload-video
 * @desc    Upload lecture video
 * @access  Private (Admin)
 */
router.post('/lectures/upload-video', authenticateAdmin, LectureController.upload.single('video_file'), LectureController.uploadVideo);

/**
 * @route   POST /api/admin/lectures/upload-thumbnail
 * @desc    Upload lecture thumbnail
 * @access  Private (Admin)
 */
router.post('/lectures/upload-thumbnail', authenticateAdmin, LectureController.upload.single('thumbnail'), LectureController.uploadThumbnail);

/**
 * @route   POST /api/admin/lectures/upload-image
 * @desc    Upload image for rich text editor (article content)
 * @access  Private (Admin)
 */
router.post('/lectures/upload-image', authenticateAdmin, LectureController.upload.single('lecture_image'), LectureController.uploadImage);

module.exports = router;

