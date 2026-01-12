const CollegeCourse = require('../../models/college/CollegeCourse');
const { validationResult } = require('express-validator');
const multer = require('multer');
const { uploadToS3, deleteFromS3 } = require('../../../utils/storage/s3Upload');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

class CollegeCourseController {
  /**
   * Get all college courses
   * GET /api/admin/college-courses
   */
  static async getAllCollegeCourses(req, res) {
    try {
      const courses = await CollegeCourse.findAll();
      res.json({
        success: true,
        data: { courses }
      });
    } catch (error) {
      console.error('Error fetching college courses:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch college courses'
      });
    }
  }

  /**
   * Get course by ID
   * GET /api/admin/college-courses/:id
   */
  static async getCollegeCourseById(req, res) {
    try {
      const { id } = req.params;
      const course = await CollegeCourse.findById(parseInt(id));

      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'College course not found'
        });
      }

      res.json({
        success: true,
        data: { course }
      });
    } catch (error) {
      console.error('Error fetching college course:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch college course'
      });
    }
  }

  /**
   * Create new course
   * POST /api/admin/college-courses
   */
  static async createCollegeCourse(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        college_id,
        stream_id,
        level_id,
        program_id,
        title,
        summary,
        duration,
        curriculum_detail,
        admission_process,
        eligibility,
        placements,
        scholarship,
        fee_per_sem,
        total_fee
      } = req.body;

      let brochure_url = null;

      // Handle brochure file upload if present
      if (req.file) {
        try {
          brochure_url = await uploadToS3(req.file.buffer, req.file.originalname, 'college-courses/brochures');
        } catch (uploadError) {
          console.error('Error uploading brochure:', uploadError);
          return res.status(500).json({
            success: false,
            message: 'Failed to upload brochure'
          });
        }
      } else if (req.body.brochure_url) {
        brochure_url = req.body.brochure_url;
      }

      // Parse subject_ids and exam_ids if they are strings
      let parsedSubjectIds = null;
      let parsedExamIds = null;
      
      if (subject_ids) {
        if (typeof subject_ids === 'string') {
          try {
            parsedSubjectIds = JSON.parse(subject_ids);
          } catch (e) {
            parsedSubjectIds = subject_ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
          }
        } else if (Array.isArray(subject_ids)) {
          parsedSubjectIds = subject_ids.map(id => parseInt(id)).filter(id => !isNaN(id));
        }
      }
      
      if (exam_ids) {
        if (typeof exam_ids === 'string') {
          try {
            parsedExamIds = JSON.parse(exam_ids);
          } catch (e) {
            parsedExamIds = exam_ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
          }
        } else if (Array.isArray(exam_ids)) {
          parsedExamIds = exam_ids.map(id => parseInt(id)).filter(id => !isNaN(id));
        }
      }

      const course = await CollegeCourse.create({
        college_id: parseInt(college_id),
        stream_id: stream_id ? parseInt(stream_id) : null,
        level_id: level_id ? parseInt(level_id) : null,
        program_id: program_id ? parseInt(program_id) : null,
        title,
        summary: summary || null,
        duration: duration || null,
        curriculum_detail: curriculum_detail || null,
        admission_process: admission_process || null,
        eligibility: eligibility || null,
        placements: placements || null,
        scholarship: scholarship || null,
        brochure_url,
        fee_per_sem: fee_per_sem ? parseFloat(fee_per_sem) : null,
        total_fee: total_fee ? parseFloat(total_fee) : null,
        subject_ids: parsedSubjectIds,
        exam_ids: parsedExamIds
      });

      res.status(201).json({
        success: true,
        message: 'College course created successfully',
        data: { course }
      });
    } catch (error) {
      console.error('Error creating college course:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create college course'
      });
    }
  }

  /**
   * Update course
   * PUT /api/admin/college-courses/:id
   */
  static async updateCollegeCourse(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const existing = await CollegeCourse.findById(parseInt(id));
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'College course not found'
        });
      }

      const {
        college_id,
        stream_id,
        level_id,
        program_id,
        title,
        summary,
        duration,
        curriculum_detail,
        admission_process,
        eligibility,
        placements,
        scholarship,
        fee_per_sem,
        total_fee,
        subject_ids,
        exam_ids
      } = req.body;

      let brochure_url = existing.brochure_url;

      // Handle brochure file upload if present
      if (req.file) {
        try {
          // Delete old brochure if exists
          if (existing.brochure_url) {
            await deleteFromS3(existing.brochure_url);
          }

          brochure_url = await uploadToS3(req.file.buffer, req.file.originalname, 'college-courses/brochures');
        } catch (uploadError) {
          console.error('Error uploading brochure:', uploadError);
          return res.status(500).json({
            success: false,
            message: 'Failed to upload brochure'
          });
        }
      } else if (req.body.brochure_url !== undefined) {
        // If brochure_url is explicitly set to null/empty, delete old one
        if (!req.body.brochure_url && existing.brochure_url) {
          await deleteFromS3(existing.brochure_url);
        }
        brochure_url = req.body.brochure_url || null;
      }

      // Parse subject_ids and exam_ids if they are strings
      let parsedSubjectIds = undefined;
      let parsedExamIds = undefined;
      
      if (subject_ids !== undefined) {
        if (typeof subject_ids === 'string') {
          try {
            parsedSubjectIds = JSON.parse(subject_ids);
          } catch (e) {
            parsedSubjectIds = subject_ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
          }
        } else if (Array.isArray(subject_ids)) {
          parsedSubjectIds = subject_ids.map(id => parseInt(id)).filter(id => !isNaN(id));
        } else if (subject_ids === null || subject_ids === '') {
          parsedSubjectIds = null;
        }
      }
      
      if (exam_ids !== undefined) {
        if (typeof exam_ids === 'string') {
          try {
            parsedExamIds = JSON.parse(exam_ids);
          } catch (e) {
            parsedExamIds = exam_ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
          }
        } else if (Array.isArray(exam_ids)) {
          parsedExamIds = exam_ids.map(id => parseInt(id)).filter(id => !isNaN(id));
        } else if (exam_ids === null || exam_ids === '') {
          parsedExamIds = null;
        }
      }

      const updateData = {};
      if (college_id !== undefined) updateData.college_id = parseInt(college_id);
      if (stream_id !== undefined) updateData.stream_id = stream_id ? parseInt(stream_id) : null;
      if (level_id !== undefined) updateData.level_id = level_id ? parseInt(level_id) : null;
      if (program_id !== undefined) updateData.program_id = program_id ? parseInt(program_id) : null;
      if (title !== undefined) updateData.title = title;
      if (summary !== undefined) updateData.summary = summary || null;
      if (duration !== undefined) updateData.duration = duration || null;
      if (curriculum_detail !== undefined) updateData.curriculum_detail = curriculum_detail || null;
      if (admission_process !== undefined) updateData.admission_process = admission_process || null;
      if (eligibility !== undefined) updateData.eligibility = eligibility || null;
      if (placements !== undefined) updateData.placements = placements || null;
      if (scholarship !== undefined) updateData.scholarship = scholarship || null;
      if (brochure_url !== undefined) updateData.brochure_url = brochure_url;
      if (fee_per_sem !== undefined) updateData.fee_per_sem = fee_per_sem ? parseFloat(fee_per_sem) : null;
      if (total_fee !== undefined) updateData.total_fee = total_fee ? parseFloat(total_fee) : null;
      if (parsedSubjectIds !== undefined) updateData.subject_ids = parsedSubjectIds;
      if (parsedExamIds !== undefined) updateData.exam_ids = parsedExamIds;

      const course = await CollegeCourse.update(parseInt(id), updateData);

      res.json({
        success: true,
        message: 'College course updated successfully',
        data: { course }
      });
    } catch (error) {
      console.error('Error updating college course:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update college course'
      });
    }
  }

  /**
   * Delete course
   * DELETE /api/admin/college-courses/:id
   */
  static async deleteCollegeCourse(req, res) {
    try {
      const { id } = req.params;
      const course = await CollegeCourse.findById(parseInt(id));

      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'College course not found'
        });
      }

      // Delete brochure from S3 if exists
      if (course.brochure_url) {
        try {
          await deleteFromS3(course.brochure_url);
        } catch (s3Error) {
          console.error('Error deleting brochure from S3:', s3Error);
          // Continue with deletion even if S3 delete fails
        }
      }

      await CollegeCourse.delete(parseInt(id));

      res.json({
        success: true,
        message: 'College course deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting college course:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete college course'
      });
    }
  }

  /**
   * Upload image for rich text editor
   * POST /api/admin/college-courses/upload-image
   */
  static async uploadImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided'
        });
      }

      const fileBuffer = req.file.buffer;
      const fileName = req.file.originalname;
      const s3Url = await uploadToS3(fileBuffer, fileName, 'college_course_images');

      res.json({
        success: true,
        data: { imageUrl: s3Url }
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload image'
      });
    }
  }
}

module.exports = { CollegeCourseController, upload };

