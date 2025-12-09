/**
 * Main API exports
 * Central export point for all API modules
 */

// Export all types
export * from './types';

// Export auth APIs
export * from './auth';

// Export admin APIs
export * from './admin';

// Export career goals API (public) - use explicit exports to avoid conflicts
export { getAllCareerGoals as getAllCareerGoalsPublic } from './career-goals';
export type { CareerGoal as CareerGoalPublic } from './career-goals';

// Export exams API (public) - use explicit exports to avoid conflicts with admin
export { getAllExams, getExamPreferences, updateExamPreferences } from './exams';
export type { Exam as ExamPublic, PreviousExamAttempt } from './exams';

// Export subjects API (public) - use explicit exports to avoid conflicts with admin
export { getAllSubjects as getAllSubjectsPublic } from './subjects';
export type { Subject as SubjectPublic } from './subjects';

// Export streams API (public)
export { getAllStreamsPublic } from './streams';
export type { StreamPublic } from './streams';

// Export careers API (public)
export { getAllCareersPublic } from './careers';
export type { CareerPublic } from './careers';

