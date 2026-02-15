/**
 * Automation Exam Controller
 * Handles CRUD operations for automation exam configurations
 */
const { pool } = require('../../config/database');

class AutomationExamController {
    /**
     * Get all automation exams
     */
    static async getAllExams(req, res) {
        try {
            const { active_only } = req.query;

            let query = 'SELECT * FROM automation_exams';
            const values = [];

            if (active_only === 'true') {
                query += ' WHERE is_active = true';
            }

            query += ' ORDER BY created_at DESC';

            const result = await pool.query(query, values);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('Error fetching automation exams:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch automation exams' });
        }
    }

    /**
     * Get a single exam by ID
     */
    static async getExamById(req, res) {
        try {
            const { id } = req.params;

            const result = await pool.query(
                'SELECT * FROM automation_exams WHERE id = $1',
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Exam not found' });
            }

            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            console.error('Error fetching exam:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch exam' });
        }
    }

    /**
     * Create a new automation exam
     */
    static async createExam(req, res) {
        try {
            const {
                name,
                slug,
                url,
                is_active = true,
                field_mappings = {},
                agent_config = {},
                notify_on_complete = true,
                notify_on_failure = true,
                notification_emails = []
            } = req.body;

            // Check if slug already exists
            const slugCheck = await pool.query(
                'SELECT id FROM automation_exams WHERE slug = $1',
                [slug]
            );

            if (slugCheck.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'An exam with this slug already exists'
                });
            }

            // Default agent_config if not provided
            const defaultAgentConfig = {
                max_retries: 3,
                screenshot_interval_ms: 1000,
                human_intervention_timeout_seconds: 300,
                success_patterns: [],
                error_patterns: [],
                captcha: {
                    auto_solve_enabled: false,
                    provider: 'manual',
                    timeout_seconds: 30
                }
            };

            const finalAgentConfig = Object.keys(agent_config).length > 0 
                ? agent_config 
                : defaultAgentConfig;

            const result = await pool.query(
                `INSERT INTO automation_exams (
                    name, slug, url, is_active, field_mappings, agent_config,
                    notify_on_complete, notify_on_failure, notification_emails
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *`,
                [
                    name,
                    slug,
                    url,
                    is_active,
                    JSON.stringify(field_mappings),
                    JSON.stringify(finalAgentConfig),
                    notify_on_complete,
                    notify_on_failure,
                    notification_emails
                ]
            );

            res.status(201).json({ success: true, data: result.rows[0] });
        } catch (error) {
            console.error('Error creating exam:', error);
            res.status(500).json({ success: false, message: 'Failed to create exam' });
        }
    }

    /**
     * Update an automation exam
     */
    static async updateExam(req, res) {
        try {
            const { id } = req.params;
            const {
                name,
                slug,
                url,
                is_active,
                field_mappings,
                agent_config,
                notify_on_complete,
                notify_on_failure,
                notification_emails
            } = req.body;

            // Check if exam exists
            const examCheck = await pool.query(
                'SELECT * FROM automation_exams WHERE id = $1',
                [id]
            );

            if (examCheck.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Exam not found' });
            }

            // Check if slug is being changed and if new slug already exists
            if (slug && slug !== examCheck.rows[0].slug) {
                const slugCheck = await pool.query(
                    'SELECT id FROM automation_exams WHERE slug = $1 AND id != $2',
                    [slug, id]
                );

                if (slugCheck.rows.length > 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'An exam with this slug already exists'
                    });
                }
            }

            // Build update query dynamically
            const updateFields = [];
            const values = [];
            let paramCount = 1;

            if (name !== undefined) {
                updateFields.push(`name = $${paramCount++}`);
                values.push(name);
            }

            if (slug !== undefined) {
                updateFields.push(`slug = $${paramCount++}`);
                values.push(slug);
            }

            if (url !== undefined) {
                updateFields.push(`url = $${paramCount++}`);
                values.push(url);
            }

            if (is_active !== undefined) {
                updateFields.push(`is_active = $${paramCount++}`);
                values.push(is_active);
            }

            if (field_mappings !== undefined) {
                updateFields.push(`field_mappings = $${paramCount++}`);
                values.push(JSON.stringify(field_mappings));
            }

            if (agent_config !== undefined) {
                updateFields.push(`agent_config = $${paramCount++}`);
                values.push(JSON.stringify(agent_config));
            }

            if (notify_on_complete !== undefined) {
                updateFields.push(`notify_on_complete = $${paramCount++}`);
                values.push(notify_on_complete);
            }

            if (notify_on_failure !== undefined) {
                updateFields.push(`notify_on_failure = $${paramCount++}`);
                values.push(notify_on_failure);
            }

            if (notification_emails !== undefined) {
                updateFields.push(`notification_emails = $${paramCount++}`);
                values.push(notification_emails);
            }

            if (updateFields.length === 0) {
                return res.json({ success: true, data: examCheck.rows[0] });
            }

            // Add updated_at
            updateFields.push('updated_at = CURRENT_TIMESTAMP');

            // Add id as last parameter for WHERE clause
            values.push(id);

            const query = `
                UPDATE automation_exams 
                SET ${updateFields.join(', ')}
                WHERE id = $${paramCount}
                RETURNING *
            `;

            const result = await pool.query(query, values);

            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            console.error('Error updating exam:', error);
            res.status(500).json({ success: false, message: 'Failed to update exam' });
        }
    }

    /**
     * Delete an automation exam
     */
    static async deleteExam(req, res) {
        try {
            const { id } = req.params;

            const result = await pool.query(
                'DELETE FROM automation_exams WHERE id = $1 RETURNING id',
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Exam not found' });
            }

            res.json({ success: true, message: 'Exam deleted successfully' });
        } catch (error) {
            console.error('Error deleting exam:', error);
            res.status(500).json({ success: false, message: 'Failed to delete exam' });
        }
    }
}

module.exports = AutomationExamController;
