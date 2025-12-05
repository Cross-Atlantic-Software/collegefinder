const db = require('../../config/database');

class CareerGoal {
  /**
   * Find all career goals taxonomies
   */
  static async findAll() {
    const result = await db.query(
      'SELECT * FROM career_goals_taxonomies ORDER BY label ASC'
    );
    return result.rows;
  }

  /**
   * Find career goal taxonomy by ID
   */
  static async findById(id) {
    const result = await db.query(
      'SELECT * FROM career_goals_taxonomies WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Find career goal taxonomy by label
   */
  static async findByLabel(label) {
    const result = await db.query(
      'SELECT * FROM career_goals_taxonomies WHERE LOWER(label) = LOWER($1)',
      [label]
    );
    return result.rows[0] || null;
  }

  /**
   * Create a new career goal taxonomy
   */
  static async create(data) {
    const { label, logo } = data;
    const result = await db.query(
      'INSERT INTO career_goals_taxonomies (label, logo) VALUES ($1, $2) RETURNING *',
      [label, logo]
    );
    return result.rows[0];
  }

  /**
   * Update a career goal taxonomy
   */
  static async update(id, data) {
    const { label, logo } = data;
    const result = await db.query(
      'UPDATE career_goals_taxonomies SET label = $1, logo = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [label, logo, id]
    );
    return result.rows[0] || null;
  }

  /**
   * Delete a career goal taxonomy
   */
  static async delete(id) {
    const result = await db.query(
      'DELETE FROM career_goals_taxonomies WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0] || null;
  }
}

module.exports = CareerGoal;

