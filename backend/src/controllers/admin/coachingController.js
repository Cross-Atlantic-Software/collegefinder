const Coaching = require('../../models/coaching/Coaching');
const CoachingLocation = require('../../models/coaching/CoachingLocation');
const CoachingGallery = require('../../models/coaching/CoachingGallery');
const CoachingCourse = require('../../models/coaching/CoachingCourse');
const { validationResult } = require('express-validator');
const { uploadToS3, deleteFromS3 } = require('../../../utils/storage/s3Upload');
const multer = require('multer');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for images
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Coaching Controller
class CoachingController {
  /**
   * Get all coachings
   * GET /api/admin/coachings
   */
  static async getAllCoachings(req, res) {
    try {
      const coachings = await Coaching.findAll();
      res.json({
        success: true,
        data: { coachings }
      });
    } catch (error) {
      console.error('Error fetching coachings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch coachings'
      });
    }
  }

  /**
   * Get coaching by ID
   * GET /api/admin/coachings/:id
   */
  static async getCoachingById(req, res) {
    try {
      const { id } = req.params;
      const coaching = await Coaching.findById(parseInt(id));

      if (!coaching) {
        return res.status(404).json({
          success: false,
          message: 'Coaching not found'
        });
      }

      res.json({
        success: true,
        data: { coaching }
      });
    } catch (error) {
      console.error('Error fetching coaching:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch coaching'
      });
    }
  }

  /**
   * Create new coaching
   * POST /api/admin/coachings
   */
  static async createCoaching(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { name, description } = req.body;

      // Check if coaching with same name exists
      const existing = await Coaching.findByName(name);
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Coaching with this name already exists'
        });
      }

      // Handle logo upload if provided
      let logo = null;
      if (req.files && req.files.logo) {
        const fileBuffer = req.files.logo[0].buffer;
        const fileName = req.files.logo[0].originalname;
        logo = await uploadToS3(fileBuffer, fileName, 'coaching_logos');
      }

      const coaching = await Coaching.create({
        name,
        logo,
        description: description || null
      });

      res.status(201).json({
        success: true,
        message: 'Coaching created successfully',
        data: { coaching }
      });
    } catch (error) {
      console.error('Error creating coaching:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create coaching'
      });
    }
  }

  /**
   * Update coaching
   * PUT /api/admin/coachings/:id
   */
  static async updateCoaching(req, res) {
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
      const existingCoaching = await Coaching.findById(parseInt(id));

      if (!existingCoaching) {
        return res.status(404).json({
          success: false,
          message: 'Coaching not found'
        });
      }

      const { name, description } = req.body;

      // Check if name is being changed and if it already exists
      if (name && name !== existingCoaching.name) {
        const nameExists = await Coaching.findByName(name);
        if (nameExists && nameExists.id !== parseInt(id)) {
          return res.status(400).json({
            success: false,
            message: 'Coaching with this name already exists'
          });
        }
      }

      // Handle logo upload if provided
      let logo = undefined;
      if (req.files && req.files.logo) {
        // Delete old logo if exists
        if (existingCoaching.logo) {
          await deleteFromS3(existingCoaching.logo);
        }
        const fileBuffer = req.files.logo[0].buffer;
        const fileName = req.files.logo[0].originalname;
        logo = await uploadToS3(fileBuffer, fileName, 'coaching_logos');
      }

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (logo !== undefined) updateData.logo = logo;
      if (description !== undefined) updateData.description = description;

      const coaching = await Coaching.update(parseInt(id), updateData);

      res.json({
        success: true,
        message: 'Coaching updated successfully',
        data: { coaching }
      });
    } catch (error) {
      console.error('Error updating coaching:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update coaching'
      });
    }
  }

  /**
   * Delete coaching
   * DELETE /api/admin/coachings/:id
   */
  static async deleteCoaching(req, res) {
    try {
      const { id } = req.params;
      const coaching = await Coaching.findById(parseInt(id));

      if (!coaching) {
        return res.status(404).json({
          success: false,
          message: 'Coaching not found'
        });
      }

      // Delete logo from S3 if exists
      if (coaching.logo) {
        await deleteFromS3(coaching.logo);
      }

      await Coaching.delete(parseInt(id));

      res.json({
        success: true,
        message: 'Coaching deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting coaching:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete coaching'
      });
    }
  }
}

