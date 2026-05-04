const Testimonial = require('../../models/Testimonial');
const { uploadToS3, deleteFromS3 } = require('../../../utils/storage/s3Upload');

function parseRating(value) {
  const n = parseInt(String(value), 10);
  if (Number.isNaN(n) || n < 1 || n > 5) return null;
  return n;
}

class TestimonialAdminController {
  static async uploadImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No image file uploaded' });
      }
      const url = await uploadToS3(req.file.buffer, req.file.originalname, 'testimonials-profiles');
      res.json({
        success: true,
        data: { imageUrl: url },
        message: 'Image uploaded',
      });
    } catch (e) {
      console.error('testimonial uploadImage:', e);
      res.status(500).json({ success: false, message: e.message || 'Upload failed' });
    }
  }

  static async list(req, res) {
    try {
      const items = await Testimonial.findAllForAdmin();
      res.json({ success: true, data: { testimonials: items } });
    } catch (e) {
      console.error('testimonials admin list:', e);
      res.status(500).json({ success: false, message: 'Failed to load testimonials' });
    }
  }

  static async create(req, res) {
    try {
      const { name, body, rating, sort_order, is_active, profile_image_url } = req.body;
      if (!name || !String(name).trim()) {
        return res.status(400).json({ success: false, message: 'Name is required' });
      }
      if (!body || !String(body).trim()) {
        return res.status(400).json({ success: false, message: 'Testimonial text is required' });
      }
      const r = parseRating(rating);
      if (r == null) {
        return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
      }

      let img = profile_image_url != null ? String(profile_image_url).trim() : '';
      if (!img) img = null;

      const row = await Testimonial.create({
        name: String(name).trim(),
        body: String(body).trim(),
        rating: r,
        sort_order:
          sort_order !== undefined && sort_order !== null && sort_order !== ''
            ? parseInt(String(sort_order), 10)
            : undefined,
        is_active,
        profile_image_url: img,
      });

      res.status(201).json({
        success: true,
        data: { testimonial: row },
        message: 'Testimonial created',
      });
    } catch (e) {
      console.error('testimonial create:', e);
      res.status(500).json({ success: false, message: e.message || 'Create failed' });
    }
  }

  static async update(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id) || id < 1) {
        return res.status(400).json({ success: false, message: 'Invalid id' });
      }
      const existing = await Testimonial.findById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Testimonial not found' });
      }

      const { name, body, rating, sort_order, is_active, profile_image_url } = req.body;
      const payload = {};

      if (name !== undefined) {
        if (!String(name).trim()) {
          return res.status(400).json({ success: false, message: 'Name cannot be empty' });
        }
        payload.name = String(name).trim();
      }
      if (body !== undefined) {
        if (!String(body).trim()) {
          return res.status(400).json({ success: false, message: 'Text cannot be empty' });
        }
        payload.body = String(body).trim();
      }
      if (rating !== undefined) {
        const pr = parseRating(rating);
        if (pr == null) {
          return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
        }
        payload.rating = pr;
      }
      if (sort_order !== undefined) {
        const s = parseInt(String(sort_order), 10);
        payload.sort_order = Number.isNaN(s) ? 0 : s;
      }
      if (is_active !== undefined) {
        payload.is_active = Boolean(is_active);
      }

      if (profile_image_url !== undefined) {
        const nextUrl =
          profile_image_url === null || profile_image_url === ''
            ? null
            : String(profile_image_url).trim() || null;
        if (existing.profile_image_url && existing.profile_image_url !== nextUrl) {
          try {
            await deleteFromS3(existing.profile_image_url);
          } catch (_) {
            /* continue even if S3 delete fails */
          }
        }
        payload.profile_image_url = nextUrl;
      }

      const row = await Testimonial.update(id, payload);
      res.json({ success: true, data: { testimonial: row }, message: 'Testimonial updated' });
    } catch (e) {
      console.error('testimonial update:', e);
      res.status(500).json({ success: false, message: e.message || 'Update failed' });
    }
  }

  static async remove(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id) || id < 1) {
        return res.status(400).json({ success: false, message: 'Invalid id' });
      }
      const existing = await Testimonial.findById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Testimonial not found' });
      }
      if (existing.profile_image_url) {
        try {
          await deleteFromS3(existing.profile_image_url);
        } catch (_) {
          /* still delete row */
        }
      }
      const deleted = await Testimonial.delete(id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Testimonial not found' });
      }
      res.json({ success: true, message: 'Testimonial deleted' });
    } catch (e) {
      console.error('testimonial delete:', e);
      res.status(500).json({ success: false, message: 'Delete failed' });
    }
  }
}

module.exports = TestimonialAdminController;
