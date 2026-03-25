const express = require('express');
const router = express.Router();
const multer = require('multer');
const AdminController = require('../../controllers/admin/adminController');
const AdminUsersController = require('../../controllers/admin/adminUsersController');
const CareerGoalsController = require('../../controllers/profile/careerGoalsController');
const ExamsController = require('../../controllers/profile/examsController');
const MockPromptsController = require('../../controllers/admin/mockPromptsController');
const SubjectController = require('../../controllers/admin/subjectController');
const StreamController = require('../../controllers/admin/streamController');
const CareerController = require('../../controllers/admin/careerController');
const TopicController = require('../../controllers/admin/topicController');
const SubtopicController = require('../../controllers/admin/subtopicController');
const LectureController = require('../../controllers/admin/lectureController');
const PurposeController = require('../../controllers/admin/purposeController');
const LevelController = require('../../controllers/admin/levelController');
const ProgramController = require('../../controllers/admin/programController');
const ExamCityController = require('../../controllers/admin/examCityController');
const CategoryController = require('../../controllers/admin/categoryController');
const CollegesController = require('../../controllers/admin/collegesController');
const BranchController = require('../../controllers/admin/branchController');
const InstitutesController = require('../../controllers/admin/institutesController');
const ScholarshipsController = require('../../controllers/admin/scholarshipsController');
const LoansController = require('../../controllers/admin/loansController');
const ModulesController = require('../../controllers/admin/modulesController');
const { authenticateAdmin, requireSuperAdmin, requireModuleAccess, requireCanDelete, requireCanEdit, requireCanDownloadExcel } = require('../../middleware/adminAuth');
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
  validateCreateExamCity,
  validateUpdateExamCity,
  validateCreateCategory,
  validateUpdateCategory,
  validateCreateAutomationExam,
  validateUpdateAutomationExam,
  validateCreateBranch,
  validateUpdateBranch
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

// Multer for bulk exam upload: Excel + multiple logo images or one ZIP of logos
const uploadBulkExams = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB per file (zip can contain many images)
  },
  fileFilter: (req, file, cb) => {
    const field = file.fieldname || '';
    if (field === 'excel') {
      const ok = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ].includes(file.mimetype);
      return cb(ok ? null : new Error('Excel file required (.xlsx or .xls)'), ok);
    }
    if (field === 'logos') {
      return cb(null, file.mimetype.startsWith('image/'));
    }
    if (field === 'logos_zip') {
      const ok = file.mimetype === 'application/zip' || file.mimetype === 'application/x-zip-compressed' || (file.originalname || '').toLowerCase().endsWith('.zip');
      return cb(ok ? null : new Error('ZIP file required for logos'), ok);
    }
    cb(null, false);
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
router.get('/users/basic-info', authenticateAdmin, requireSuperAdmin, AdminUsersController.getAllUsersBasicInfo);

/**
 * @route   GET /api/admin/users/academics
 * @desc    Get all users with academics
 * @access  Private (Super Admin only - Users module not assignable to Data Entry/Admin)
 */
router.get('/users/academics', authenticateAdmin, requireSuperAdmin, AdminUsersController.getAllUsersAcademics);

/**
 * @route   GET /api/admin/users/career-goals
 * @desc    Get all users with career goals
 * @access  Private (Super Admin only)
 */
router.get('/users/career-goals', authenticateAdmin, requireSuperAdmin, AdminUsersController.getAllUsersCareerGoals);

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get single user with complete details (basic + academics + career goals)
 * @access  Private (Super Admin only)
 */
router.get('/users/:id', authenticateAdmin, requireSuperAdmin, AdminUsersController.getUserDetails);

/**
 * @route   GET /api/admin/users
 * @desc    Get all registered users
 * @access  Private (Super Admin only)
 */
router.get('/users', authenticateAdmin, requireSuperAdmin, AdminController.getAllUsers);

/**
 * Modules taxonomy - Super Admin only (used when assigning modules to Data Entry/Admin)
 */
router.get('/modules', authenticateAdmin, requireSuperAdmin, ModulesController.getAll);
router.get('/modules/:id', authenticateAdmin, requireSuperAdmin, ModulesController.getById);
router.post('/modules', authenticateAdmin, requireSuperAdmin, ModulesController.create);
router.put('/modules/:id', authenticateAdmin, requireSuperAdmin, ModulesController.update);
router.delete('/modules/:id', authenticateAdmin, requireSuperAdmin, ModulesController.delete);

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
 * Career Goals Taxonomy Routes (module: career_goals; Data Entry: add only; Admin: add+edit; Super Admin: full+delete)
 */
router.get('/career-goals', authenticateAdmin, requireModuleAccess('career_goals'), CareerGoalsController.getAllAdmin);
router.get('/career-goals/download-excel', authenticateAdmin, requireModuleAccess('career_goals'), requireCanDownloadExcel, CareerGoalsController.downloadAllExcel);
router.post('/career-goals/upload-image', authenticateAdmin, requireModuleAccess('career_goals'), upload.single('image'), CareerGoalsController.uploadImage);
router.post('/career-goals/upload-missing-logos', authenticateAdmin, requireModuleAccess('career_goals'), uploadBulkExams.fields([{ name: 'logos_zip', maxCount: 1 }]), CareerGoalsController.uploadMissingLogos);
router.post('/career-goals', authenticateAdmin, requireModuleAccess('career_goals'), CareerGoalsController.create);
router.get('/career-goals/:id', authenticateAdmin, requireModuleAccess('career_goals'), CareerGoalsController.getById);
router.put('/career-goals/:id', authenticateAdmin, requireModuleAccess('career_goals'), requireCanEdit, CareerGoalsController.update);
router.delete('/career-goals/all', authenticateAdmin, requireModuleAccess('career_goals'), requireCanDelete, CareerGoalsController.deleteAll);
router.delete('/career-goals/:id', authenticateAdmin, requireModuleAccess('career_goals'), requireCanDelete, CareerGoalsController.delete);

