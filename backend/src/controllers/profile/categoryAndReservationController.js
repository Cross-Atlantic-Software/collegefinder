const CategoryAndReservation = require('../../models/user/CategoryAndReservation');
const Category = require('../../models/taxonomy/Category');
const { validationResult } = require('express-validator');

class CategoryAndReservationController {
  /**
   * Get category and reservation for current user
   * GET /api/auth/profile/category-and-reservation
   */
  static async getCategoryAndReservation(req, res) {
    try {
      const userId = req.user.id;
      const catRes = await CategoryAndReservation.findByUserId(userId);

      if (!catRes) {
        return res.json({
          success: true,
          data: null
        });
      }

      // Get category name if category_id exists
      let categoryName = null;
      if (catRes.category_id) {
        const category = await Category.findById(catRes.category_id);
        categoryName = category ? category.name : null;
      }

      res.json({
        success: true,
        data: {
          id: catRes.id,
          user_id: catRes.user_id,
          category_id: catRes.category_id,
          category_name: categoryName,
          ews_status: catRes.ews_status,
          pwbd_status: catRes.pwbd_status,
          type_of_disability: catRes.type_of_disability,
          disability_percentage: catRes.disability_percentage,
          udid_number: catRes.udid_number,
          minority_status: catRes.minority_status,
          ex_serviceman_defence_quota: catRes.ex_serviceman_defence_quota,
          kashmiri_migrant_regional_quota: catRes.kashmiri_migrant_regional_quota,
          state_domicile: catRes.state_domicile,
          home_state_for_quota: catRes.home_state_for_quota,
          created_at: catRes.created_at,
          updated_at: catRes.updated_at
        }
      });
    } catch (error) {
      console.error('Error getting category and reservation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get category and reservation'
      });
    }
  }

  /**
   * Create or update category and reservation for current user
   * PUT /api/auth/profile/category-and-reservation
   */
  static async upsertCategoryAndReservation(req, res) {
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
        category_id,
        ews_status,
        pwbd_status,
        type_of_disability,
        disability_percentage,
        udid_number,
        minority_status,
        ex_serviceman_defence_quota,
        kashmiri_migrant_regional_quota,
        state_domicile,
        home_state_for_quota
      } = req.body;

      const catRes = await CategoryAndReservation.upsert(userId, {
        category_id,
        ews_status,
        pwbd_status,
        type_of_disability,
        disability_percentage,
        udid_number,
        minority_status,
        ex_serviceman_defence_quota,
        kashmiri_migrant_regional_quota,
        state_domicile,
        home_state_for_quota
      });

      // Get category name if category_id exists
      let categoryName = null;
      if (catRes.category_id) {
        const category = await Category.findById(catRes.category_id);
        categoryName = category ? category.name : null;
      }

      res.json({
        success: true,
        message: 'Category and reservation saved successfully',
        data: {
          id: catRes.id,
          user_id: catRes.user_id,
          category_id: catRes.category_id,
          category_name: categoryName,
          ews_status: catRes.ews_status,
          pwbd_status: catRes.pwbd_status,
          type_of_disability: catRes.type_of_disability,
          disability_percentage: catRes.disability_percentage,
          udid_number: catRes.udid_number,
          minority_status: catRes.minority_status,
          ex_serviceman_defence_quota: catRes.ex_serviceman_defence_quota,
          kashmiri_migrant_regional_quota: catRes.kashmiri_migrant_regional_quota,
          created_at: catRes.created_at,
          updated_at: catRes.updated_at
        }
      });
    } catch (error) {
      console.error('Error saving category and reservation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save category and reservation'
      });
    }
  }

  /**
   * Delete category and reservation for current user
   * DELETE /api/auth/profile/category-and-reservation
   */
  static async deleteCategoryAndReservation(req, res) {
    try {
      const userId = req.user.id;
      const deleted = await CategoryAndReservation.deleteByUserId(userId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Category and reservation not found'
        });
      }

      res.json({
        success: true,
        message: 'Category and reservation deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting category and reservation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete category and reservation'
      });
    }
  }
}

module.exports = CategoryAndReservationController;

