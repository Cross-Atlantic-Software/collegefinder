const express = require('express');
const router = express.Router();
const Program = require('../../models/taxonomy/Program');

/**
 * @route   GET /api/programs
 * @desc    Get all active programs (public endpoint)
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const programs = await Program.findActive();
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
});

module.exports = router;