/**
 * Subjects Taxonomy Routes
 */

/**
 * @route   GET /api/admin/subjects
 * @desc    Get all subjects (for admin)
 * @access  Private (Admin)
 */
router.get('/subjects', authenticateAdmin, requireModuleAccess('subjects'), SubjectController.getAllSubjects);

router.get('/subjects/bulk-upload-template', authenticateAdmin, requireModuleAccess('subjects'), SubjectController.downloadBulkTemplate);
router.get('/subjects/download-excel', authenticateAdmin, requireModuleAccess('subjects'), requireCanDownloadExcel, SubjectController.downloadAllExcel);
router.post('/subjects/bulk-upload', authenticateAdmin, requireModuleAccess('subjects'), uploadBulkExams.fields([{ name: 'excel', maxCount: 1 }]), SubjectController.bulkUpload);

/**
 * @route   GET /api/admin/subjects/:id
 * @desc    Get subject by ID
 * @access  Private (Admin)
 */
router.get('/subjects/:id', authenticateAdmin, requireModuleAccess('subjects'), SubjectController.getSubjectById);

/**
 * @route   POST /api/admin/subjects
 * @desc    Create new subject
 * @access  Private (Admin)
 */
router.post('/subjects', authenticateAdmin, requireModuleAccess('subjects'), validateCreateSubject, SubjectController.createSubject);

/**
 * @route   PUT /api/admin/subjects/:id
 * @desc    Update subject
 * @access  Private (Admin)
 */
router.put('/subjects/:id', authenticateAdmin, requireModuleAccess('subjects'), requireCanEdit, validateUpdateSubject, SubjectController.updateSubject);

/**
 * @route   DELETE /api/admin/subjects/:id
 * @desc    Delete subject
 * @access  Private (Admin)
 */
router.delete('/subjects/:id', authenticateAdmin, requireModuleAccess('subjects'), requireCanDelete, SubjectController.deleteSubject);

/**
 * Streams Taxonomy Routes
 */

/**
 * @route   GET /api/admin/streams
 * @desc    Get all streams (for admin)
 * @access  Private (Admin)
 */
router.get('/streams', authenticateAdmin, requireModuleAccess('streams'), StreamController.getAllStreams);

/**
 * @route   GET /api/admin/streams/:id
 * @desc    Get stream by ID
 * @access  Private (Admin)
 */
router.get('/streams/:id', authenticateAdmin, requireModuleAccess('streams'), StreamController.getStreamById);

/**
 * @route   POST /api/admin/streams
 * @desc    Create new stream
 * @access  Private (Admin)
 */
router.post('/streams', authenticateAdmin, requireModuleAccess('streams'), validateCreateStream, StreamController.createStream);

/**
 * @route   PUT /api/admin/streams/:id
 * @desc    Update stream
 * @access  Private (Admin)
 */
router.put('/streams/:id', authenticateAdmin, requireModuleAccess('streams'), requireCanEdit, validateUpdateStream, StreamController.updateStream);

/**
 * @route   DELETE /api/admin/streams/:id
 * @desc    Delete stream
 * @access  Private (Admin)
 */
router.delete('/streams/:id', authenticateAdmin, requireModuleAccess('streams'), requireCanDelete, StreamController.deleteStream);

/**
 * Careers Taxonomy Routes
 */

/**
 * @route   GET /api/admin/careers
 * @desc    Get all careers (for admin)
 * @access  Private (Admin)
 */
router.get('/careers', authenticateAdmin, requireModuleAccess('careers'), CareerController.getAllCareers);

/**
 * @route   GET /api/admin/careers/bulk-upload-template
 * @desc    Download careers bulk upload template
 * @access  Private (Admin)
 */
router.get('/careers/bulk-upload-template', authenticateAdmin, requireModuleAccess('careers'), CareerController.downloadBulkTemplate);

/**
 * @route   GET /api/admin/careers/download-excel
 * @desc    Download all careers as Excel (Super Admin only)
 * @access  Private (Admin)
 */
router.get('/careers/download-excel', authenticateAdmin, requireModuleAccess('careers'), requireCanDownloadExcel, CareerController.downloadAllExcel);

/**
 * @route   POST /api/admin/careers/bulk-upload
 * @desc    Bulk upload careers from Excel
 * @access  Private (Admin)
 */
router.post('/careers/bulk-upload', authenticateAdmin, requireModuleAccess('careers'), uploadBulkExams.fields([{ name: 'excel', maxCount: 1 }]), CareerController.bulkUpload);

/**
 * @route   DELETE /api/admin/careers/all
 * @desc    Delete all careers (Super Admin only)
 * @access  Private (Admin)
 */
