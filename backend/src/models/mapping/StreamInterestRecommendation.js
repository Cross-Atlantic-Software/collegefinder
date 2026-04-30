const db = require('../../config/database');

class StreamInterestRecommendation {
  static async findAll() {
    const result = await db.query(
      `SELECT m.id, m.stream_id, m.interest_id, m.program_ids, m.exam_ids, m.created_at, m.updated_at,
        s.name AS stream_name,
        cg.label AS interest_label,
        (SELECT string_agg(p.name, ', ' ORDER BY p.name)
         FROM programs p
         WHERE p.id = ANY (COALESCE(m.program_ids, ARRAY[]::integer[]))
        ) AS program_names,
        (SELECT string_agg(e.name, ', ' ORDER BY e.name)
         FROM exams_taxonomies e
         WHERE e.id = ANY (COALESCE(m.exam_ids, ARRAY[]::integer[]))
        ) AS exam_names
       FROM stream_interest_recommendation_mappings m
       JOIN streams s ON s.id = m.stream_id
       JOIN career_goals_taxonomies cg ON cg.id = m.interest_id
       ORDER BY s.name ASC, cg.label ASC`
    );
    return result.rows;
  }

  static async findByStreamAndInterest(streamId, interestId) {
    const result = await db.query(
      `SELECT * FROM stream_interest_recommendation_mappings
       WHERE stream_id = $1 AND interest_id = $2`,
      [streamId, interestId]
    );
    return result.rows[0] || null;
  }

  static async upsert(streamId, interestId, programIds, examIds) {
    const pids = Array.isArray(programIds) ? programIds : [];
    const eids = Array.isArray(examIds) ? examIds : [];
    const result = await db.query(
      `INSERT INTO stream_interest_recommendation_mappings (stream_id, interest_id, program_ids, exam_ids)
       VALUES ($1, $2, $3::integer[], $4::integer[])
       ON CONFLICT (stream_id, interest_id)
       DO UPDATE SET
         program_ids = EXCLUDED.program_ids,
         exam_ids = EXCLUDED.exam_ids,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [streamId, interestId, pids, eids]
    );
    return result.rows[0];
  }
}

module.exports = StreamInterestRecommendation;
