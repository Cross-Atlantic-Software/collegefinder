const db = require('../../config/database');

class AdminUserModule {
  static async getModuleIdsByAdminUserId(adminUserId) {
    const result = await db.query(
      'SELECT module_id FROM admin_user_modules WHERE admin_user_id = $1 ORDER BY module_id',
      [adminUserId]
    );
    return result.rows.map(r => r.module_id);
  }

  static async setModulesForAdminUser(adminUserId, moduleIds) {
    await db.query('DELETE FROM admin_user_modules WHERE admin_user_id = $1', [adminUserId]);
    if (!moduleIds || !Array.isArray(moduleIds) || moduleIds.length === 0) return [];
    const created = [];
    for (const moduleId of moduleIds) {
      const row = await db.query(
        `INSERT INTO admin_user_modules (admin_user_id, module_id) VALUES ($1, $2)
         ON CONFLICT (admin_user_id, module_id) DO NOTHING RETURNING *`,
        [adminUserId, moduleId]
      );
      if (row.rows[0]) created.push(row.rows[0]);
    }
    return created;
  }

  static async deleteByAdminUserId(adminUserId) {
    await db.query('DELETE FROM admin_user_modules WHERE admin_user_id = $1', [adminUserId]);
  }
}

module.exports = AdminUserModule;
