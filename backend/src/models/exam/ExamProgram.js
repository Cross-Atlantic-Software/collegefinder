const db = require('../../config/database');

class ExamProgram {
  /**
   * Programs linked to many exams (batch). Rows: exam_id, program_id, name
   */
  static async findProgramsForExamIds(examIds) {
    if (!examIds || examIds.length === 0) {
      return [];
    }
    const result = await db.query(
      `SELECT ep.exam_id, ep.program_id, p.name AS program_name
       FROM exam_program ep
       JOIN programs p ON p.id = ep.program_id
       WHERE ep.exam_id = ANY($1::int[])
       ORDER BY ep.exam_id ASC, p.name ASC`,
      [examIds]
    );
    return result.rows;
  }

  static async getProgramIdsByExamId(examId) {
    const result = await db.query(
      'SELECT program_id FROM exam_program WHERE exam_id = $1 ORDER BY program_id',
      [examId]
    );
    return result.rows.map(r => r.program_id);
  }

  static async setProgramsForExam(examId, programIds) {
    await db.query('DELETE FROM exam_program WHERE exam_id = $1', [examId]);
    if (!programIds || !Array.isArray(programIds) || programIds.length === 0) return [];
    const created = [];
    for (const programId of programIds) {
      const row = await db.query(
        `INSERT INTO exam_program (exam_id, program_id) VALUES ($1, $2) ON CONFLICT (exam_id, program_id) DO NOTHING RETURNING *`,
        [examId, programId]
      );
      if (row.rows[0]) created.push(row.rows[0]);
    }
    return created;
  }

  static async deleteByExamId(examId) {
    await db.query('DELETE FROM exam_program WHERE exam_id = $1', [examId]);
  }
}

module.exports = ExamProgram;
