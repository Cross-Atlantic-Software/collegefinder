const db = require('../../config/database');

function ilikeContains(term) {
  const s = term != null ? String(term).trim() : '';
  if (!s) return null;
  const escaped = s.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
  return `%${escaped}%`;
}

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
   * Paginated admin list with optional search (aligned with admin UI filter fields).
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
        name ILIKE $1 ESCAPE '\\' OR
        COALESCE(code, '') ILIKE $1 ESCAPE '\\' OR
        COALESCE(description, '') ILIKE $1 ESCAPE '\\' OR
        COALESCE(conducting_authority, '') ILIKE $1 ESCAPE '\\' OR
        COALESCE(exam_type, '') ILIKE $1 ESCAPE '\\' OR
        COALESCE(website, '') ILIKE $1 ESCAPE '\\'
      )`;
      params.push(pattern);
    }

    const countSql = `SELECT COUNT(*)::int AS n FROM exams_taxonomies ${whereClause}`;
    const countResult = await db.query(countSql, params);
    const total = countResult.rows[0].n;

    const limitIdx = params.length + 1;
    const offsetIdx = params.length + 2;
    const dataSql = `
      SELECT * FROM exams_taxonomies
      ${whereClause}
      ORDER BY name ASC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;
    const dataResult = await db.query(dataSql, [...params, limit, offset]);
    return { rows: dataResult.rows, total };
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
   * Find exam taxonomy by code (skips null/empty codes in DB; caller should pass non-empty)
   */
  static async findByCode(code) {
    if (code == null || String(code).trim() === '') {
      return null;
    }
    const result = await db.query(
      'SELECT * FROM exams_taxonomies WHERE LOWER(code) = LOWER($1)',
      [String(code).trim()]
    );
    return result.rows[0] || null;
  }

  /**
   * Create a new exam taxonomy
   */
  static async create(data) {
    const { name, code, description, exam_logo, exam_type, conducting_authority, logo_file_name, number_of_papers, website, documents_required, counselling } = data;
    const codeVal = code != null && String(code).trim() ? String(code).trim() : null;
    const papers = number_of_papers != null ? Math.max(1, Math.min(10, parseInt(number_of_papers, 10) || 1)) : 1;
    const result = await db.query(
      `INSERT INTO exams_taxonomies (name, code, description, exam_logo, exam_type, conducting_authority, logo_file_name, number_of_papers, website, documents_required, counselling)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [name, codeVal, description || null, exam_logo || null, exam_type || null, conducting_authority || null, logo_file_name || null, papers, website || null, documents_required != null && String(documents_required).trim() ? String(documents_required).trim() : null, counselling != null && String(counselling).trim() ? String(counselling).trim() : null]
    );
    return result.rows[0];
  }

  /**
   * Update an exam taxonomy
   */
  static async update(id, data) {
    const { name, code, description, exam_logo, exam_type, conducting_authority, logo_file_name, number_of_papers, website, documents_required, counselling } = data;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (code !== undefined) {
      const codeVal = code != null && String(code).trim() ? String(code).trim() : null;
      updates.push(`code = $${paramCount++}`);
      values.push(codeVal);
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
    if (logo_file_name !== undefined) {
      updates.push(`logo_file_name = $${paramCount++}`);
      values.push(logo_file_name);
    }
    if (number_of_papers !== undefined) {
      const papers = Math.max(1, Math.min(10, parseInt(number_of_papers, 10) || 1));
      updates.push(`number_of_papers = $${paramCount++}`);
      values.push(papers);
    }
    if (website !== undefined) {
      updates.push(`website = $${paramCount++}`);
      values.push(website || null);
    }
    if (documents_required !== undefined) {
      const v = documents_required != null && String(documents_required).trim() ? String(documents_required).trim() : null;
      updates.push(`documents_required = $${paramCount++}`);
      values.push(v);
    }
    if (counselling !== undefined) {
      const v = counselling != null && String(counselling).trim() ? String(counselling).trim() : null;
      updates.push(`counselling = $${paramCount++}`);
      values.push(v);
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
   * Find exams with given logo_file_name and no exam_logo (missing logos)
   */
  static async findMissingLogosByFilename(filename) {
    if (!filename || !String(filename).trim()) return [];
    const result = await db.query(
      `SELECT * FROM exams_taxonomies
       WHERE LOWER(TRIM(logo_file_name)) = LOWER(TRIM($1))
       AND (exam_logo IS NULL OR exam_logo = '')`,
      [String(filename).trim()]
    );
    return result.rows;
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

  /**
   * Legacy: format JSON was removed from DB; always no structural format from row.
   */
  static async getFormats(examId) {
    return null;
  }

  /**
   * @deprecated no longer stored
   */
  static async getFormatConfig(examId, formatId) {
    return null;
  }

  /**
   * @deprecated no longer stored
   */
  static async updateFormat(examId, formatData) {
    return this.findById(examId);
  }

  /**
   * @deprecated
   */
  static async findByIdWithFormat(id) {
    return this.findById(id);
  }

  /**
   * Get generation prompt for an exam (for mock question generation)
   */
  static async getGenerationPrompt(examId) {
    const result = await db.query(
      'SELECT generation_prompt FROM exams_taxonomies WHERE id = $1',
      [examId]
    );
    return result.rows[0] ? result.rows[0].generation_prompt : null;
  }

  static async updateGenerationPrompt(examId, generationPrompt) {
    const value = (generationPrompt && String(generationPrompt).trim()) ? String(generationPrompt).trim() : null;
    const result = await db.query(
      'UPDATE exams_taxonomies SET generation_prompt = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [value, examId]
    );
    return result.rows[0] || null;
  }

  static async hasFormat(examId) {
    return false;
  }
}

module.exports = Exam;
