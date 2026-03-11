const express = require('express');
const router = express.Router();
const ExamCity = require('../../models/taxonomy/ExamCity');

/**
 * @route   GET /api/exam-cities
 * @desc    Get all active exam cities (public endpoint)
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const examCities = await ExamCity.findActive();
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
});

module.exports = router;

