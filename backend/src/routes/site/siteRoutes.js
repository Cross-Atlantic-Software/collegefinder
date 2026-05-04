const express = require('express');
const router = express.Router();
const LandingPageController = require('../../controllers/site/landingPageController');
const BlogSiteController = require('../../controllers/site/blogSiteController');
const SiteRegistrationController = require('../../controllers/site/siteRegistrationController');
const TestimonialSiteController = require('../../controllers/site/testimonialSiteController');

/**
 * Public site content (no auth)
 */
router.get('/landing-page', LandingPageController.getPublic);
router.get('/testimonials', TestimonialSiteController.listPublic);
router.get('/blogs', BlogSiteController.listPublic);
router.get('/blogs/:slug', BlogSiteController.getBySlugPublic);
router.post('/check-email', SiteRegistrationController.checkEmail);

module.exports = router;
