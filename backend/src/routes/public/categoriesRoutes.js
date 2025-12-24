const express = require('express');
const router = express.Router();
const Category = require('../../models/taxonomy/Category');

/**
 * @route   GET /api/categories
 * @desc    Get all categories (public endpoint)
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const categories = await Category.findAll();
    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
});

module.exports = router;

