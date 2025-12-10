const db = require('../../config/database');

class Blog {
  /**
   * Find all blogs
   */
  static async findAll() {
    const result = await db.query(
      'SELECT * FROM college_finder_blogs ORDER BY created_at DESC'
    );
    return result.rows;
  }

  /**
   * Find blog by ID
   */
  static async findById(id) {
    const result = await db.query(
      'SELECT * FROM college_finder_blogs WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Find blog by slug
   */
  static async findBySlug(slug) {
    const result = await db.query(
      'SELECT * FROM college_finder_blogs WHERE slug = $1',
      [slug]
    );
    return result.rows[0] || null;
  }

  /**
   * Find blog by title
   */
  static async findByTitle(title) {
    const result = await db.query(
      'SELECT * FROM college_finder_blogs WHERE title = $1',
      [title]
    );
    return result.rows[0] || null;
  }

  /**
   * Find featured blogs
   */
  static async findFeatured() {
    const result = await db.query(
      'SELECT * FROM college_finder_blogs WHERE is_featured = true ORDER BY created_at DESC'
    );
    return result.rows;
  }

  /**
   * Create a new blog
   */
  static async create(data) {
    const {
      slug,
      is_featured,
      title,
      blog_image,
      teaser,
      summary,
      content_type,
      first_part,
      second_part,
      video_file,
      streams,
      careers
    } = data;

    const result = await db.query(
      `INSERT INTO college_finder_blogs 
       (slug, is_featured, title, blog_image, teaser, summary, content_type, first_part, second_part, video_file, streams, careers)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
       RETURNING *`,
      [
        slug,
        is_featured || false,
        title,
        blog_image || null,
        teaser || null,
        summary || null,
        content_type,
        first_part || null,
        second_part || null,
        video_file || null,
        streams ? JSON.stringify(streams) : '[]',
        careers ? JSON.stringify(careers) : '[]'
      ]
    );
    return result.rows[0];
  }

  /**
   * Update a blog
   */
  static async update(id, data) {
    const {
      slug,
      is_featured,
      title,
      blog_image,
      teaser,
      summary,
      content_type,
      first_part,
      second_part,
      video_file,
      streams,
      careers
    } = data;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (slug !== undefined) {
      updates.push(`slug = $${paramCount++}`);
      values.push(slug);
    }
    if (is_featured !== undefined) {
      updates.push(`is_featured = $${paramCount++}`);
      values.push(is_featured);
    }
    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (blog_image !== undefined) {
      updates.push(`blog_image = $${paramCount++}`);
      values.push(blog_image || null);
    }
    if (teaser !== undefined) {
      updates.push(`teaser = $${paramCount++}`);
      values.push(teaser || null);
    }
    if (summary !== undefined) {
      updates.push(`summary = $${paramCount++}`);
      values.push(summary || null);
    }
    if (content_type !== undefined) {
      updates.push(`content_type = $${paramCount++}`);
      values.push(content_type);
    }
    if (first_part !== undefined) {
      updates.push(`first_part = $${paramCount++}`);
      values.push(first_part || null);
    }
    if (second_part !== undefined) {
      updates.push(`second_part = $${paramCount++}`);
      values.push(second_part || null);
    }
    if (video_file !== undefined) {
      updates.push(`video_file = $${paramCount++}`);
      values.push(video_file || null);
    }
    if (streams !== undefined) {
      updates.push(`streams = $${paramCount++}`);
      values.push(Array.isArray(streams) ? JSON.stringify(streams) : streams);
    }
    if (careers !== undefined) {
      updates.push(`careers = $${paramCount++}`);
      values.push(Array.isArray(careers) ? JSON.stringify(careers) : careers);
    }

    if (updates.length === 0) {
      return null;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE college_finder_blogs 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Delete a blog
   */
  static async delete(id) {
    const result = await db.query(
      'DELETE FROM college_finder_blogs WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Get total count of blogs
   */
  static async count() {
    const result = await db.query(
      'SELECT COUNT(*) as total FROM college_finder_blogs'
    );
    return parseInt(result.rows[0].total, 10);
  }
}

module.exports = Blog;


