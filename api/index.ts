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

// Export exams API
export * from './exams';

