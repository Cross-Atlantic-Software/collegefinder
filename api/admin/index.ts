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
