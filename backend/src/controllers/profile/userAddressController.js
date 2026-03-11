const UserAddress = require('../../models/user/UserAddress');
const { validationResult } = require('express-validator');

class UserAddressController {
  /**
   * Get address for current user
   * GET /api/auth/profile/address
   */
  static async getAddress(req, res) {
    try {
      const userId = req.user.id;
      const address = await UserAddress.findByUserId(userId);

      if (!address) {
        return res.json({
          success: true,
          data: null
        });
      }

      res.json({
        success: true,
        data: {
          id: address.id,
          user_id: address.user_id,
          correspondence_address_line1: address.correspondence_address_line1,
          correspondence_address_line2: address.correspondence_address_line2,
          city_town_village: address.city_town_village,
          district: address.district,
          state: address.state,
          country: address.country,
          pincode: address.pincode,
          permanent_address_same_as_correspondence: address.permanent_address_same_as_correspondence,
          permanent_address: address.permanent_address,
          created_at: address.created_at,
          updated_at: address.updated_at
        }
      });
    } catch (error) {
      console.error('Error getting address:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get address'
      });
    }
  }

  /**
   * Create or update address for current user
   * PUT /api/auth/profile/address
   */
  static async upsertAddress(req, res) {
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
      const {
        correspondence_address_line1,
        correspondence_address_line2,
        city_town_village,
        district,
        state,
        country,
        pincode,
        permanent_address_same_as_correspondence,
        permanent_address
      } = req.body;

      const address = await UserAddress.upsert(userId, {
        correspondence_address_line1,
        correspondence_address_line2,
        city_town_village,
        district,
        state,
        country,
        pincode,
        permanent_address_same_as_correspondence,
        permanent_address
      });

      res.json({
        success: true,
        message: 'Address saved successfully',
        data: {
          id: address.id,
          user_id: address.user_id,
          correspondence_address_line1: address.correspondence_address_line1,
          correspondence_address_line2: address.correspondence_address_line2,
          city_town_village: address.city_town_village,
          district: address.district,
          state: address.state,
          country: address.country,
          pincode: address.pincode,
          permanent_address_same_as_correspondence: address.permanent_address_same_as_correspondence,
          permanent_address: address.permanent_address,
          created_at: address.created_at,
          updated_at: address.updated_at
        }
      });
    } catch (error) {
      console.error('Error saving address:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save address'
      });
    }
  }

  /**
   * Delete address for current user
   * DELETE /api/auth/profile/address
   */
  static async deleteAddress(req, res) {
    try {
      const userId = req.user.id;
      const deleted = await UserAddress.deleteByUserId(userId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Address not found'
        });
      }

      res.json({
        success: true,
        message: 'Address deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting address:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete address'
      });
    }
  }
}

module.exports = UserAddressController;

