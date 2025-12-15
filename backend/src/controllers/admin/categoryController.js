const Category = require('../../models/taxonomy/Category');
const { validationResult } = require('express-validator');

class CategoryController {
  /**
   * Get all categories
   * GET /api/admin/categories
   */
  static async getAllCategories(req, res) {
    try {
      const categories = await Category.findAll();
      res.json({
        success: true,
        data: { categories }
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch categories'
      });
    }
  }

  /**
   * Get category by ID
   * GET /api/admin/categories/:id
   */
  static async getCategoryById(req, res) {
    try {
      const { id } = req.params;
      const category = await Category.findById(parseInt(id));

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      res.json({
        success: true,
        data: { category }
      });
    } catch (error) {
      console.error('Error fetching category:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch category'
      });
    }
  }

  /**
   * Create new category
   * POST /api/admin/categories
   */
  static async createCategory(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { name } = req.body;

      // Check if name already exists
      const existing = await Category.findByName(name);
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Category with this name already exists'
        });
      }

      const category = await Category.create({ name });

      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: { category }
      });
    } catch (error) {
      console.error('Error creating category:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create category'
      });
    }
  }

  /**
   * Update category
   * PUT /api/admin/categories/:id
   */
  static async updateCategory(req, res) {
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
      const { name } = req.body;

      const existing = await Category.findById(parseInt(id));
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      // Check if name already exists (excluding current category)
      if (name && name !== existing.name) {
        const nameExists = await Category.findByName(name);
        if (nameExists) {
          return res.status(400).json({
            success: false,
            message: 'Category with this name already exists'
          });
        }
      }

      const category = await Category.update(parseInt(id), { name });

      res.json({
        success: true,
        message: 'Category updated successfully',
        data: { category }
      });
    } catch (error) {
      console.error('Error updating category:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update category'
      });
    }
  }

  /**
   * Delete category
   * DELETE /api/admin/categories/:id
   */
  static async deleteCategory(req, res) {
    try {
      const { id } = req.params;
      const category = await Category.findById(parseInt(id));

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      await Category.delete(parseInt(id));

      res.json({
        success: true,
        message: 'Category deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete category'
      });
    }
  }
}

module.exports = CategoryController;
