const Blog = require('../../models/blog/Blog');

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
  };
}

/**
 * GET /api/site/blogs — public list (newest first; featured pinned to top)
 */
async function listPublic(req, res) {
  try {
    const rows = await Blog.findAll();
    const blogs = rows.map(formatPublicBlog);
    blogs.sort((a, b) => {
      if (Boolean(a.is_featured) !== Boolean(b.is_featured)) {
        return b.is_featured ? 1 : -1;
      }
      return new Date(b.created_at) - new Date(a.created_at);
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
    const blog = await Blog.findBySlug(slug);
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
