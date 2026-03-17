const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticateAdmin } = require('../../middleware/adminAuth');
const ExpertController = require('../../controllers/admin/expertController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

const uploadBulk = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }
});

const uploadBulkWithZip = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }
}).fields([
  { name: 'excel', maxCount: 1 },
  { name: 'photos_zip', maxCount: 1 }
]);

const uploadExpertPhotosZip = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
}).fields([{ name: 'photos_zip', maxCount: 1 }]);

router.get('/', authenticateAdmin, ExpertController.getAll);
router.get('/bulk-upload-template', authenticateAdmin, ExpertController.downloadBulkTemplate);
router.get('/download-excel', authenticateAdmin, ExpertController.downloadAllExcel);
router.post('/', authenticateAdmin, upload.single('photo'), ExpertController.create);
router.post('/bulk-upload', authenticateAdmin, uploadBulkWithZip, ExpertController.bulkUpload);
router.post('/upload-expert-photos', authenticateAdmin, uploadExpertPhotosZip, ExpertController.uploadExpertPhotos);
router.put('/:id', authenticateAdmin, upload.single('photo'), ExpertController.update);
router.delete('/:id', authenticateAdmin, ExpertController.delete);

module.exports = router;