router.delete('/careers/all', authenticateAdmin, requireModuleAccess('careers'), requireCanDelete, CareerController.deleteAll);

/**
 * @route   GET /api/admin/careers/:id
 * @desc    Get career by ID
 * @access  Private (Admin)
 */
router.get('/careers/:id', authenticateAdmin, requireModuleAccess('careers'), CareerController.getCareerById);

/**
 * @route   POST /api/admin/careers
 * @desc    Create new career
 * @access  Private (Admin)
 */
router.post('/careers', authenticateAdmin, requireModuleAccess('careers'), validateCreateCareer, CareerController.createCareer);

/**
 * @route   PUT /api/admin/careers/:id
 * @desc    Update career
 * @access  Private (Admin)
 */
router.put('/careers/:id', authenticateAdmin, requireModuleAccess('careers'), requireCanEdit, validateUpdateCareer, CareerController.updateCareer);

/**
 * @route   DELETE /api/admin/careers/:id
 * @desc    Delete career
 * @access  Private (Admin)
 */
router.delete('/careers/:id', authenticateAdmin, requireModuleAccess('careers'), requireCanDelete, CareerController.deleteCareer);

/**
 * Exams Taxonomy Routes
 */

/**
 * @route   GET /api/admin/exams
 * @desc    Get all exams (for admin)
 * @access  Private (Admin)
 */
router.get('/exams', authenticateAdmin, requireModuleAccess('exams'), ExamsController.getAllAdmin);

/**
 * @route   POST /api/admin/exams/upload-logo
 * @desc    Upload exam logo to S3
 * @access  Private (Admin)
 * IMPORTANT: This route must come BEFORE /exams/:id to avoid route conflicts
 */
router.post('/exams/upload-logo', authenticateAdmin, requireModuleAccess('exams'), upload.single('image'), ExamsController.uploadLogo);

/**
 * @route   POST /api/admin/exams/upload-missing-logos
 * @desc    Upload missing logos from ZIP; matches by logo_file_name
 * @access  Private (Admin)
 */
router.post('/exams/upload-missing-logos', authenticateAdmin, requireModuleAccess('exams'), uploadBulkExams.fields([
  { name: 'logos_zip', maxCount: 1 },
]), ExamsController.uploadMissingLogos);

/**
 * @route   GET /api/admin/exams/bulk-upload-template
 * @desc    Download Excel template for bulk exam upload
 * @access  Private (Admin)
 */
router.get('/exams/bulk-upload-template', authenticateAdmin, requireModuleAccess('exams'), requireCanDownloadExcel, ExamsController.downloadBulkTemplate);

/**
 * @route   GET /api/admin/exams/download-excel
 * @desc    Download all exams data as Excel (Super Admin only)
 * @access  Private (Super Admin)
 */
router.get('/exams/download-excel', authenticateAdmin, requireModuleAccess('exams'), requireCanDownloadExcel, ExamsController.downloadAllExcel);

/**
 * @route   POST /api/admin/exams/bulk-upload
 * @desc    Bulk create exams from Excel; optional logos matched by logo_filename column
 * @access  Private (Admin)
 */
router.post('/exams/bulk-upload', authenticateAdmin, requireModuleAccess('exams'), uploadBulkExams.fields([
  { name: 'excel', maxCount: 1 },
  { name: 'logos', maxCount: 100 },
  { name: 'logos_zip', maxCount: 1 },
]), ExamsController.bulkUpload);

/**
 * @route   POST /api/admin/exams
 * @desc    Create new exam (for admin)
 * @access  Private (Admin)
 */
router.post('/exams', authenticateAdmin, requireModuleAccess('exams'), ExamsController.create);

/**
 * @route   GET /api/admin/exams/:id/prompt
 * @desc    Get exam generation prompt (for admin)
 * @access  Private (Admin)
 */
router.get('/exams/:id/prompt', authenticateAdmin, ExamsController.getPrompt);

/**
 * @route   PUT /api/admin/exams/:id/prompt
 * @desc    Update exam generation prompt (for admin)
 * @access  Private (Admin)
 */
router.put('/exams/:id/prompt', authenticateAdmin, ExamsController.updatePrompt);

/**
 * @route   GET /api/admin/exams/:id
 * @desc    Get exam by ID (for admin)
 * @access  Private (Admin)
 */
router.get('/exams/:id', authenticateAdmin, requireModuleAccess('exams'), ExamsController.getById);

/**
 * @route   PUT /api/admin/exams/:id
 * @desc    Update exam (for admin)
 * @access  Private (Admin)
 */
router.put('/exams/:id', authenticateAdmin, requireModuleAccess('exams'), requireCanEdit, ExamsController.update);

/**
 * @route   DELETE /api/admin/exams/all
 * @desc    Delete all exams (Super Admin only)
 * @access  Private (Admin)
 */
router.delete('/exams/all', authenticateAdmin, requireModuleAccess('exams'), requireCanDelete, ExamsController.deleteAll);

/**
 * @route   DELETE /api/admin/exams/:id
 * @desc    Delete exam (for admin)
 * @access  Private (Admin)
 */
router.delete('/exams/:id', authenticateAdmin, requireModuleAccess('exams'), requireCanDelete, ExamsController.delete);

/**
 * Mock Prompts (exam_mock_prompts table by exam ID)
 */
