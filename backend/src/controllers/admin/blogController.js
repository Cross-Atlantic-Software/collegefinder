const Blog = require('../../models/blog/Blog');
const { validationResult } = require('express-validator');
const { uploadToS3, deleteFromS3 } = require('../../../utils/storage/s3Upload');

class BlogController {
  /**
   * Get all blogs
   * GET /api/admin/blogs
   */
  static async getAllBlogs(req, res) {
    try {
      const blogs = await Blog.findAll();
      
      // Ensure streams and careers are arrays (parse if needed)
      const parsedBlogs = blogs.map(blog => {
        try {
          return {
            ...blog,
            streams: BlogController.parseJsonbArray(blog.streams),
            careers: BlogController.parseJsonbArray(blog.careers),
          };
        } catch (parseError) {
          console.error('Error parsing blog JSONB fields:', parseError, blog);
          // Return blog with empty arrays if parsing fails
          return {
            ...blog,
            streams: [],
            careers: [],
          };
        }
      });
      
      res.json({
        success: true,
        data: {
          blogs: parsedBlogs,
          total: parsedBlogs.length
        }
      });
    } catch (error) {
      console.error('Error fetching blogs:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch blogs',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Helper function to parse JSONB array fields
   */
  static parseJsonbArray(field) {
    // Handle null or undefined
    if (field === null || field === undefined) return [];
    
    // If already an array, return it (might already be parsed by pg JSONB parser)
    if (Array.isArray(field)) {
      // Ensure all elements are numbers (stream/career IDs)
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
   * Get blog by ID
   * GET /api/admin/blogs/:id
   */
  static async getBlogById(req, res) {
    try {
      const { id } = req.params;
      const blog = await Blog.findById(id);

      if (!blog) {
        return res.status(404).json({
          success: false,
          message: 'Blog not found'
        });
      }

      // Ensure streams and careers are arrays (parse if needed)
      const parsedBlog = {
        ...blog,
        streams: BlogController.parseJsonbArray(blog.streams),
        careers: BlogController.parseJsonbArray(blog.careers),
      };

      res.json({
        success: true,
        data: { blog: parsedBlog }
      });
    } catch (error) {
      console.error('Error fetching blog:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch blog'
      });
    }
  }

  /**
   * Create a new blog
   * POST /api/admin/blogs
   */
  static async createBlog(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        slug,
        is_featured,
        title,
        teaser,
        summary,
        content_type,
        first_part,
        second_part,
        streams,
        careers
      } = req.body;

      // Check if slug already exists
      const existingBlog = await Blog.findBySlug(slug);
      if (existingBlog) {
        return res.status(400).json({
          success: false,
          message: 'Blog with this slug already exists'
        });
      }

      // Handle blog image upload
      let blog_image = null;
      if (req.files && req.files['blog_image']) {
        const file = req.files['blog_image'][0];
        const fileBuffer = file.buffer;
        const fileName = file.originalname;
        blog_image = await uploadToS3(fileBuffer, fileName, 'blog_images');
      }

      // Handle video file upload (if content_type is VIDEO)
      let video_file = null;
      if (content_type === 'VIDEO' && req.files && req.files['video_file']) {
        const file = req.files['video_file'][0];
        const fileBuffer = file.buffer;
        const fileName = file.originalname;
        video_file = await uploadToS3(fileBuffer, fileName, 'blog_videos');
      }

      // Validate content_type specific fields
      if (content_type === 'TEXT' && (!first_part || !second_part)) {
        return res.status(400).json({
          success: false,
          message: 'first_part and second_part are required when content_type is TEXT'
        });
      }

      if (content_type === 'VIDEO' && !video_file) {
        return res.status(400).json({
          success: false,
          message: 'video_file is required when content_type is VIDEO'
        });
      }

      // Convert is_featured to boolean (FormData sends as string)
      const isFeaturedBool = is_featured === true || is_featured === 'true' || is_featured === '1';

      // Parse streams and careers (can be JSON strings or arrays)
      let streamsArray = [];
      if (streams !== undefined && streams !== null) {
        try {
          streamsArray = typeof streams === 'string' ? JSON.parse(streams) : streams;
          if (!Array.isArray(streamsArray)) streamsArray = [];
        } catch (e) {
          streamsArray = [];
        }
      }

      let careersArray = [];
      if (careers !== undefined && careers !== null) {
        try {
          careersArray = typeof careers === 'string' ? JSON.parse(careers) : careers;
          if (!Array.isArray(careersArray)) careersArray = [];
        } catch (e) {
          careersArray = [];
        }
      }

      const blogData = {
        slug,
        is_featured: isFeaturedBool,
        title,
        blog_image,
        teaser: teaser || null,
        summary: summary || null,
        content_type,
        first_part: content_type === 'TEXT' ? first_part : null,
        second_part: content_type === 'TEXT' ? second_part : null,
        video_file: content_type === 'VIDEO' ? video_file : null,
        streams: streamsArray,
        careers: careersArray
      };

      const blog = await Blog.create(blogData);

      res.status(201).json({
        success: true,
        message: 'Blog created successfully',
        data: { blog }
      });
    } catch (error) {
      console.error('Error creating blog:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create blog'
      });
    }
  }

  /**
   * Update a blog
   * PUT /api/admin/blogs/:id
   */
  static async updateBlog(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const existingBlog = await Blog.findById(id);

      if (!existingBlog) {
        return res.status(404).json({
          success: false,
          message: 'Blog not found'
        });
      }

      const {
        slug,
        is_featured,
        title,
        teaser,
        summary,
        content_type,
        first_part,
        second_part,
        streams,
        careers
      } = req.body;

      // Parse streams and careers (can be JSON strings or arrays)
      let streamsArray = undefined;
      if (streams !== undefined) {
        try {
          streamsArray = typeof streams === 'string' ? JSON.parse(streams) : streams;
          if (!Array.isArray(streamsArray)) streamsArray = [];
        } catch (e) {
          streamsArray = [];
        }
      }

      let careersArray = undefined;
      if (careers !== undefined) {
        try {
          careersArray = typeof careers === 'string' ? JSON.parse(careers) : careers;
          if (!Array.isArray(careersArray)) careersArray = [];
        } catch (e) {
          careersArray = [];
        }
      }

      // Check if slug is being changed and if it already exists
      if (slug && slug !== existingBlog.slug) {
        const slugExists = await Blog.findBySlug(slug);
        if (slugExists) {
          return res.status(400).json({
            success: false,
            message: 'Blog with this slug already exists'
          });
        }
      }

      // Handle blog image upload (if new image is provided)
      let blog_image = existingBlog.blog_image;
      if (req.files && req.files['blog_image']) {
        // Delete old image from S3
        if (existingBlog.blog_image) {
          await deleteFromS3(existingBlog.blog_image);
        }
        // Upload new image
        const file = req.files['blog_image'][0];
        const fileBuffer = file.buffer;
        const fileName = file.originalname;
        blog_image = await uploadToS3(fileBuffer, fileName, 'blog_images');
      }

      // Handle video file upload (if content_type is VIDEO and new video is provided)
      let video_file = existingBlog.video_file;
      if (content_type === 'VIDEO' && req.files && req.files['video_file']) {
        // Delete old video from S3
        if (existingBlog.video_file) {
          await deleteFromS3(existingBlog.video_file);
        }
        // Upload new video
        const file = req.files['video_file'][0];
        const fileBuffer = file.buffer;
        const fileName = file.originalname;
        video_file = await uploadToS3(fileBuffer, fileName, 'blog_videos');
      }

      // If content_type is being changed, handle cleanup
      let final_first_part = first_part;
      let final_second_part = second_part;
      if (content_type && content_type !== existingBlog.content_type) {
        if (content_type === 'TEXT' && existingBlog.video_file) {
          // Delete video file if switching to TEXT
          await deleteFromS3(existingBlog.video_file);
          video_file = null;
        } else if (content_type === 'VIDEO' && (existingBlog.first_part || existingBlog.second_part)) {
          // Clear text parts if switching to VIDEO
          final_first_part = null;
          final_second_part = null;
        }
      }

      // Validate content_type specific fields
      if (content_type === 'TEXT' && (!first_part || !second_part)) {
        return res.status(400).json({
          success: false,
          message: 'first_part and second_part are required when content_type is TEXT'
        });
      }

      if (content_type === 'VIDEO' && !video_file) {
        return res.status(400).json({
          success: false,
          message: 'video_file is required when content_type is VIDEO'
        });
      }

      const updateData = {};
      if (slug !== undefined) updateData.slug = slug;
      if (is_featured !== undefined) {
        // Convert is_featured to boolean (FormData sends as string)
        updateData.is_featured = is_featured === true || is_featured === 'true' || is_featured === '1';
      }
      if (title !== undefined) updateData.title = title;
      if (blog_image !== undefined) updateData.blog_image = blog_image;
      if (teaser !== undefined) updateData.teaser = teaser;
      if (summary !== undefined) updateData.summary = summary;
      if (content_type !== undefined) updateData.content_type = content_type;
      if (first_part !== undefined) updateData.first_part = content_type === 'TEXT' ? final_first_part : null;
      if (second_part !== undefined) updateData.second_part = content_type === 'TEXT' ? final_second_part : null;
      if (video_file !== undefined) updateData.video_file = content_type === 'VIDEO' ? video_file : null;
      if (streamsArray !== undefined) updateData.streams = streamsArray;
      if (careersArray !== undefined) updateData.careers = careersArray;

      const blog = await Blog.update(id, updateData);

      res.json({
        success: true,
        message: 'Blog updated successfully',
        data: { blog }
      });
    } catch (error) {
      console.error('Error updating blog:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update blog'
      });
    }
  }

  /**
   * Delete a blog
   * DELETE /api/admin/blogs/:id
   */
  static async deleteBlog(req, res) {
    try {
      const { id } = req.params;
      const blog = await Blog.findById(id);

      if (!blog) {
        return res.status(404).json({
          success: false,
          message: 'Blog not found'
        });
      }

      // Delete blog image from S3 if exists
      if (blog.blog_image) {
        await deleteFromS3(blog.blog_image);
      }

      // Delete video file from S3 if exists
      if (blog.video_file) {
        await deleteFromS3(blog.video_file);
      }

      // Delete blog from database
      await Blog.delete(id);

      res.json({
        success: true,
        message: 'Blog deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting blog:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete blog'
      });
    }
  }

  /**
   * Upload image for rich text editor
   * POST /api/admin/blogs/upload-image
   */
  static async uploadImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided'
        });
      }

      const fileBuffer = req.file.buffer;
      const fileName = req.file.originalname;
      const s3Url = await uploadToS3(fileBuffer, fileName, 'blog_images');

      res.json({
        success: true,
        data: { imageUrl: s3Url }
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload image'
      });
    }
  }
}

module.exports = BlogController;

