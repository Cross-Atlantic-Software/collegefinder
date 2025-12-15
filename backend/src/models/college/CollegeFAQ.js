const db = require('../../config/database');

class CollegeFAQ {
  /**
   * Find all college FAQs
   */
  static async findAll() {
    const result = await db.query(
      `SELECT cf.*, c.name as college_name
       FROM college_faqs cf
       LEFT JOIN colleges c ON cf.college_id = c.id
       ORDER BY c.name ASC, cf.created_at DESC`
    );
    return result.rows;
  }

  /**
   * Find FAQs by college ID
   */
  static async findByCollegeId(collegeId) {
    const result = await db.query(
      'SELECT * FROM college_faqs WHERE college_id = $1 ORDER BY created_at DESC',
      [collegeId]
    );
    return result.rows;
  }

  /**
   * Find FAQ by ID
   */
  static async findById(id) {
    const result = await db.query(
      `SELECT cf.*, c.name as college_name
       FROM college_faqs cf
       LEFT JOIN colleges c ON cf.college_id = c.id
       WHERE cf.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Create a new FAQ
   */
  static async create(data) {
    const { college_id, question, answer } = data;

    const result = await db.query(
      `INSERT INTO college_faqs (college_id, question, answer)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [college_id, question, answer]
    );
    return result.rows[0];
  }

  /**
   * Update a FAQ
   */
  static async update(id, data) {
    const { college_id, question, answer } = data;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (college_id !== undefined) {
      updates.push(`college_id = $${paramCount++}`);
      values.push(college_id);
    }
    if (question !== undefined) {
      updates.push(`question = $${paramCount++}`);
      values.push(question);
    }
    if (answer !== undefined) {
      updates.push(`answer = $${paramCount++}`);
      values.push(answer);
    }

    if (updates.length === 0) {
      return await this.findById(id);
    }

    values.push(id);
    const result = await db.query(
      `UPDATE college_faqs SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  /**
   * Delete a FAQ
   */
  static async delete(id) {
    const result = await db.query('DELETE FROM college_faqs WHERE id = $1 RETURNING *', [id]);
    return result.rows[0] || null;
  }
}

module.exports = CollegeFAQ;

