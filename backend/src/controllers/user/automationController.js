/**
 * User Automation Controller
 * Handles student-facing automation application operations
 */

const pool = require('../../config/database').pool;

/**
 * Get available automation exams (active exams only)
 * GET /api/user/automation-exams
 */
exports.getAvailableExams = async (req, res, next) => {
    try {
        const result = await pool.query(`
            SELECT id, name, slug, url, is_active
            FROM automation_exams 
            WHERE is_active = TRUE
            ORDER BY name ASC
        `);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching automation exams:', error);
        next(error);
    }
};

/**
 * Get user's automation applications
 * GET /api/user/automation-applications
 */
exports.getMyApplications = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { status } = req.query;

        let query = `
            SELECT 
                aa.id,
                aa.user_id,
                aa.exam_id,
                aa.status,
                aa.session_id,
                aa.created_at,
                aa.updated_at,
                e.name as exam_name,
                e.slug as exam_slug,
                e.url as exam_url
            FROM automation_applications aa
            LEFT JOIN automation_exams e ON aa.exam_id = e.id
            WHERE aa.user_id = $1
        `;
        const params = [userId];

        if (status && status !== 'all') {
            query += ` AND aa.status = $2`;
            params.push(status);
        }

        query += ` ORDER BY aa.created_at DESC`;

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching user applications:', error);
        next(error);
    }
};

/**
 * Create a new automation application (auto-approved)
 * POST /api/user/automation-applications
 */
exports.createApplication = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { exam_id } = req.body;

        if (!exam_id) {
            return res.status(400).json({
                success: false,
                message: 'exam_id is required'
            });
        }

        // Check if exam exists and is active
        const examCheck = await pool.query(
            'SELECT id, name FROM automation_exams WHERE id = $1 AND is_active = TRUE',
            [exam_id]
        );

        if (examCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Exam not found or not available'
            });
        }

        // Check for existing pending/running application for same exam
        const existingCheck = await pool.query(`
            SELECT id FROM automation_applications 
            WHERE user_id = $1 AND exam_id = $2 AND status IN ('pending', 'approved', 'running')
        `, [userId, exam_id]);

        if (existingCheck.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'You already have an active application for this exam'
            });
        }

        // Create application with 'approved' status (auto-approved for students)
        const result = await pool.query(`
            INSERT INTO automation_applications (user_id, exam_id, status, created_at)
            VALUES ($1, $2, 'approved', CURRENT_TIMESTAMP)
            RETURNING id, user_id, exam_id, status, created_at
        `, [userId, exam_id]);

        const application = result.rows[0];

        res.status(201).json({
            success: true,
            message: 'Application created successfully',
            data: {
                ...application,
                exam_name: examCheck.rows[0].name
            }
        });
    } catch (error) {
        console.error('Error creating application:', error);
        next(error);
    }
};

/**
 * Update application status (for starting workflow)
 * PUT /api/user/automation-applications/:id
 */
exports.updateApplication = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { status, session_id } = req.body;

        // Check if application belongs to user
        const appCheck = await pool.query(
            'SELECT id, status FROM automation_applications WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        if (appCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        // Build update query dynamically
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (status) {
            updates.push(`status = $${paramCount++}`);
            values.push(status);
        }

        if (session_id) {
            updates.push(`session_id = $${paramCount++}`);
            values.push(session_id);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);

        const result = await pool.query(`
            UPDATE automation_applications 
            SET ${updates.join(', ')}
            WHERE id = $${paramCount}
            RETURNING *
        `, values);

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating application:', error);
        next(error);
    }
};

/**
 * Get single application by ID
 * GET /api/user/automation-applications/:id
 */
exports.getApplication = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const result = await pool.query(`
            SELECT 
                aa.*,
                e.name as exam_name,
                e.slug as exam_slug,
                e.url as exam_url
            FROM automation_applications aa
            LEFT JOIN automation_exams e ON aa.exam_id = e.id
            WHERE aa.id = $1 AND aa.user_id = $2
        `, [id, userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching application:', error);
        next(error);
    }
};
