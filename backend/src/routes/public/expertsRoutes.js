const express = require('express');
const router = express.Router();
const ExpertController = require('../../controllers/admin/expertController');

router.get('/', ExpertController.getPublic);

module.exports = router;
