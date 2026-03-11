/**
 * Automation Applications Controller
 * Handles CRUD operations for automation applications (user exam automation requests)
 */
const { pool } = require('../../config/database');

class AutomationApplicationsController {
    /**
     * Get all automation applications with user and exam details
     */
    static async getAllApplications(req, res) {
        try {
            const { status, limit = 50, offset = 0 } = req.query;

            let query = `
        SELECT 
          aa.id, aa.user_id, aa.exam_id, aa.status, aa.session_id,
          aa.approved_by, aa.approved_at, aa.admin_notes,
          aa.created_at, aa.updated_at,
          u.name as user_name, u.email as user_email, u.phone_number as user_phone,
          e.name as exam_name, e.slug as exam_slug, e.url as exam_url
        FROM automation_applications aa
        LEFT JOIN users u ON aa.user_id = u.id
        LEFT JOIN automation_exams e ON aa.exam_id = e.id
      `;

            const values = [];

            if (status && status !== 'all') {
                query += ` WHERE aa.status = $1`;
                values.push(status);
            }

            query += ` ORDER BY aa.created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
            values.push(parseInt(limit), parseInt(offset));

            const result = await pool.query(query, values);

            res.json({
                success: true,
                data: result.rows
            });
        } catch (error) {
            console.error('Error fetching applications:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch applications' });
        }
    }

    /**
     * Get a single application by ID
     */
    static async getApplicationById(req, res) {
        try {
            const { id } = req.params;

            const result = await pool.query(`
        SELECT 
          aa.*, 
          u.name as user_name, u.email as user_email, u.phone_number as user_phone,
          e.name as exam_name, e.slug as exam_slug, e.url as exam_url
        FROM automation_applications aa
        LEFT JOIN users u ON aa.user_id = u.id
        LEFT JOIN automation_exams e ON aa.exam_id = e.id
        WHERE aa.id = $1
      `, [id]);

            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Application not found' });
            }

            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            console.error('Error fetching application:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch application' });
        }
    }

    /**
     * Create a new automation application
     */
    static async createApplication(req, res) {
        try {
            const { user_id, exam_id, admin_notes } = req.body;

            // Validate user exists
            const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [user_id]);
            if (userCheck.rows.length === 0) {
                return res.status(400).json({ success: false, message: 'User not found' });
            }

            // Validate exam exists
            const examCheck = await pool.query('SELECT id FROM automation_exams WHERE id = $1', [exam_id]);
            if (examCheck.rows.length === 0) {
                return res.status(400).json({ success: false, message: 'Automation exam not found' });
            }

            // Check for duplicate active application
            const duplicateCheck = await pool.query(`
        SELECT id FROM automation_applications 
        WHERE user_id = $1 AND exam_id = $2 AND status IN ('pending', 'approved', 'running')
      `, [user_id, exam_id]);

            if (duplicateCheck.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'An active application already exists for this user and exam'
                });
            }

            const result = await pool.query(`
        INSERT INTO automation_applications (user_id, exam_id, status, admin_notes)
        VALUES ($1, $2, 'pending', $3)
        RETURNING *
      `, [user_id, exam_id, admin_notes || null]);

            res.status(201).json({ success: true, data: result.rows[0] });
        } catch (error) {
            console.error('Error creating application:', error);
            res.status(500).json({ success: false, message: 'Failed to create application' });
        }
    }

    /**
     * Approve an application
     */
    static async approveApplication(req, res) {
        try {
            const { id } = req.params;
            const adminId = req.admin?.id;

            const result = await pool.query(`
        UPDATE automation_applications 
        SET status = 'approved', approved_by = $1, approved_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND status = 'pending'
        RETURNING *
      `, [adminId, id]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Application not found or not in pending status'
                });
            }

            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            console.error('Error approving application:', error);
            res.status(500).json({ success: false, message: 'Failed to approve application' });
        }
    }

    /**
     * Update application status (for automation workflow updates)
     */
    static async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const { status, session_id, admin_notes } = req.body;

            const validStatuses = ['pending', 'approved', 'running', 'completed', 'failed'];
            if (status && !validStatuses.includes(status)) {
                return res.status(400).json({ success: false, message: 'Invalid status' });
            }

            let query = 'UPDATE automation_applications SET updated_at = CURRENT_TIMESTAMP';
            const values = [];
            let paramCount = 1;

            if (status) {
                query += `, status = $${paramCount}`;
                values.push(status);
                paramCount++;
            }

            if (session_id) {
                query += `, session_id = $${paramCount}`;
                values.push(session_id);
                paramCount++;
            }

            if (admin_notes !== undefined) {
                query += `, admin_notes = $${paramCount}`;
                values.push(admin_notes);
                paramCount++;
            }

            query += ` WHERE id = $${paramCount} RETURNING *`;
            values.push(id);

            const result = await pool.query(query, values);

            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Application not found' });
            }

            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            console.error('Error updating application:', error);
            res.status(500).json({ success: false, message: 'Failed to update application' });
        }
    }

    /**
     * Delete an application
     */
    static async deleteApplication(req, res) {
        try {
            const { id } = req.params;

            const result = await pool.query(
                'DELETE FROM automation_applications WHERE id = $1 RETURNING id',
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Application not found' });
            }

            res.json({ success: true, message: 'Application deleted successfully' });
        } catch (error) {
            console.error('Error deleting application:', error);
            res.status(500).json({ success: false, message: 'Failed to delete application' });
        }
    }

    /**
     * Get all automation exams (for dropdown selection)
     */
    static async getAutomationExams(req, res) {
        try {
            const { active_only = 'true' } = req.query;

            let query = 'SELECT id, name, slug, url, is_active FROM automation_exams';
            if (active_only === 'true') {
                query += ' WHERE is_active = true';
            }
            query += ' ORDER BY name';

            const result = await pool.query(query);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('Error fetching automation exams:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch automation exams' });
        }
    }

    /**
     * Get users for dropdown selection
     */
    static async getUsersForSelection(req, res) {
        try {
            const { search, limit = 50 } = req.query;

            let query = `
        SELECT id, name, email, phone_number 
        FROM users 
        WHERE is_active = true
      `;

            const values = [];
            if (search) {
                query += ` AND (name ILIKE $1 OR email ILIKE $1 OR phone_number ILIKE $1)`;
                values.push(`%${search}%`);
            }

            query += ` ORDER BY name LIMIT $${values.length + 1}`;
            values.push(parseInt(limit));

            const result = await pool.query(query, values);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('Error fetching users:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch users' });
        }
    }
}

module.exports = AutomationApplicationsController;
