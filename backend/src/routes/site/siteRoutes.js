const express = require('express');
const router = express.Router();
const LandingPageController = require('../../controllers/site/landingPageController');
const LegalPageSiteController = require('../../controllers/site/legalPageSiteController');
const BlogSiteController = require('../../controllers/site/blogSiteController');
const SiteRegistrationController = require('../../controllers/site/siteRegistrationController');
const TestimonialSiteController = require('../../controllers/site/testimonialSiteController');
const QuerySiteController = require('../../controllers/site/querySiteController');
const { authenticate } = require('../../middleware/auth');

/**
 * Public site content (no auth)
 */
router.get('/landing-page', LandingPageController.getPublic);
router.get('/legal-document', LegalPageSiteController.getPublic);
router.get('/testimonials', TestimonialSiteController.listPublic);
router.get('/blogs', BlogSiteController.listPublic);
router.get('/blogs/:slug', BlogSiteController.getBySlugPublic);
router.post('/check-email', SiteRegistrationController.checkEmail);
router.post('/queries', authenticate, QuerySiteController.create);

module.exports = router;