// Coaching Location Controller
class CoachingLocationController {
  /**
   * Get all coaching locations
   * GET /api/admin/coaching-locations
   */
  static async getAllCoachingLocations(req, res) {
    try {
      const locations = await CoachingLocation.findAll();
      res.json({
        success: true,
        data: { locations }
      });
    } catch (error) {
      console.error('Error fetching coaching locations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch coaching locations'
      });
    }
  }

  /**
   * Get locations by coaching ID
   * GET /api/admin/coaching-locations/coaching/:coachingId
   */
  static async getLocationsByCoachingId(req, res) {
    try {
      const { coachingId } = req.params;
      const locations = await CoachingLocation.findByCoachingId(parseInt(coachingId));
      res.json({
        success: true,
        data: { locations }
      });
    } catch (error) {
      console.error('Error fetching locations by coaching:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch coaching locations'
      });
    }
  }

  /**
   * Get location by ID
   * GET /api/admin/coaching-locations/:id
   */
  static async getCoachingLocationById(req, res) {
    try {
      const { id } = req.params;
      const location = await CoachingLocation.findById(parseInt(id));

      if (!location) {
        return res.status(404).json({
          success: false,
          message: 'Coaching location not found'
        });
      }

      res.json({
        success: true,
        data: { location }
      });
    } catch (error) {
      console.error('Error fetching coaching location:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch coaching location'
      });
    }
  }

  /**
   * Create new coaching location
   * POST /api/admin/coaching-locations
   */
  static async createCoachingLocation(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { coaching_id, branch_title, address, state, city, google_map_url } = req.body;

      const location = await CoachingLocation.create({
        coaching_id: parseInt(coaching_id),
        branch_title,
        address,
        state,
        city,
        google_map_url: google_map_url || null
      });

      res.status(201).json({
        success: true,
        message: 'Coaching location created successfully',
        data: { location }
      });
    } catch (error) {
      console.error('Error creating coaching location:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create coaching location'
      });
    }
  }

  /**
   * Update coaching location
   * PUT /api/admin/coaching-locations/:id
   */
  static async updateCoachingLocation(req, res) {
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
      const existingLocation = await CoachingLocation.findById(parseInt(id));

      if (!existingLocation) {
        return res.status(404).json({
          success: false,
          message: 'Coaching location not found'
        });
      }

      const { coaching_id, branch_title, address, state, city, google_map_url } = req.body;

      const updateData = {};
      if (coaching_id !== undefined) updateData.coaching_id = parseInt(coaching_id);
      if (branch_title !== undefined) updateData.branch_title = branch_title;
      if (address !== undefined) updateData.address = address;
      if (state !== undefined) updateData.state = state;
      if (city !== undefined) updateData.city = city;
      if (google_map_url !== undefined) updateData.google_map_url = google_map_url;

      const location = await CoachingLocation.update(parseInt(id), updateData);

      res.json({
        success: true,
        message: 'Coaching location updated successfully',
        data: { location }
      });
    } catch (error) {
      console.error('Error updating coaching location:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update coaching location'
      });
    }
  }

  /**
   * Delete coaching location
   * DELETE /api/admin/coaching-locations/:id
   */
  static async deleteCoachingLocation(req, res) {
    try {
      const { id } = req.params;
      const location = await CoachingLocation.findById(parseInt(id));

      if (!location) {
        return res.status(404).json({
          success: false,
          message: 'Coaching location not found'
        });
      }

      await CoachingLocation.delete(parseInt(id));

      res.json({
        success: true,
        message: 'Coaching location deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting coaching location:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete coaching location'
      });
    }
  }
}

