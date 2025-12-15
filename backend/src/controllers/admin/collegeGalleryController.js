const CollegeGallery = require('../../models/college/CollegeGallery');
const { validationResult } = require('express-validator');
const { uploadToS3, deleteFromS3 } = require('../../../utils/storage/s3Upload');

class CollegeGalleryController {
  /**
   * Get all college gallery images
   * GET /api/admin/college-gallery
   */
  static async getAllCollegeGallery(req, res) {
    try {
      const gallery = await CollegeGallery.findAll();
      res.json({
        success: true,
        data: { gallery }
      });
    } catch (error) {
      console.error('Error fetching college gallery:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch college gallery'
      });
    }
  }

  /**
   * Get gallery image by ID
   * GET /api/admin/college-gallery/:id
   */
  static async getCollegeGalleryById(req, res) {
    try {
      const { id } = req.params;
      const image = await CollegeGallery.findById(parseInt(id));

      if (!image) {
        return res.status(404).json({
          success: false,
          message: 'Gallery image not found'
        });
      }

      res.json({
        success: true,
        data: { image }
      });
    } catch (error) {
      console.error('Error fetching gallery image:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch gallery image'
      });
    }
  }

  /**
   * Create new gallery image
   * POST /api/admin/college-gallery
   */
  static async createCollegeGallery(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { college_id, caption, sort_order } = req.body;

      let image_url = null;

      // Handle image file upload if present
      if (req.file) {
        try {
          image_url = await uploadToS3(req.file.buffer, req.file.originalname, 'colleges/gallery');
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          return res.status(500).json({
            success: false,
            message: 'Failed to upload image'
          });
        }
      } else if (req.body.image_url) {
        image_url = req.body.image_url;
      }

      if (!image_url) {
        return res.status(400).json({
          success: false,
          message: 'Image is required'
        });
      }

      const image = await CollegeGallery.create({ 
        college_id: parseInt(college_id),
        image_url,
        caption: caption || null,
        sort_order: sort_order ? parseInt(sort_order) : 0
      });

      res.status(201).json({
        success: true,
        message: 'Gallery image created successfully',
        data: { image }
      });
    } catch (error) {
      console.error('Error creating gallery image:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create gallery image'
      });
    }
  }

  /**
   * Update gallery image
   * PUT /api/admin/college-gallery/:id
   */
  static async updateCollegeGallery(req, res) {
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
      const { college_id, image_url, caption, sort_order } = req.body;

      const existing = await CollegeGallery.findById(parseInt(id));
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Gallery image not found'
        });
      }

      const image = await CollegeGallery.update(parseInt(id), { 
        college_id: college_id ? parseInt(college_id) : undefined,
        image_url,
        caption,
        sort_order: sort_order !== undefined ? parseInt(sort_order) : undefined
      });

      res.json({
        success: true,
        message: 'Gallery image updated successfully',
        data: { image }
      });
    } catch (error) {
      console.error('Error updating gallery image:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update gallery image'
      });
    }
  }

  /**
   * Delete gallery image
   * DELETE /api/admin/college-gallery/:id
   */
  static async deleteCollegeGallery(req, res) {
    try {
      const { id } = req.params;
      const image = await CollegeGallery.findById(parseInt(id));

      if (!image) {
        return res.status(404).json({
          success: false,
          message: 'Gallery image not found'
        });
      }

      // Delete image from S3 if it exists
      if (image.image_url) {
        try {
          await deleteFromS3(image.image_url);
        } catch (deleteError) {
          console.error('Error deleting image from S3:', deleteError);
          // Continue with deletion even if S3 deletion fails
        }
      }

      await CollegeGallery.delete(parseInt(id));

      res.json({
        success: true,
        message: 'Gallery image deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting gallery image:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete gallery image'
      });
    }
  }
}

// Configure multer for image uploads
const multer = require('multer');
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

module.exports = { CollegeGalleryController, upload: imageUpload };

