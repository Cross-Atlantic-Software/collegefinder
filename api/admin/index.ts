/**
 * Admin API - Main export
 * Re-exports all admin-related APIs from submodules
 */

// Export admin login APIs
export * from './login';

// Export admin users management APIs
export * from './admins';

// Export modules taxonomy (Super Admin only)
export * from './modules';

// Export site users management APIs
export * from './users';
export {
  getAllUsersBasicInfo,
  getAllUsersAcademics,
  getAllUsersCareerGoals,
} from './users';

// Export email templates management APIs
export * from './email-templates';
export * from './blogs';

// Export career goals taxonomy management APIs - use explicit exports to avoid conflicts
export {
  getAllCareerGoals as getAllCareerGoalsAdmin,
  getCareerGoalById,
  createCareerGoal,
  uploadCareerGoalLogo,
  updateCareerGoal,
  deleteCareerGoal,
  downloadAllDataExcel as downloadAllCareerGoalsExcel,
  deleteAllCareerGoals,
  uploadMissingLogosCareerGoals,
} from './career-goals';
export type { CareerGoal as CareerGoalAdmin } from './career-goals';

// Export exams taxonomy management APIs
export {
  getAllExamsAdmin,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
  uploadExamLogo,
} from './exams';
export type { Exam, ExamDates, ExamEligibilityCriteria, ExamPattern, ExamCutoff, ExamWithDetails } from './exams';

// Export mock prompts (exam_mock_prompts table by exam ID)
export {
  getMockPromptsList,
  getMockPrompt,
  updateMockPrompt,
} from './mock-prompts';
export type { MockPromptItem } from './mock-prompts';

// Export subjects taxonomy management APIs
export {
  getAllSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
  deleteAllSubjects,
  downloadSubjectsBulkTemplate,
  downloadAllSubjectsExcel,
  bulkUploadSubjects,
} from './subjects';
export type { Subject } from './subjects';

// Export streams taxonomy management APIs
export {
  getAllStreams,
  getStreamById,
  createStream,
  updateStream,
  deleteStream,
  deleteAllStreams,
} from './streams';
export type { Stream } from './streams';

// Export careers taxonomy management APIs
export {
  getAllCareers,
  getCareerById,
  createCareer,
  updateCareer,
  deleteCareer,
  downloadAllCareersExcel,
  downloadCareersBulkTemplate,
  bulkUploadCareers,
  deleteAllCareers,
} from './careers';
export type { Career } from './careers';

// Export topics taxonomy management APIs
export {
  getAllTopics,
  getTopicById,
  createTopic,
  updateTopic,
  deleteTopic,
  deleteAllTopics,
  uploadTopicThumbnail,
  downloadTopicsBulkTemplate,
  bulkUploadTopics,
} from './topics';
export type { Topic, TopicsBulkUploadResult } from './topics';

// Export subtopics taxonomy management APIs
export {
  getAllSubtopics,
  getSubtopicsByTopicId,
  getSubtopicById,
  createSubtopic,
  updateSubtopic,
  deleteSubtopic,
  deleteAllSubtopics,
  downloadSubtopicsBulkTemplate,
  bulkUploadSubtopics,
} from './subtopics';
export type { Subtopic, SubtopicsBulkUploadResult } from './subtopics';

// Export lectures taxonomy management APIs
export {
  getAllLectures,
  getLecturesBySubtopicId,
  getLectureById,
  createLecture,
  updateLecture,
  deleteLecture,
  deleteAllLectures,
  uploadLectureVideo,
  uploadLectureThumbnail,
  downloadLecturesBulkTemplate,
  downloadLecturesAllExcel,
  bulkUploadLectures,
  getLectureHookSummaryQueueStatus,
  enqueuePendingLectureHookSummaries,
  uploadMissingLectureThumbnails,
  fetchYoutubeLectureMetadata,
} from './lectures';
export type {
  Lecture,
  LectureTaxonomyRef,
  LectureHookSummaryQueueStatus,
  LecturesBulkUploadResult,
  UploadMissingLectureThumbnailsResult,
  YoutubeLectureMetadata,
} from './lectures';

// Export purposes taxonomy management APIs
export {
  getAllPurposes,
  getPurposeById,
  createPurpose,
  updatePurpose,
  deletePurpose,
} from './purposes';
export type { Purpose } from './purposes';

// Export levels taxonomy management APIs
export {
  getAllLevels,
  getLevelById,
  createLevel,
  updateLevel,
  deleteLevel,
} from './levels';
export type { Level } from './levels';

// Export programs taxonomy management APIs
export {
  getAllPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  deleteProgram,
  deleteAllPrograms,
  downloadProgramsBulkTemplate,
  downloadAllProgramsExcel,
  bulkUploadPrograms,
} from './programs';
export type { Program } from './programs';

// Export exam cities taxonomy management APIs
export {
  getAllExamCities,
  getExamCityById,
  createExamCity,
  updateExamCity,
  deleteExamCity,
} from './exam-cities';
export type { ExamCity } from './exam-cities';

// Export categories taxonomy management APIs
export {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from './categories';
export type { Category } from './categories';


// Export automation exams management APIs
export {
  getAllAutomationExams,
  getAutomationExamById,
  createAutomationExam,
  updateAutomationExam,
  deleteAutomationExam,
} from './automation-exams';
export type {
  AutomationExam,
  CreateAutomationExamData,
  UpdateAutomationExamData,
} from './automation-exams';

// Export counsellor APIs
export {
  searchStudent,
  submitCounsellorResults,
  getCounsellorResults,
  updateCounsellorResults,
} from './counsellor';
export type { StudentSearchResult } from './counsellor';

// Export experts admin CRUD APIs
export {
  getAllExpertsAdmin,
  createExpert,
  updateExpert,
  deleteExpert,
} from './experts';

// Landing page (home) CMS copy
export { getAdminLandingPageContent, updateAdminLandingPageContent } from './landingPage';

// Active referral codes (admin)
export {
  getAllActiveReferralCodes,
  deactivateReferralCode,
  deleteReferralCode,
} from './referral-codes';
export type { ActiveReferralCode } from './referral-codes';

// Stream + interest → programs / exams (admin mapping)
export {
  getAllRecommendedMappings,
  downloadRecommendedMappingTemplate,
  bulkUploadRecommendedMappings,
} from './recommended-mappings';
export type { StreamInterestRecommendedMapping } from './recommended-mappings';