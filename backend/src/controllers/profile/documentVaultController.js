const DocumentVault = require('../../models/user/DocumentVault');
const { uploadToS3, deleteFromS3 } = require('../../../utils/storage/s3Upload');
const { validationResult } = require('express-validator');

class DocumentVaultController {
  /**
   * Get document vault
   * GET /api/auth/profile/document-vault
   */
  static async getDocumentVault(req, res) {
    try {
      const userId = req.user.id;
      const documentVault = await DocumentVault.findByUserId(userId);

      if (!documentVault) {
        return res.json({
          success: true,
          data: null
        });
      }

      res.json({
        success: true,
        data: documentVault
      });
    } catch (error) {
      console.error('Error fetching document vault:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch document vault'
      });
    }
  }

  /**
   * Upload a document
   * POST /api/auth/profile/document-vault/upload
   */
  static async uploadDocument(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const { fieldName } = req.body;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const allowedFields = [
        'passport_size_photograph',
        'signature_image',
        'matric_marksheet',
        'matric_certificate',
        'postmatric_marksheet',
        'valid_photo_id_proof',
        'sc_certificate',
        'st_certificate',
        'obc_ncl_certificate',
        'ews_certificate',
        'pwbd_disability_certificate',
        'udid_card',
        'domicile_certificate',
        'citizenship_certificate',
        'migration_certificate'
      ];

      if (!allowedFields.includes(fieldName)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid field name'
        });
      }

      // Additional security validations
      const file = req.file;
      if (!file || !file.buffer) {
        return res.status(400).json({
          success: false,
          message: 'Invalid file data received'
        });
      }
      
      // Extract file properties
      const fileBuffer = file.buffer;
      const fileName = file.originalname || 'document';
      const fileSize = file.size || 0;
      const mimeType = file.mimetype || '';
      
      // Debug log (can be removed later)
      console.log('File upload validation:', {
        hasBuffer: !!fileBuffer,
        fileName,
        fileSize,
        mimeType
      });

      // 1. Validate file size (defense in depth - multer already checks, but double-check)
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      if (fileSize > MAX_FILE_SIZE) {
        return res.status(400).json({
          success: false,
          message: 'File size exceeds the maximum limit of 10MB'
        });
      }

      // 2. Validate file extension
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
      const lastDotIndex = fileName.lastIndexOf('.');
      if (lastDotIndex === -1) {
        return res.status(400).json({
          success: false,
          message: 'File must have a valid extension (.jpg, .jpeg, .png, .webp, or .pdf)'
        });
      }
      const fileExtension = fileName.toLowerCase().substring(lastDotIndex);
      if (!allowedExtensions.includes(fileExtension)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid file type. Only JPEG, PNG, WebP images and PDF files are allowed'
        });
      }

      // 3. Validate MIME type matches extension
      const validMimeTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'application/pdf'
      ];
      if (!validMimeTypes.includes(mimeType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid file MIME type. Only images (JPEG, PNG, WebP) and PDF files are allowed'
        });
      }

      // 4. Validate file signature (magic bytes) for security
      const isValidFileSignature = (buffer, extension) => {
        if (buffer.length < 4) return false;

        // PDF signature: %PDF
        if (extension === '.pdf') {
          const pdfSignature = buffer.slice(0, 4).toString('ascii');
          return pdfSignature === '%PDF';
        }

        // JPEG signature: FF D8 FF
        if (extension === '.jpg' || extension === '.jpeg') {
          return buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
        }

        // PNG signature: 89 50 4E 47
        if (extension === '.png') {
          return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
        }

        // WebP signature: RIFF...WEBP
        if (extension === '.webp') {
          if (buffer.length < 12) return false;
          const riff = buffer.slice(0, 4).toString('ascii');
          const webp = buffer.slice(8, 12).toString('ascii');
          return riff === 'RIFF' && webp === 'WEBP';
        }

        return false;
      };

      if (!isValidFileSignature(fileBuffer, fileExtension)) {
        return res.status(400).json({
          success: false,
          message: 'File signature validation failed. The file may be corrupted or not match its extension'
        });
      }

      // 5. Sanitize filename (additional security)
      const sanitizedFileName = fileName
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .replace(/\.\./g, '_') // Prevent directory traversal
        .substring(0, 255); // Limit filename length

      // Get existing document vault
      const existing = await DocumentVault.findByUserId(userId);

      // Delete old file from S3 if exists
      if (existing && existing[fieldName]) {
        try {
          await deleteFromS3(existing[fieldName]);
        } catch (deleteError) {
          console.error(`Error deleting old ${fieldName}:`, deleteError);
          // Continue even if deletion fails
        }
      }

      // Upload new file to S3 (using sanitized filename)
      const s3Url = await uploadToS3(fileBuffer, sanitizedFileName, 'document-vault');

      // Update document vault
      const updateData = { [fieldName]: s3Url };
      const documentVault = await DocumentVault.upsert(userId, updateData);

      res.json({
        success: true,
        message: 'Document uploaded successfully',
        data: {
          fieldName,
          url: s3Url,
          documentVault
        }
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload document'
      });
    }
  }

  /**
   * Delete a document
   * DELETE /api/auth/profile/document-vault/:fieldName
   */
  static async deleteDocument(req, res) {
    try {
      const userId = req.user.id;
      const { fieldName } = req.params;

      const allowedFields = [
        'passport_size_photograph',
        'signature_image',
        'matric_marksheet',
        'matric_certificate',
        'postmatric_marksheet',
        'valid_photo_id_proof',
        'sc_certificate',
        'st_certificate',
        'obc_ncl_certificate',
        'ews_certificate',
        'pwbd_disability_certificate',
        'udid_card',
        'domicile_certificate',
        'citizenship_certificate',
        'migration_certificate'
      ];

      if (!allowedFields.includes(fieldName)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid field name'
        });
      }

      // Get existing document vault
      const existing = await DocumentVault.findByUserId(userId);

      if (!existing || !existing[fieldName]) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      // Delete file from S3
      try {
        await deleteFromS3(existing[fieldName]);
      } catch (deleteError) {
        console.error(`Error deleting ${fieldName} from S3:`, deleteError);
        // Continue even if deletion fails
      }

      // Delete from database
      await DocumentVault.deleteDocument(userId, fieldName);

      res.json({
        success: true,
        message: 'Document deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete document'
      });
    }
  }
}

module.exports = DocumentVaultController;

