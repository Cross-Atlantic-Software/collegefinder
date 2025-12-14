const CollegeNews = require('../../models/college/CollegeNews');
const { validationResult } = require('express-validator');

class CollegeNewsController {
  /**
   * Get all college news
   * GET /api/admin/college-news
   */
  static async getAllCollegeNews(req, res) {
    try {
      const news = await CollegeNews.findAll();
      res.json({
        success: true,
        data: { news }
      });
    } catch (error) {
      console.error('Error fetching college news:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch college news'
      });
    }
  }

  /**
   * Get news by ID
   * GET /api/admin/college-news/:id
   */
  static async getCollegeNewsById(req, res) {
    try {
      const { id } = req.params;
      const newsItem = await CollegeNews.findById(parseInt(id));

      if (!newsItem) {
        return res.status(404).json({
          success: false,
          message: 'College news not found'
        });
      }

      res.json({
        success: true,
        data: { news: newsItem }
      });
    } catch (error) {
      console.error('Error fetching college news:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch college news'
      });
    }
  }

  /**
   * Create new news article
   * POST /api/admin/college-news
   */
  static async createCollegeNews(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { college_id, title, teaser, url, source_name } = req.body;

      const news = await CollegeNews.create({ 
        college_id: parseInt(college_id),
        title,
        teaser: teaser.substring(0, 30), // Ensure max 30 characters
        url,
        source_name: source_name || null
      });

      res.status(201).json({
        success: true,
        message: 'College news created successfully',
        data: { news }
      });
    } catch (error) {
      console.error('Error creating college news:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create college news'
      });
    }
  }

  /**
   * Update news article
   * PUT /api/admin/college-news/:id
   */
  static async updateCollegeNews(req, res) {
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
      const { college_id, title, teaser, url, source_name } = req.body;

      const existing = await CollegeNews.findById(parseInt(id));
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'College news not found'
        });
      }

      const updateData = {};
      if (college_id !== undefined) updateData.college_id = parseInt(college_id);
      if (title !== undefined) updateData.title = title;
      if (teaser !== undefined) updateData.teaser = teaser.substring(0, 30); // Ensure max 30 characters
      if (url !== undefined) updateData.url = url;
      if (source_name !== undefined) updateData.source_name = source_name || null;

      const news = await CollegeNews.update(parseInt(id), updateData);

      res.json({
        success: true,
        message: 'College news updated successfully',
        data: { news }
      });
    } catch (error) {
      console.error('Error updating college news:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update college news'
      });
    }
  }

  /**
   * Delete news article
   * DELETE /api/admin/college-news/:id
   */
  static async deleteCollegeNews(req, res) {
    try {
      const { id } = req.params;
      const news = await CollegeNews.findById(parseInt(id));

      if (!news) {
        return res.status(404).json({
          success: false,
          message: 'College news not found'
        });
      }

      await CollegeNews.delete(parseInt(id));

      res.json({
        success: true,
        message: 'College news deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting college news:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete college news'
      });
    }
  }
}

module.exports = CollegeNewsController;

