/**
 * Normalize exam date values from PostgreSQL (Date object or ISO string) to YYYY-MM-DD.
 */
function normalizeExamDateIso(raw) {
  if (raw == null || raw === '') return null;

  if (raw instanceof Date) {
    if (Number.isNaN(raw.getTime())) return null;
    return raw.toISOString().slice(0, 10);
  }

  const text = String(raw).trim();
  const isoPrefix = text.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoPrefix) return isoPrefix[1];

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function addDaysToIsoDate(isoDate, days) {
  const base = normalizeExamDateIso(isoDate);
  if (!base) return null;

  const d = new Date(`${base}T12:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;

  d.setUTCDate(d.getUTCDate() + days);
  const out = d.toISOString().slice(0, 10);
  return Number.isNaN(new Date(`${out}T12:00:00.000Z`).getTime()) ? null : out;
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

/** ISO week start (Monday) as YYYY-MM-DD — matches PostgreSQL date_trunc('week', …) in UTC. */
function weekStartIsoFromIsoDate(isoDate) {
  const base = normalizeExamDateIso(isoDate);
  if (!base) return null;

  const d = new Date(`${base}T12:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;

  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

module.exports = {
  normalizeExamDateIso,
  addDaysToIsoDate,
  todayIsoDate,
  weekStartIsoFromIsoDate,
};
