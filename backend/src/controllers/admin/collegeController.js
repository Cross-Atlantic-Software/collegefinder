const College = require('../../models/college/College');
const { validationResult } = require('express-validator');
const { uploadToS3, deleteFromS3 } = require('../../../utils/storage/s3Upload');

class CollegeController {
  /**
   * Get all colleges
   * GET /api/admin/colleges
   */
  static async getAllColleges(req, res) {
    try {
      const colleges = await College.findAll();
      res.json({
        success: true,
        data: { colleges }
      });
    } catch (error) {
      console.error('Error fetching colleges:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch colleges'
      });
    }
  }

  /**
   * Get college by ID
   * GET /api/admin/colleges/:id
   */
  static async getCollegeById(req, res) {
    try {
      const { id } = req.params;
      const college = await College.findById(parseInt(id));

      if (!college) {
        return res.status(404).json({
          success: false,
          message: 'College not found'
        });
      }

      res.json({
        success: true,
        data: { college }
      });
    } catch (error) {
      console.error('Error fetching college:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch college'
      });
    }
  }

  /**
   * Create new college
   * POST /api/admin/colleges
   */
  static async createCollege(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { name, ranking, description } = req.body;

      let logo_url = null;

      // Handle logo file upload if present
      if (req.file) {
        try {
          logo_url = await uploadToS3(req.file.buffer, req.file.originalname, 'colleges/logos');
        } catch (uploadError) {
          console.error('Error uploading logo:', uploadError);
          return res.status(500).json({
            success: false,
            message: 'Failed to upload logo'
          });
        }
      } else if (req.body.logo_url) {
        logo_url = req.body.logo_url;
      }

      const college = await College.create({ 
        name,
        ranking: ranking ? parseInt(ranking) : null,
        description: description || null,
        logo_url
      });

      res.status(201).json({
        success: true,
        message: 'College created successfully',
        data: { college }
      });
    } catch (error) {
      console.error('Error creating college:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create college'
      });
    }
  }

  /**
   * Update college
   * PUT /api/admin/colleges/:id
   */
  static async updateCollege(req, res) {
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
      const { name, ranking, description } = req.body;

      const existing = await College.findById(parseInt(id));
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'College not found'
        });
      }

      let logo_url = existing.logo_url;

      // Handle logo file upload if present
      if (req.file) {
        try {
          // Delete old logo from S3 if it exists
          if (existing.logo_url) {
            try {
              await deleteFromS3(existing.logo_url);
            } catch (deleteError) {
              console.error('Error deleting old logo:', deleteError);
              // Continue even if deletion fails
            }
          }
          logo_url = await uploadToS3(req.file.buffer, req.file.originalname, 'colleges/logos');
        } catch (uploadError) {
          console.error('Error uploading logo:', uploadError);
          return res.status(500).json({
            success: false,
            message: 'Failed to upload logo'
          });
        }
      } else if (req.body.logo_url !== undefined) {
        // If logo_url is explicitly set (including null), use it
        if (req.body.logo_url && req.body.logo_url !== existing.logo_url) {
          // Delete old logo if URL changed
          if (existing.logo_url) {
            try {
              await deleteFromS3(existing.logo_url);
            } catch (deleteError) {
              console.error('Error deleting old logo:', deleteError);
            }
          }
        }
        logo_url = req.body.logo_url || null;
      }

      const college = await College.update(parseInt(id), { 
        name,
        ranking: ranking !== undefined ? (ranking ? parseInt(ranking) : null) : undefined,
        description,
        logo_url
      });

      res.json({
        success: true,
        message: 'College updated successfully',
        data: { college }
      });
    } catch (error) {
      console.error('Error updating college:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update college'
      });
    }
  }

  /**
   * Delete college
   * DELETE /api/admin/colleges/:id
   */
  static async deleteCollege(req, res) {
    try {
      const { id } = req.params;
      const college = await College.findById(parseInt(id));

      if (!college) {
        return res.status(404).json({
          success: false,
          message: 'College not found'
        });
      }

      // Delete logo from S3 if it exists
      if (college.logo_url) {
        try {
          await deleteFromS3(college.logo_url);
        } catch (deleteError) {
          console.error('Error deleting logo from S3:', deleteError);
          // Continue with deletion even if S3 deletion fails
        }
      }

      await College.delete(parseInt(id));

      res.json({
        success: true,
        message: 'College deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting college:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete college'
      });
    }
  }
}

// Configure multer for logo uploads
const multer = require('multer');
const logoUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow no file (for updates without logo change)
    if (!file) {
      cb(null, true);
      return;
    }
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

module.exports = { CollegeController, upload: logoUpload };

