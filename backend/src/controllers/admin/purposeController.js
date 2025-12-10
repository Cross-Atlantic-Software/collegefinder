const Purpose = require('../../models/taxonomy/Purpose');
const { validationResult } = require('express-validator');

class PurposeController {
  /**
   * Get all purposes
   * GET /api/admin/purposes
   */
  static async getAllPurposes(req, res) {
    try {
      const purposes = await Purpose.findAll();
      res.json({
        success: true,
        data: { purposes }
      });
    } catch (error) {
      console.error('Error fetching purposes:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch purposes'
      });
    }
  }

  /**
   * Get purpose by ID
   * GET /api/admin/purposes/:id
   */
  static async getPurposeById(req, res) {
    try {
      const { id } = req.params;
      const purpose = await Purpose.findById(parseInt(id));

      if (!purpose) {
        return res.status(404).json({
          success: false,
          message: 'Purpose not found'
        });
      }

      res.json({
        success: true,
        data: { purpose }
      });
    } catch (error) {
      console.error('Error fetching purpose:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch purpose'
      });
    }
  }

  /**
   * Create new purpose
   * POST /api/admin/purposes
   */
  static async createPurpose(req, res) {
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
      const existing = await Purpose.findByName(name);
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Purpose with this name already exists'
        });
      }

      const purpose = await Purpose.create({ 
        name, 
        status: status !== undefined ? status : true 
      });

      res.status(201).json({
        success: true,
        message: 'Purpose created successfully',
        data: { purpose }
      });
    } catch (error) {
      console.error('Error creating purpose:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create purpose'
      });
    }
  }

  /**
   * Update purpose
   * PUT /api/admin/purposes/:id
   */
  static async updatePurpose(req, res) {
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
      const { name, status } = req.body;

      const existing = await Purpose.findById(parseInt(id));
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Purpose not found'
        });
      }

      // Check if name already exists (excluding current purpose)
      if (name && name !== existing.name) {
        const nameExists = await Purpose.findByName(name);
        if (nameExists) {
          return res.status(400).json({
            success: false,
            message: 'Purpose with this name already exists'
          });
        }
      }

      const purpose = await Purpose.update(parseInt(id), { name, status });

      res.json({
        success: true,
        message: 'Purpose updated successfully',
        data: { purpose }
      });
    } catch (error) {
      console.error('Error updating purpose:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update purpose'
      });
    }
  }

  /**
   * Delete purpose
   * DELETE /api/admin/purposes/:id
   */
  static async deletePurpose(req, res) {
    try {
      const { id } = req.params;
      const purpose = await Purpose.findById(parseInt(id));

      if (!purpose) {
        return res.status(404).json({
          success: false,
          message: 'Purpose not found'
        });
      }

      await Purpose.delete(parseInt(id));

      res.json({
        success: true,
        message: 'Purpose deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting purpose:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete purpose'
      });
    }
  }
}

module.exports = PurposeController;

