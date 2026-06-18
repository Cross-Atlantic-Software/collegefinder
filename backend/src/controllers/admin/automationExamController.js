/**
 * Automation Exam Controller
 * Handles CRUD operations for automation exam configurations
 */
const { pool } = require('../../config/database');
const {
  deriveMappingStatus,
  syncTaxonomyFromAutomation,
  loadExamDatesForTaxonomy,
  resolveTaxonomyExamIdForAutomation,
  hasExamDetailsPayload,
} = require('../../services/automationExamTaxonomySync');

function mapRowWithExamDetails(row) {
  if (!row) return row;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    url: row.url,
    is_active: row.is_active,
    field_mappings: row.field_mappings,
    agent_config: row.agent_config,
    notify_on_complete: row.notify_on_complete,
    notify_on_failure: row.notify_on_failure,
    notification_emails: row.notification_emails,
    taxonomy_exam_id: row.taxonomy_exam_id ?? null,
    mapping_status: row.mapping_status ?? 'not_mapped',
    created_at: row.created_at,
    updated_at: row.updated_at,
    exam_details: {
      application_start_date: row.application_start_date ?? null,
      application_close_date: row.application_close_date ?? null,
      admit_card_date: row.admit_card_date ?? null,
      exam_date: row.exam_date ?? null,
      result_date: row.result_date ?? null,
      counselling_start_date: row.counselling_start_date ?? row.counselling_date ?? null,
      counselling_end_date: row.counselling_end_date ?? null,
      application_fees: row.application_fees != null ? Number(row.application_fees) : null,
      ut_service_fee: row.ut_service_fee != null ? Number(row.ut_service_fee) : null,
    },
  };
}

const EXAM_LIST_SELECT = `
  SELECT
    ae.*,
    ed.application_start_date,
    ed.application_close_date,
    ed.admit_card_date,
    ed.exam_date,
    ed.result_date,
    ed.counselling_date,
    ed.counselling_start_date,
    ed.counselling_end_date,
    ed.application_fees,
    ed.ut_service_fee
  FROM automation_exams ae
  LEFT JOIN exam_dates ed ON ed.exam_id = ae.taxonomy_exam_id
`;

