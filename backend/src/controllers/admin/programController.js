const Program = require('../../models/taxonomy/Program');
const { validationResult } = require('express-validator');

class ProgramController {
  /**
   * Get all programs
   * GET /api/admin/programs
   */
  static async getAllPrograms(req, res) {
    try {
      const programs = await Program.findAll();
      res.json({
        success: true,
        data: { programs }
      });
    } catch (error) {
      console.error('Error fetching programs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch programs'
      });
    }
  }

  /**
   * Get program by ID
   * GET /api/admin/programs/:id
   */
  static async getProgramById(req, res) {
    try {
      const { id } = req.params;
      const program = await Program.findById(parseInt(id));

      if (!program) {
        return res.status(404).json({
          success: false,
          message: 'Program not found'
        });
      }

      res.json({
        success: true,
        data: { program }
      });
    } catch (error) {
      console.error('Error fetching program:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch program'
      });
    }
  }

  /**
   * Create new program
   * POST /api/admin/programs
   */
  static async createProgram(req, res) {
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
      const existing = await Program.findByName(name);
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Program with this name already exists'
        });
      }

      const program = await Program.create({ 
        name, 
        status: status !== undefined ? status : true 
      });

      res.status(201).json({
        success: true,
        message: 'Program created successfully',
        data: { program }
      });
    } catch (error) {
      console.error('Error creating program:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create program'
      });
    }
  }

  /**
   * Update program
   * PUT /api/admin/programs/:id
   */
  static async updateProgram(req, res) {
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

      const existing = await Program.findById(parseInt(id));
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Program not found'
        });
      }

      // Check if name already exists (excluding current program)
      if (name && name !== existing.name) {
        const nameExists = await Program.findByName(name);
        if (nameExists) {
          return res.status(400).json({
            success: false,
            message: 'Program with this name already exists'
          });
        }
      }

      const program = await Program.update(parseInt(id), { name, status });

      res.json({
        success: true,
        message: 'Program updated successfully',
        data: { program }
      });
    } catch (error) {
      console.error('Error updating program:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update program'
      });
    }
  }

  /**
   * Delete program
   * DELETE /api/admin/programs/:id
   */
  static async deleteProgram(req, res) {
    try {
      const { id } = req.params;
      const program = await Program.findById(parseInt(id));

      if (!program) {
        return res.status(404).json({
          success: false,
          message: 'Program not found'
        });
      }

      await Program.delete(parseInt(id));

      res.json({
        success: true,
        message: 'Program deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting program:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete program'
      });
    }
  }
}

module.exports = ProgramController;

