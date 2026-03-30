const express = require('express');
const router = express.Router();
const SocialController = require('../../controllers/social/socialController');
const { authenticateAdmin } = require('../../middleware/adminAuth');
const { getGoogleApiKey } = require('../../services/geminiService/env');

/** Ensures rejected promises become Express errors (JSON error middleware) instead of hanging / plain 500. */
function asyncRoute(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Public JSON probe (no auth) so the admin UI can tell if Next’s /api rewrite can reach this server.
 * Plain "Internal Server Error" from the browser usually means this route is unreachable (backend down / wrong port).
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      ok: true,
      service: 'social',
      googleKeyConfigured: Boolean(getGoogleApiKey()),
    },
  });
});

router.post(
  '/generate',
  authenticateAdmin,
  asyncRoute((req, res, next) => SocialController.generate(req, res, next))
);

module.exports = router;
