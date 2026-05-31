const pool = require('../../config/database').pool;

const VALID_TABS = new Set(['all', 'approved', 'running', 'completed']);
const MAX_ROWS = 12;

function mapRow(row) {
  return {
    id: row.id,
    exam_id: row.exam_id,
    exam_name: row.exam_name || 'Exam application',
    exam_slug: row.exam_slug || '',
    status: row.status,
    created_at: row.created_at,
  };
}

async function fetchApplications(tab) {
  const params = [];
  let query = `
    SELECT aa.id, aa.exam_id, aa.status, aa.created_at, e.name AS exam_name, e.slug AS exam_slug
    FROM automation_applications aa
    INNER JOIN automation_exams e ON e.id = aa.exam_id AND e.is_active = TRUE
  `;
  if (tab !== 'all') {
    query += ' WHERE aa.status = $1';
    params.push(tab);
  }
  query += ' ORDER BY aa.created_at DESC LIMIT $' + (params.length + 1);
  params.push(MAX_ROWS);

  const result = await pool.query(query, params);
  return result.rows.map(mapRow);
}

/** Demo cards when no real applications exist yet. */
async function fetchDemoApplications(tab) {
  const examsResult = await pool.query(`
    SELECT id, name, slug
    FROM automation_exams
    WHERE is_active = TRUE
    ORDER BY name ASC
    LIMIT 12
  `);
  const exams = examsResult.rows;
  if (!exams.length) return [];

  const statusByTab = {
    all: ['approved', 'running', 'completed', 'approved', 'running', 'completed'],
    approved: ['approved', 'approved', 'approved', 'approved', 'approved', 'approved'],
    running: ['running', 'running', 'running', 'running', 'running', 'running'],
    completed: ['completed', 'completed', 'completed', 'completed', 'completed', 'completed'],
  };
  const statuses = statusByTab[tab] || statusByTab.all;
  const now = Date.now();

  return exams.map((exam, index) => ({
    id: -(index + 1),
    exam_id: exam.id,
    exam_name: exam.name,
    exam_slug: exam.slug || '',
    status: statuses[index % statuses.length],
    created_at: new Date(now - index * 86400000 * 3).toISOString(),
  }));
}

class PublicApplicationsDirectoryController {
  /**
   * GET /api/applications/directory?tab=all|approved|running|completed
   */
  static async list(req, res) {
    try {
      const tabRaw = String(req.query.tab || 'all').trim().toLowerCase();
      const tab = VALID_TABS.has(tabRaw) ? tabRaw : 'all';

      let applications = await fetchApplications(tab);
      if (!applications.length) {
        applications = await fetchDemoApplications(tab);
      }

      return res.json({
        success: true,
        data: { applications, tab, isDemo: applications.length > 0 && applications[0].id < 0 },
      });
    } catch (error) {
      console.error('Error fetching public applications directory:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch applications',
      });
    }
  }
}

module.exports = PublicApplicationsDirectoryController;
