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
   * Colleges that offer the given program (via college_programs).
   * Ordered by linked exam count, then name.
   */
  static async findAllByProgramId(programId) {
    const id = parseInt(programId, 10);
    if (!Number.isInteger(id) || id <= 0) return [];
    const result = await db.query(
      `SELECT c.*
       FROM colleges c
       WHERE c.id IN (
         SELECT DISTINCT cp.college_id
         FROM college_programs cp
         WHERE cp.program_id = $1
         UNION
         SELECT DISTINCT cd.college_id
         FROM college_details cd
         WHERE cd.major_program_ids IS NOT NULL
           AND btrim(cd.major_program_ids) <> ''
           AND EXISTS (
             SELECT 1
             FROM unnest(regexp_split_to_array(cd.major_program_ids, '[,;]+')) AS tok(raw)
             WHERE btrim(tok.raw) ~ '^[0-9]+$'
               AND btrim(tok.raw)::int = $1
           )
       )
       ORDER BY COALESCE(c.linked_exam_count, 0) DESC, c.college_name ASC`,
      [id]
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

  /** Preserve caller sort order (dashboard tab pagination). */
  static async findByIdsPreservingOrder(ids) {
    if (!ids?.length) return [];
    const validIds = ids.map((id) => parseInt(id, 10)).filter((n) => Number.isInteger(n) && n > 0);
    if (!validIds.length) return [];
    const result = await db.query(
      `SELECT c.*
       FROM colleges c
       INNER JOIN unnest($1::int[]) WITH ORDINALITY AS t(id, ord) ON c.id = t.id
       ORDER BY t.ord`,
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

  /** Match dashboard route slug (`slugifyCollegeName`). */
  static async findBySlug(slug) {
    const s = slug != null ? String(slug).trim().toLowerCase() : '';
    if (!s) return null;
    const result = await db.query(
      `SELECT * FROM colleges
       WHERE regexp_replace(
         regexp_replace(lower(trim(college_name)), '[^a-z0-9]+', '-', 'g'),
         '(^-+|-+$)', '', 'g'
       ) = $1
       LIMIT 1`,
      [s]
    );
    return result.rows[0] || null;
  }

  /**
   * One query: map LOWER(TRIM(college_name)) -> id for names in the given list.
   */
  static async findIdMapByCollegeNamesLowercase(names) {
    const unique = [
      ...new Set(
        (names || []).map((n) => String(n).trim().toLowerCase()).filter(Boolean)
      ),
    ];
    if (!unique.length) return new Map();
    const result = await db.query(
      `SELECT id, college_name FROM colleges
       WHERE LOWER(TRIM(college_name)) = ANY($1::text[])`,
      [unique]
    );
    const map = new Map();
    for (const r of result.rows) {
      map.set(String(r.college_name).trim().toLowerCase(), r.id);
    }
    return map;
  }

  static async create(data) {
    const {
      college_name,
      college_location,
      college_type,
      college_logo,
      logo_url,
      logo_filename,
      website,
      state,
      city,
      parent_university,
      nirf_ranking,
      admission_timeline,
    } = data;
    const result = await db.query(
      `INSERT INTO colleges (college_name, college_location, college_type, college_logo, logo_url, logo_filename, website, state, city, parent_university, nirf_ranking, admission_timeline)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [
        college_name,
        college_location || null,
        college_type || null,
        college_logo || null,
        logo_url || null,
        logo_filename || null,
        website || null,
        state != null ? String(state).trim() || null : null,
        city != null ? String(city).trim() || null : null,
        parent_university != null ? String(parent_university).trim() || null : null,
        nirf_ranking != null && nirf_ranking !== '' ? parseInt(nirf_ranking, 10) : null,
        admission_timeline != null ? String(admission_timeline).trim() || null : null,
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
      logo_filename,
      website,
      state,
      city,
      parent_university,
      nirf_ranking,
      admission_timeline,
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
    if (logo_filename !== undefined) {
      updates.push(`logo_filename = $${paramCount++}`);
      values.push(logo_filename);
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
    if (nirf_ranking !== undefined) {
      updates.push(`nirf_ranking = $${paramCount++}`);
      values.push(
        nirf_ranking != null && nirf_ranking !== ''
          ? parseInt(nirf_ranking, 10)
          : null
      );
    }
    if (admission_timeline !== undefined) {
      updates.push(`admission_timeline = $${paramCount++}`);
      values.push(
        admission_timeline != null ? String(admission_timeline).trim() || null : null
      );
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
