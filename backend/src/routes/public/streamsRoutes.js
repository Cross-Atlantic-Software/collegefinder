const express = require('express');
const router = express.Router();
const Stream = require('../../models/taxonomy/Stream');

/**
 * @route   GET /api/streams
 * @desc    Get all active streams (public endpoint)
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const streams = await Stream.findActive();
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
});

module.exports = router;


