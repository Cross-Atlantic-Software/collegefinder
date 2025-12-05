const db = require('../config/database');

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
    const { name, code, description } = data;
    const result = await db.query(
      'INSERT INTO exams_taxonomies (name, code, description) VALUES ($1, $2, $3) RETURNING *',
      [name, code, description || null]
    );
    return result.rows[0];
  }

  /**
   * Update an exam taxonomy
   */
  static async update(id, data) {
    const { name, code, description } = data;
    const result = await db.query(
      'UPDATE exams_taxonomies SET name = $1, code = $2, description = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
      [name, code, description || null, id]
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
}

module.exports = Exam;

