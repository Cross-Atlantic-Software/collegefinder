const ExamCity = require('../../models/taxonomy/ExamCity');
const { validationResult } = require('express-validator');

class ExamCityController {
  /**
   * Get all exam cities
   * GET /api/admin/exam-cities
   */
  static async getAllExamCities(req, res) {
    try {
      const examCities = await ExamCity.findAll();
      res.json({
        success: true,
        data: { examCities }
      });
    } catch (error) {
      console.error('Error fetching exam cities:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch exam cities'
      });
    }
  }

  /**
   * Get exam city by ID
   * GET /api/admin/exam-cities/:id
   */
  static async getExamCityById(req, res) {
    try {
      const { id } = req.params;
      const examCity = await ExamCity.findById(parseInt(id));

      if (!examCity) {
        return res.status(404).json({
          success: false,
          message: 'Exam city not found'
        });
      }

      res.json({
        success: true,
        data: { examCity }
      });
    } catch (error) {
      console.error('Error fetching exam city:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch exam city'
      });
    }
  }

  /**
   * Create new exam city
   * POST /api/admin/exam-cities
   */
  static async createExamCity(req, res) {
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
      const existing = await ExamCity.findByName(name);
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Exam city with this name already exists'
        });
      }

      const examCity = await ExamCity.create({ 
        name, 
        status: status !== undefined ? status : true 
      });

      res.status(201).json({
        success: true,
        message: 'Exam city created successfully',
        data: { examCity }
      });
    } catch (error) {
      console.error('Error creating exam city:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create exam city'
      });
    }
  }

  /**
   * Update exam city
   * PUT /api/admin/exam-cities/:id
   */
  static async updateExamCity(req, res) {
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

      const existing = await ExamCity.findById(parseInt(id));
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Exam city not found'
        });
      }

      // Check if name already exists (excluding current exam city)
      if (name && name !== existing.name) {
        const nameExists = await ExamCity.findByName(name);
        if (nameExists) {
          return res.status(400).json({
            success: false,
            message: 'Exam city with this name already exists'
          });
        }
      }

      const examCity = await ExamCity.update(parseInt(id), { name, status });

      res.json({
        success: true,
        message: 'Exam city updated successfully',
        data: { examCity }
      });
    } catch (error) {
      console.error('Error updating exam city:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update exam city'
      });
    }
  }

  /**
   * Delete exam city
   * DELETE /api/admin/exam-cities/:id
   */
  static async deleteExamCity(req, res) {
    try {
      const { id } = req.params;
      const examCity = await ExamCity.findById(parseInt(id));

      if (!examCity) {
        return res.status(404).json({
          success: false,
          message: 'Exam city not found'
        });
      }

      await ExamCity.delete(parseInt(id));

      res.json({
        success: true,
        message: 'Exam city deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting exam city:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete exam city'
      });
    }
  }
}

module.exports = ExamCityController;


