const express = require('express');
const router = express.Router();
const LandingPageController = require('../../controllers/site/landingPageController');
const BlogSiteController = require('../../controllers/site/blogSiteController');

/**
 * Public site content (no auth)
 */
router.get('/landing-page', LandingPageController.getPublic);
router.get('/blogs', BlogSiteController.listPublic);
router.get('/blogs/:slug', BlogSiteController.getBySlugPublic);

module.exports = router;
