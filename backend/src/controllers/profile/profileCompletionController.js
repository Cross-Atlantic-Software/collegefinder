const User = require('../../models/user/User');
const UserAcademics = require('../../models/user/UserAcademics');
const UserCareerGoals = require('../../models/user/UserCareerGoals');
const GovernmentIdentification = require('../../models/user/GovernmentIdentification');
const CategoryAndReservation = require('../../models/user/CategoryAndReservation');
const OtherPersonalDetails = require('../../models/user/OtherPersonalDetails');
const UserAddress = require('../../models/user/UserAddress');
const UserOtherInfo = require('../../models/user/UserOtherInfo');
const UserExamPreferences = require('../../models/user/UserExamPreferences');
const DocumentVault = require('../../models/user/DocumentVault');

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
      const governmentIdentification = await GovernmentIdentification.findByUserId(userId);
      const categoryAndReservation = await CategoryAndReservation.findByUserId(userId);
      const otherPersonalDetails = await OtherPersonalDetails.findByUserId(userId);
      const userAddress = await UserAddress.findByUserId(userId);
      const otherInfo = await UserOtherInfo.findByUserId(userId);
      const examPreferences = await UserExamPreferences.findByUserId(userId);
      const documentVault = await DocumentVault.findByUserId(userId);

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
        { key: 'matric_marks_type', label: '10th Marks Type', value: academics?.matric_marks_type },
        { key: 'matric_subjects', label: '10th Subjects', value: academics?.matric_subjects }
      ];

      // Check matric marks - either percentage/CGPA based on marks_type
      const matricMarksType = academics?.matric_marks_type;
      if (matricMarksType === 'CGPA') {
        // For CGPA, only check CGPA field
        matricFields.push({ key: 'matric_cgpa', label: '10th CGPA', value: academics?.matric_cgpa });
      } else {
        // For Percentage or if marks_type is not set, check percentage fields
        matricFields.push(
          { key: 'matric_total_marks', label: '10th Total Marks', value: academics?.matric_total_marks },
          { key: 'matric_obtained_marks', label: '10th Obtained Marks', value: academics?.matric_obtained_marks },
          { key: 'matric_percentage', label: '10th Percentage', value: academics?.matric_percentage }
        );
      }

      // Academics Section - Post-Matric (12th)
      const isPursuing12th = academics?.is_pursuing_12th || false;
      
      if (!isPursuing12th) {
        // If completed 12th, check all postmatric fields
        const postmatricFields = [
          { key: 'postmatric_board', label: '12th Board', value: academics?.postmatric_board },
          { key: 'postmatric_school_name', label: '12th School', value: academics?.postmatric_school_name },
          { key: 'postmatric_passing_year', label: '12th Passing Year', value: academics?.postmatric_passing_year },
          { key: 'postmatric_roll_number', label: '12th Roll Number', value: academics?.postmatric_roll_number },
          { key: 'postmatric_marks_type', label: '12th Marks Type', value: academics?.postmatric_marks_type },
          { key: 'stream_id', label: 'Stream', value: academics?.stream_id },
          { key: 'subjects', label: '12th Subjects', value: academics?.subjects }
        ];

        // Check postmatric marks - either percentage/CGPA based on marks_type
        const postmatricMarksType = academics?.postmatric_marks_type;
        if (postmatricMarksType === 'CGPA') {
          // For CGPA, only check CGPA field
          postmatricFields.push({ key: 'postmatric_cgpa', label: '12th CGPA', value: academics?.postmatric_cgpa });
        } else {
          // For Percentage or if marks_type is not set, check percentage fields
          postmatricFields.push(
            { key: 'postmatric_total_marks', label: '12th Total Marks', value: academics?.postmatric_total_marks },
            { key: 'postmatric_obtained_marks', label: '12th Obtained Marks', value: academics?.postmatric_obtained_marks },
            { key: 'postmatric_percentage', label: '12th Percentage', value: academics?.postmatric_percentage }
          );
        }
        
        matricFields.push(...postmatricFields);
      } else {
        // If pursuing 12th, only stream is required
        matricFields.push({ key: 'stream_id', label: 'Stream', value: academics?.stream_id });
      }

      const academicsFields = matricFields;

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

      // Government Identification Section
      const govIdFields = [
        { key: 'aadhar_number', label: 'Aadhar Number', value: governmentIdentification?.aadhar_number }
      ];

      govIdFields.forEach(field => {
        totalFields++;
        if (field.value !== null && field.value !== undefined && field.value !== '') {
          completedFields++;
        } else {
          missingFields.push({ section: 'Government Identification', field: field.label });
        }
      });

      // Category and Reservation Section
      const categoryFields = [
        { key: 'category_id', label: 'Category', value: categoryAndReservation?.category_id }
      ];

      categoryFields.forEach(field => {
        totalFields++;
        if (field.value !== null && field.value !== undefined) {
          completedFields++;
        } else {
          missingFields.push({ section: 'Category and Reservation', field: field.label });
        }
      });

      // Address Section
      const addressFields = [
        { key: 'correspondence_address_line1', label: 'Address Line 1', value: userAddress?.correspondence_address_line1 },
        { key: 'city_town_village', label: 'City/Town/Village', value: userAddress?.city_town_village },
        { key: 'state', label: 'State', value: userAddress?.state },
        { key: 'pincode', label: 'Pincode', value: userAddress?.pincode }
      ];

      addressFields.forEach(field => {
        totalFields++;
        if (field.value !== null && field.value !== undefined && field.value !== '') {
          completedFields++;
        } else {
          missingFields.push({ section: 'Address', field: field.label });
        }
      });

      // Exam Preferences Section
      const examPrefFields = [
        { key: 'target_exams', label: 'At least one target exam', value: examPreferences?.target_exams }
      ];

      examPrefFields.forEach(field => {
        totalFields++;
        const hasValue = Array.isArray(field.value) && field.value.length > 0;
        if (hasValue) {
          completedFields++;
        } else {
          missingFields.push({ section: 'Exam Preferences', field: field.label });
        }
      });

      // Other Info Section (always count, but fields are optional)
      const otherInfoFields = [
        { key: 'medium', label: 'Medium of Examination', value: otherInfo?.medium },
        { key: 'language', label: 'Language Preference', value: otherInfo?.language },
        { key: 'program_ids', label: 'Program Preferences', value: otherInfo?.program_ids },
        { key: 'exam_city_ids', label: 'Exam City Preferences', value: otherInfo?.exam_city_ids }
      ];

      otherInfoFields.forEach(field => {
        totalFields++;
        if (field.key === 'program_ids' || field.key === 'exam_city_ids') {
          const hasValue = Array.isArray(field.value) && field.value.length > 0;
          if (hasValue) {
            completedFields++;
          } else {
            missingFields.push({ section: 'Other Info', field: field.label });
          }
        } else {
          if (field.value !== null && field.value !== undefined && field.value !== '') {
            completedFields++;
          } else {
            missingFields.push({ section: 'Other Info', field: field.label });
          }
        }
      });

      // Document Vault Section - Mandatory Documents
      const mandatoryDocuments = [
        { key: 'passport_size_photograph', label: 'Passport-size Photograph', value: documentVault?.passport_size_photograph },
        { key: 'signature_image', label: 'Signature Image', value: documentVault?.signature_image }
      ];

      mandatoryDocuments.forEach(field => {
        totalFields++;
        if (field.value !== null && field.value !== undefined && field.value !== '') {
          completedFields++;
        } else {
          missingFields.push({ section: 'Document Vault', field: field.label });
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


