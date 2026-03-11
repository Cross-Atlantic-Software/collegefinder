const db = require('../../config/database');

class ExamCity {
  /**
   * Find all exam cities
   */
  static async findAll() {
    const result = await db.query(
      'SELECT * FROM exam_city ORDER BY name ASC'
    );
    return result.rows;
  }

  /**
   * Find active exam cities only
   */
  static async findActive() {
    const result = await db.query(
      'SELECT * FROM exam_city WHERE status = TRUE ORDER BY name ASC'
    );
    return result.rows;
  }

  /**
   * Find exam city by ID
   */
  static async findById(id) {
    const result = await db.query('SELECT * FROM exam_city WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  /**
   * Find exam city by name
   */
  static async findByName(name) {
    const result = await db.query('SELECT * FROM exam_city WHERE name = $1', [name]);
    return result.rows[0] || null;
  }

  /**
   * Create a new exam city
   */
  static async create(data) {
    const { name, status = true } = data;

    const result = await db.query(
      `INSERT INTO exam_city (name, status)
       VALUES ($1, $2)
       RETURNING *`,
      [name, status]
    );
    return result.rows[0];
  }

  /**
   * Update an exam city
   */
  static async update(id, data) {
    const { name, status } = data;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }

    if (updates.length === 0) {
      return await this.findById(id);
    }

    values.push(id);
    const result = await db.query(
      `UPDATE exam_city SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  /**
   * Delete an exam city
   */
  static async delete(id) {
    const result = await db.query('DELETE FROM exam_city WHERE id = $1 RETURNING *', [id]);
    return result.rows[0] || null;
  }
}

module.exports = ExamCity;