// Coaching Gallery Controller
class CoachingGalleryController {
  /**
   * Get all coaching gallery images
   * GET /api/admin/coaching-gallery
   */
  static async getAllCoachingGallery(req, res) {
    try {
      const gallery = await CoachingGallery.findAll();
      res.json({
        success: true,
        data: { gallery }
      });
    } catch (error) {
      console.error('Error fetching coaching gallery:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch coaching gallery'
      });
    }
  }

  /**
   * Get gallery images by coaching ID
   * GET /api/admin/coaching-gallery/coaching/:coachingId
   */
  static async getGalleryByCoachingId(req, res) {
    try {
      const { coachingId } = req.params;
      const gallery = await CoachingGallery.findByCoachingId(parseInt(coachingId));
      res.json({
        success: true,
        data: { gallery }
      });
    } catch (error) {
      console.error('Error fetching gallery by coaching:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch coaching gallery'
      });
    }
  }

  /**
   * Get gallery image by ID
   * GET /api/admin/coaching-gallery/:id
   */
  static async getCoachingGalleryById(req, res) {
    try {
      const { id } = req.params;
      const galleryItem = await CoachingGallery.findById(parseInt(id));

      if (!galleryItem) {
        return res.status(404).json({
          success: false,
          message: 'Gallery image not found'
        });
      }

      res.json({
        success: true,
        data: { galleryItem }
      });
    } catch (error) {
      console.error('Error fetching gallery image:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch gallery image'
      });
    }
  }

  /**
   * Create new gallery image
   * POST /api/admin/coaching-gallery
   */
  static async createCoachingGallery(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { coaching_id, caption, sort_order } = req.body;

      // Handle image upload
      let image_url = null;
      if (req.files && req.files.image) {
        const fileBuffer = req.files.image[0].buffer;
        const fileName = req.files.image[0].originalname;
        image_url = await uploadToS3(fileBuffer, fileName, 'coaching_gallery');
      } else {
        return res.status(400).json({
          success: false,
          message: 'Image file is required'
        });
      }

      const galleryItem = await CoachingGallery.create({
        coaching_id: parseInt(coaching_id),
        image_url,
        caption: caption || null,
        sort_order: sort_order ? parseInt(sort_order) : 0
      });

      res.status(201).json({
        success: true,
        message: 'Gallery image added successfully',
        data: { galleryItem }
      });
    } catch (error) {
      console.error('Error creating gallery image:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create gallery image'
      });
    }
  }

  /**
   * Update gallery image
   * PUT /api/admin/coaching-gallery/:id
   */
  static async updateCoachingGallery(req, res) {
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
      const existingGalleryItem = await CoachingGallery.findById(parseInt(id));

      if (!existingGalleryItem) {
        return res.status(404).json({
          success: false,
          message: 'Gallery image not found'
        });
      }

      const { coaching_id, caption, sort_order } = req.body;

      // Handle image upload if provided
      let image_url = undefined;
      if (req.files && req.files.image) {
        // Delete old image if exists
        if (existingGalleryItem.image_url) {
          await deleteFromS3(existingGalleryItem.image_url);
        }
        const fileBuffer = req.files.image[0].buffer;
        const fileName = req.files.image[0].originalname;
        image_url = await uploadToS3(fileBuffer, fileName, 'coaching_gallery');
      }

      const updateData = {};
      if (coaching_id !== undefined) updateData.coaching_id = parseInt(coaching_id);
      if (image_url !== undefined) updateData.image_url = image_url;
      if (caption !== undefined) updateData.caption = caption;
      if (sort_order !== undefined) updateData.sort_order = parseInt(sort_order);

      const galleryItem = await CoachingGallery.update(parseInt(id), updateData);

      res.json({
        success: true,
        message: 'Gallery image updated successfully',
        data: { galleryItem }
      });
    } catch (error) {
      console.error('Error updating gallery image:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update gallery image'
      });
    }
  }

  /**
   * Delete gallery image
   * DELETE /api/admin/coaching-gallery/:id
   */
  static async deleteCoachingGallery(req, res) {
    try {
      const { id } = req.params;
      const galleryItem = await CoachingGallery.findById(parseInt(id));

      if (!galleryItem) {
        return res.status(404).json({
          success: false,
          message: 'Gallery image not found'
        });
      }

      // Delete image from S3 if exists
      if (galleryItem.image_url) {
        await deleteFromS3(galleryItem.image_url);
      }

      await CoachingGallery.delete(parseInt(id));

      res.json({
        success: true,
        message: 'Gallery image deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting gallery image:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete gallery image'
      });
    }
  }
}

