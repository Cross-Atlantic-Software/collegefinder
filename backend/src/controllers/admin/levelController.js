const Level = require('../../models/taxonomy/Level');
const { validationResult } = require('express-validator');

class LevelController {
  /**
   * Get all levels
   * GET /api/admin/levels
   */
  static async getAllLevels(req, res) {
    try {
      const levels = await Level.findAll();
      res.json({
        success: true,
        data: { levels }
      });
    } catch (error) {
      console.error('Error fetching levels:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch levels'
      });
    }
  }

  /**
   * Get level by ID
   * GET /api/admin/levels/:id
   */
  static async getLevelById(req, res) {
    try {
      const { id } = req.params;
      const level = await Level.findById(parseInt(id));

      if (!level) {
        return res.status(404).json({
          success: false,
          message: 'Level not found'
        });
      }

      res.json({
        success: true,
        data: { level }
      });
    } catch (error) {
      console.error('Error fetching level:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch level'
      });
    }
  }

  /**
   * Create new level
   * POST /api/admin/levels
   */
  static async createLevel(req, res) {
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
      const existing = await Level.findByName(name);
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Level with this name already exists'
        });
      }

      const level = await Level.create({ 
        name, 
        status: status !== undefined ? status : true 
      });

      res.status(201).json({
        success: true,
        message: 'Level created successfully',
        data: { level }
      });
    } catch (error) {
      console.error('Error creating level:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create level'
      });
    }
  }

  /**
   * Update level
   * PUT /api/admin/levels/:id
   */
  static async updateLevel(req, res) {
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

      const existing = await Level.findById(parseInt(id));
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Level not found'
        });
      }

      // Check if name already exists (excluding current level)
      if (name && name !== existing.name) {
        const nameExists = await Level.findByName(name);
        if (nameExists) {
          return res.status(400).json({
            success: false,
            message: 'Level with this name already exists'
          });
        }
      }

      const level = await Level.update(parseInt(id), { name, status });

      res.json({
        success: true,
        message: 'Level updated successfully',
        data: { level }
      });
    } catch (error) {
      console.error('Error updating level:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update level'
      });
    }
  }

  /**
   * Delete level
   * DELETE /api/admin/levels/:id
   */
  static async deleteLevel(req, res) {
    try {
      const { id } = req.params;
      const level = await Level.findById(parseInt(id));

      if (!level) {
        return res.status(404).json({
          success: false,
          message: 'Level not found'
        });
      }

      await Level.delete(parseInt(id));

      res.json({
        success: true,
        message: 'Level deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting level:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete level'
      });
    }
  }
}

module.exports = LevelController;

