/**
 * User Automation Controller
 * Handles student-facing automation application operations
 */

const pool = require('../../config/database').pool;
const {
    resolveAutomationExamForStudentApply,
} = require('../../services/alreadyFilledFormService');

function buildMissingFields(row) {
    const missing = [];
    if (!row.application_start_date) missing.push('Application start date');
    if (!row.application_close_date) missing.push('Application end date');
    if (row.application_fees == null) missing.push('Form fee');
    if (row.ut_service_fee == null) missing.push('UT service fee');
    if (!row.exam_url || !String(row.exam_url).trim()) missing.push('Registration link');
    return missing;
}

function mapDisplayStatus(row, source) {
    if (row.status === 'failed') return 'Failed';
    if (row.status === 'completed') {
        return source === 'already_filled_form' ? 'Filled' : 'Applied';
    }
    return 'In Process';
}

async function resolveActiveAutomationExamId({ exam_id, taxonomy_exam_id }) {
    if (exam_id != null && exam_id !== '') {
        const id = Number(exam_id);
        if (!Number.isInteger(id) || id <= 0) return null;
        const check = await pool.query(
            'SELECT id FROM automation_exams WHERE id = $1 AND is_active = TRUE LIMIT 1',
            [id]
        );
        return check.rows[0]?.id ?? null;
    }

    if (taxonomy_exam_id != null && taxonomy_exam_id !== '') {
        return resolveAutomationExamForStudentApply(taxonomy_exam_id);
    }

    return null;
}

async function enrichApplicationRow(row, mapApplicationSource, findTaxonomyExamIdForAutomation) {
    const taxonomyId =
        row.taxonomy_exam_id != null
            ? Number(row.taxonomy_exam_id)
            : (await findTaxonomyExamIdForAutomation(row.exam_id, row.exam_name, row.exam_slug))?.id ?? null;
    const source = mapApplicationSource(row);
    const missing_fields = buildMissingFields(row);
    const display_status = mapDisplayStatus(row, source);

    return {
        id: row.id,
        user_id: row.user_id,
        exam_id: row.exam_id,
        exam_name: row.exam_name,
        exam_slug: row.exam_slug,
        exam_url: row.exam_url,
        taxonomy_exam_id: taxonomyId,
        status: row.status,
        session_id: row.session_id,
        admin_notes: row.admin_notes,
        created_at: row.created_at,
        updated_at: row.updated_at,
        application_start_date: row.application_start_date ?? null,
        application_close_date: row.application_close_date ?? null,
        application_fees: row.application_fees != null ? Number(row.application_fees) : null,
        ut_service_fee: row.ut_service_fee != null ? Number(row.ut_service_fee) : null,
        missing_fields,
        display_status,
        ...(source ? { source } : {}),
    };
}

const APPLICATION_SELECT = `
    SELECT 
        aa.id,
        aa.user_id,
        aa.exam_id,
        aa.taxonomy_exam_id AS application_taxonomy_exam_id,
        aa.status,
        aa.session_id,
        aa.admin_notes,
        aa.created_at,
        aa.updated_at,
        COALESCE(e.name, et.name) as exam_name,
        COALESCE(e.slug, et.code) as exam_slug,
        COALESCE(NULLIF(TRIM(e.url), ''), NULLIF(TRIM(et.registration_link), ''), NULLIF(TRIM(et.website), '')) as exam_url,
        COALESCE(aa.taxonomy_exam_id, e.taxonomy_exam_id, et.id) as taxonomy_exam_id,
        ed.application_start_date,
        ed.application_close_date,
        ed.application_fees,
        ed.ut_service_fee
    FROM automation_applications aa
    LEFT JOIN automation_exams e ON aa.exam_id = e.id
    LEFT JOIN exams_taxonomies et ON et.id = COALESCE(aa.taxonomy_exam_id, e.taxonomy_exam_id)
    LEFT JOIN exam_dates ed ON ed.exam_id = COALESCE(aa.taxonomy_exam_id, e.taxonomy_exam_id, et.id)
`;

/**
 * Get user's automation applications
 * GET /api/user/automation-applications
 */
