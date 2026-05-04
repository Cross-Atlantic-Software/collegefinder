const Testimonial = require('../../models/Testimonial');

class TestimonialSiteController {
  static async listPublic(req, res) {
    try {
      const items = await Testimonial.findAllActivePublic();
      res.json({
        success: true,
        data: { testimonials: items },
      });
    } catch (e) {
      console.error('testimonials public list:', e);
      res.status(500).json({ success: false, message: 'Failed to load testimonials' });
    }
  }
}

module.exports = TestimonialSiteController;
