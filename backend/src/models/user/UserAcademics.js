const db = require('../../../config/database');

class UserAcademics {
  /**
   * Find academics by user ID
   */
  static async findByUserId(userId) {
    const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    if (isNaN(userIdNum)) {
      return null;
    }

    const result = await db.query(
      'SELECT * FROM user_academics WHERE user_id = $1',
      [userIdNum]
    );
    return result.rows[0] || null;
  }

  /**
   * Create or update user academics
   */
  static async upsert(userId, data) {
    const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    if (isNaN(userIdNum)) {
      throw new Error('Invalid user ID');
    }

    const {
      // Matric (10th) fields
      matric_board,
      matric_school_name,
      matric_passing_year,
      matric_roll_number,
      matric_total_marks,
      matric_obtained_marks,
      matric_percentage,
      // Post-Matric (12th) fields
      postmatric_board,
      postmatric_school_name,
      postmatric_passing_year,
      postmatric_roll_number,
      postmatric_total_marks,
      postmatric_obtained_marks,
      postmatric_percentage,
      stream,
      subjects,
      matric_subjects,
      is_pursuing_12th
    } = data;

    // Prepare matric_subjects as JSONB
    let matricSubjectsJson = null;
    if (matric_subjects) {
      try {
        let subjectsArray = matric_subjects;
        if (typeof matric_subjects === 'string') {
          subjectsArray = JSON.parse(matric_subjects);
        }
        
        if (Array.isArray(subjectsArray) && subjectsArray.length > 0) {
          const validSubjects = subjectsArray.filter(subj => 
            subj && typeof subj === 'object' && 
            typeof subj.name === 'string' && 
            typeof subj.percent === 'number'
          );
          
          if (validSubjects.length > 0) {
            matricSubjectsJson = validSubjects.map(subj => ({
              name: subj.name,
              percent: subj.percent,
              ...(subj.obtainedMarks !== undefined && { obtainedMarks: subj.obtainedMarks }),
              ...(subj.totalMarks !== undefined && { totalMarks: subj.totalMarks })
            }));
          }
        }
      } catch (e) {
        throw new Error('Invalid matric_subjects data format');
      }
    }

    // Prepare subjects as JSONB (for post-matric)
    // Ensure we're working with a proper JavaScript array, not a string
    let subjectsJson = null;
    if (subjects) {
      try {
        // Handle case where subjects might be a string (from JSON parsing)
        let subjectsArray = subjects;
        if (typeof subjects === 'string') {
          subjectsArray = JSON.parse(subjects);
        }
        
        // Ensure it's an array
        if (Array.isArray(subjectsArray) && subjectsArray.length > 0) {
          // Validate subjects structure
          // Support both old format {name, percent} and new format {name, percent, obtainedMarks, totalMarks}
          const validSubjects = subjectsArray.filter(subj => 
            subj && typeof subj === 'object' && 
            typeof subj.name === 'string' && 
            typeof subj.percent === 'number'
          );
          
          if (validSubjects.length > 0) {
            // Pass as JavaScript object - pg library will convert to JSONB automatically
            // Include obtainedMarks and totalMarks if present
            subjectsJson = validSubjects.map(subj => ({
              name: subj.name,
              percent: subj.percent,
              ...(subj.obtainedMarks !== undefined && { obtainedMarks: subj.obtainedMarks }),
              ...(subj.totalMarks !== undefined && { totalMarks: subj.totalMarks })
            }));
          }
        }
      } catch (e) {
        throw new Error('Invalid subjects data format');
      }
    }

    // Upsert academics data
    try {
      // Convert to JSON strings - this is what PostgreSQL expects
      const matricSubjectsParam = matricSubjectsJson ? JSON.stringify(matricSubjectsJson) : null;
      const subjectsParam = subjectsJson ? JSON.stringify(subjectsJson) : null;
      
      // Pass as text and let PostgreSQL convert to JSONB
      // This avoids double-stringification issues
      const result = await db.query(
        `INSERT INTO user_academics (
          user_id, 
          matric_board, matric_school_name, matric_passing_year, matric_roll_number,
          matric_total_marks, matric_obtained_marks, matric_percentage,
          postmatric_board, postmatric_school_name, postmatric_passing_year, postmatric_roll_number,
          postmatric_total_marks, postmatric_obtained_marks, postmatric_percentage,
          stream, subjects, matric_subjects, is_pursuing_12th
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17::jsonb, $18::jsonb, $19)
        ON CONFLICT (user_id)
        DO UPDATE SET
          matric_board = EXCLUDED.matric_board,
          matric_school_name = EXCLUDED.matric_school_name,
          matric_passing_year = EXCLUDED.matric_passing_year,
          matric_roll_number = EXCLUDED.matric_roll_number,
          matric_total_marks = EXCLUDED.matric_total_marks,
          matric_obtained_marks = EXCLUDED.matric_obtained_marks,
          matric_percentage = EXCLUDED.matric_percentage,
          postmatric_board = EXCLUDED.postmatric_board,
          postmatric_school_name = EXCLUDED.postmatric_school_name,
          postmatric_passing_year = EXCLUDED.postmatric_passing_year,
          postmatric_roll_number = EXCLUDED.postmatric_roll_number,
          postmatric_total_marks = EXCLUDED.postmatric_total_marks,
          postmatric_obtained_marks = EXCLUDED.postmatric_obtained_marks,
          postmatric_percentage = EXCLUDED.postmatric_percentage,
          stream = EXCLUDED.stream,
          subjects = EXCLUDED.subjects::jsonb,
          matric_subjects = EXCLUDED.matric_subjects::jsonb,
          is_pursuing_12th = EXCLUDED.is_pursuing_12th,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *`,
        [
          userIdNum,
          matric_board || null,
          matric_school_name || null,
          matric_passing_year || null,
          matric_roll_number || null,
          matric_total_marks || null,
          matric_obtained_marks || null,
          matric_percentage || null,
          postmatric_board || null,
          postmatric_school_name || null,
          postmatric_passing_year || null,
          postmatric_roll_number || null,
          postmatric_total_marks || null,
          postmatric_obtained_marks || null,
          postmatric_percentage || null,
          stream || null,
          subjectsParam,  // JSON string - cast to jsonb
          matricSubjectsParam,  // JSON string - cast to jsonb
          is_pursuing_12th !== undefined ? is_pursuing_12th : false
        ]
      );

      return result.rows[0];
    } catch (dbError) {
      throw dbError;
    }
  }

  /**
   * Delete user academics
   */
  static async deleteByUserId(userId) {
    const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    if (isNaN(userIdNum)) {
      throw new Error('Invalid user ID');
    }

    const result = await db.query(
      'DELETE FROM user_academics WHERE user_id = $1 RETURNING *',
      [userIdNum]
    );
    return result.rows[0] || null;
  }
}

module.exports = UserAcademics;

