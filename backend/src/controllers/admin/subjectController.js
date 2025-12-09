const Subject = require('../../models/taxonomy/Subject');
const { validationResult } = require('express-validator');

class SubjectController {
  /**
   * Get all subjects
   * GET /api/admin/subjects
   */
  static async getAllSubjects(req, res) {
    try {
      const subjects = await Subject.findAll();
      res.json({
        success: true,
        data: { subjects }
      });
    } catch (error) {
      console.error('Error fetching subjects:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch subjects'
      });
    }
  }

  /**
   * Get subject by ID
   * GET /api/admin/subjects/:id
   */
  static async getSubjectById(req, res) {
    try {
      const { id } = req.params;
      const subject = await Subject.findById(parseInt(id));

      if (!subject) {
        return res.status(404).json({
          success: false,
          message: 'Subject not found'
        });
      }

      res.json({
        success: true,
        data: { subject }
      });
    } catch (error) {
      console.error('Error fetching subject:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch subject'
      });
    }
  }

  /**
   * Create new subject
   * POST /api/admin/subjects
   */
  static async createSubject(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { name, streams, status } = req.body;

      // Check if name already exists
      const existing = await Subject.findByName(name);
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Subject with this name already exists'
        });
      }

      // Parse streams array if provided
      let streamsArray = [];
      if (streams !== undefined) {
        try {
          streamsArray = typeof streams === 'string' ? JSON.parse(streams) : streams;
          if (!Array.isArray(streamsArray)) streamsArray = [];
          // Ensure all are numbers
          streamsArray = streamsArray.map(s => Number(s)).filter(n => !isNaN(n));
        } catch (e) {
          streamsArray = [];
        }
      }

      const subject = await Subject.create({ 
        name,
        streams: streamsArray,
        status: status !== undefined ? status : true 
      });

      res.status(201).json({
        success: true,
        message: 'Subject created successfully',
        data: { subject }
      });
    } catch (error) {
      console.error('Error creating subject:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create subject'
      });
    }
  }

  /**
   * Update subject
   * PUT /api/admin/subjects/:id
   */
  static async updateSubject(req, res) {
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
      const existingSubject = await Subject.findById(parseInt(id));

      if (!existingSubject) {
        return res.status(404).json({
          success: false,
          message: 'Subject not found'
        });
      }

      const { name, streams, status } = req.body;

      // Check if name is being changed and if it already exists
      if (name && name !== existingSubject.name) {
        const nameExists = await Subject.findByName(name);
        if (nameExists) {
          return res.status(400).json({
            success: false,
            message: 'Subject with this name already exists'
          });
        }
      }

      // Parse streams array if provided
      let streamsArray = undefined;
      if (streams !== undefined) {
        try {
          streamsArray = typeof streams === 'string' ? JSON.parse(streams) : streams;
          if (!Array.isArray(streamsArray)) streamsArray = [];
          // Ensure all are numbers
          streamsArray = streamsArray.map(s => Number(s)).filter(n => !isNaN(n));
        } catch (e) {
          streamsArray = [];
        }
      }

      const subject = await Subject.update(parseInt(id), { name, streams: streamsArray, status });

      res.json({
        success: true,
        message: 'Subject updated successfully',
        data: { subject }
      });
    } catch (error) {
      console.error('Error updating subject:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update subject'
      });
    }
  }

  /**
   * Delete subject
   * DELETE /api/admin/subjects/:id
   */
  static async deleteSubject(req, res) {
    try {
      const { id } = req.params;
      const subject = await Subject.findById(parseInt(id));

      if (!subject) {
        return res.status(404).json({
          success: false,
          message: 'Subject not found'
        });
      }

      await Subject.delete(parseInt(id));

      res.json({
        success: true,
        message: 'Subject deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting subject:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete subject'
      });
    }
  }
}

module.exports = SubjectController;