exports.getMyApplications = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { status } = req.query;

        const { mapApplicationSource } = require('../../services/alreadyFilledFormService');

        let query = `${APPLICATION_SELECT} WHERE aa.user_id = $1`;
        const params = [userId];

        if (status && status !== 'all') {
            query += ` AND aa.status = $2`;
            params.push(status);
        }

        query += ` ORDER BY aa.created_at DESC`;

        const result = await pool.query(query, params);
        const { findTaxonomyExamIdForAutomation } = require('../../services/journeyPhaseDatesService');

        const rows = await Promise.all(
            result.rows.map((row) => enrichApplicationRow(row, mapApplicationSource, findTaxonomyExamIdForAutomation))
        );

        res.json({
            success: true,
            data: rows
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
        const { exam_id, taxonomy_exam_id } = req.body;

        if ((exam_id == null || exam_id === '') && (taxonomy_exam_id == null || taxonomy_exam_id === '')) {
            return res.status(400).json({
                success: false,
                message: 'exam_id or taxonomy_exam_id is required',
            });
        }

        const resolvedExamId = await resolveActiveAutomationExamId({ exam_id, taxonomy_exam_id });

        if (!resolvedExamId) {
            return res.status(404).json({
                success: false,
                message: 'Exam not found or not available for automation',
            });
        }

        const examCheck = await pool.query(
            'SELECT id, name, url, taxonomy_exam_id FROM automation_exams WHERE id = $1',
            [resolvedExamId]
        );

        if (examCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Exam not found or not available'
            });
        }

        const taxonomyId =
            taxonomy_exam_id != null && taxonomy_exam_id !== ''
                ? Number(taxonomy_exam_id)
                : examCheck.rows[0].taxonomy_exam_id != null
                  ? Number(examCheck.rows[0].taxonomy_exam_id)
                  : null;

        // Return existing application for this exam (any status)
        const existingCheck = await pool.query(`
            SELECT aa.id
            FROM automation_applications aa
            WHERE aa.user_id = $1 AND aa.exam_id = $2
            ORDER BY aa.created_at DESC
            LIMIT 1
        `, [userId, resolvedExamId]);

        if (existingCheck.rows.length > 0) {
            const existingId = existingCheck.rows[0].id;
            if (taxonomyId != null) {
                await pool.query(
                    'UPDATE automation_applications SET taxonomy_exam_id = $1 WHERE id = $2 AND taxonomy_exam_id IS NULL',
                    [taxonomyId, existingId]
                );
            }
            const existingResult = await pool.query(
                `${APPLICATION_SELECT} WHERE aa.id = $1 AND aa.user_id = $2`,
                [existingId, userId]
            );
            const { mapApplicationSource } = require('../../services/alreadyFilledFormService');
            const { findTaxonomyExamIdForAutomation } = require('../../services/journeyPhaseDatesService');
            const enriched = await enrichApplicationRow(
                existingResult.rows[0],
                mapApplicationSource,
                findTaxonomyExamIdForAutomation
            );
            return res.json({
                success: true,
                message: 'Application already exists',
                data: enriched,
            });
        }

        // Create application with 'approved' status (auto-approved for students)
        const result = await pool.query(`
            INSERT INTO automation_applications (user_id, exam_id, taxonomy_exam_id, status, created_at)
            VALUES ($1, $2, $3, 'approved', CURRENT_TIMESTAMP)
            RETURNING id, user_id, exam_id, status, created_at
        `, [userId, resolvedExamId, taxonomyId]);

        const application = result.rows[0];
        const createdResult = await pool.query(
            `${APPLICATION_SELECT} WHERE aa.id = $1 AND aa.user_id = $2`,
            [application.id, userId]
        );
        const { mapApplicationSource } = require('../../services/alreadyFilledFormService');
        const { findTaxonomyExamIdForAutomation } = require('../../services/journeyPhaseDatesService');
        const enriched = await enrichApplicationRow(
            createdResult.rows[0],
            mapApplicationSource,
            findTaxonomyExamIdForAutomation
        );

        res.status(201).json({
            success: true,
            message: 'Application created successfully',
            data: enriched,
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

        const previousStatus = appCheck.rows[0].status;

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

        if (status === 'failed' && previousStatus !== 'failed') {
            try {
                const creditService = require('../../services/credit/creditService');
                await creditService.refundCreditsForRegistration(
                    userId,
                    Number(id),
                    'Application marked as failed'
                );
            } catch (refundError) {
                console.error('Failed to auto-refund credits for failed application:', refundError);
            }
        }

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

/**
 * GET /api/user/exam-extra-fields/:taxonomyExamId
 * The approved discovered.* profile fields this exam's adapter references that
 * the student hasn't filled yet — so the Apply flow can collect them inline.
 * Resolves the adapter via the same slug-derived join the dashboard uses
 * (Exam.findApplyReadyMap). Non-fatal by design: any problem returns an empty
 * list so applying is never blocked. Core profile fields never appear here.
 */
exports.getExamExtraFields = async (req, res) => {
    try {
        const userId = req.user.id;
        const taxonomyExamId = parseInt(req.params.taxonomyExamId, 10);
        if (!Number.isInteger(taxonomyExamId)) {
            return res.json({ success: true, data: [] });
        }

        const adapterRes = await pool.query(
            `SELECT a.adapter_config
               FROM exams_taxonomies t
               JOIN exam_adapters a
                 ON a.exam_id = btrim(regexp_replace(lower(COALESCE(NULLIF(t.code, ''), t.name)), '[^a-z0-9]+', '_', 'g'), '_')
                AND a.approval_status = 'approved'
                AND a.status = 'published'
                AND a.is_active = TRUE
              WHERE t.id = $1
              LIMIT 1`,
            [taxonomyExamId]
        );
        if (adapterRes.rows.length === 0) {
            return res.json({ success: true, data: [] });
        }

        const rawCfg = adapterRes.rows[0].adapter_config;
        const config = typeof rawCfg === 'string' ? JSON.parse(rawCfg) : (rawCfg || {});
        const sections = Array.isArray(config.sections) ? config.sections : [];

        // Distinct discovered.* sources the adapter actually fills.
        const wanted = new Set();
        for (const section of sections) {
            for (const field of (section.fields || [])) {
                if (typeof field.source === 'string' && field.source.startsWith('discovered.')) {
                    wanted.add(field.source);
                }
            }
        }
        if (wanted.size === 0) {
            return res.json({ success: true, data: [] });
        }

        // Only surface APPROVED registry fields (label/type), minus any the
        // student has already filled (value present in profile_field_values).
        const fieldsRes = await pool.query(
            `SELECT r.field_path, r.label, r.type, v.value
               FROM profile_field_registry r
               LEFT JOIN profile_field_values v
                 ON v.field_path = r.field_path AND v.user_id = $1
              WHERE r.field_path = ANY($2::text[])
                AND r.status = 'approved'`,
            [userId, [...wanted]]
        );

        const data = fieldsRes.rows
            .filter((row) => row.value == null || String(row.value).trim() === '')
            .map((row) => ({
                field_path: row.field_path,
                label: row.label || row.field_path,
                type: row.type || 'text'
            }));

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching exam extra fields (non-fatal):', error);
        res.json({ success: true, data: [] });
    }
};

/**
 * PUT /api/user/profile-field-values
 * Upserts student-entered values for approved discovered.* fields into
 * profile_field_values — the table the ExamFill fill-profile overlay reads.
 * Body: { values: { "discovered.x": "B+", ... } }.
 * Allow-listed: only paths that are approved discovered.* registry rows are
 * written, so a student can never set an arbitrary profile path.
 */
exports.saveProfileFieldValues = async (req, res) => {
    try {
        const userId = req.user.id;
        const values =
            req.body && typeof req.body.values === 'object' && req.body.values
                ? req.body.values
                : null;
        if (!values) {
            return res.status(400).json({ success: false, message: 'values object is required' });
        }

        const requestedPaths = Object.keys(values).filter(
            (p) => typeof p === 'string' && p.startsWith('discovered.')
        );
        if (requestedPaths.length === 0) {
            return res.json({ success: true, data: { saved: 0 } });
        }

        const allowedRes = await pool.query(
            `SELECT field_path FROM profile_field_registry
              WHERE field_path = ANY($1::text[]) AND status = 'approved'`,
            [requestedPaths]
        );
        const allowed = new Set(allowedRes.rows.map((r) => r.field_path));

        let saved = 0;
        for (const path of requestedPaths) {
            if (!allowed.has(path)) continue;
            const raw = values[path];
            const value = raw == null ? '' : String(raw).slice(0, 1000);
            await pool.query(
                `INSERT INTO profile_field_values (user_id, field_path, value, source)
                 VALUES ($1, $2, $3, 'student_edit')
                 ON CONFLICT (user_id, field_path)
                 DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
                [userId, path.slice(0, 150), value]
            );
            saved += 1;
        }

        res.json({ success: true, data: { saved } });
    } catch (error) {
        console.error('Error saving profile field values:', error);
        res.status(500).json({ success: false, message: 'Failed to save field values' });
    }
};
