const db = require('../../config/database');

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
      matric_state,
      matric_city,
      // Post-Matric (12th) fields
      postmatric_board,
      postmatric_school_name,
      postmatric_passing_year,
      postmatric_roll_number,
      postmatric_total_marks,
      postmatric_obtained_marks,
      postmatric_percentage,
      postmatric_state,
      postmatric_city,
      matric_marks_type,
      matric_cgpa,
      matric_result_status,
      postmatric_marks_type,
      postmatric_cgpa,
      postmatric_result_status,
      stream,
      stream_id,
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
      
      // Check if record exists
      const existing = await UserAcademics.findByUserId(userIdNum);
      
      if (existing) {
        // Update existing record - only update fields that are provided (not undefined)
        const updates = [];
        const values = [];
        let paramCount = 1;
        
        // Helper to add update if value is provided
        const addUpdate = (field, value) => {
          if (value !== undefined) {
            updates.push(`${field} = $${paramCount++}`);
            values.push(value !== null && value !== '' ? value : null);
          }
        };
        
        // Matric fields
        addUpdate('matric_board', matric_board);
        addUpdate('matric_school_name', matric_school_name);
        addUpdate('matric_passing_year', matric_passing_year);
        addUpdate('matric_roll_number', matric_roll_number);
        addUpdate('matric_total_marks', matric_total_marks);
        addUpdate('matric_obtained_marks', matric_obtained_marks);
        addUpdate('matric_percentage', matric_percentage);
        addUpdate('matric_state', matric_state);
        addUpdate('matric_city', matric_city);
        addUpdate('matric_marks_type', matric_marks_type);
        addUpdate('matric_cgpa', matric_cgpa);
        addUpdate('matric_result_status', matric_result_status);
        
        // Post-Matric fields
        addUpdate('postmatric_board', postmatric_board);
        addUpdate('postmatric_school_name', postmatric_school_name);
        addUpdate('postmatric_passing_year', postmatric_passing_year);
        addUpdate('postmatric_roll_number', postmatric_roll_number);
        addUpdate('postmatric_total_marks', postmatric_total_marks);
        addUpdate('postmatric_obtained_marks', postmatric_obtained_marks);
        addUpdate('postmatric_percentage', postmatric_percentage);
        addUpdate('postmatric_state', postmatric_state);
        addUpdate('postmatric_city', postmatric_city);
        addUpdate('postmatric_marks_type', postmatric_marks_type);
        addUpdate('postmatric_cgpa', postmatric_cgpa);
        addUpdate('postmatric_result_status', postmatric_result_status);
        addUpdate('stream', stream);
        addUpdate('stream_id', stream_id);
        addUpdate('is_pursuing_12th', is_pursuing_12th);
        
        // Handle JSONB fields
        if (subjectsParam !== undefined) {
          updates.push(`subjects = $${paramCount++}::jsonb`);
          values.push(subjectsParam);
        }
        if (matricSubjectsParam !== undefined) {
          updates.push(`matric_subjects = $${paramCount++}::jsonb`);
          values.push(matricSubjectsParam);
        }
        
        // Always update updated_at
        updates.push('updated_at = CURRENT_TIMESTAMP');
        
        if (updates.length > 0) {
          values.push(userIdNum);
          const result = await db.query(
            `UPDATE user_academics SET ${updates.join(', ')} WHERE user_id = $${paramCount} RETURNING *`,
            values
          );
          return result.rows[0];
        } else {
          return existing;
        }
      } else {
        // Insert new record
        const result = await db.query(
          `INSERT INTO user_academics (
            user_id, 
            matric_board, matric_school_name, matric_passing_year, matric_roll_number,
            matric_total_marks, matric_obtained_marks, matric_percentage, matric_state, matric_city,
            postmatric_board, postmatric_school_name, postmatric_passing_year, postmatric_roll_number,
            postmatric_total_marks, postmatric_obtained_marks, postmatric_percentage, postmatric_state, postmatric_city,
            matric_marks_type, matric_cgpa, matric_result_status,
            postmatric_marks_type, postmatric_cgpa, postmatric_result_status,
            stream, stream_id, subjects, matric_subjects, is_pursuing_12th
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28::jsonb, $29::jsonb, $30)
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
            matric_state || null,
            matric_city || null,
            postmatric_board || null,
            postmatric_school_name || null,
            postmatric_passing_year || null,
            postmatric_roll_number || null,
            postmatric_total_marks || null,
            postmatric_obtained_marks || null,
            postmatric_percentage || null,
            postmatric_state || null,
            postmatric_city || null,
            matric_marks_type || null,
            matric_cgpa || null,
            matric_result_status || null,
            postmatric_marks_type || null,
            postmatric_cgpa || null,
            postmatric_result_status || null,
            stream || null,
            stream_id || null,
            subjectsParam,  // JSON string - cast to jsonb
            matricSubjectsParam,  // JSON string - cast to jsonb
            is_pursuing_12th !== undefined ? is_pursuing_12th : false
          ]
        );
        return result.rows[0];
      }
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

