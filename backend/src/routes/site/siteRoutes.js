const express = require('express');
const router = express.Router();
const LandingPageController = require('../../controllers/site/landingPageController');

/**
 * Public site content (no auth)
 */
router.get('/landing-page', LandingPageController.getPublic);

module.exports = router;
