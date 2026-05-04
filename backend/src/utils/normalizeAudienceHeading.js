/**
 * Migrate legacy `headingAndParents` (single string) into `headingAnd` + `headingParents`.
 * Removes `headingAndParents` from the object. Ensures non-empty defaults.
 */
function normalizeAudienceHeading(audience) {
  if (!audience || typeof audience !== 'object') return audience;
  const a = { ...audience };

  if (a.headingAndParents != null && String(a.headingAndParents).trim() !== '') {
    const legacy = String(a.headingAndParents).trim();
    const spaceIdx = legacy.indexOf(' ');
    if (spaceIdx > 0) {
      a.headingAnd = legacy.slice(0, spaceIdx);
      a.headingParents = legacy.slice(spaceIdx + 1).trim();
    } else {
      a.headingParents = legacy;
    }
  }

  delete a.headingAndParents;

  if (!String(a.headingAnd ?? '').trim()) {
    a.headingAnd = 'And';
  }
  if (!String(a.headingParents ?? '').trim()) {
    a.headingParents = 'Parents';
  }

  return a;
}

module.exports = { normalizeAudienceHeading };
