const db = require('../../config/database');

class Blog {
  /**
   * Find all blogs (admin; optional filters)
   * @param {{ is_active?: string|boolean, content_type?: string }} filters
   */
  static async findAllForAdmin(filters = {}) {
    const conditions = [];
    const values = [];
    let p = 1;

    const rawActive = filters.is_active;
    if (rawActive !== undefined && rawActive !== null && rawActive !== '' && rawActive !== 'all') {
      const active =
        rawActive === true ||
        rawActive === 'true' ||
        rawActive === '1';
      const inactive =
        rawActive === false ||
        rawActive === 'false' ||
        rawActive === '0';
      if (active || inactive) {
        conditions.push(`is_active = $${p++}`);
        values.push(active);
      }
    }

    if (
      filters.content_type &&
      filters.content_type !== 'all' &&
      (filters.content_type === 'TEXT' || filters.content_type === 'VIDEO')
    ) {
      conditions.push(`content_type = $${p++}`);
      values.push(filters.content_type);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await db.query(
      `SELECT * FROM college_finder_blogs ${where} ORDER BY created_at DESC`,
      values
    );
    return result.rows;
  }

  /**
   * Public site: active blogs only
   */
  static async findAllActivePublic() {
    const result = await db.query(
      `SELECT * FROM college_finder_blogs WHERE is_active = true ORDER BY created_at DESC`
    );
    return result.rows;
  }

  /**
   * @deprecated use findAllForAdmin or findAllActivePublic
   */
  static async findAll() {
    return this.findAllForAdmin({});
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
   * Public site: active post only
   */
  static async findBySlugActivePublic(slug) {
    const result = await db.query(
      'SELECT * FROM college_finder_blogs WHERE slug = $1 AND is_active = true',
      [slug]
    );
    return result.rows[0] || null;
  }

  /**
   * Return a slug that does not collide with another row (append -2, -3, …).
   * @param {string} baseSlug - preferred slug (lowercase kebab-case)
   * @param {number|null} excludeBlogId - when updating, ignore this id as a collision
   */
  static async uniqueSlug(baseSlug, excludeBlogId = null) {
    let base = (baseSlug && String(baseSlug).trim())
      ? String(baseSlug).trim().toLowerCase()
      : 'blog';
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(base)) {
      base = base
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'blog';
    }
    let slug = base;
    for (let counter = 0; counter < 10000; counter += 1) {
      const existing = await this.findBySlug(slug);
      if (
        !existing ||
        (excludeBlogId != null && Number(existing.id) === Number(excludeBlogId))
      ) {
        return slug;
      }
      slug = `${base}-${counter + 1}`;
    }
    return `${base}-${Date.now()}`;
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
      is_active,
      title,
      blog_image,
      teaser,
      summary,
      content_type,
      first_part,
      second_part,
      video_file,
      streams,
      careers,
      url,
      source_name,
      published_date_custom
    } = data;

    const result = await db.query(
      `INSERT INTO college_finder_blogs 
       (slug, is_featured, is_active, title, blog_image, teaser, summary, content_type, first_part, second_part, video_file, streams, careers, url, source_name, published_date_custom)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) 
       RETURNING *`,
      [
        slug,
        is_featured || false,
        is_active !== false && is_active !== 'false' && is_active !== '0',
        title,
        blog_image || null,
        teaser || null,
        summary || null,
        content_type,
        first_part || null,
        second_part || null,
        video_file || null,
        streams ? JSON.stringify(streams) : '[]',
        careers ? JSON.stringify(careers) : '[]',
        url || null,
        source_name || null,
        published_date_custom || null
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
      is_active,
      title,
      blog_image,
      teaser,
      summary,
      content_type,
      first_part,
      second_part,
      video_file,
      streams,
      careers,
      url,
      source_name,
      published_date_custom
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
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(is_active);
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
    if (url !== undefined) {
      updates.push(`url = $${paramCount++}`);
      values.push(url || null);
    }
    if (source_name !== undefined) {
      updates.push(`source_name = $${paramCount++}`);
      values.push(source_name || null);
    }
    if (published_date_custom !== undefined) {
      updates.push(`published_date_custom = $${paramCount++}`);
      values.push(published_date_custom || null);
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

  /**
   * Ensure new columns exist (migration helper)
   * This ensures url and source_name columns exist in the database
   */
  static async ensureColumnsExist() {
    try {
      // Check if url column exists
      const urlCheck = await db.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'college_finder_blogs' 
        AND column_name = 'url'
      `);
      
      if (urlCheck.rows.length === 0) {
        await db.query('ALTER TABLE college_finder_blogs ADD COLUMN url VARCHAR(500)');
        console.log('✓ Added url column to college_finder_blogs table');
      }

      // Check if source_name column exists
      const sourceNameCheck = await db.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'college_finder_blogs' 
        AND column_name = 'source_name'
      `);
      
      if (sourceNameCheck.rows.length === 0) {
        await db.query('ALTER TABLE college_finder_blogs ADD COLUMN source_name VARCHAR(255)');
        console.log('✓ Added source_name column to college_finder_blogs table');
      }

      const activeCheck = await db.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'college_finder_blogs' 
        AND column_name = 'is_active'
      `);
      if (activeCheck.rows.length === 0) {
        await db.query(
          `ALTER TABLE college_finder_blogs ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE`
        );
        console.log('✓ Added is_active column to college_finder_blogs table');
      }

      const pubDateCheck = await db.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'college_finder_blogs' 
        AND column_name = 'published_date_custom'
      `);
      if (pubDateCheck.rows.length === 0) {
        await db.query(
          `ALTER TABLE college_finder_blogs ADD COLUMN published_date_custom DATE`
        );
        console.log('✓ Added published_date_custom column to college_finder_blogs table');
      }
    } catch (error) {
      console.error('Error ensuring blog columns exist:', error);
      // Don't throw - allow the app to continue even if migration fails
    }
  }
}

module.exports = Blog;


