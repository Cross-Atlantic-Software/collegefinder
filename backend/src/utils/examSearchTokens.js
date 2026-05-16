/**
 * Multi-token exam search: every token must appear somewhere in the haystack (substring).
 * Mirrors frontend lib/examSearch.ts for consistent dashboard tab filtering.
 */
function matchesExamSearchTokens(haystackParts, rawQuery) {
  const q = String(rawQuery || '').trim().toLowerCase();
  if (!q) return true;
  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  const hay = haystackParts
    .filter((p) => p != null && String(p).trim() !== '')
    .map((p) => String(p).toLowerCase())
    .join(' ');
  return tokens.every((t) => hay.includes(t));
}

module.exports = { matchesExamSearchTokens };
