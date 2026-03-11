const db = require('../../config/database');

class Category {
  /**
   * Find all categories
   */
  static async findAll() {
    const result = await db.query(
      'SELECT * FROM categories ORDER BY name ASC'
    );
    return result.rows;
  }

  /**
   * Find category by ID
   */
  static async findById(id) {
    const result = await db.query('SELECT * FROM categories WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  /**
   * Find category by name
   */
  static async findByName(name) {
    const result = await db.query('SELECT * FROM categories WHERE name = $1', [name]);
    return result.rows[0] || null;
  }

  /**
   * Create a new category
   */
  static async create(data) {
    const { name } = data;

    const result = await db.query(
      `INSERT INTO categories (name)
       VALUES ($1)
       RETURNING *`,
      [name]
    );
    return result.rows[0];
  }

  /**
   * Update a category
   */
  static async update(id, data) {
    const { name } = data;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }

    if (updates.length === 0) {
      return await this.findById(id);
    }

    values.push(id);
    const result = await db.query(
      `UPDATE categories SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  /**
   * Delete a category
   */
  static async delete(id) {
    const result = await db.query('DELETE FROM categories WHERE id = $1 RETURNING *', [id]);
    return result.rows[0] || null;
  }
}

module.exports = Category;