class AutomationExamController {
    static async getTaxonomyExamOptions(req, res) {
        try {
            const result = await pool.query(`
                SELECT
                  et.id,
                  et.name,
                  et.code,
                  et.website,
                  et.registration_link,
                  ed.application_start_date,
                  ed.application_close_date,
                  ed.admit_card_date,
                  ed.exam_date,
                  ed.result_date,
                  ed.counselling_start_date,
                  ed.counselling_end_date,
                  ed.counselling_date,
                  ed.application_fees,
                  ed.ut_service_fee
                FROM exams_taxonomies et
                LEFT JOIN exam_dates ed ON ed.exam_id = et.id
                ORDER BY et.name ASC
            `);
            const data = result.rows.map((row) => ({
              id: row.id,
              name: row.name,
              code: row.code,
              website: row.website,
              registration_link: row.registration_link,
              exam_details: {
                application_start_date: row.application_start_date ?? null,
                application_close_date: row.application_close_date ?? null,
                admit_card_date: row.admit_card_date ?? null,
                exam_date: row.exam_date ?? null,
                result_date: row.result_date ?? null,
                counselling_start_date: row.counselling_start_date ?? row.counselling_date ?? null,
                counselling_end_date: row.counselling_end_date ?? null,
                application_fees: row.application_fees != null ? Number(row.application_fees) : null,
                ut_service_fee: row.ut_service_fee != null ? Number(row.ut_service_fee) : null,
              },
            }));
            res.json({ success: true, data });
        } catch (error) {
            console.error('Error fetching taxonomy exam options:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch exam catalog' });
        }
    }

    static async getAllExams(req, res) {
        try {
            const { active_only } = req.query;

            let query = EXAM_LIST_SELECT;
            const values = [];

            if (active_only === 'true') {
                query += ' WHERE ae.is_active = true';
            }

            query += ' ORDER BY ae.created_at DESC';

            const result = await pool.query(query, values);
            res.json({
              success: true,
              data: result.rows.map(mapRowWithExamDetails),
            });
        } catch (error) {
            console.error('Error fetching automation exams:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch automation exams' });
        }
    }

    static async getExamById(req, res) {
        try {
            const { id } = req.params;

            const result = await pool.query(
              `${EXAM_LIST_SELECT} WHERE ae.id = $1`,
              [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Exam not found' });
            }

            res.json({ success: true, data: mapRowWithExamDetails(result.rows[0]) });
        } catch (error) {
            console.error('Error fetching exam:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch exam' });
        }
    }

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
                notification_emails = [],
                taxonomy_exam_id = null,
                exam_details = null,
            } = req.body;

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

            const mappingStatus = deriveMappingStatus(field_mappings);

            const resolvedTaxonomyId = await resolveTaxonomyExamIdForAutomation({
              taxonomy_exam_id,
              name,
              slug,
            });

            if (hasExamDetailsPayload(exam_details) && !resolvedTaxonomyId) {
              return res.status(400).json({
                success: false,
                message: 'Select a catalog exam from the dropdown to save application dates and fees',
              });
            }

            const result = await pool.query(
                `INSERT INTO automation_exams (
                    name, slug, url, is_active, field_mappings, agent_config,
                    notify_on_complete, notify_on_failure, notification_emails,
                    taxonomy_exam_id, mapping_status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
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
                    notification_emails,
                    resolvedTaxonomyId,
                    mappingStatus,
                ]
            );

            const created = result.rows[0];

            if (resolvedTaxonomyId) {
              await syncTaxonomyFromAutomation({
                taxonomy_exam_id: resolvedTaxonomyId,
                name,
                registration_link: url,
                exam_dates: exam_details,
              });
            }

            const enriched = await pool.query(`${EXAM_LIST_SELECT} WHERE ae.id = $1`, [created.id]);
            res.status(201).json({
              success: true,
              data: mapRowWithExamDetails(enriched.rows[0] || created),
            });
        } catch (error) {
            console.error('Error creating exam:', error);
            res.status(500).json({ success: false, message: 'Failed to create exam' });
        }
    }

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
                notification_emails,
                taxonomy_exam_id,
                exam_details,
            } = req.body;

            const examCheck = await pool.query(
                'SELECT * FROM automation_exams WHERE id = $1',
                [id]
            );

            if (examCheck.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Exam not found' });
            }

            const existing = examCheck.rows[0];

            const resolvedTaxonomyId = await resolveTaxonomyExamIdForAutomation({
              taxonomy_exam_id:
                taxonomy_exam_id !== undefined ? taxonomy_exam_id : existing.taxonomy_exam_id,
              name: name !== undefined ? name : existing.name,
              slug: slug !== undefined ? slug : existing.slug,
            });

            if (hasExamDetailsPayload(exam_details) && !resolvedTaxonomyId) {
              return res.status(400).json({
                success: false,
                message: 'Select a catalog exam from the dropdown to save application dates and fees',
              });
            }

            if (slug && slug !== existing.slug) {
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
                updateFields.push(`mapping_status = $${paramCount++}`);
                values.push(deriveMappingStatus(field_mappings));
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
            if (resolvedTaxonomyId) {
                updateFields.push(`taxonomy_exam_id = $${paramCount++}`);
                values.push(resolvedTaxonomyId);
            } else if (taxonomy_exam_id !== undefined) {
                updateFields.push(`taxonomy_exam_id = $${paramCount++}`);
                values.push(taxonomy_exam_id ? Number(taxonomy_exam_id) : null);
            }

            if (updateFields.length === 0 && !exam_details) {
                const enriched = await pool.query(`${EXAM_LIST_SELECT} WHERE ae.id = $1`, [id]);
                return res.json({ success: true, data: mapRowWithExamDetails(enriched.rows[0] || existing) });
            }

            updateFields.push('updated_at = CURRENT_TIMESTAMP');
            values.push(id);

            await pool.query(
                `UPDATE automation_exams SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
                values
            );

            const taxonomyId =
              resolvedTaxonomyId ??
              (taxonomy_exam_id !== undefined && taxonomy_exam_id != null
                ? Number(taxonomy_exam_id)
                : existing.taxonomy_exam_id);

            if (taxonomyId && (exam_details !== undefined || name !== undefined || url !== undefined)) {
              await syncTaxonomyFromAutomation({
                taxonomy_exam_id: taxonomyId,
                name: name !== undefined ? name : existing.name,
                registration_link: url !== undefined ? url : existing.url,
                exam_dates: exam_details,
              });
            }

            const enriched = await pool.query(`${EXAM_LIST_SELECT} WHERE ae.id = $1`, [id]);
            res.json({ success: true, data: mapRowWithExamDetails(enriched.rows[0] || existing) });
        } catch (error) {
            console.error('Error updating exam:', error);
            res.status(500).json({ success: false, message: 'Failed to update exam' });
        }
    }

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
