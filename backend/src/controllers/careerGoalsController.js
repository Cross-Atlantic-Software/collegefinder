const CareerGoal = require('../models/CareerGoal');
const UserCareerGoals = require('../models/UserCareerGoals');
const { uploadToS3, deleteFromS3 } = require('../../utils/s3Upload');

class CareerGoalsTaxonomyController {
  /**
   * Get all career goals (for users - public endpoint)
   * GET /api/career-goals
   */
  static async getAll(req, res) {
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
          message: 'Career goal not found'
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
      const { label, logo } = req.body;

      // Validate required fields
      if (!label || !logo) {
        return res.status(400).json({
          success: false,
          message: 'Label and logo are required'
        });
      }

      // Check if label already exists
      const existing = await CareerGoal.findByLabel(label);
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Career goal with this label already exists'
        });
      }

      const careerGoal = await CareerGoal.create({ label, logo });
      res.status(201).json({
        success: true,
        data: { careerGoal },
        message: 'Career goal created successfully'
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
      const { label, logo } = req.body;

      const existing = await CareerGoal.findById(parseInt(id));
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Career goal not found'
        });
      }

      // If label is being changed, check for duplicates
      if (label && label !== existing.label) {
        const duplicate = await CareerGoal.findByLabel(label);
        if (duplicate && duplicate.id !== parseInt(id)) {
          return res.status(400).json({
            success: false,
            message: 'Career goal with this label already exists'
          });
        }
      }

      // If logo is being updated, delete old logo from S3
      if (logo && logo !== existing.logo) {
        await deleteFromS3(existing.logo);
      }

      const careerGoal = await CareerGoal.update(parseInt(id), { label, logo });
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
          message: 'Career goal not found'
        });
      }

      // Delete logo from S3
      await deleteFromS3(careerGoal.logo);

      await CareerGoal.delete(parseInt(id));
      res.json({
        success: true,
        message: 'Career goal deleted successfully'
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
        message: 'Career goals updated successfully'
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
