const express = require('express');
const router = express.Router();
const Career = require('../../models/taxonomy/Career');

/**
 * @route   GET /api/careers
 * @desc    Get all active careers (public endpoint)
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const careers = await Career.findActive();
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
});

module.exports = router;


