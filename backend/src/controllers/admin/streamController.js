const Stream = require('../../models/taxonomy/Stream');
const { validationResult } = require('express-validator');

class StreamController {
  /**
   * Get all streams
   * GET /api/admin/streams
   */
  static async getAllStreams(req, res) {
    try {
      const streams = await Stream.findAll();
      res.json({
        success: true,
        data: { streams }
      });
    } catch (error) {
      console.error('Error fetching streams:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch streams'
      });
    }
  }

  /**
   * Get stream by ID
   * GET /api/admin/streams/:id
   */
  static async getStreamById(req, res) {
    try {
      const { id } = req.params;
      const stream = await Stream.findById(parseInt(id));

      if (!stream) {
        return res.status(404).json({
          success: false,
          message: 'Stream not found'
        });
      }

      res.json({
        success: true,
        data: { stream }
      });
    } catch (error) {
      console.error('Error fetching stream:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch stream'
      });
    }
  }

  /**
   * Create new stream
   * POST /api/admin/streams
   */
  static async createStream(req, res) {
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
      const existing = await Stream.findByName(name);
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Stream with this name already exists'
        });
      }

      const stream = await Stream.create({ 
        name, 
        status: status !== undefined ? status : true 
      });

      res.status(201).json({
        success: true,
        message: 'Stream created successfully',
        data: { stream }
      });
    } catch (error) {
      console.error('Error creating stream:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create stream'
      });
    }
  }

  /**
   * Update stream
   * PUT /api/admin/streams/:id
   */
  static async updateStream(req, res) {
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
      const existingStream = await Stream.findById(parseInt(id));

      if (!existingStream) {
        return res.status(404).json({
          success: false,
          message: 'Stream not found'
        });
      }

      const { name, status } = req.body;

      // Check if name is being changed and if it already exists
      if (name && name !== existingStream.name) {
        const nameExists = await Stream.findByName(name);
        if (nameExists) {
          return res.status(400).json({
            success: false,
            message: 'Stream with this name already exists'
          });
        }
      }

      const stream = await Stream.update(parseInt(id), { name, status });

      res.json({
        success: true,
        message: 'Stream updated successfully',
        data: { stream }
      });
    } catch (error) {
      console.error('Error updating stream:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update stream'
      });
    }
  }

  /**
   * Delete stream
   * DELETE /api/admin/streams/:id
   */
  static async deleteStream(req, res) {
    try {
      const { id } = req.params;
      const stream = await Stream.findById(parseInt(id));

      if (!stream) {
        return res.status(404).json({
          success: false,
          message: 'Stream not found'
        });
      }

      await Stream.delete(parseInt(id));

      res.json({
        success: true,
        message: 'Stream deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting stream:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete stream'
      });
    }
  }
}

module.exports = StreamController;


