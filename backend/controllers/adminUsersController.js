const User = require('../models/User');
const UserAcademics = require('../models/UserAcademics');
const UserCareerGoals = require('../models/UserCareerGoals');
const CareerGoal = require('../models/CareerGoal');

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
}

module.exports = AdminUsersController;

