const Referral = require('../../models/referral/Referral');

class ReferralCodesController {
  static async getAll(req, res) {
    try {
      const referralCodes = await Referral.getAllUserCodesForAdmin();
      return res.json({
        success: true,
        data: { referralCodes },
      });
    } catch (error) {
      console.error('Error fetching referral codes:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch referral codes',
      });
    }
  }

  static async deactivate(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id) || id <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid referral code id' });
      }
      const row = await Referral.deactivateUserCodeByRowId(id, req.admin?.id || null);
      if (!row) {
        return res.status(404).json({ success: false, message: 'Referral code not found' });
      }
      return res.json({
        success: true,
        message: 'Referral code deactivated successfully',
        data: { referralCode: row },
      });
    } catch (error) {
      console.error('Error deactivating referral code:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to deactivate referral code',
      });
    }
  }

  static async delete(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id) || id <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid referral code id' });
      }
      const row = await Referral.deleteUserCodeByRowId(id);
      if (!row) {
        return res.status(404).json({ success: false, message: 'Referral code not found' });
      }
      return res.json({
        success: true,
        message: 'Referral code deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting referral code:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete referral code',
      });
    }
  }
}

module.exports = ReferralCodesController;
