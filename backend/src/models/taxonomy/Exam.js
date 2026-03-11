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
    const { name, code, description, exam_logo, exam_type, conducting_authority } = data;
    const result = await db.query(
      'INSERT INTO exams_taxonomies (name, code, description, exam_logo, exam_type, conducting_authority) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, code, description || null, exam_logo || null, exam_type || null, conducting_authority || null]
    );
    return result.rows[0];
  }

  /**
   * Update an exam taxonomy
   */
  static async update(id, data) {
    const { name, code, description, exam_logo, exam_type, conducting_authority } = data;
    
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

