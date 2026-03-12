const Module = require('../../models/taxonomy/Module');

class ModulesController {
  static async getAll(req, res) {
    try {
      const modules = await Module.findAll();
      res.json({ success: true, data: { modules } });
    } catch (error) {
      console.error('Error fetching modules:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch modules' });
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;
      const mod = await Module.findById(parseInt(id));
      if (!mod) {
        return res.status(404).json({ success: false, message: 'Module not found' });
      }
      res.json({ success: true, data: { module: mod } });
    } catch (error) {
      console.error('Error fetching module:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch module' });
    }
  }

  static async create(req, res) {
    try {
      const { name, code } = req.body;
      if (!name || !String(name).trim()) {
        return res.status(400).json({ success: false, message: 'Module name is required' });
      }
      const codeVal = (code || String(name).trim().toLowerCase().replace(/\s+/g, '_')).trim();
      const existingByName = await Module.findByName(name.trim());
      if (existingByName) {
        return res.status(400).json({ success: false, message: 'Module with this name already exists' });
      }
      const existingByCode = await Module.findByCode(codeVal);
      if (existingByCode) {
        return res.status(400).json({ success: false, message: 'Module with this code already exists' });
      }
      const module = await Module.create({ name: name.trim(), code: codeVal });
      res.status(201).json({ success: true, data: { module }, message: 'Module created successfully' });
    } catch (error) {
      console.error('Error creating module:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create module' });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const { name, code } = req.body;
      const existing = await Module.findById(parseInt(id));
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Module not found' });
      }
      if (name !== undefined && name.trim() !== existing.name) {
        const dup = await Module.findByName(name.trim());
        if (dup) return res.status(400).json({ success: false, message: 'Module with this name already exists' });
      }
      const codeVal = code !== undefined ? String(code).trim().toLowerCase().replace(/\s+/g, '_') : undefined;
      if (codeVal && codeVal !== existing.code) {
        const dup = await Module.findByCode(codeVal);
        if (dup) return res.status(400).json({ success: false, message: 'Module with this code already exists' });
      }
      const module = await Module.update(parseInt(id), { name: name !== undefined ? name.trim() : undefined, code: codeVal });
      res.json({ success: true, data: { module }, message: 'Module updated successfully' });
    } catch (error) {
      console.error('Error updating module:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to update module' });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      const existing = await Module.findById(parseInt(id));
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Module not found' });
      }
      await Module.delete(parseInt(id));
      res.json({ success: true, message: 'Module deleted successfully' });
    } catch (error) {
      console.error('Error deleting module:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to delete module' });
    }
  }
}

module.exports = ModulesController;
