const db = require('../../config/database');

class Subject {
  /**
   * Helper function to parse JSONB array fields
   */
  static parseJsonbArray(field) {
    // Handle null or undefined
    if (field === null || field === undefined) return [];
    
    // If already an array, return it (might already be parsed by pg JSONB parser)
    if (Array.isArray(field)) {
      // Ensure all elements are numbers (stream IDs)
      return field.map(item => {
        const num = typeof item === 'number' ? item : Number(item);
        return isNaN(num) ? null : num;
      }).filter(item => item !== null);
    }
    
    // If it's a string, try to parse it
    if (typeof field === 'string') {
      try {
        const parsed = JSON.parse(field);
        if (Array.isArray(parsed)) {
          return parsed.map(item => {
            const num = typeof item === 'number' ? item : Number(item);
            return isNaN(num) ? null : num;
          }).filter(item => item !== null);
        }
        return [];
      } catch (e) {
        console.warn('Failed to parse JSONB string:', field, e);
        return [];
      }
    }
    
    // If it's an object (shouldn't happen for arrays, but handle it)
    if (typeof field === 'object') {
      // If it has an array-like structure, try to extract it
      if (Array.isArray(field)) {
        return field;
      }
      return [];
    }
    
    return [];
  }

  /**
   * Find all subjects
   */
  static async findAll() {
    const result = await db.query(
      'SELECT * FROM subjects ORDER BY name ASC'
    );
    // Parse JSONB streams field
    return result.rows.map(row => ({
      ...row,
      streams: Subject.parseJsonbArray(row.streams)
    }));
  }

  /**
   * Find subject by ID
   */
  static async findById(id) {
    const result = await db.query(
      'SELECT * FROM subjects WHERE id = $1',
      [id]
    );
    if (!result.rows[0]) return null;
    return {
      ...result.rows[0],
      streams: Subject.parseJsonbArray(result.rows[0].streams)
    };
  }

  /**
   * Find subject by name
   */
  static async findByName(name) {
    const result = await db.query(
      'SELECT * FROM subjects WHERE LOWER(name) = LOWER($1)',
      [name]
    );
    if (!result.rows[0]) return null;
    return {
      ...result.rows[0],
      streams: Subject.parseJsonbArray(result.rows[0].streams)
    };
  }

  /**
   * Find active subjects only
   */
  static async findActive() {
    const result = await db.query(
      'SELECT * FROM subjects WHERE status = true ORDER BY name ASC'
    );
    // Parse JSONB streams field
    return result.rows.map(row => ({
      ...row,
      streams: Subject.parseJsonbArray(row.streams)
    }));
  }

  /**
   * Find active subjects by stream_id
   * Returns subjects where the streams JSONB array contains the given stream_id
   * This checks if ANY of the stream IDs in the subject's streams array matches the user's stream_id
   * Works with subjects that have single or multiple streams
   */
  static async findByStreamId(streamId) {
    const streamIdNum = typeof streamId === 'string' ? parseInt(streamId, 10) : streamId;
    if (isNaN(streamIdNum)) {
      return [];
    }
    
    // Use jsonb_array_elements to expand the array and check each element
    // This handles both numeric and string representations in the JSONB array
    // Works regardless of how many streams are in the array (1, 2, 3, etc.)
    const result = await db.query(
      `SELECT DISTINCT s.* 
       FROM subjects s
       CROSS JOIN LATERAL jsonb_array_elements(s.streams) AS stream_elem
       WHERE s.status = true 
       AND (stream_elem::text::integer = $1 OR stream_elem::text = $2)
       ORDER BY s.name ASC`,
      [streamIdNum, streamIdNum.toString()]
    );
    // Parse JSONB streams field
    return result.rows.map(row => ({
      ...row,
      streams: Subject.parseJsonbArray(row.streams)
    }));
  }

  /**
   * Create a new subject
   */
  static async create(data) {
    const { name, streams, status } = data;
    const streamsJson = streams ? (Array.isArray(streams) ? JSON.stringify(streams) : streams) : '[]';
    const result = await db.query(
      'INSERT INTO subjects (name, streams, status) VALUES ($1, $2, $3) RETURNING *',
      [name, streamsJson, status !== undefined ? status : true]
    );
    return {
      ...result.rows[0],
      streams: Subject.parseJsonbArray(result.rows[0].streams)
    };
  }

  /**
   * Update a subject
   */
  static async update(id, data) {
    const { name, streams, status } = data;
    
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (streams !== undefined) {
      const streamsJson = streams ? (Array.isArray(streams) ? JSON.stringify(streams) : streams) : '[]';
      updates.push(`streams = $${paramCount++}`);
      values.push(streamsJson);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }

    if (updates.length === 0) {
      return null;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE subjects 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);
    if (!result.rows[0]) return null;
    return {
      ...result.rows[0],
      streams: Subject.parseJsonbArray(result.rows[0].streams)
    };
  }

  /**
   * Delete a subject
   */
  static async delete(id) {
    const result = await db.query(
      'DELETE FROM subjects WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0] || null;
  }
}

module.exports = Subject;


