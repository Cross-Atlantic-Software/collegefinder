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
   * Find all active career goals taxonomies (for public use)
   */
  static async findActive() {
    const result = await db.query(
      'SELECT * FROM career_goals_taxonomies WHERE status = TRUE ORDER BY label ASC'
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
    const { label, logo, description, status } = data;
    const result = await db.query(
      'INSERT INTO career_goals_taxonomies (label, logo, description, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [label, logo, description || null, status !== undefined ? status : true]
    );
    return result.rows[0];
  }

  /**
   * Update a career goal taxonomy
   */
  static async update(id, data) {
    const { label, logo, description, status } = data;
    
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (label !== undefined) {
      updates.push(`label = $${paramCount++}`);
      values.push(label);
    }
    if (logo !== undefined) {
      updates.push(`logo = $${paramCount++}`);
      values.push(logo);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }

    if (updates.length === 0) {
      return null;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE career_goals_taxonomies 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);
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

