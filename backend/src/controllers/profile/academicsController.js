const UserAcademics = require('../../models/user/UserAcademics');
const Subject = require('../../models/taxonomy/Subject');
const Stream = require('../../models/taxonomy/Stream');
const { validationResult } = require('express-validator');

class AcademicsController {
  /**
   * Get academics
   * GET /api/auth/profile/academics
   */
  static async getAcademics(req, res) {
    try {
      const userId = req.user.id;
      const academics = await UserAcademics.findByUserId(userId);

      if (!academics) {
        return res.json({
          success: true,
          data: null
        });
      }

      // Parse matric_subjects JSONB if it exists and enrich with subject names
      let matricSubjects = [];
      if (academics.matric_subjects) {
        try {
          matricSubjects = typeof academics.matric_subjects === 'string' 
            ? JSON.parse(academics.matric_subjects) 
            : academics.matric_subjects;
          
          // Enrich with subject names from database if subject_id exists
          for (let i = 0; i < matricSubjects.length; i++) {
            if (matricSubjects[i].subject_id && !matricSubjects[i].name) {
              const subject = await Subject.findById(matricSubjects[i].subject_id);
              if (subject) {
                matricSubjects[i].name = subject.name;
              }
            }
          }
        } catch (e) {
          console.error('Error parsing matric_subjects:', e);
          matricSubjects = [];
        }
      }

      // Parse subjects JSONB if it exists and enrich with subject names
      let subjects = [];
      if (academics.subjects) {
        try {
          subjects = typeof academics.subjects === 'string' 
            ? JSON.parse(academics.subjects) 
            : academics.subjects;
          
          // Enrich with subject names from database if subject_id exists
          for (let i = 0; i < subjects.length; i++) {
            if (subjects[i].subject_id && !subjects[i].name) {
              const subject = await Subject.findById(subjects[i].subject_id);
              if (subject) {
                subjects[i].name = subject.name;
              }
            }
          }
        } catch (e) {
          console.error('Error parsing subjects:', e);
          subjects = [];
        }
      }

      res.json({
        success: true,
        data: {
          // Matric (10th) fields
          matric_board: academics.matric_board,
          matric_school_name: academics.matric_school_name,
          matric_passing_year: academics.matric_passing_year,
          matric_roll_number: academics.matric_roll_number,
          matric_total_marks: academics.matric_total_marks,
          matric_obtained_marks: academics.matric_obtained_marks,
          matric_percentage: academics.matric_percentage,
          matric_state: academics.matric_state,
          matric_city: academics.matric_city,
          // Post-Matric (12th) fields
          postmatric_board: academics.postmatric_board,
          postmatric_school_name: academics.postmatric_school_name,
          postmatric_passing_year: academics.postmatric_passing_year,
          postmatric_roll_number: academics.postmatric_roll_number,
          postmatric_total_marks: academics.postmatric_total_marks,
          postmatric_obtained_marks: academics.postmatric_obtained_marks,
          postmatric_percentage: academics.postmatric_percentage,
          postmatric_state: academics.postmatric_state,
          postmatric_city: academics.postmatric_city,
          matric_marks_type: academics.matric_marks_type,
          matric_cgpa: academics.matric_cgpa,
          matric_result_status: academics.matric_result_status,
          postmatric_marks_type: academics.postmatric_marks_type,
          postmatric_cgpa: academics.postmatric_cgpa,
          postmatric_result_status: academics.postmatric_result_status,
          stream: academics.stream,
          stream_id: academics.stream_id,
          matric_subjects: matricSubjects,
          subjects: subjects,
          is_pursuing_12th: academics.is_pursuing_12th || false
        }
      });
    } catch (error) {
      console.error('Error getting academics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get academics'
      });
    }
  }

  /**
   * Update academics
   * PUT /api/auth/profile/academics
   */
  static async updateAcademics(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const academics = await UserAcademics.upsert(userId, req.body);

      // Parse matric_subjects JSONB if it exists and enrich with subject names
      let matricSubjects = [];
      if (academics.matric_subjects) {
        try {
          matricSubjects = typeof academics.matric_subjects === 'string' 
            ? JSON.parse(academics.matric_subjects) 
            : academics.matric_subjects;
          
          // Enrich with subject names from database if subject_id exists
          for (let i = 0; i < matricSubjects.length; i++) {
            if (matricSubjects[i].subject_id && !matricSubjects[i].name) {
              const subject = await Subject.findById(matricSubjects[i].subject_id);
              if (subject) {
                matricSubjects[i].name = subject.name;
              }
            }
          }
        } catch (e) {
          console.error('Error parsing matric_subjects:', e);
          matricSubjects = [];
        }
      }

      // Parse subjects JSONB if it exists and enrich with subject names
      let subjects = [];
      if (academics.subjects) {
        try {
          subjects = typeof academics.subjects === 'string' 
            ? JSON.parse(academics.subjects) 
            : academics.subjects;
          
          // Enrich with subject names from database if subject_id exists
          for (let i = 0; i < subjects.length; i++) {
            if (subjects[i].subject_id && !subjects[i].name) {
              const subject = await Subject.findById(subjects[i].subject_id);
              if (subject) {
                subjects[i].name = subject.name;
              }
            }
          }
        } catch (e) {
          console.error('Error parsing subjects:', e);
          subjects = [];
        }
      }

      res.json({
        success: true,
        message: 'Academics updated successfully',
        data: {
          // Matric (10th) fields
          matric_board: academics.matric_board,
          matric_school_name: academics.matric_school_name,
          matric_passing_year: academics.matric_passing_year,
          matric_roll_number: academics.matric_roll_number,
          matric_total_marks: academics.matric_total_marks,
          matric_obtained_marks: academics.matric_obtained_marks,
          matric_percentage: academics.matric_percentage,
          matric_state: academics.matric_state,
          matric_city: academics.matric_city,
          // Post-Matric (12th) fields
          postmatric_board: academics.postmatric_board,
          postmatric_school_name: academics.postmatric_school_name,
          postmatric_passing_year: academics.postmatric_passing_year,
          postmatric_roll_number: academics.postmatric_roll_number,
          postmatric_total_marks: academics.postmatric_total_marks,
          postmatric_obtained_marks: academics.postmatric_obtained_marks,
          postmatric_percentage: academics.postmatric_percentage,
          postmatric_state: academics.postmatric_state,
          postmatric_city: academics.postmatric_city,
          matric_marks_type: academics.matric_marks_type,
          matric_cgpa: academics.matric_cgpa,
          matric_result_status: academics.matric_result_status,
          postmatric_marks_type: academics.postmatric_marks_type,
          postmatric_cgpa: academics.postmatric_cgpa,
          postmatric_result_status: academics.postmatric_result_status,
          stream: academics.stream,
          stream_id: academics.stream_id,
          matric_subjects: matricSubjects,
          subjects: subjects,
          is_pursuing_12th: academics.is_pursuing_12th || false
        }
      });
    } catch (error) {
      console.error('❌ Error updating academics:', error);
      console.error('❌ Error stack:', error.stack);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        detail: error.detail,
        constraint: error.constraint
      });
      res.status(500).json({
        success: false,
        message: 'Failed to update academics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = AcademicsController;

