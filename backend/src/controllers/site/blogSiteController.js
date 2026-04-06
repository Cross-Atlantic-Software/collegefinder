const Blog = require('../../models/blog/Blog');

Blog.ensureColumnsExist().catch((err) => {
  console.error('Failed to ensure blog columns exist (site):', err);
});

/**
 * DB DATE / JS Date / ISO string → 'YYYY-MM-DD' or null (for JSON + sorting)
 */
function normalizePublishedDateCustom(val) {
  if (val == null || val === '') return null;
  if (typeof val === 'string') {
    const t = val.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
    if (t.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(t)) return t.slice(0, 10);
  }
  if (val instanceof Date && !Number.isNaN(val.getTime())) {
    return val.toISOString().slice(0, 10);
  }
  return null;
}

/** Sort key: custom calendar date if set, else created_at (UTC ms, stable on any server TZ) */
function effectivePublishMs(blog) {
  const custom = normalizePublishedDateCustom(blog.published_date_custom);
  if (custom) {
    const [y, m, d] = custom.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  }
  return new Date(blog.created_at).getTime();
}

function parseJsonbArray(field) {
  if (field === null || field === undefined) return [];
  if (Array.isArray(field)) {
    return field
      .map((item) => {
        const num = typeof item === 'number' ? item : Number(item);
        return Number.isNaN(num) ? null : num;
      })
      .filter((item) => item !== null);
  }
  if (typeof field === 'string') {
    try {
      const parsed = JSON.parse(field);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => {
            const num = typeof item === 'number' ? item : Number(item);
            return Number.isNaN(num) ? null : num;
          })
          .filter((item) => item !== null);
      }
    } catch {
      /* ignore */
    }
  }
  return [];
}

function formatPublicBlog(blog) {
  return {
    ...blog,
    streams: parseJsonbArray(blog.streams),
    careers: parseJsonbArray(blog.careers),
    url: blog.url || null,
    source_name: blog.source_name || null,
    published_date_custom: normalizePublishedDateCustom(blog.published_date_custom),
  };
}

/**
 * GET /api/site/blogs — public list (newest first; featured pinned to top)
 */
async function listPublic(req, res) {
  try {
    const rows = await Blog.findAllActivePublic();
    const blogs = rows.map(formatPublicBlog);
    blogs.sort((a, b) => {
      if (Boolean(a.is_featured) !== Boolean(b.is_featured)) {
        return b.is_featured ? 1 : -1;
      }
      return effectivePublishMs(b) - effectivePublishMs(a);
    });
    res.json({
      success: true,
      data: { blogs, total: blogs.length },
    });
  } catch (error) {
    console.error('listPublic blogs:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch blogs' });
  }
}

/**
 * GET /api/site/blogs/:slug — single post by slug
 */
async function getBySlugPublic(req, res) {
  try {
    const { slug } = req.params;
    const blog = await Blog.findBySlugActivePublic(slug);
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }
    res.json({
      success: true,
      data: { blog: formatPublicBlog(blog) },
    });
  } catch (error) {
    console.error('getBySlugPublic blog:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch blog' });
  }
}

module.exports = {
  listPublic,
  getBySlugPublic,
};
