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
export { getAllUsersBasicInfo, getAllUsersAcademics, getAllUsersCareerGoals } from './users';

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

// Export subjects taxonomy management APIs
export {
  getAllSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
} from './subjects';
export type { Subject } from './subjects';

// Export streams taxonomy management APIs
export {
  getAllStreams,
  getStreamById,
  createStream,
  updateStream,
  deleteStream,
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
  uploadTopicThumbnail,
} from './topics';
export type { Topic } from './topics';

// Export subtopics taxonomy management APIs
export {
  getAllSubtopics,
  getSubtopicsByTopicId,
  getSubtopicById,
  createSubtopic,
  updateSubtopic,
  deleteSubtopic,
} from './subtopics';
export type { Subtopic } from './subtopics';

// Export lectures taxonomy management APIs
export {
  getAllLectures,
  getLecturesBySubtopicId,
  getLectureById,
  createLecture,
  updateLecture,
  deleteLecture,
  uploadLectureVideo,
  uploadLectureThumbnail,
} from './lectures';
export type { Lecture } from './lectures';

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