router.get('/mock-prompts', authenticateAdmin, MockPromptsController.list);
router.get('/mock-prompts/:examId', authenticateAdmin, MockPromptsController.get);
router.put('/mock-prompts/:examId', authenticateAdmin, MockPromptsController.update);

/**
 * Topics Routes
 */

/**
 * @route   GET /api/admin/topics
 * @desc    Get all topics
 * @access  Private (Admin)
 */
router.get('/topics', authenticateAdmin, requireModuleAccess('topics'), TopicController.getAllTopics);

/**
 * @route   GET /api/admin/topics/:id
 * @desc    Get topic by ID
 * @access  Private (Admin)
 */
router.get('/topics/:id', authenticateAdmin, requireModuleAccess('topics'), TopicController.getTopicById);

/**
 * @route   POST /api/admin/topics
 * @desc    Create new topic
 * @access  Private (Admin)
 */
router.post('/topics', authenticateAdmin, requireModuleAccess('topics'), TopicController.upload.single('thumbnail'), validateCreateTopic, TopicController.createTopic);

/**
 * @route   PUT /api/admin/topics/:id
 * @desc    Update topic
 * @access  Private (Admin)
 */
router.put('/topics/:id', authenticateAdmin, requireModuleAccess('topics'), requireCanEdit, TopicController.upload.single('thumbnail'), validateUpdateTopic, TopicController.updateTopic);

/**
 * @route   DELETE /api/admin/topics/:id
 * @desc    Delete topic
 * @access  Private (Admin)
 */
router.delete('/topics/:id', authenticateAdmin, requireModuleAccess('topics'), requireCanDelete, TopicController.deleteTopic);

/**
 * @route   POST /api/admin/topics/upload-thumbnail
 * @desc    Upload topic thumbnail
 * @access  Private (Admin)
 */
router.post('/topics/upload-thumbnail', authenticateAdmin, requireModuleAccess('topics'), TopicController.upload.single('thumbnail'), TopicController.uploadThumbnail);

/**
 * Subtopics Routes
 */

/**
 * @route   GET /api/admin/subtopics
 * @desc    Get all subtopics
 * @access  Private (Admin)
 */
router.get('/subtopics', authenticateAdmin, requireModuleAccess('subtopics'), SubtopicController.getAllSubtopics);

/**
 * @route   GET /api/admin/subtopics/topic/:topicId
 * @desc    Get subtopics by topic ID
 * @access  Private (Admin)
 */
router.get('/subtopics/topic/:topicId', authenticateAdmin, requireModuleAccess('subtopics'), SubtopicController.getSubtopicsByTopicId);

/**
 * @route   GET /api/admin/subtopics/:id
 * @desc    Get subtopic by ID
 * @access  Private (Admin)
 */
router.get('/subtopics/:id', authenticateAdmin, requireModuleAccess('subtopics'), SubtopicController.getSubtopicById);

/**
 * @route   POST /api/admin/subtopics
 * @desc    Create new subtopic
 * @access  Private (Admin)
 */
router.post('/subtopics', authenticateAdmin, requireModuleAccess('subtopics'), validateCreateSubtopic, SubtopicController.createSubtopic);

/**
 * @route   PUT /api/admin/subtopics/:id
 * @desc    Update subtopic
 * @access  Private (Admin)
 */
router.put('/subtopics/:id', authenticateAdmin, requireModuleAccess('subtopics'), requireCanEdit, validateUpdateSubtopic, SubtopicController.updateSubtopic);

/**
 * @route   DELETE /api/admin/subtopics/:id
 * @desc    Delete subtopic
 * @access  Private (Admin)
 */
router.delete('/subtopics/:id', authenticateAdmin, requireModuleAccess('subtopics'), requireCanDelete, SubtopicController.deleteSubtopic);

/**
 * Lectures Routes
 */

/**
 * @route   GET /api/admin/lectures
 * @desc    Get all lectures
 * @access  Private (Admin)
 */
router.get('/lectures', authenticateAdmin, requireModuleAccess('lectures'), LectureController.getAllLectures);

/**
 * @route   GET /api/admin/lectures/subtopic/:subtopicId
 * @desc    Get lectures by subtopic ID
 * @access  Private (Admin)
 */
router.get('/lectures/subtopic/:subtopicId', authenticateAdmin, requireModuleAccess('lectures'), LectureController.getLecturesBySubtopicId);

/**
 * @route   GET /api/admin/lectures/:id
 * @desc    Get lecture by ID
 * @access  Private (Admin)
 */
router.get('/lectures/:id', authenticateAdmin, requireModuleAccess('lectures'), LectureController.getLectureById);

/**
 * @route   POST /api/admin/lectures
 * @desc    Create new lecture
 * @access  Private (Admin)
 */
