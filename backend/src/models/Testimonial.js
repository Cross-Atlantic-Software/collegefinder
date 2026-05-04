const db = require('../config/database');

class Testimonial {
  static async findAllForAdmin() {
    const result = await db.query(
      `SELECT * FROM testimonials
       ORDER BY sort_order ASC, id ASC`
    );
    return result.rows;
  }

  static async findAllActivePublic() {
    const result = await db.query(
      `SELECT id, name, body, rating, sort_order, profile_image_url, created_at
       FROM testimonials
       WHERE is_active = TRUE
       ORDER BY sort_order ASC, id ASC`
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await db.query('SELECT * FROM testimonials WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async create({ name, body, rating, sort_order, is_active, profile_image_url }) {
    const r = await db.query(
      `INSERT INTO testimonials (name, body, rating, sort_order, is_active, profile_image_url, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
       RETURNING *`,
      [
        name,
        body,
        rating,
        sort_order != null ? sort_order : 0,
        is_active !== false,
        profile_image_url || null,
      ]
    );
    return r.rows[0];
  }

  static async update(id, data) {
    const {
      name,
      body,
      rating,
      sort_order,
      is_active,
      profile_image_url,
    } = data;
    const updates = [];
    const values = [];
    let n = 1;

    if (name !== undefined) {
      updates.push(`name = $${n++}`);
      values.push(name);
    }
    if (body !== undefined) {
      updates.push(`body = $${n++}`);
      values.push(body);
    }
    if (rating !== undefined) {
      updates.push(`rating = $${n++}`);
      values.push(rating);
    }
    if (sort_order !== undefined) {
      updates.push(`sort_order = $${n++}`);
      values.push(sort_order);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${n++}`);
      values.push(is_active);
    }
    if (profile_image_url !== undefined) {
      updates.push(`profile_image_url = $${n++}`);
      values.push(profile_image_url);
    }

    if (updates.length === 0) return Testimonial.findById(id);

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const q = `
      UPDATE testimonials SET ${updates.join(', ')}
      WHERE id = $${n}
      RETURNING *
    `;
    const result = await db.query(q, values);
    return result.rows[0] || null;
  }

  static async delete(id) {
    const result = await db.query('DELETE FROM testimonials WHERE id = $1 RETURNING *', [id]);
    return result.rows[0] || null;
  }
}

module.exports = Testimonial;
