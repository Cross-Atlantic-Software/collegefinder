const User = require('../models/User');
const UserAcademics = require('../models/UserAcademics');
const UserCareerGoals = require('../models/UserCareerGoals');

class ProfileCompletionController {
  /**
   * Calculate profile completion percentage
   * GET /api/auth/profile/completion
   */
  static async getCompletion(req, res) {
    try {
      const userId = req.user.id;
      
      // Get all profile data
      const user = await User.findById(userId);
      const academicsRaw = await UserAcademics.findByUserId(userId);
      const careerGoals = await UserCareerGoals.findByUserId(userId);

      // Parse JSONB fields from academics if they exist
      let academics = academicsRaw;
      if (academicsRaw) {
        // Parse matric_subjects if it exists
        if (academicsRaw.matric_subjects) {
          try {
            academics.matric_subjects = typeof academicsRaw.matric_subjects === 'string' 
              ? JSON.parse(academicsRaw.matric_subjects) 
              : academicsRaw.matric_subjects;
          } catch (e) {
            academics.matric_subjects = null;
          }
        }
        // Parse subjects if it exists
        if (academicsRaw.subjects) {
          try {
            academics.subjects = typeof academicsRaw.subjects === 'string' 
              ? JSON.parse(academicsRaw.subjects) 
              : academicsRaw.subjects;
          } catch (e) {
            academics.subjects = null;
          }
        }
      }

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Calculate completion for each section
      let completedFields = 0;
      let totalFields = 0;
      const missingFields = [];

      // Basic Info Section
      const basicInfoFields = [
        { key: 'first_name', label: 'First Name', value: user.first_name },
        { key: 'last_name', label: 'Last Name', value: user.last_name },
        { key: 'date_of_birth', label: 'Date of Birth', value: user.date_of_birth },
        { key: 'gender', label: 'Gender', value: user.gender },
        { key: 'state', label: 'State', value: user.state },
        { key: 'district', label: 'District', value: user.district },
        { key: 'phone_number', label: 'Phone Number', value: user.phone_number },
        { key: 'email_verified', label: 'Email Verified', value: user.email_verified }
      ];

      basicInfoFields.forEach(field => {
        totalFields++;
        if (field.value !== null && field.value !== undefined && field.value !== '') {
          completedFields++;
        } else {
          missingFields.push({ section: 'Basic Info', field: field.label });
        }
      });

      // Academics Section - Matric (10th)
      const matricFields = [
        { key: 'matric_board', label: '10th Board', value: academics?.matric_board },
        { key: 'matric_school_name', label: '10th School', value: academics?.matric_school_name },
        { key: 'matric_passing_year', label: '10th Passing Year', value: academics?.matric_passing_year },
        { key: 'matric_roll_number', label: '10th Roll Number', value: academics?.matric_roll_number },
        { key: 'matric_total_marks', label: '10th Total Marks', value: academics?.matric_total_marks },
        { key: 'matric_obtained_marks', label: '10th Obtained Marks', value: academics?.matric_obtained_marks },
        { key: 'matric_percentage', label: '10th Percentage', value: academics?.matric_percentage },
        { key: 'matric_subjects', label: '10th Subjects', value: academics?.matric_subjects }
      ];

      // Academics Section - Post-Matric (12th) - Only if not pursuing
      const postmatricFields = [
        { key: 'postmatric_board', label: '12th Board', value: academics?.postmatric_board },
        { key: 'postmatric_school_name', label: '12th School', value: academics?.postmatric_school_name },
        { key: 'postmatric_passing_year', label: '12th Passing Year', value: academics?.postmatric_passing_year },
        { key: 'postmatric_roll_number', label: '12th Roll Number', value: academics?.postmatric_roll_number },
        { key: 'postmatric_total_marks', label: '12th Total Marks', value: academics?.postmatric_total_marks },
        { key: 'postmatric_obtained_marks', label: '12th Obtained Marks', value: academics?.postmatric_obtained_marks },
        { key: 'postmatric_percentage', label: '12th Percentage', value: academics?.postmatric_percentage },
        { key: 'stream', label: 'Stream', value: academics?.stream },
        { key: 'subjects', label: 'At least one subject', value: academics?.subjects }
      ];

      // Check if user is pursuing 12th (no passing year means still pursuing)
      const isPursuing12th = !academics?.postmatric_passing_year;
      
      // Add matric fields (always required)
      const academicsFields = [...matricFields];
      
      // Add post-matric fields only if not pursuing 12th
      if (!isPursuing12th) {
        academicsFields.push(...postmatricFields);
      } else {
        // If pursuing 12th, only stream is required
        academicsFields.push({ key: 'stream', label: 'Stream', value: academics?.stream });
      }

      academicsFields.forEach(field => {
        totalFields++;
        // Check for subjects (both matric_subjects and subjects for 12th)
        if (field.key === 'subjects' || field.key === 'matric_subjects') {
          // Check if subjects array exists and has at least one entry
          let hasSubjects = false;
          if (field.value) {
            try {
              const subjects = typeof field.value === 'string' 
                ? JSON.parse(field.value) 
                : field.value;
              hasSubjects = Array.isArray(subjects) && subjects.length > 0;
            } catch (e) {
              hasSubjects = false;
            }
          }
          if (hasSubjects) {
            completedFields++;
          } else {
            missingFields.push({ section: 'Academics', field: field.label });
          }
        } else {
          if (field.value !== null && field.value !== undefined && field.value !== '') {
            completedFields++;
          } else {
            missingFields.push({ section: 'Academics', field: field.label });
          }
        }
      });

      // Career Goals Section - Only interests now
      const careerGoalsFields = [
        { key: 'interests', label: 'At least one interest', value: careerGoals?.interests }
      ];

      careerGoalsFields.forEach(field => {
        totalFields++;
        const hasValue = Array.isArray(field.value) && field.value.length > 0;
        if (hasValue) {
          completedFields++;
        } else {
          missingFields.push({ section: 'Career Goals', field: field.label });
        }
      });

      // Calculate percentage
      const completionPercentage = totalFields > 0 
        ? Math.round((completedFields / totalFields) * 100) 
        : 0;

      res.json({
        success: true,
        data: {
          percentage: completionPercentage,
          completedFields,
          totalFields,
          missingFields
        }
      });
    } catch (error) {
      console.error('Error calculating profile completion:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to calculate profile completion'
      });
    }
  }
}

module.exports = ProfileCompletionController;