router.post('/lectures', authenticateAdmin, requireModuleAccess('lectures'), LectureController.upload.fields([
  { name: 'video_file', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), validateCreateLecture, LectureController.createLecture);

/**
 * @route   PUT /api/admin/lectures/:id
 * @desc    Update lecture
 * @access  Private (Admin)
 */
router.put('/lectures/:id', authenticateAdmin, requireModuleAccess('lectures'), requireCanEdit, LectureController.upload.fields([
  { name: 'video_file', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), validateUpdateLecture, LectureController.updateLecture);

/**
 * @route   DELETE /api/admin/lectures/:id
 * @desc    Delete lecture
 * @access  Private (Admin)
 */
router.delete('/lectures/:id', authenticateAdmin, requireModuleAccess('lectures'), requireCanDelete, LectureController.deleteLecture);

/**
 * Purposes Taxonomy Routes
 */

/**
 * @route   GET /api/admin/purposes
 * @desc    Get all purposes (for admin)
 * @access  Private (Admin)
 */
router.get('/purposes', authenticateAdmin, requireModuleAccess('purposes'), PurposeController.getAllPurposes);

/**
 * @route   GET /api/admin/purposes/:id
 * @desc    Get purpose by ID
 * @access  Private (Admin)
 */
router.get('/purposes/:id', authenticateAdmin, requireModuleAccess('purposes'), PurposeController.getPurposeById);

/**
 * @route   POST /api/admin/purposes
 * @desc    Create new purpose
 * @access  Private (Admin)
 */
router.post('/purposes', authenticateAdmin, requireModuleAccess('purposes'), validateCreatePurpose, PurposeController.createPurpose);

/**
 * @route   PUT /api/admin/purposes/:id
 * @desc    Update purpose
 * @access  Private (Admin)
 */
router.put('/purposes/:id', authenticateAdmin, requireModuleAccess('purposes'), requireCanEdit, validateUpdatePurpose, PurposeController.updatePurpose);

/**
 * @route   DELETE /api/admin/purposes/:id
 * @desc    Delete purpose
 * @access  Private (Admin)
 */
router.delete('/purposes/:id', authenticateAdmin, requireModuleAccess('purposes'), requireCanDelete, PurposeController.deletePurpose);

/**
 * @route   GET /api/admin/levels
 * @desc    Get all levels (for admin)
 * @access  Private (Admin)
 */
router.get('/levels', authenticateAdmin, requireModuleAccess('levels'), LevelController.getAllLevels);

/**
 * @route   GET /api/admin/levels/:id
 * @desc    Get level by ID
 * @access  Private (Admin)
 */
router.get('/levels/:id', authenticateAdmin, requireModuleAccess('levels'), LevelController.getLevelById);

/**
 * @route   POST /api/admin/levels
 * @desc    Create new level
 * @access  Private (Admin)
 */
router.post('/levels', authenticateAdmin, requireModuleAccess('levels'), validateCreateLevel, LevelController.createLevel);

/**
 * @route   PUT /api/admin/levels/:id
 * @desc    Update level
 * @access  Private (Admin)
 */
router.put('/levels/:id', authenticateAdmin, requireModuleAccess('levels'), requireCanEdit, validateUpdateLevel, LevelController.updateLevel);

/**
 * @route   DELETE /api/admin/levels/:id
 * @desc    Delete level
 * @access  Private (Admin)
 */
router.delete('/levels/:id', authenticateAdmin, requireModuleAccess('levels'), requireCanDelete, LevelController.deleteLevel);

/**
 * @route   GET /api/admin/programs
 * @desc    Get all programs (for admin)
 * @access  Private (Admin)
 */
router.get('/programs', authenticateAdmin, requireModuleAccess('programs'), ProgramController.getAllPrograms);

router.get('/programs/bulk-upload-template', authenticateAdmin, requireModuleAccess('programs'), ProgramController.downloadBulkTemplate);
router.get('/programs/download-excel', authenticateAdmin, requireModuleAccess('programs'), requireCanDownloadExcel, ProgramController.downloadAllExcel);
router.post('/programs/bulk-upload', authenticateAdmin, requireModuleAccess('programs'), uploadBulkExams.fields([{ name: 'excel', maxCount: 1 }]), ProgramController.bulkUpload);

/**
 * @route   GET /api/admin/programs/:id
 * @desc    Get program by ID
 * @access  Private (Admin)
 */
router.get('/programs/:id', authenticateAdmin, requireModuleAccess('programs'), ProgramController.getProgramById);

/**
 * @route   POST /api/admin/programs
 * @desc    Create new program
 * @access  Private (Admin)
 */
router.post('/programs', authenticateAdmin, requireModuleAccess('programs'), validateCreateProgram, ProgramController.createProgram);

/**
 * @route   PUT /api/admin/programs/:id
 * @desc    Update program
 * @access  Private (Admin)
 */
router.put('/programs/:id', authenticateAdmin, requireModuleAccess('programs'), requireCanEdit, validateUpdateProgram, ProgramController.updateProgram);

/**
 * @route   DELETE /api/admin/programs/:id
 * @desc    Delete program
 * @access  Private (Admin)
 */
router.delete('/programs/:id', authenticateAdmin, requireModuleAccess('programs'), requireCanDelete, ProgramController.deleteProgram);

/**
 * Branches / Courses Taxonomy Routes
 */
router.get('/branches', authenticateAdmin, requireModuleAccess('branches'), BranchController.getAll);
router.get('/branches/bulk-upload-template', authenticateAdmin, requireModuleAccess('branches'), BranchController.downloadBulkTemplate);
router.get('/branches/download-excel', authenticateAdmin, requireModuleAccess('branches'), requireCanDownloadExcel, BranchController.downloadAllExcel);
router.post('/branches/bulk-upload', authenticateAdmin, requireModuleAccess('branches'), uploadBulkExams.fields([{ name: 'excel', maxCount: 1 }]), BranchController.bulkUpload);
router.get('/branches/:id', authenticateAdmin, requireModuleAccess('branches'), BranchController.getById);
router.post('/branches', authenticateAdmin, requireModuleAccess('branches'), validateCreateBranch, BranchController.create);
router.put('/branches/:id', authenticateAdmin, requireModuleAccess('branches'), requireCanEdit, validateUpdateBranch, BranchController.update);
router.delete('/branches/:id', authenticateAdmin, requireModuleAccess('branches'), requireCanDelete, BranchController.delete);

/**
 * Exam Cities Taxonomy Routes
 */

/**
 * @route   GET /api/admin/exam-cities
 * @desc    Get all exam cities (for admin)
 * @access  Private (Admin)
 */
router.get('/exam-cities', authenticateAdmin, requireModuleAccess('exam_cities'), ExamCityController.getAllExamCities);

/**
 * @route   GET /api/admin/exam-cities/:id
 * @desc    Get exam city by ID
 * @access  Private (Admin)
 */
router.get('/exam-cities/:id', authenticateAdmin, requireModuleAccess('exam_cities'), ExamCityController.getExamCityById);

/**
 * @route   POST /api/admin/exam-cities
 * @desc    Create new exam city
 * @access  Private (Admin)
 */
router.post('/exam-cities', authenticateAdmin, requireModuleAccess('exam_cities'), validateCreateExamCity, ExamCityController.createExamCity);

/**
 * @route   PUT /api/admin/exam-cities/:id
 * @desc    Update exam city
 * @access  Private (Admin)
 */
router.put('/exam-cities/:id', authenticateAdmin, requireModuleAccess('exam_cities'), requireCanEdit, validateUpdateExamCity, ExamCityController.updateExamCity);

/**
 * @route   DELETE /api/admin/exam-cities/:id
 * @desc    Delete exam city
 * @access  Private (Admin)
 */
router.delete('/exam-cities/:id', authenticateAdmin, requireModuleAccess('exam_cities'), requireCanDelete, ExamCityController.deleteExamCity);

/**
 * @route   GET /api/admin/categories
 * @desc    Get all categories
 * @access  Private (Admin)
 */
router.get('/categories', authenticateAdmin, requireModuleAccess('categories'), CategoryController.getAllCategories);

/**
 * @route   GET /api/admin/categories/:id
 * @desc    Get category by ID
 * @access  Private (Admin)
 */
router.get('/categories/:id', authenticateAdmin, requireModuleAccess('categories'), CategoryController.getCategoryById);

/**
 * @route   POST /api/admin/categories
 * @desc    Create new category
 * @access  Private (Admin)
 */
router.post('/categories', authenticateAdmin, requireModuleAccess('categories'), validateCreateCategory, CategoryController.createCategory);

/**
 * @route   PUT /api/admin/categories/:id
 * @desc    Update category
 * @access  Private (Admin)
 */
router.put('/categories/:id', authenticateAdmin, requireModuleAccess('categories'), requireCanEdit, validateUpdateCategory, CategoryController.updateCategory);

/**
 * @route   DELETE /api/admin/categories/:id
 * @desc    Delete category
 * @access  Private (Admin)
 */
router.delete('/categories/:id', authenticateAdmin, requireModuleAccess('categories'), requireCanDelete, CategoryController.deleteCategory);

/**
 * Colleges Routes (CRUD + upload logo + bulk Excel + logos ZIP, same pattern as Exams)
 */
router.get('/colleges', authenticateAdmin, requireModuleAccess('colleges'), CollegesController.getAllAdmin);
router.post('/colleges/upload-logo', authenticateAdmin, requireModuleAccess('colleges'), upload.single('image'), CollegesController.uploadLogo);
router.get('/colleges/bulk-upload-template', authenticateAdmin, requireModuleAccess('colleges'), requireCanDownloadExcel, CollegesController.downloadBulkTemplate);
router.get('/colleges/download-excel', authenticateAdmin, requireModuleAccess('colleges'), requireCanDownloadExcel, CollegesController.downloadAllExcel);
router.post('/colleges/upload-missing-logos', authenticateAdmin, requireModuleAccess('colleges'), uploadBulkExams.fields([{ name: 'logos_zip', maxCount: 1 }]), CollegesController.uploadMissingLogos);
router.post('/colleges/bulk-upload', authenticateAdmin, requireModuleAccess('colleges'), uploadBulkExams.fields([
  { name: 'excel', maxCount: 1 },
  { name: 'logos', maxCount: 100 },
  { name: 'logos_zip', maxCount: 1 },
]), CollegesController.bulkUpload);
router.post('/colleges', authenticateAdmin, requireModuleAccess('colleges'), CollegesController.create);
router.delete('/colleges/all', authenticateAdmin, requireModuleAccess('colleges'), requireCanDelete, CollegesController.deleteAll);
router.get('/colleges/:id', authenticateAdmin, requireModuleAccess('colleges'), CollegesController.getById);
router.put('/colleges/:id', authenticateAdmin, requireModuleAccess('colleges'), requireCanEdit, CollegesController.update);
router.delete('/colleges/:id', authenticateAdmin, requireModuleAccess('colleges'), requireCanDelete, CollegesController.delete);

/**
 * Institutes (Coachings) Routes - CRUD + upload logo + bulk Excel + logos ZIP
 */
router.get('/institutes', authenticateAdmin, requireModuleAccess('institutes'), InstitutesController.getAllAdmin);
router.post('/institutes/upload-logo', authenticateAdmin, requireModuleAccess('institutes'), upload.single('image'), InstitutesController.uploadLogo);
router.get('/institutes/bulk-upload-template', authenticateAdmin, requireModuleAccess('institutes'), requireCanDownloadExcel, InstitutesController.downloadBulkTemplate);
router.get('/institutes/download-excel', authenticateAdmin, requireModuleAccess('institutes'), requireCanDownloadExcel, InstitutesController.downloadAllExcel);
router.post('/institutes/upload-missing-logos', authenticateAdmin, requireModuleAccess('institutes'), uploadBulkExams.fields([{ name: 'logos_zip', maxCount: 1 }]), InstitutesController.uploadMissingLogos);
router.post('/institutes/bulk-upload', authenticateAdmin, requireModuleAccess('institutes'), uploadBulkExams.fields([
  { name: 'excel', maxCount: 1 },
  { name: 'logos', maxCount: 100 },
  { name: 'logos_zip', maxCount: 1 },
]), InstitutesController.bulkUpload);
router.post('/institutes', authenticateAdmin, requireModuleAccess('institutes'), InstitutesController.create);
router.delete('/institutes/all', authenticateAdmin, requireModuleAccess('institutes'), requireCanDelete, InstitutesController.deleteAll);
router.get('/institutes/:id', authenticateAdmin, requireModuleAccess('institutes'), InstitutesController.getById);
router.put('/institutes/:id', authenticateAdmin, requireModuleAccess('institutes'), requireCanEdit, InstitutesController.update);
router.delete('/institutes/:id', authenticateAdmin, requireModuleAccess('institutes'), requireCanDelete, InstitutesController.delete);

/**
 * Scholarships Routes - CRUD + bulk Excel upload
 */
router.get('/scholarships', authenticateAdmin, requireModuleAccess('scholarships'), ScholarshipsController.getAllAdmin);
router.get('/scholarships/bulk-upload-template', authenticateAdmin, requireModuleAccess('scholarships'), requireCanDownloadExcel, ScholarshipsController.downloadBulkTemplate);
router.get('/scholarships/download-excel', authenticateAdmin, requireModuleAccess('scholarships'), requireCanDownloadExcel, ScholarshipsController.downloadAllExcel);
router.post('/scholarships/bulk-upload', authenticateAdmin, requireModuleAccess('scholarships'), uploadBulkExams.fields([
  { name: 'excel', maxCount: 1 },
]), ScholarshipsController.bulkUpload);
router.post('/scholarships', authenticateAdmin, requireModuleAccess('scholarships'), ScholarshipsController.create);
router.delete('/scholarships/all', authenticateAdmin, requireModuleAccess('scholarships'), requireCanDelete, ScholarshipsController.deleteAll);
router.get('/scholarships/:id', authenticateAdmin, requireModuleAccess('scholarships'), ScholarshipsController.getById);
router.put('/scholarships/:id', authenticateAdmin, requireModuleAccess('scholarships'), requireCanEdit, ScholarshipsController.update);
router.delete('/scholarships/:id', authenticateAdmin, requireModuleAccess('scholarships'), requireCanDelete, ScholarshipsController.delete);

/**
 * Loans (Loan Providers) Routes - CRUD + upload logo + bulk Excel + logos ZIP
 */
router.get('/loans', authenticateAdmin, requireModuleAccess('loans'), LoansController.getAllAdmin);
router.post('/loans/upload-logo', authenticateAdmin, requireModuleAccess('loans'), upload.single('image'), LoansController.uploadLogo);
router.get('/loans/bulk-upload-template', authenticateAdmin, requireModuleAccess('loans'), requireCanDownloadExcel, LoansController.downloadBulkTemplate);
router.get('/loans/download-excel', authenticateAdmin, requireModuleAccess('loans'), requireCanDownloadExcel, LoansController.downloadAllExcel);
router.post('/loans/upload-missing-logos', authenticateAdmin, requireModuleAccess('loans'), uploadBulkExams.fields([{ name: 'logos_zip', maxCount: 1 }]), LoansController.uploadMissingLogos);
router.post('/loans/bulk-upload', authenticateAdmin, requireModuleAccess('loans'), uploadBulkExams.fields([
  { name: 'excel', maxCount: 1 },
  { name: 'logos', maxCount: 100 },
  { name: 'logos_zip', maxCount: 1 },
]), LoansController.bulkUpload);
router.post('/loans', authenticateAdmin, requireModuleAccess('loans'), LoansController.create);
router.delete('/loans/all', authenticateAdmin, requireModuleAccess('loans'), requireCanDelete, LoansController.deleteAll);
// Scraped Gyandhan data — specific paths before /loans/scraped and before /loans/:id
router.get('/loans/scraped/banks', authenticateAdmin, requireModuleAccess('loans'), LoansController.getScrapedLoanBanks);
router.get('/loans/scraped/bank/:slug', authenticateAdmin, requireModuleAccess('loans'), LoansController.getScrapedLoanBySlug);
router.get('/loans/scraped', authenticateAdmin, requireModuleAccess('loans'), LoansController.getScrapedLoans);
router.get('/loans/scraped/download-excel', authenticateAdmin, requireModuleAccess('loans'), requireCanDownloadExcel, LoansController.downloadScrapedLoansExcel);
router.get('/loans/:id', authenticateAdmin, requireModuleAccess('loans'), LoansController.getById);
router.put('/loans/:id', authenticateAdmin, requireModuleAccess('loans'), requireCanEdit, LoansController.update);
router.delete('/loans/:id', authenticateAdmin, requireModuleAccess('loans'), requireCanDelete, LoansController.delete);

/**
 * @route   POST /api/admin/lectures/upload-video
 * @desc    Upload lecture video
 * @access  Private (Admin)
 */
router.post('/lectures/upload-video', authenticateAdmin, requireModuleAccess('lectures'), LectureController.upload.single('video_file'), LectureController.uploadVideo);

/**
 * @route   POST /api/admin/lectures/upload-thumbnail
 * @desc    Upload lecture thumbnail
 * @access  Private (Admin)
 */
router.post('/lectures/upload-thumbnail', authenticateAdmin, requireModuleAccess('lectures'), LectureController.upload.single('thumbnail'), LectureController.uploadThumbnail);

/**
 * @route   POST /api/admin/lectures/upload-image
 * @desc    Upload image for rich text editor (article content)
 * @access  Private (Admin)
 */
router.post('/lectures/upload-image', authenticateAdmin, requireModuleAccess('lectures'), LectureController.upload.single('lecture_image'), LectureController.uploadImage);


/**
 * Automation Applications Routes
 * For managing user exam automation requests
 */
const AutomationApplicationsController = require('../../controllers/admin/automationApplicationsController');
const AutomationExamController = require('../../controllers/admin/automationExamController');

/**
 * @route   GET /api/admin/automation-applications
 * @desc    Get all automation applications
 * @access  Private (Admin)
 */
router.get('/automation-applications', authenticateAdmin, requireModuleAccess('applications'), AutomationApplicationsController.getAllApplications);

/**
 * @route   GET /api/admin/automation-applications/:id
 * @desc    Get automation application by ID
 * @access  Private (Admin)
 */
router.get('/automation-applications/:id', authenticateAdmin, requireModuleAccess('applications'), AutomationApplicationsController.getApplicationById);

/**
 * @route   POST /api/admin/automation-applications
 * @desc    Create new automation application
 * @access  Private (Admin)
 */
router.post('/automation-applications', authenticateAdmin, requireModuleAccess('applications'), AutomationApplicationsController.createApplication);

/**
 * @route   POST /api/admin/automation-applications/:id/approve
 * @desc    Approve an automation application
 * @access  Private (Admin)
 */
router.post('/automation-applications/:id/approve', authenticateAdmin, requireModuleAccess('applications'), AutomationApplicationsController.approveApplication);

/**
 * @route   PUT /api/admin/automation-applications/:id
 * @desc    Update automation application status
 * @access  Private (Admin)
 */
router.put('/automation-applications/:id', authenticateAdmin, requireModuleAccess('applications'), requireCanEdit, AutomationApplicationsController.updateStatus);

/**
 * @route   DELETE /api/admin/automation-applications/:id
 * @desc    Delete automation application
 * @access  Private (Admin)
 */
router.delete('/automation-applications/:id', authenticateAdmin, requireModuleAccess('applications'), requireCanDelete, AutomationApplicationsController.deleteApplication);

/**
 * @route   GET /api/admin/automation-exams
 * @desc    Get automation exams for selection dropdown
 * @access  Private (Admin)
 */
router.get('/automation-exams', authenticateAdmin, requireModuleAccess('automation_exams'), AutomationApplicationsController.getAutomationExams);

/**
 * @route   GET /api/admin/automation-exams-full
 * @desc    Get all automation exams with full details
 * @access  Private (Admin)
 */
router.get('/automation-exams-full', authenticateAdmin, requireModuleAccess('automation_exams'), AutomationExamController.getAllExams);

/**
 * @route   GET /api/admin/automation-exams/:id
 * @desc    Get a single automation exam by ID
 * @access  Private (Admin)
 */
router.get('/automation-exams/:id', authenticateAdmin, requireModuleAccess('automation_exams'), AutomationExamController.getExamById);

/**
 * @route   POST /api/admin/automation-exams
 * @desc    Create a new automation exam
 * @access  Private (Admin)
 */
router.post('/automation-exams', authenticateAdmin, requireModuleAccess('automation_exams'), validateCreateAutomationExam, AutomationExamController.createExam);

/**
 * @route   PUT /api/admin/automation-exams/:id
 * @desc    Update an automation exam
 * @access  Private (Admin)
 */
router.put('/automation-exams/:id', authenticateAdmin, requireModuleAccess('automation_exams'), requireCanEdit, validateUpdateAutomationExam, AutomationExamController.updateExam);

/**
 * @route   DELETE /api/admin/automation-exams/:id
 * @desc    Delete an automation exam
 * @access  Private (Admin)
 */
router.delete('/automation-exams/:id', authenticateAdmin, requireModuleAccess('automation_exams'), requireCanDelete, AutomationExamController.deleteExam);

/**
 * @route   GET /api/admin/users-for-automation
 * @desc    Get users for automation selection dropdown
 * @access  Private (Admin)
 */
router.get('/users-for-automation', authenticateAdmin, AutomationApplicationsController.getUsersForSelection);

module.exports = router;

