const User = require('../../models/user/User');
const { validationResult } = require('express-validator');
const { uploadToS3, deleteFromS3 } = require('../../../utils/storage/s3Upload');

class BasicInfoController {
  /**
   * Get basic info
   * GET /api/auth/profile/basic
   */
  static async getBasicInfo(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          first_name: user.first_name,
          last_name: user.last_name,
          date_of_birth: user.date_of_birth,
          gender: user.gender,
          phone_number: user.phone_number,
          state: user.state,
          district: user.district,
          email_verified: user.email_verified,
          profile_photo: user.profile_photo,
          latitude: user.latitude,
          longitude: user.longitude
        }
      });
    } catch (error) {
      console.error('Error getting basic info:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get basic info'
      });
    }
  }

  /**
   * Upload profile photo
   * POST /api/auth/profile/upload-photo
   */
  static async uploadProfilePhoto(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const userId = req.user.id;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Delete old photo from S3 if exists
      if (user.profile_photo) {
        await deleteFromS3(user.profile_photo);
      }

      // Upload new photo to S3
      const fileBuffer = req.file.buffer;
      const fileName = req.file.originalname;
      const s3Url = await uploadToS3(fileBuffer, fileName, 'profile-photos');

      // Update user's profile_photo in database
      const db = require('../../config/database');
      const result = await db.query(
        'UPDATE users SET profile_photo = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [s3Url, userId]
      );

      res.json({
        success: true,
        message: 'Profile photo uploaded successfully',
        data: {
          profile_photo: result.rows[0].profile_photo
        }
      });
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload profile photo'
      });
    }
  }

  /**
   * Delete profile photo
   * DELETE /api/auth/profile/upload-photo
   */
  static async deleteProfilePhoto(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Delete photo from S3 if exists
      if (user.profile_photo) {
        await deleteFromS3(user.profile_photo);
      }

      // Update user's profile_photo to null in database
      const db = require('../../config/database');
      const result = await db.query(
        'UPDATE users SET profile_photo = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
        [userId]
      );

      res.json({
        success: true,
        message: 'Profile photo deleted successfully',
        data: {
          profile_photo: null
        }
      });
    } catch (error) {
      console.error('Error deleting profile photo:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete profile photo'
      });
    }
  }

  /**
   * Update basic info
   * PUT /api/auth/profile/basic
   */
  static async updateBasicInfo(req, res) {
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
        name,
        first_name,
        last_name,
        date_of_birth,
        gender,
        state,
        district,
        phone_number,
        profile_photo,
        latitude,
        longitude
      } = req.body;

      // Build update query dynamically
      const updates = [];
      const values = [];
      let paramCount = 1;

      if (name !== undefined) {
        updates.push(`name = $${paramCount++}`);
        values.push(name || null);
      }
      if (first_name !== undefined) {
        updates.push(`first_name = $${paramCount++}`);
        values.push(first_name);
      }
      if (last_name !== undefined) {
        updates.push(`last_name = $${paramCount++}`);
        values.push(last_name);
      }
      if (date_of_birth !== undefined) {
        // Ensure date is in YYYY-MM-DD format for PostgreSQL DATE type
        let dateValue = date_of_birth;
        if (date_of_birth && typeof date_of_birth === 'string') {
          // Validate and format date string (YYYY-MM-DD)
          const dateMatch = date_of_birth.match(/^(\d{4})-(\d{2})-(\d{2})/);
          if (!dateMatch) {
            return res.status(400).json({
              success: false,
              message: 'Invalid date format. Expected YYYY-MM-DD'
            });
          }
          dateValue = dateMatch[0]; // Use matched YYYY-MM-DD format
        }
        updates.push(`date_of_birth = $${paramCount++}::DATE`);
        values.push(dateValue);
      }
      if (gender !== undefined) {
        updates.push(`gender = $${paramCount++}`);
        values.push(gender);
      }
      if (state !== undefined) {
        updates.push(`state = $${paramCount++}`);
        values.push(state);
      }
      if (district !== undefined) {
        updates.push(`district = $${paramCount++}`);
        values.push(district);
      }
      if (phone_number !== undefined) {
        updates.push(`phone_number = $${paramCount++}`);
        values.push(phone_number);
      }
      if (profile_photo !== undefined) {
        // If profile_photo is being cleared (null or empty string), delete old photo from S3
        // First get current user to check for existing photo
        const currentUser = await User.findById(userId);
        if ((profile_photo === null || profile_photo === '') && currentUser?.profile_photo) {
          await deleteFromS3(currentUser.profile_photo);
        }
        updates.push(`profile_photo = $${paramCount++}`);
        values.push(profile_photo || null);
      }
      if (latitude !== undefined) {
        updates.push(`latitude = $${paramCount++}`);
        values.push(latitude);
      }
      if (longitude !== undefined) {
        updates.push(`longitude = $${paramCount++}`);
        values.push(longitude);
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No fields to update'
        });
      }

      values.push(userId);
      const db = require('../../config/database');
      const query = `
        UPDATE users 
        SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount}
        RETURNING *
      `;
      
      const result = await db.query(query, values);
      const updatedUser = result.rows[0];

      res.json({
        success: true,
        message: 'Basic info updated successfully',
        data: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          first_name: updatedUser.first_name,
          last_name: updatedUser.last_name,
          date_of_birth: updatedUser.date_of_birth,
          gender: updatedUser.gender,
          state: updatedUser.state,
          district: updatedUser.district,
          phone_number: updatedUser.phone_number,
          profile_photo: updatedUser.profile_photo,
          latitude: updatedUser.latitude,
          longitude: updatedUser.longitude
        }
      });
    } catch (error) {
      console.error('Error updating basic info:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update basic info'
      });
    }
  }
}

module.exports = BasicInfoController;

