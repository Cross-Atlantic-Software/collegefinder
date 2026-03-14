const db = require('../../config/database');

class Exam {
  /**
   * Find all exams taxonomies
   */
  static async findAll() {
    const result = await db.query(
      'SELECT * FROM exams_taxonomies ORDER BY name ASC'
    );
    return result.rows;
  }

  /**
   * Find exam taxonomy by ID
   */
  static async findById(id) {
    const result = await db.query(
      'SELECT * FROM exams_taxonomies WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Find exam taxonomy by name
   */
  static async findByName(name) {
    const result = await db.query(
      'SELECT * FROM exams_taxonomies WHERE LOWER(name) = LOWER($1)',
      [name]
    );
    return result.rows[0] || null;
  }

  /**
   * Find exam taxonomy by code
   */
  static async findByCode(code) {
    const result = await db.query(
      'SELECT * FROM exams_taxonomies WHERE LOWER(code) = LOWER($1)',
      [code]
    );
    return result.rows[0] || null;
  }

  /**
   * Create a new exam taxonomy
   */
  static async create(data) {
    const { name, code, description, exam_logo, exam_type, conducting_authority, logo_file_name, format } = data;
    const formatJson = format != null && typeof format === 'object' ? JSON.stringify(format) : (format && String(format).trim() ? String(format).trim() : null);
    const result = await db.query(
      'INSERT INTO exams_taxonomies (name, code, description, exam_logo, exam_type, conducting_authority, logo_file_name, format) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb) RETURNING *',
      [name, code, description || null, exam_logo || null, exam_type || null, conducting_authority || null, logo_file_name || null, formatJson || '{}']
    );
    return result.rows[0];
  }

  /**
   * Update an exam taxonomy
   */
  static async update(id, data) {
    const { name, code, description, exam_logo, exam_type, conducting_authority, logo_file_name } = data;
    
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (code !== undefined) {
      updates.push(`code = $${paramCount++}`);
      values.push(code);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (exam_logo !== undefined) {
      updates.push(`exam_logo = $${paramCount++}`);
      values.push(exam_logo);
    }
    if (exam_type !== undefined) {
      updates.push(`exam_type = $${paramCount++}`);
      values.push(exam_type);
    }
    if (conducting_authority !== undefined) {
      updates.push(`conducting_authority = $${paramCount++}`);
      values.push(conducting_authority);
    }
    if (logo_file_name !== undefined) {
      updates.push(`logo_file_name = $${paramCount++}`);
      values.push(logo_file_name);
    }

    if (updates.length === 0) {
      return null;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE exams_taxonomies 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Find exams with given logo_file_name and no exam_logo (missing logos)
   */
  static async findMissingLogosByFilename(filename) {
    if (!filename || !String(filename).trim()) return [];
    const result = await db.query(
      `SELECT * FROM exams_taxonomies 
       WHERE LOWER(TRIM(logo_file_name)) = LOWER(TRIM($1)) 
       AND (exam_logo IS NULL OR exam_logo = '')`,
      [String(filename).trim()]
    );
    return result.rows;
  }

  /**
   * Delete an exam taxonomy
   */
  static async delete(id) {
    const result = await db.query(
      'DELETE FROM exams_taxonomies WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Get available formats for an exam
   */
  static async getFormats(examId) {
    const result = await db.query(
      'SELECT format FROM exams_taxonomies WHERE id = $1',
      [examId]
    );
    
    if (!result.rows[0]) {
      return null;
    }
    
    const format = result.rows[0].format;
    if (!format || Object.keys(format).length === 0) {
      return null;
    }
    
    return format;
  }

  /**
   * Get specific format configuration for an exam
   */
  static async getFormatConfig(examId, formatId) {
    const result = await db.query(
      'SELECT format FROM exams_taxonomies WHERE id = $1',
      [examId]
    );
    
    if (!result.rows[0]) {
      return null;
    }
    
    const format = result.rows[0].format;
    if (!format || !format[formatId]) {
      return null;
    }
    
    return format[formatId];
  }

  /**
   * Update format configuration for an exam
   */
  static async updateFormat(examId, formatData) {
    const result = await db.query(
      'UPDATE exams_taxonomies SET format = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [JSON.stringify(formatData), examId]
    );
    return result.rows[0] || null;
  }

  /**
   * Get exam with format information
   */
  static async findByIdWithFormat(id) {
    const result = await db.query(
      'SELECT * FROM exams_taxonomies WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Get generation prompt for an exam (for mock question generation)
   */
  static async getGenerationPrompt(examId) {
    const result = await db.query(
      'SELECT generation_prompt FROM exams_taxonomies WHERE id = $1',
      [examId]
    );
    return result.rows[0] ? result.rows[0].generation_prompt : null;
  }

  /**
   * Update generation prompt for an exam (persisted in exams_taxonomies.generation_prompt).
   * Pass a non-empty string to save, or null/empty to clear.
   */
  static async updateGenerationPrompt(examId, generationPrompt) {
    const value = (generationPrompt && String(generationPrompt).trim()) ? String(generationPrompt).trim() : null;
    const result = await db.query(
      'UPDATE exams_taxonomies SET generation_prompt = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [value, examId]
    );
    return result.rows[0] || null;
  }

  /**
   * Check if exam has format configuration
   */
  static async hasFormat(examId) {
    const result = await db.query(
      'SELECT format FROM exams_taxonomies WHERE id = $1',
      [examId]
    );
    
    if (!result.rows[0]) {
      return false;
    }
    
    const format = result.rows[0].format;
    return format && Object.keys(format).length > 0;
  }
}

module.exports = Exam;

