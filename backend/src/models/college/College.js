const db = require('../../config/database');

function ilikeContains(term) {
  const s = term != null ? String(term).trim() : '';
  if (!s) return null;
  const escaped = s.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
  return `%${escaped}%`;
}

class College {
  static async findAll() {
    const result = await db.query(
      'SELECT * FROM colleges ORDER BY college_name ASC'
    );
    return result.rows;
  }

  /**
   * Paginated admin list with optional search across the same fields as the admin UI filter.
   */
  static async findPaginatedAdmin({ page = 1, perPage = 10, q = '' } = {}) {
    const limit = Math.min(Math.max(parseInt(perPage, 10) || 10, 1), 100);
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const offset = (pageNum - 1) * limit;
    const pattern = ilikeContains(q);

    let whereClause = '';
    const params = [];
    if (pattern) {
      whereClause = `WHERE (
        college_name ILIKE $1 ESCAPE '\\' OR
        COALESCE(college_location, '') ILIKE $1 ESCAPE '\\' OR
        COALESCE(state, '') ILIKE $1 ESCAPE '\\' OR
        COALESCE(city, '') ILIKE $1 ESCAPE '\\' OR
        COALESCE(college_type, '') ILIKE $1 ESCAPE '\\' OR
        COALESCE(parent_university, '') ILIKE $1 ESCAPE '\\'
      )`;
      params.push(pattern);
    }

    const countSql = `SELECT COUNT(*)::int AS n FROM colleges ${whereClause}`;
    const countResult = await db.query(countSql, params);
    const total = countResult.rows[0].n;

    const limitIdx = params.length + 1;
    const offsetIdx = params.length + 2;
    const dataSql = `
      SELECT * FROM colleges
      ${whereClause}
      ORDER BY college_name ASC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;
    const dataResult = await db.query(dataSql, [...params, limit, offset]);
    return { rows: dataResult.rows, total };
  }

  static async findById(id) {
    const result = await db.query(
      'SELECT * FROM colleges WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByIds(ids) {
    if (!ids || !Array.isArray(ids) || ids.length === 0) return [];
    const validIds = ids.map(id => parseInt(id, 10)).filter(n => !isNaN(n));
    if (validIds.length === 0) return [];
    const result = await db.query(
      'SELECT * FROM colleges WHERE id = ANY($1::int[]) ORDER BY college_name ASC',
      [validIds]
    );
    return result.rows;
  }

  static async findByName(name) {
    const result = await db.query(
      'SELECT * FROM colleges WHERE LOWER(college_name) = LOWER($1)',
      [name]
    );
    return result.rows[0] || null;
  }

  static async create(data) {
    const {
      college_name,
      college_location,
      college_type,
      college_logo,
      logo_url,
      website,
      state,
      city,
      parent_university,
    } = data;
    const result = await db.query(
      `INSERT INTO colleges (college_name, college_location, college_type, college_logo, logo_url, website, state, city, parent_university)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        college_name,
        college_location || null,
        college_type || null,
        college_logo || null,
        logo_url || null,
        website || null,
        state != null ? String(state).trim() || null : null,
        city != null ? String(city).trim() || null : null,
        parent_university != null ? String(parent_university).trim() || null : null,
      ]
    );
    return result.rows[0];
  }

  static async update(id, data) {
    const {
      college_name,
      college_location,
      college_type,
      college_logo,
      logo_url,
      website,
      state,
      city,
      parent_university,
    } = data;
    const updates = [];
    const values = [];
    let paramCount = 1;
    if (college_name !== undefined) {
      updates.push(`college_name = $${paramCount++}`);
      values.push(college_name);
    }
    if (college_location !== undefined) {
      updates.push(`college_location = $${paramCount++}`);
      values.push(college_location);
    }
    if (college_type !== undefined) {
      updates.push(`college_type = $${paramCount++}`);
      values.push(college_type);
    }
    if (college_logo !== undefined) {
      updates.push(`college_logo = $${paramCount++}`);
      values.push(college_logo);
    }
    if (logo_url !== undefined) {
      updates.push(`logo_url = $${paramCount++}`);
      values.push(logo_url);
    }
    if (website !== undefined) {
      updates.push(`website = $${paramCount++}`);
      values.push(website);
    }
    if (state !== undefined) {
      updates.push(`state = $${paramCount++}`);
      values.push(state != null ? String(state).trim() || null : null);
    }
    if (city !== undefined) {
      updates.push(`city = $${paramCount++}`);
      values.push(city != null ? String(city).trim() || null : null);
    }
    if (parent_university !== undefined) {
      updates.push(`parent_university = $${paramCount++}`);
      values.push(parent_university != null ? String(parent_university).trim() || null : null);
    }
    if (updates.length === 0) return await this.findById(id);
    values.push(id);
    const result = await db.query(
      `UPDATE colleges SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  static async delete(id) {
    const result = await db.query(
      'DELETE FROM colleges WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0] || null;
  }
}

module.exports = College;
