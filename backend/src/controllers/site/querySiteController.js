const UserQuery = require('../../models/UserQuery');

const ALLOWED_QUERY_TYPES = new Set([
  'Choosing the right course',
  'College selection',
  'Exam planning',
  'Application process',
  'Scholarships / fees',
  'Others',
]);

class QuerySiteController {
  static async create(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const name = String(req.body?.name || '').trim();
      const email = String(req.body?.email || '').trim().toLowerCase();
      const phone = String(req.body?.phone || '').trim();
      const queryType = String(req.body?.query_type || '').trim();
      const description = String(req.body?.description || '').trim();

      if (!name) return res.status(400).json({ success: false, message: 'Name is required.' });
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ success: false, message: 'Valid email is required.' });
      }
      if (!queryType || !ALLOWED_QUERY_TYPES.has(queryType)) {
        return res.status(400).json({ success: false, message: 'Select a valid query type.' });
      }
      if (!description) {
        return res.status(400).json({ success: false, message: 'Description is required.' });
      }

      const row = await UserQuery.create({
        user_id: userId,
        name,
        email,
        phone,
        query_type: queryType,
        description,
      });

      return res.status(201).json({
        success: true,
        message: 'Query submitted successfully.',
        data: { query: row },
      });
    } catch (error) {
      console.error('site create query:', error);
      return res.status(500).json({
        success: false,
        message: 'Could not submit query. Please try again.',
      });
    }
  }
}

module.exports = QuerySiteController;
