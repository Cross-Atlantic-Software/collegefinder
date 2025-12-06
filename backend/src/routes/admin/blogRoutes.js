const express = require('express');
const router = express.Router();
const multer = require('multer');
const BlogController = require('../../controllers/admin/blogController');
const { authenticateAdmin } = require('../../middleware/adminAuth');
const {
  validateCreateBlog,
  validateUpdateBlog
} = require('../../middleware/validators');

// Configure multer for memory storage (for S3 upload)
// Support multiple file fields: blog_image and video_file
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for videos
  },
  fileFilter: (req, file, cb) => {
    // Accept image files for blog_image
    if (file.fieldname === 'blog_image' && file.mimetype.startsWith('image/')) {
      cb(null, true);
    }
    // Accept video files for video_file
    else if (file.fieldname === 'video_file' && file.mimetype.startsWith('video/')) {
      cb(null, true);
    }
    // Reject other files
    else {
      cb(new Error(`Invalid file type for ${file.fieldname}. Images allowed for blog_image, videos for video_file.`), false);
    }
  },
});

/**
 * @route   GET /api/admin/blogs
 * @desc    Get all blogs
 * @access  Private (Admin)
 */
router.get('/', authenticateAdmin, BlogController.getAllBlogs);

/**
 * @route   GET /api/admin/blogs/:id
 * @desc    Get blog by ID
 * @access  Private (Admin)
 */
router.get('/:id', authenticateAdmin, BlogController.getBlogById);

/**
 * @route   POST /api/admin/blogs
 * @desc    Create new blog
 * @access  Private (Admin)
 */
router.post(
  '/',
  authenticateAdmin,
  upload.fields([
    { name: 'blog_image', maxCount: 1 },
    { name: 'video_file', maxCount: 1 }
  ]),
  validateCreateBlog,
  BlogController.createBlog
);

/**
 * @route   PUT /api/admin/blogs/:id
 * @desc    Update blog
 * @access  Private (Admin)
 */
router.put(
  '/:id',
  authenticateAdmin,
  upload.fields([
    { name: 'blog_image', maxCount: 1 },
    { name: 'video_file', maxCount: 1 }
  ]),
  validateUpdateBlog,
  BlogController.updateBlog
);

/**
 * @route   DELETE /api/admin/blogs/:id
 * @desc    Delete blog
 * @access  Private (Admin)
 */
router.delete('/:id', authenticateAdmin, BlogController.deleteBlog);

module.exports = router;


