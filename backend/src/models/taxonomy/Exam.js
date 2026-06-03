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

  static async countAll() {
    const result = await db.query('SELECT COUNT(*)::int AS n FROM exams_taxonomies');
    return result.rows[0]?.n ?? 0;
  }

  /**
   * Exams whose eligibility stream_ids contains the given stream ID.
   */
  static async findAllByStreamId(streamId) {
    const n = parseInt(streamId, 10);
    if (!Number.isInteger(n) || n < 1) return [];
    const result = await db.query(
      `SELECT DISTINCT e.*
       FROM exams_taxonomies e
       INNER JOIN exam_eligibility_criteria ec ON ec.exam_id = e.id
       WHERE $1 = ANY(COALESCE(ec.stream_ids, '{}'))
       ORDER BY e.exam_popularity_rank ASC NULLS LAST, e.name ASC`,
      [n]
    );
    return result.rows;
  }

  /**
   * Exams eligible for the student's stream OR the taxonomy "Default" stream (stream_ids on eligibility row).
   * @param {number|string} userStreamId Primary stream from profile
   * @param {number|null} defaultStreamId Optional "Default" stream id from streams table
   */
  static async findEligibleForUserStreamOrDefault(userStreamId, defaultStreamId) {
    const n = parseInt(userStreamId, 10);
    if (!Number.isInteger(n) || n < 1) return [];
    const d = defaultStreamId != null ? parseInt(defaultStreamId, 10) : NaN;
    if (!Number.isInteger(d) || d < 1) {
      return Exam.findAllByStreamId(n);
    }
    const result = await db.query(
      `SELECT DISTINCT e.*
       FROM exams_taxonomies e
       INNER JOIN exam_eligibility_criteria ec ON ec.exam_id = e.id
       WHERE (
         $1::int = ANY (COALESCE(ec.stream_ids, '{}'))
         OR $2::int = ANY (COALESCE(ec.stream_ids, '{}'))
       )
       ORDER BY e.exam_popularity_rank ASC NULLS LAST, e.name ASC`,
      [n, d]
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
   * Find exam taxonomy by name (exact case-insensitive match)
   */
  static async findByName(name) {
    const result = await db.query(
      'SELECT * FROM exams_taxonomies WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))',
      [name]
    );
    return result.rows[0] || null;
  }

  /**
   * One query: map lowercased trimmed name or code tokens -> exam id (exact match).
   */
  static async findIdMapByExactNameOrCodeLowercase(tokens) {
    const unique = [
      ...new Set(
        (tokens || []).map((t) => String(t).trim().toLowerCase()).filter(Boolean)
      ),
    ];
    if (!unique.length) return new Map();
    const result = await db.query(
      `SELECT id, name, code FROM exams_taxonomies
       WHERE LOWER(TRIM(name)) = ANY($1::text[])
          OR (NULLIF(TRIM(code), '') IS NOT NULL AND LOWER(TRIM(code)) = ANY($1::text[]))`,
      [unique]
    );
    const map = new Map();
    for (const r of result.rows) {
      map.set(String(r.name).trim().toLowerCase(), r.id);
      if (r.code != null && String(r.code).trim() !== '') {
        map.set(String(r.code).trim().toLowerCase(), r.id);
      }
    }
    return map;
  }

  /**
   * Find exam taxonomy by partial name match (fuzzy fallback)
   */
  static async findByNameContains(name) {
    if (!name || !String(name).trim()) return null;
    const trimmed = String(name).trim();
    const result = await db.query(
      `SELECT * FROM exams_taxonomies WHERE LOWER(TRIM(name)) LIKE LOWER($1) LIMIT 1`,
      [`%${trimmed}%`]
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
    const {
      name,
      code,
      description,
      exam_logo,
      exam_type,
      conducting_authority,
      logo_file_name,
      number_of_papers,
      website,
      documents_required,
      counselling,
      exam_popularity_rank,
      difficulty_level,
    } = data;
    const codeVal = code != null && String(code).trim() ? String(code).trim() : null;
    const papers = number_of_papers != null ? Math.max(1, Math.min(10, parseInt(number_of_papers, 10) || 1)) : 1;
    const rankVal =
      exam_popularity_rank != null && exam_popularity_rank !== '' && !Number.isNaN(parseInt(exam_popularity_rank, 10))
        ? parseInt(exam_popularity_rank, 10)
        : null;
    const result = await db.query(
      `INSERT INTO exams_taxonomies (name, code, description, exam_logo, exam_type, conducting_authority, logo_file_name, number_of_papers, website, documents_required, counselling, exam_popularity_rank, difficulty_level)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [
        name,
        codeVal,
        description || null,
        exam_logo || null,
        exam_type || null,
        conducting_authority || null,
        logo_file_name || null,
        papers,
        website || null,
        documents_required != null && String(documents_required).trim() ? String(documents_required).trim() : null,
        counselling != null && String(counselling).trim() ? String(counselling).trim() : null,
        rankVal,
        difficulty_level || null,
      ]
    );
    return result.rows[0];
  }

  /**
   * Update an exam taxonomy
   */
  static async update(id, data) {
    const {
      name,
      code,
      description,
      exam_logo,
      exam_type,
      conducting_authority,
      logo_file_name,
      number_of_papers,
      website,
      documents_required,
      counselling,
      exam_popularity_rank,
      difficulty_level,
    } = data;

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
    if (exam_popularity_rank !== undefined) {
      const v =
        exam_popularity_rank == null || exam_popularity_rank === ''
          ? null
          : parseInt(exam_popularity_rank, 10);
      updates.push(`exam_popularity_rank = $${paramCount++}`);
      values.push(Number.isNaN(v) ? null : v);
    }
    if (difficulty_level !== undefined) {
      updates.push(`difficulty_level = $${paramCount++}`);
      values.push(difficulty_level || null);
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
   * Mock-test formats derived from exam code templates + exam_pattern row.
   */
  static async getFormats(examId) {
    const { getFormatsForExam } = require('../../utils/examFormatTemplates');
    return getFormatsForExam(examId);
  }

  static async getFormatConfig(examId, formatId) {
    const exam = await Exam.findById(examId);
    if (!exam) return null;
    const ExamPattern = require('../exam/ExamPattern');
    const pattern = await ExamPattern.findByExamId(examId);
    const { resolveFormatConfig } = require('../../utils/examFormatTemplates');
    return resolveFormatConfig(exam, pattern, formatId);
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
    const formats = await Exam.getFormats(examId);
    return formats != null && Object.keys(formats).length > 0;
  }
}

module.exports = Exam;
