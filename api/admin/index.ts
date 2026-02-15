/**
 * Admin API - Main export
 * Re-exports all admin-related APIs from submodules
 */

// Export admin login APIs
export * from './login';

// Export admin users management APIs
export * from './admins';

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
} from './career-goals';
export type { CareerGoal as CareerGoalAdmin } from './career-goals';

// Export exams taxonomy management APIs
export {
  getAllExamsAdmin,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
} from './exams';
export type { Exam } from './exams';

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

// Export colleges management APIs
export {
  getAllColleges,
  getCollegeById,
  createCollege,
  updateCollege,
  deleteCollege,
} from './colleges';
export type { College } from './colleges';

// Export college locations management APIs
export {
  getAllCollegeLocations,
  getCollegeLocationById,
  createCollegeLocation,
  updateCollegeLocation,
  deleteCollegeLocation,
} from './college-locations';
export type { CollegeLocation } from './college-locations';

// Export college gallery management APIs
export {
  getAllCollegeGallery,
  getCollegeGalleryById,
  createCollegeGallery,
  updateCollegeGallery,
  deleteCollegeGallery,
} from './college-gallery';
export type { CollegeGallery } from './college-gallery';

// Export college reviews management APIs
export {
  getAllCollegeReviews,
  getCollegeReviewById,
  createCollegeReview,
  updateCollegeReview,
  deleteCollegeReview,
} from './college-reviews';
export type { CollegeReview } from './college-reviews';

// Export college news management APIs
export {
  getAllCollegeNews,
  getCollegeNewsById,
  createCollegeNews,
  updateCollegeNews,
  deleteCollegeNews,
} from './college-news';
export type { CollegeNews } from './college-news';

// Export college courses management APIs
export {
  getAllCollegeCourses,
  getCollegeCourseById,
  createCollegeCourse,
  updateCollegeCourse,
  deleteCollegeCourse,
} from './college-courses';
export type { CollegeCourse } from './college-courses';

// Export course exams management APIs
export {
  getAllCourseExams,
  getCourseExamById,
  createCourseExam,
  updateCourseExam,
  deleteCourseExam,
} from './course-exams';
export type { CourseExam } from './course-exams';

// Export course cutoffs management APIs
export {
  getAllCourseCutoffs,
  getCourseCutoffById,
  createCourseCutoff,
  updateCourseCutoff,
  deleteCourseCutoff,
} from './course-cutoffs';
export type { CourseCutoff } from './course-cutoffs';

// Export course subjects management APIs
export {
  getAllCourseSubjects,
  getCourseSubjectById,
  createCourseSubject,
  updateCourseSubject,
  deleteCourseSubject,
} from './course-subjects';
export type { CourseSubject } from './course-subjects';

// Export college FAQs management APIs
export {
  getAllCollegeFAQs,
  getCollegeFAQById,
  createCollegeFAQ,
  updateCollegeFAQ,
  deleteCollegeFAQ,
} from './college-faqs';
export type { CollegeFAQ } from './college-faqs';

// Export coachings management APIs
export {
  getAllCoachings,
  getCoachingById,
  createCoaching,
  updateCoaching,
  deleteCoaching,
} from './coachings';
export type { Coaching } from './coachings';

// Export coaching locations management APIs
export {
  getAllCoachingLocations,
  getLocationsByCoachingId,
  getCoachingLocationById,
  createCoachingLocation,
  updateCoachingLocation,
  deleteCoachingLocation,
} from './coaching-locations';
export type { CoachingLocation } from './coaching-locations';

// Export coaching gallery management APIs
export {
  getAllCoachingGallery,
  getGalleryByCoachingId,
  getCoachingGalleryById,
  createCoachingGallery,
  updateCoachingGallery,
  deleteCoachingGallery,
} from './coaching-gallery';
export type { CoachingGalleryItem } from './coaching-gallery';

// Export coaching courses management APIs
export {
  getAllCoachingCourses,
  getCoursesByCoachingId,
  getCoachingCourseById,
  createCoachingCourse,
  updateCoachingCourse,
  deleteCoachingCourse,
} from './coaching-courses';
export type { CoachingCourse } from './coaching-courses';

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