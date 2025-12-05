const User = require('../models/User');
const UserAcademics = require('../models/UserAcademics');
const UserCareerGoals = require('../models/UserCareerGoals');
const UserExamPreferences = require('../models/UserExamPreferences');
const CareerGoal = require('../models/CareerGoal');
const Exam = require('../models/Exam');

class AdminUsersController {
  /**
   * Get all users with basic info
   * GET /api/admin/users/basic-info
   */
  static async getAllUsersBasicInfo(req, res) {
    try {
      const users = await User.findAll();
      
      res.json({
        success: true,
        data: {
          users,
          total: users.length
        }
      });
    } catch (error) {
      console.error('Error fetching users basic info:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users basic info'
      });
    }
  }

  /**
   * Get all users with academics
   * GET /api/admin/users/academics
   */
  static async getAllUsersAcademics(req, res) {
    try {
      const users = await User.findAll();
      const usersWithAcademics = [];

      for (const user of users) {
        const academics = await UserAcademics.findByUserId(user.id);
        
        let subjects = [];
        if (academics?.subjects) {
          try {
            subjects = typeof academics.subjects === 'string' 
              ? JSON.parse(academics.subjects) 
              : academics.subjects;
          } catch (e) {
            console.error('Error parsing subjects for user', user.id, ':', e);
            subjects = [];
          }
        }

        usersWithAcademics.push({
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
          academics: academics ? {
            // Matric (10th) fields
            matric_board: academics.matric_board,
            matric_school_name: academics.matric_school_name,
            matric_passing_year: academics.matric_passing_year,
            matric_roll_number: academics.matric_roll_number,
            matric_total_marks: academics.matric_total_marks,
            matric_obtained_marks: academics.matric_obtained_marks,
            matric_percentage: academics.matric_percentage,
            // Post-Matric (12th) fields
            postmatric_board: academics.postmatric_board,
            postmatric_school_name: academics.postmatric_school_name,
            postmatric_passing_year: academics.postmatric_passing_year,
            postmatric_roll_number: academics.postmatric_roll_number,
            postmatric_total_marks: academics.postmatric_total_marks,
            postmatric_obtained_marks: academics.postmatric_obtained_marks,
            postmatric_percentage: academics.postmatric_percentage,
            stream: academics.stream,
            subjects: subjects
          } : null
        });
      }
      
      res.json({
        success: true,
        data: {
          users: usersWithAcademics,
          total: usersWithAcademics.length
        }
      });
    } catch (error) {
      console.error('Error fetching users academics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users academics'
      });
    }
  }

  /**
   * Get all users with career goals
   * GET /api/admin/users/career-goals
   */
  static async getAllUsersCareerGoals(req, res) {
    try {
      const users = await User.findAll();
      const usersWithCareerGoals = [];
      
      // Fetch all taxonomies to map IDs to labels
      const allTaxonomies = await CareerGoal.findAll();
      const taxonomyMap = new Map();
      allTaxonomies.forEach(tax => {
        taxonomyMap.set(tax.id, tax);
      });

      for (const user of users) {
        const careerGoals = await UserCareerGoals.findByUserId(user.id);
        
        // Parse interests array (INTEGER[] of taxonomy IDs)
        let interests = [];
        
        if (careerGoals && careerGoals.interests) {
          const interestIds = Array.isArray(careerGoals.interests) 
            ? careerGoals.interests 
            : [careerGoals.interests];
          
          // Map taxonomy IDs to labels
          interests = interestIds
            .map(id => {
              const taxonomy = taxonomyMap.get(parseInt(id));
              return taxonomy ? taxonomy.label : `ID: ${id}`;
            })
            .filter(Boolean);
        }
        
        usersWithCareerGoals.push({
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
          careerGoals: careerGoals ? {
            interests: interests // Now contains labels instead of IDs
          } : null
        });
      }
      
      res.json({
        success: true,
        data: {
          users: usersWithCareerGoals,
          total: usersWithCareerGoals.length
        }
      });
    } catch (error) {
      console.error('Error fetching users career goals:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users career goals'
      });
    }
  }

  /**
   * Get single user with complete details (basic info + academics + career goals)
   * GET /api/admin/users/:id
   */
  static async getUserDetails(req, res) {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
      }

      // Get user basic info
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Get academics
      const academics = await UserAcademics.findByUserId(userId);
      let subjects = [];
      if (academics?.subjects) {
        try {
          subjects = typeof academics.subjects === 'string' 
            ? JSON.parse(academics.subjects) 
            : academics.subjects;
        } catch (e) {
          console.error('Error parsing subjects for user', userId, ':', e);
          subjects = [];
        }
      }

      let matricSubjects = [];
      if (academics?.matric_subjects) {
        try {
          matricSubjects = typeof academics.matric_subjects === 'string' 
            ? JSON.parse(academics.matric_subjects) 
            : academics.matric_subjects;
        } catch (e) {
          console.error('Error parsing matric_subjects for user', userId, ':', e);
          matricSubjects = [];
        }
      }

      // Get career goals
      const careerGoals = await UserCareerGoals.findByUserId(userId);
      let interests = [];
      
      if (careerGoals && careerGoals.interests) {
        // Fetch all taxonomies to map IDs to labels
        const allTaxonomies = await CareerGoal.findAll();
        const taxonomyMap = new Map();
        allTaxonomies.forEach(tax => {
          taxonomyMap.set(tax.id, tax);
        });

        const interestIds = Array.isArray(careerGoals.interests) 
          ? careerGoals.interests 
          : [careerGoals.interests];
        
        // Map taxonomy IDs to labels
        interests = interestIds
          .map(id => {
            const taxonomy = taxonomyMap.get(parseInt(id));
            return taxonomy ? taxonomy.label : `ID: ${id}`;
          })
          .filter(Boolean);
      }

      // Get exam preferences
      const examPreferences = await UserExamPreferences.findByUserId(userId);
      let targetExams = [];
      let previousAttempts = [];

      if (examPreferences) {
        // Map target exam IDs to names
        if (examPreferences.target_exams && examPreferences.target_exams.length > 0) {
          const allExams = await Exam.findAll();
          const examMap = new Map();
          allExams.forEach(exam => {
            examMap.set(exam.id, exam);
          });

          const examIds = Array.isArray(examPreferences.target_exams) 
            ? examPreferences.target_exams 
            : [examPreferences.target_exams];
          
          targetExams = examIds
            .map(id => {
              const exam = examMap.get(parseInt(id));
              return exam ? exam.name : `ID: ${id}`;
            })
            .filter(Boolean);
        }

        // Parse and map previous attempts
        if (examPreferences.previous_attempts) {
          let attempts = [];
          try {
            attempts = typeof examPreferences.previous_attempts === 'string' 
              ? JSON.parse(examPreferences.previous_attempts) 
              : examPreferences.previous_attempts;
          } catch (e) {
            console.error('Error parsing previous_attempts for user', userId, ':', e);
            attempts = [];
          }

          if (Array.isArray(attempts) && attempts.length > 0) {
            const allExams = await Exam.findAll();
            const examMap = new Map();
            allExams.forEach(exam => {
              examMap.set(exam.id, exam);
            });

            previousAttempts = attempts.map(attempt => {
              const exam = examMap.get(attempt.exam_id);
              return {
                exam_name: exam ? exam.name : `ID: ${attempt.exam_id}`,
                year: attempt.year,
                rank: attempt.rank
              };
            });
          }
        }
      }

      res.json({
        success: true,
        data: {
          user: user,
          academics: academics ? {
            matric_board: academics.matric_board,
            matric_school_name: academics.matric_school_name,
            matric_passing_year: academics.matric_passing_year,
            matric_roll_number: academics.matric_roll_number,
            matric_total_marks: academics.matric_total_marks,
            matric_obtained_marks: academics.matric_obtained_marks,
            matric_percentage: academics.matric_percentage,
            matric_subjects: matricSubjects,
            postmatric_board: academics.postmatric_board,
            postmatric_school_name: academics.postmatric_school_name,
            postmatric_passing_year: academics.postmatric_passing_year,
            postmatric_roll_number: academics.postmatric_roll_number,
            postmatric_total_marks: academics.postmatric_total_marks,
            postmatric_obtained_marks: academics.postmatric_obtained_marks,
            postmatric_percentage: academics.postmatric_percentage,
            stream: academics.stream,
            subjects: subjects,
            is_pursuing_12th: academics.is_pursuing_12th || false,
            created_at: academics.created_at,
            updated_at: academics.updated_at
          } : null,
          careerGoals: careerGoals ? {
            interests: interests,
            created_at: careerGoals.created_at,
            updated_at: careerGoals.updated_at
          } : null,
          examPreferences: examPreferences ? {
            target_exams: targetExams,
            previous_attempts: previousAttempts,
            created_at: examPreferences.created_at,
            updated_at: examPreferences.updated_at
          } : null
        }
      });
    } catch (error) {
      console.error('Error fetching user details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user details'
      });
    }
  }
}

module.exports = AdminUsersController;

