const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticateAdmin, requireCounsellor } = require('../../middleware/adminAuth');
const CounsellorController = require('../../controllers/admin/counsellorController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files are allowed'), false);
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
  { name: 'reports_zip', maxCount: 1 }
]);

const uploadReportPdfsZip = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
}).fields([{ name: 'reports_zip', maxCount: 1 }]);

router.get('/search/:userId', authenticateAdmin, requireCounsellor, CounsellorController.searchStudent);
router.get('/bulk-upload-template', authenticateAdmin, requireCounsellor, CounsellorController.downloadBulkTemplate);
router.get('/download-excel', authenticateAdmin, requireCounsellor, CounsellorController.downloadAllExcel);
router.post('/results', authenticateAdmin, requireCounsellor, upload.single('report'), CounsellorController.submitResults);
router.post('/bulk-upload', authenticateAdmin, requireCounsellor, uploadBulkWithZip, CounsellorController.bulkUpload);
router.post('/upload-report-pdfs', authenticateAdmin, requireCounsellor, uploadReportPdfsZip, CounsellorController.uploadReportPdfs);
router.get('/results/:userId', authenticateAdmin, requireCounsellor, CounsellorController.getResults);
router.put('/results/:userId', authenticateAdmin, requireCounsellor, upload.single('report'), CounsellorController.updateResults);

module.exports = router;
