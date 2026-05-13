/**
 * Human-readable durations: exam pattern “hours as stored”, test timers (minutes), and media (seconds).
 */

/**
 * `exam_pattern.duration_minutes` is the **hours value as entered** in admin/Excel (e.g. 3 → show `3 Hrs`).
 * No unit conversion — display only.
 */
export function formatExamPatternDurationHours(value: number | null | undefined): string {
  if (value == null) return "—";
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "—";
  if (Number.isInteger(n)) return `${n} Hrs`;
  const rounded = Math.round(n * 100) / 100;
  return `${rounded} Hrs`;
}

/** Values stored as minutes (e.g. test format `duration_minutes` for countdown). */
export function formatDurationMinutes(minutes: number | null | undefined): string {
  if (minutes == null) return "—";
  const n = Math.round(Number(minutes));
  if (!Number.isFinite(n) || n <= 0) return "—";
  const h = Math.floor(n / 60);
  const min = n % 60;
  if (h === 0) return `${min} min`;
  if (min === 0) return h === 1 ? "1 hour" : `${h} hours`;
  return `${h} hr ${min} min`;
}

/** Wall-clock length from seconds (e.g. YouTube `contentDetails.duration`). */
export function formatDurationFromSeconds(seconds: number | null | undefined): string {
  if (seconds == null) return "—";
  const n = Math.round(Number(seconds));
  if (!Number.isFinite(n) || n <= 0) return "—";
  const h = Math.floor(n / 3600);
  const m = Math.floor((n % 3600) / 60);
  const s = n % 60;
  if (h >= 1) {
    if (m > 0) return `${h} hr ${m} min`;
    if (s > 0) return `${h} hr ${s} s`;
    return h === 1 ? "1 hr" : `${h} hr`;
  }
  if (m >= 1) return s > 0 ? `${m} min ${s} s` : `${m} min`;
  return `${s} s`;
}
