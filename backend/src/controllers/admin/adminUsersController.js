const User = require('../../models/user/User');
const UserAcademics = require('../../models/user/UserAcademics');
const UserCareerGoals = require('../../models/user/UserCareerGoals');
const UserExamPreferences = require('../../models/user/UserExamPreferences');
const UserOtherInfo = require('../../models/user/UserOtherInfo');
const CareerGoal = require('../../models/taxonomy/CareerGoal');
const Exam = require('../../models/taxonomy/Exam');
const Program = require('../../models/taxonomy/Program');
const ExamCity = require('../../models/taxonomy/ExamCity');
const Stream = require('../../models/taxonomy/Stream');

class AdminUsersController {
  /**
   * Get all users with basic info
   * GET /api/admin/users/basic-info
   */
  static async getAllUsersBasicInfo(req, res) {
    try {
      const users = await User.findAll();
      
      // Helper function to convert PostgreSQL boolean to JavaScript boolean
      const toBoolean = (value) => {
        if (value === null || value === undefined) return false;
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') {
          const lower = value.toLowerCase().trim();
          return lower === 't' || lower === 'true' || lower === '1';
        }
        if (typeof value === 'number') return value === 1;
        return false;
      };
      
      // Ensure boolean values are properly converted and phone_number is included
      const formattedUsers = users.map(user => ({
        ...user,
        email_verified: toBoolean(user.email_verified),
        is_active: toBoolean(user.is_active),
        phone_number: user.phone_number || null
      }));
      
      res.json({
        success: true,
        data: {
          users: formattedUsers,
          total: formattedUsers.length
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
      
      // Debug: Log what we got from the database
      if (academics) {
        console.log(`[DEBUG] User ${userId} academics from DB:`, {
          stream_id: academics.stream_id,
          stream: academics.stream,
          stream_id_type: typeof academics.stream_id,
          stream_id_value: academics.stream_id,
          has_stream_id: 'stream_id' in academics,
          all_keys: Object.keys(academics).filter(k => k.includes('stream'))
        });
        
        // If stream_id is not in the object, try to get it directly from DB
        if (!('stream_id' in academics) || academics.stream_id === undefined) {
          console.log(`[DEBUG] stream_id missing, querying directly...`);
          const db = require('../../config/database');
          const directQuery = await db.query(
            'SELECT stream_id FROM user_academics WHERE user_id = $1',
            [userId]
          );
          if (directQuery.rows[0]) {
            academics.stream_id = directQuery.rows[0].stream_id;
            console.log(`[DEBUG] Retrieved stream_id directly: ${academics.stream_id}`);
          }
        }
      }
      
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

      // Get stream name if stream_id exists
      let streamName = null;
      const streamId = academics?.stream_id;
      
      console.log(`[DEBUG] User ${userId} - stream_id value:`, streamId, 'type:', typeof streamId);
      
      if (streamId !== null && streamId !== undefined) {
        try {
          console.log(`[DEBUG] Looking up stream with ID: ${streamId}`);
          const stream = await Stream.findById(streamId);
          streamName = stream ? stream.name : null;
          console.log(`[DEBUG] Stream lookup result:`, stream ? stream.name : 'NOT FOUND');
        } catch (error) {
          console.error(`Error fetching stream for user ${userId}, stream_id=${streamId}:`, error);
        }
      } else {
        console.log(`[DEBUG] User ${userId} - stream_id is null/undefined, checking deprecated stream field`);
      }
      
      // Fallback to deprecated stream field if stream_id is not available
      if (!streamName && academics?.stream) {
        streamName = academics.stream;
        console.log(`[DEBUG] Using fallback stream field: ${streamName}`);
      }
      
      console.log(`[DEBUG] Final streamName for user ${userId}:`, streamName);

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

      // Get government identification
      const GovernmentIdentification = require('../../models/user/GovernmentIdentification');
      const governmentIdentification = await GovernmentIdentification.findByUserId(userId);

      // Get category and reservation
      const CategoryAndReservation = require('../../models/user/CategoryAndReservation');
      const categoryAndReservation = await CategoryAndReservation.findByUserId(userId);
      
      // Get category name if category_id exists
      let categoryName = null;
      if (categoryAndReservation?.category_id) {
        const Category = require('../../models/taxonomy/Category');
        const category = await Category.findById(categoryAndReservation.category_id);
        categoryName = category ? category.name : null;
      }

      // Get other personal details
      const OtherPersonalDetails = require('../../models/user/OtherPersonalDetails');
      const otherPersonalDetails = await OtherPersonalDetails.findByUserId(userId);

      // Get user address
      const UserAddress = require('../../models/user/UserAddress');
      const userAddress = await UserAddress.findByUserId(userId);

      // Get other info
      const otherInfo = await UserOtherInfo.findByUserId(userId);
      let programNames = [];
      let examCityNames = [];

      if (otherInfo) {
        // Map program IDs to names
        if (otherInfo.program_ids && Array.isArray(otherInfo.program_ids) && otherInfo.program_ids.length > 0) {
          const allPrograms = await Program.findAll();
          const programMap = new Map();
          allPrograms.forEach(program => {
            programMap.set(program.id, program);
          });

          programNames = otherInfo.program_ids
            .map(id => {
              const program = programMap.get(parseInt(id));
              return program ? program.name : `ID: ${id}`;
            })
            .filter(Boolean);
        }

        // Map exam city IDs to names
        if (otherInfo.exam_city_ids && Array.isArray(otherInfo.exam_city_ids) && otherInfo.exam_city_ids.length > 0) {
          const allExamCities = await ExamCity.findAll();
          const examCityMap = new Map();
          allExamCities.forEach(city => {
            examCityMap.set(city.id, city);
          });

          examCityNames = otherInfo.exam_city_ids
            .map(id => {
              const city = examCityMap.get(parseInt(id));
              return city ? city.name : `ID: ${id}`;
            })
            .filter(Boolean);
        }
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
            matric_state: academics.matric_state,
            matric_city: academics.matric_city,
            matric_marks_type: academics.matric_marks_type,
            matric_cgpa: academics.matric_cgpa,
            matric_result_status: academics.matric_result_status,
            matric_subjects: matricSubjects,
            postmatric_board: academics.postmatric_board,
            postmatric_school_name: academics.postmatric_school_name,
            postmatric_passing_year: academics.postmatric_passing_year,
            postmatric_roll_number: academics.postmatric_roll_number,
            postmatric_total_marks: academics.postmatric_total_marks,
            postmatric_obtained_marks: academics.postmatric_obtained_marks,
            postmatric_percentage: academics.postmatric_percentage,
            postmatric_state: academics.postmatric_state,
            postmatric_city: academics.postmatric_city,
            postmatric_marks_type: academics.postmatric_marks_type,
            postmatric_cgpa: academics.postmatric_cgpa,
            postmatric_result_status: academics.postmatric_result_status,
            stream: streamName,
            stream_id: academics.stream_id !== undefined ? academics.stream_id : null,
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
          } : null,
          governmentIdentification: governmentIdentification ? {
            id: governmentIdentification.id,
            user_id: governmentIdentification.user_id,
            aadhar_number: governmentIdentification.aadhar_number,
            apaar_id: governmentIdentification.apaar_id,
            created_at: governmentIdentification.created_at,
            updated_at: governmentIdentification.updated_at
          } : null,
          categoryAndReservation: categoryAndReservation ? {
            id: categoryAndReservation.id,
            user_id: categoryAndReservation.user_id,
            category_id: categoryAndReservation.category_id,
            category_name: categoryName,
            ews_status: categoryAndReservation.ews_status,
            pwbd_status: categoryAndReservation.pwbd_status,
            type_of_disability: categoryAndReservation.type_of_disability,
            disability_percentage: categoryAndReservation.disability_percentage,
            udid_number: categoryAndReservation.udid_number,
            minority_status: categoryAndReservation.minority_status,
            ex_serviceman_defence_quota: categoryAndReservation.ex_serviceman_defence_quota,
            kashmiri_migrant_regional_quota: categoryAndReservation.kashmiri_migrant_regional_quota,
            state_domicile: categoryAndReservation.state_domicile,
            home_state_for_quota: categoryAndReservation.home_state_for_quota,
            created_at: categoryAndReservation.created_at,
            updated_at: categoryAndReservation.updated_at
          } : null,
          otherPersonalDetails: otherPersonalDetails ? {
            id: otherPersonalDetails.id,
            user_id: otherPersonalDetails.user_id,
            religion: otherPersonalDetails.religion,
            mother_tongue: otherPersonalDetails.mother_tongue,
            annual_family_income: otherPersonalDetails.annual_family_income,
            occupation_of_father: otherPersonalDetails.occupation_of_father,
            occupation_of_mother: otherPersonalDetails.occupation_of_mother,
            created_at: otherPersonalDetails.created_at,
            updated_at: otherPersonalDetails.updated_at
          } : null,
          userAddress: userAddress ? {
            id: userAddress.id,
            user_id: userAddress.user_id,
            correspondence_address_line1: userAddress.correspondence_address_line1,
            correspondence_address_line2: userAddress.correspondence_address_line2,
            city_town_village: userAddress.city_town_village,
            district: userAddress.district,
            state: userAddress.state,
            country: userAddress.country,
            pincode: userAddress.pincode,
            permanent_address_same_as_correspondence: userAddress.permanent_address_same_as_correspondence,
            permanent_address: userAddress.permanent_address,
            created_at: userAddress.created_at,
            updated_at: userAddress.updated_at
          } : null,
          otherInfo: otherInfo ? {
            id: otherInfo.id,
            user_id: otherInfo.user_id,
            medium: otherInfo.medium,
            language: otherInfo.language,
            program_ids: otherInfo.program_ids || [],
            program_names: programNames,
            exam_city_ids: otherInfo.exam_city_ids || [],
            exam_city_names: examCityNames,
            created_at: otherInfo.created_at,
            updated_at: otherInfo.updated_at
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