// Coaching Course Controller
class CoachingCourseController {
  /**
   * Get all coaching courses
   * GET /api/admin/coaching-courses
   */
  static async getAllCoachingCourses(req, res) {
    try {
      const courses = await CoachingCourse.findAll();
      res.json({
        success: true,
        data: { courses }
      });
    } catch (error) {
      console.error('Error fetching coaching courses:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch coaching courses'
      });
    }
  }

  /**
   * Get courses by coaching ID
   * GET /api/admin/coaching-courses/coaching/:coachingId
   */
  static async getCoursesByCoachingId(req, res) {
    try {
      const { coachingId } = req.params;
      const courses = await CoachingCourse.findByCoachingId(parseInt(coachingId));
      res.json({
        success: true,
        data: { courses }
      });
    } catch (error) {
      console.error('Error fetching courses by coaching:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch coaching courses'
      });
    }
  }

  /**
   * Get course by ID
   * GET /api/admin/coaching-courses/:id
   */
  static async getCoachingCourseById(req, res) {
    try {
      const { id } = req.params;
      const course = await CoachingCourse.findById(parseInt(id));

      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Coaching course not found'
        });
      }

      res.json({
        success: true,
        data: { course }
      });
    } catch (error) {
      console.error('Error fetching coaching course:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch coaching course'
      });
    }
  }

  /**
   * Create new coaching course
   * POST /api/admin/coaching-courses
   */
  static async createCoachingCourse(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { coaching_id, exam_ids, title, summary, duration, mode, fee, contact_email, contact, rating, features } = req.body;

      // Parse exam_ids if it's a JSON string
      let parsedExamIds = [];
      try {
        if (typeof exam_ids === 'string') {
          parsedExamIds = JSON.parse(exam_ids);
        } else if (Array.isArray(exam_ids)) {
          parsedExamIds = exam_ids;
        }
        parsedExamIds = parsedExamIds.map(id => parseInt(id)).filter(id => !isNaN(id));
      } catch (e) {
        console.error('Error parsing exam_ids:', e);
      }

      // Parse features if it's a JSON string
      let parsedFeatures = [];
      try {
        if (typeof features === 'string') {
          parsedFeatures = JSON.parse(features);
        } else if (Array.isArray(features)) {
          parsedFeatures = features;
        }
      } catch (e) {
        console.error('Error parsing features:', e);
      }

      const course = await CoachingCourse.create({
        coaching_id: parseInt(coaching_id),
        exam_ids: parsedExamIds.length > 0 ? parsedExamIds : null,
        title,
        summary: summary || null,
        duration: duration || null,
        mode: mode || 'Online',
        fee: fee ? parseFloat(fee) : null,
        contact_email: contact_email || null,
        contact: contact || null,
        rating: rating ? parseFloat(rating) : null,
        features: parsedFeatures.length > 0 ? parsedFeatures : null
      });

      res.status(201).json({
        success: true,
        message: 'Coaching course created successfully',
        data: { course }
      });
    } catch (error) {
      console.error('Error creating coaching course:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create coaching course'
      });
    }
  }

  /**
   * Update coaching course
   * PUT /api/admin/coaching-courses/:id
   */
  static async updateCoachingCourse(req, res) {
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
      const existingCourse = await CoachingCourse.findById(parseInt(id));

      if (!existingCourse) {
        return res.status(404).json({
          success: false,
          message: 'Coaching course not found'
        });
      }

      const { coaching_id, exam_ids, title, summary, duration, mode, fee, contact_email, contact, rating, features } = req.body;

      // Parse exam_ids if it's a JSON string
      let parsedExamIds = undefined;
      if (exam_ids !== undefined) {
        try {
          if (typeof exam_ids === 'string') {
            parsedExamIds = JSON.parse(exam_ids);
          } else if (Array.isArray(exam_ids)) {
            parsedExamIds = exam_ids;
          }
          parsedExamIds = parsedExamIds.map(id => parseInt(id)).filter(id => !isNaN(id));
        } catch (e) {
          console.error('Error parsing exam_ids:', e);
        }
      }

      // Parse features if it's a JSON string
      let parsedFeatures = undefined;
      if (features !== undefined) {
        try {
          if (typeof features === 'string') {
            parsedFeatures = JSON.parse(features);
          } else if (Array.isArray(features)) {
            parsedFeatures = features;
          }
        } catch (e) {
          console.error('Error parsing features:', e);
        }
      }

      const updateData = {};
      if (coaching_id !== undefined) updateData.coaching_id = parseInt(coaching_id);
      if (parsedExamIds !== undefined) updateData.exam_ids = parsedExamIds;
      if (title !== undefined) updateData.title = title;
      if (summary !== undefined) updateData.summary = summary;
      if (duration !== undefined) updateData.duration = duration;
      if (mode !== undefined) updateData.mode = mode;
      if (fee !== undefined) updateData.fee = fee ? parseFloat(fee) : null;
      if (contact_email !== undefined) updateData.contact_email = contact_email;
      if (contact !== undefined) updateData.contact = contact;
      if (rating !== undefined) updateData.rating = rating ? parseFloat(rating) : null;
      if (parsedFeatures !== undefined) updateData.features = parsedFeatures;

      const course = await CoachingCourse.update(parseInt(id), updateData);

      res.json({
        success: true,
        message: 'Coaching course updated successfully',
        data: { course }
      });
    } catch (error) {
      console.error('Error updating coaching course:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update coaching course'
      });
    }
  }

  /**
   * Delete coaching course
   * DELETE /api/admin/coaching-courses/:id
   */
  static async deleteCoachingCourse(req, res) {
    try {
      const { id } = req.params;
      const course = await CoachingCourse.findById(parseInt(id));

      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Coaching course not found'
        });
      }

      await CoachingCourse.delete(parseInt(id));

      res.json({
        success: true,
        message: 'Coaching course deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting coaching course:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete coaching course'
      });
    }
  }

  /**
   * Upload image for coaching courses
   * POST /api/admin/coaching-courses/upload-image
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
      const s3Url = await uploadToS3(fileBuffer, fileName, 'coaching_course_images');

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

module.exports = {
  CoachingController,
  CoachingLocationController,
  CoachingGalleryController,
  CoachingCourseController,
  upload
};
