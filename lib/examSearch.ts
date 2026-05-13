/**
 * Multi-token exam search: every word must appear somewhere in the haystack (substring).
 * Empty query matches all.
 */
export function matchesExamSearchTokens(haystackParts: (string | null | undefined)[], rawQuery: string): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;
  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  const hay = haystackParts
    .filter((p): p is string => p != null && String(p).trim() !== "")
    .map((p) => String(p).toLowerCase())
    .join(" ");
  return tokens.every((t) => hay.includes(t));
}
