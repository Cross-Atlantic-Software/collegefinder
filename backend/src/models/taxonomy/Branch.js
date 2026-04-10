const db = require('../../config/database');

class Branch {
  static async findAll() {
    const result = await db.query('SELECT * FROM branches ORDER BY name ASC');
    return result.rows;
  }

  /** All branches with linked program ids and comma-separated names (for admin list / Excel). */
  static async findAllWithPrograms() {
    const result = await db.query(`
      SELECT b.id, b.name, b.description, b.status, b.created_at, b.updated_at,
        COALESCE(string_agg(p.name, ', ' ORDER BY p.name) FILTER (WHERE p.id IS NOT NULL), '') AS program_names,
        COALESCE(array_agg(p.id ORDER BY p.name) FILTER (WHERE p.id IS NOT NULL), ARRAY[]::INTEGER[]) AS program_ids
      FROM branches b
      LEFT JOIN branch_programs bp ON bp.branch_id = b.id
      LEFT JOIN programs p ON p.id = bp.program_id
      GROUP BY b.id
      ORDER BY b.name ASC
    `);
    return result.rows;
  }

  static async findActive() {
    const result = await db.query('SELECT * FROM branches WHERE status = TRUE ORDER BY name ASC');
    return result.rows;
  }

  static async findById(id) {
    const result = await db.query('SELECT * FROM branches WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findByIdWithPrograms(id) {
    const branch = await this.findById(id);
    if (!branch) return null;
    const pr = await db.query(
      `SELECT p.id, p.name FROM branch_programs bp
       JOIN programs p ON p.id = bp.program_id
       WHERE bp.branch_id = $1 ORDER BY p.name`,
      [id]
    );
    const programs = pr.rows;
    return {
      ...branch,
      programs,
      program_ids: programs.map((p) => p.id),
      program_names: programs.map((p) => p.name).join(', '),
    };
  }

  static async findByName(name) {
    const result = await db.query('SELECT * FROM branches WHERE name = $1', [name]);
    return result.rows[0] || null;
  }

  static async findByNameCaseInsensitive(name) {
    const result = await db.query('SELECT * FROM branches WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))', [name]);
    return result.rows[0] || null;
  }

  static async create(data) {
    const { name, description, status = true } = data;
    const result = await db.query(
      `INSERT INTO branches (name, description, status) VALUES ($1, $2, $3) RETURNING *`,
      [name, description || null, status]
    );
    return result.rows[0];
  }

  static async update(id, data) {
    const { name, description, status } = data;
    const updates = [];
    const values = [];
    let paramCount = 1;
    if (name !== undefined) { updates.push(`name = $${paramCount++}`); values.push(name); }
    if (description !== undefined) { updates.push(`description = $${paramCount++}`); values.push(description); }
    if (status !== undefined) { updates.push(`status = $${paramCount++}`); values.push(status); }
    if (updates.length === 0) return await this.findById(id);
    values.push(id);
    const result = await db.query(
      `UPDATE branches SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  static async delete(id) {
    const result = await db.query('DELETE FROM branches WHERE id = $1 RETURNING *', [id]);
    return result.rows[0] || null;
  }

  /**
   * Replace branch ↔ program links. Pass [] to clear.
   * Validates each program id exists.
   */
  static async setProgramIds(branchId, programIds) {
    const Program = require('./Program');
    const unique = [
      ...new Set((programIds || []).map(Number).filter((n) => Number.isInteger(n) && n > 0)),
    ];
    for (const pid of unique) {
      const p = await Program.findById(pid);
      if (!p) throw new Error(`Program not found (id ${pid})`);
    }
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM branch_programs WHERE branch_id = $1', [branchId]);
      for (const pid of unique) {
        await client.query(
          'INSERT INTO branch_programs (branch_id, program_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [branchId, pid]
        );
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}

module.exports = Branch;
