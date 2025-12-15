const CollegeLocation = require('../../models/college/CollegeLocation');
const { validationResult } = require('express-validator');

class CollegeLocationController {
  /**
   * Get all college locations
   * GET /api/admin/college-locations
   */
  static async getAllCollegeLocations(req, res) {
    try {
      const locations = await CollegeLocation.findAll();
      res.json({
        success: true,
        data: { locations }
      });
    } catch (error) {
      console.error('Error fetching college locations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch college locations'
      });
    }
  }

  /**
   * Get location by ID
   * GET /api/admin/college-locations/:id
   */
  static async getCollegeLocationById(req, res) {
    try {
      const { id } = req.params;
      const location = await CollegeLocation.findById(parseInt(id));

      if (!location) {
        return res.status(404).json({
          success: false,
          message: 'College location not found'
        });
      }

      res.json({
        success: true,
        data: { location }
      });
    } catch (error) {
      console.error('Error fetching college location:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch college location'
      });
    }
  }

  /**
   * Create new location
   * POST /api/admin/college-locations
   */
  static async createCollegeLocation(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { college_id, state, city, google_map_url } = req.body;

      const location = await CollegeLocation.create({ 
        college_id: parseInt(college_id),
        state,
        city,
        google_map_url: google_map_url || null
      });

      res.status(201).json({
        success: true,
        message: 'College location created successfully',
        data: { location }
      });
    } catch (error) {
      console.error('Error creating college location:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create college location'
      });
    }
  }

  /**
   * Update location
   * PUT /api/admin/college-locations/:id
   */
  static async updateCollegeLocation(req, res) {
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
      const { college_id, state, city, google_map_url } = req.body;

      const existing = await CollegeLocation.findById(parseInt(id));
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'College location not found'
        });
      }

      const location = await CollegeLocation.update(parseInt(id), { 
        college_id: college_id ? parseInt(college_id) : undefined,
        state,
        city,
        google_map_url
      });

      res.json({
        success: true,
        message: 'College location updated successfully',
        data: { location }
      });
    } catch (error) {
      console.error('Error updating college location:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update college location'
      });
    }
  }

  /**
   * Delete location
   * DELETE /api/admin/college-locations/:id
   */
  static async deleteCollegeLocation(req, res) {
    try {
      const { id } = req.params;
      const location = await CollegeLocation.findById(parseInt(id));

      if (!location) {
        return res.status(404).json({
          success: false,
          message: 'College location not found'
        });
      }

      await CollegeLocation.delete(parseInt(id));

      res.json({
        success: true,
        message: 'College location deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting college location:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete college location'
      });
    }
  }
}

module.exports = CollegeLocationController;

