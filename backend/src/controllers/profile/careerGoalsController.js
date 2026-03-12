const XLSX = require('xlsx');
const CareerGoal = require('../../models/taxonomy/CareerGoal');
const UserCareerGoals = require('../../models/user/UserCareerGoals');
const User = require('../../models/user/User');
const db = require('../../config/database');
const { uploadToS3, deleteFromS3 } = require('../../../utils/storage/s3Upload');

class CareerGoalsTaxonomyController {
  /**
   * Get all career goals (for users - public endpoint)
   * GET /api/career-goals
   * Only returns active career goals
   */
  static async getAll(req, res) {
    try {
      const careerGoals = await CareerGoal.findActive(); // Only active goals for public
      res.json({
        success: true,
        data: { careerGoals }
      });
    } catch (error) {
      console.error('Error fetching career goals:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch career goals'
      });
    }
  }

  /**
   * Get all career goals (for admin)
   * GET /api/admin/career-goals
   */
  static async getAllAdmin(req, res) {
    try {
      const careerGoals = await CareerGoal.findAll();
      res.json({
        success: true,
        data: { careerGoals }
      });
    } catch (error) {
      console.error('Error fetching career goals:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch career goals'
      });
    }
  }

  /**
   * Get career goal by ID (for admin)
   * GET /api/admin/career-goals/:id
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const careerGoal = await CareerGoal.findById(parseInt(id));

      if (!careerGoal) {
        return res.status(404).json({
          success: false,
          message: 'Interest not found'
        });
      }

      res.json({
        success: true,
        data: { careerGoal }
      });
    } catch (error) {
      console.error('Error fetching career goal:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch career goal'
      });
    }
  }

  /**
   * Create new career goal (for admin)
   * POST /api/admin/career-goals
   */
  static async create(req, res) {
    try {
      const { label, logo, description, status } = req.body;

      // Validate required fields (logo is optional)
      if (!label) {
        return res.status(400).json({
          success: false,
          message: 'Label is required'
        });
      }

      // Check if label already exists
      const existing = await CareerGoal.findByLabel(label);
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Interest with this label already exists'
        });
      }

      const careerGoal = await CareerGoal.create({ 
        label, 
        logo: logo || null, 
        description: description || null,
        status: status !== undefined ? status : true,
        updated_by: req.admin?.id || null
      });
      res.status(201).json({
        success: true,
        data: { careerGoal },
        message: 'Interest created successfully'
      });
    } catch (error) {
      console.error('Error creating career goal:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create career goal'
      });
    }
  }

  /**
   * Upload image to S3 (for admin)
   * POST /api/admin/career-goals/upload-image
   */
  static async uploadImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const fileBuffer = req.file.buffer;
      const fileName = req.file.originalname;
      const s3Url = await uploadToS3(fileBuffer, fileName, 'career-goals-taxonomies');

      res.json({
        success: true,
        data: { imageUrl: s3Url },
        message: 'Image uploaded successfully'
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload image'
      });
    }
  }

  /**
   * Update career goal (for admin)
   * PUT /api/admin/career-goals/:id
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { label, logo, description, status } = req.body;

      const existing = await CareerGoal.findById(parseInt(id));
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Interest not found'
        });
      }

      // If label is being changed, check for duplicates
      if (label && label !== existing.label) {
        const duplicate = await CareerGoal.findByLabel(label);
        if (duplicate && duplicate.id !== parseInt(id)) {
          return res.status(400).json({
            success: false,
            message: 'Interest with this label already exists'
          });
        }
      }

      // If logo is being updated, delete old logo from S3
      if (logo !== undefined && logo !== existing.logo && existing.logo) {
        await deleteFromS3(existing.logo);
      }

      const careerGoal = await CareerGoal.update(parseInt(id), { 
        label, 
        logo, 
        description,
        status,
        updated_by: req.admin?.id || null
      });
      res.json({
        success: true,
        data: { careerGoal },
        message: 'Career goal updated successfully'
      });
    } catch (error) {
      console.error('Error updating career goal:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update career goal'
      });
    }
  }

  /**
   * Delete career goal (for admin)
   * DELETE /api/admin/career-goals/:id
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const careerGoal = await CareerGoal.findById(parseInt(id));

      if (!careerGoal) {
        return res.status(404).json({
          success: false,
          message: 'Interest not found'
        });
      }

      // Delete logo from S3 if it exists
      if (careerGoal.logo) await deleteFromS3(careerGoal.logo);

      await CareerGoal.delete(parseInt(id));
      res.json({
        success: true,
        message: 'Interest deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting career goal:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete career goal'
      });
    }
  }

  /**
   * Download all career goals as Excel (Super Admin only)
   * GET /api/admin/career-goals/download-excel
   * Logo column contains full S3 URL from DB
   */
  static async downloadAllExcel(req, res) {
    try {
      const careerGoals = await CareerGoal.findAll();
      const headers = ['id', 'label', 'logo', 'description', 'status', 'created_at', 'updated_at', 'updated_by_email'];
      const rows = [headers];
      for (const cg of careerGoals) {
        rows.push([
          cg.id,
          cg.label || '',
          cg.logo || '',
          cg.description || '',
          cg.status !== false ? 'TRUE' : 'FALSE',
          cg.created_at ? String(cg.created_at).slice(0, 19) : '',
          cg.updated_at ? String(cg.updated_at).slice(0, 19) : '',
          cg.updated_by_email || ''
        ]);
      }
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Interests');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=interests-all-data.xlsx');
      res.send(buf);
    } catch (error) {
      console.error('Error generating interests export:', error);
      res.status(500).json({ success: false, message: 'Failed to export interests data' });
    }
  }

  /**
   * Delete all career goals (Super Admin only)
   * DELETE /api/admin/career-goals/all
   */
  static async deleteAll(req, res) {
    try {
      const all = await CareerGoal.findAll();
      for (const cg of all) {
        if (cg.logo) await deleteFromS3(cg.logo);
        await CareerGoal.delete(cg.id);
      }
      // Clear user interests (they reference deleted IDs)
      await db.query('UPDATE user_career_goals SET interests = NULL, updated_at = CURRENT_TIMESTAMP');
      res.json({
        success: true,
        message: `All ${all.length} interests deleted successfully`
      });
    } catch (error) {
      console.error('Error deleting all career goals:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete all interests'
      });
    }
  }

  /**
   * Get user career goals (for user profile)
   * GET /api/auth/profile/career-goals
   */
  static async getCareerGoals(req, res) {
    try {
      const userId = req.user.id;
      const userCareerGoals = await UserCareerGoals.findByUserId(userId);

      if (!userCareerGoals) {
        return res.json({
          success: true,
          data: null
        });
      }

      // Parse interests array (now INTEGER[] of taxonomy IDs)
      let interests = [];
      if (userCareerGoals.interests) {
        interests = Array.isArray(userCareerGoals.interests)
          ? userCareerGoals.interests.map(id => id.toString()) // Convert to strings for frontend
          : [userCareerGoals.interests.toString()];
      }

      res.json({
        success: true,
        data: {
          interests: interests
        }
      });
    } catch (error) {
      console.error('Error fetching user career goals:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch career goals'
      });
    }
  }

  /**
   * Update user career goals (for user profile)
   * PUT /api/auth/profile/career-goals
   */
  static async updateCareerGoals(req, res) {
    try {
      const userId = req.user.id;
      const { interests } = req.body;

      // Validate interests is an array
      if (interests && !Array.isArray(interests)) {
        return res.status(400).json({
          success: false,
          message: 'Interests must be an array'
        });
      }

      const userCareerGoals = await UserCareerGoals.upsert(userId, {
        interests: interests || []
      });

      // Check if all onboarding steps are completed and mark onboarding as completed
      const isOnboardingComplete = await User.checkOnboardingCompletion(userId);
      if (isOnboardingComplete) {
        await User.markOnboardingCompleted(userId);
      }

      // Parse interests array for response (now INTEGER[] of taxonomy IDs)
      let interestsArray = [];
      if (userCareerGoals.interests) {
        interestsArray = Array.isArray(userCareerGoals.interests)
          ? userCareerGoals.interests.map(id => id.toString()) // Convert to strings for frontend
          : [userCareerGoals.interests.toString()];
      }

      res.json({
        success: true,
        data: {
          interests: interestsArray
        },
        message: 'Interests updated successfully'
      });
    } catch (error) {
      console.error('Error updating user career goals:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update career goals'
      });
    }
  }
}

// Export the class directly - all methods are static
module.exports = CareerGoalsTaxonomyController;
