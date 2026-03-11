const Career = require('../../models/taxonomy/Career');
const { validationResult } = require('express-validator');

class CareerController {
  /**
   * Get all careers
   * GET /api/admin/careers
   */
  static async getAllCareers(req, res) {
    try {
      const careers = await Career.findAll();
      res.json({
        success: true,
        data: { careers }
      });
    } catch (error) {
      console.error('Error fetching careers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch careers'
      });
    }
  }

  /**
   * Get career by ID
   * GET /api/admin/careers/:id
   */
  static async getCareerById(req, res) {
    try {
      const { id } = req.params;
      const career = await Career.findById(parseInt(id));

      if (!career) {
        return res.status(404).json({
          success: false,
          message: 'Career not found'
        });
      }

      res.json({
        success: true,
        data: { career }
      });
    } catch (error) {
      console.error('Error fetching career:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch career'
      });
    }
  }

  /**
   * Create new career
   * POST /api/admin/careers
   */
  static async createCareer(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { name, status } = req.body;

      // Check if name already exists
      const existing = await Career.findByName(name);
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Career with this name already exists'
        });
      }

      const career = await Career.create({ 
        name, 
        status: status !== undefined ? status : true 
      });

      res.status(201).json({
        success: true,
        message: 'Career created successfully',
        data: { career }
      });
    } catch (error) {
      console.error('Error creating career:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create career'
      });
    }
  }

  /**
   * Update career
   * PUT /api/admin/careers/:id
   */
  static async updateCareer(req, res) {
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
      const existingCareer = await Career.findById(parseInt(id));

      if (!existingCareer) {
        return res.status(404).json({
          success: false,
          message: 'Career not found'
        });
      }

      const { name, status } = req.body;

      // Check if name is being changed and if it already exists
      if (name && name !== existingCareer.name) {
        const nameExists = await Career.findByName(name);
        if (nameExists) {
          return res.status(400).json({
            success: false,
            message: 'Career with this name already exists'
          });
        }
      }

      const career = await Career.update(parseInt(id), { name, status });

      res.json({
        success: true,
        message: 'Career updated successfully',
        data: { career }
      });
    } catch (error) {
      console.error('Error updating career:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update career'
      });
    }
  }

  /**
   * Delete career
   * DELETE /api/admin/careers/:id
   */
  static async deleteCareer(req, res) {
    try {
      const { id } = req.params;
      const career = await Career.findById(parseInt(id));

      if (!career) {
        return res.status(404).json({
          success: false,
          message: 'Career not found'
        });
      }

      await Career.delete(parseInt(id));

      res.json({
        success: true,
        message: 'Career deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting career:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete career'
      });
    }
  }
}

module.exports = CareerController;


