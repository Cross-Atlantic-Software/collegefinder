/**
 * Shared utilities for bulk upload templates and parsing.
 * Easy format: plain text, flexible separators, no JSON required.
 */

/**
 * Split a string by comma, semicolon, pipe, or newline. Returns trimmed non-empty parts.
 */
function splitList(raw) {
  if (raw == null || typeof raw !== 'string') return [];
  return raw.split(/[,;|\n]+/).map((s) => s.trim()).filter(Boolean);
}

/**
 * Parse date from various formats. Returns YYYY-MM-DD or null.
 */
function parseDate(val) {
  if (val == null || val === '') return null;
  const s = String(val).trim();
  if (!s) return null;
  // Try string formats first (avoid parseFloat on "01-12-2025" -> 1)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const ddmmyyyy = s.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
  if (ddmmyyyy) {
    const [, d, m, y] = ddmmyyyy;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  const yyyymmdd = s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/);
  if (yyyymmdd) {
    const [, y, m, d] = yyyymmdd;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  // Excel date serial number (last resort)
  const n = typeof val === 'number' ? val : parseFloat(s);
  if (!isNaN(n) && n > 0 && n < 1000000 && !s.includes('-') && !s.includes('/')) {
    const d = new Date((n - 25569) * 86400 * 1000);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  return null;
}

/**
 * Parse boolean. Accepts: 1, true, yes (case-insensitive). Empty = true. Else false.
 */
function parseBool(val, defaultValue = false) {
  if (val == null || val === '') return defaultValue;
  return /^(1|true|yes)$/i.test(String(val).trim());
}

/**
 * Get cell value by trying multiple keys. Returns trimmed string or ''.
 */
function getCell(row, ...keys) {
  for (const k of keys) {
    const v = row[k];
    if (v != null && String(v).trim() !== '') return String(v).trim();
  }
  return '';
}

module.exports = { splitList, parseDate, parseBool, getCell };
