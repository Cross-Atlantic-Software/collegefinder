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
    const { name, code, description, format } = data;
    const result = await db.query(
      'INSERT INTO exams_taxonomies (name, code, description, format) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, code, description || null, format ? JSON.stringify(format) : '{}']
    );
    return result.rows[0];
  }

  /**
   * Update an exam taxonomy
   */
  static async update(id, data) {
    const { name, code, description, format } = data;
    const result = await db.query(
      'UPDATE exams_taxonomies SET name = $1, code = $2, description = $3, format = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
      [name, code, description || null, format ? JSON.stringify(format) : '{}', id]
    );
    return result.rows[0] || null;
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

