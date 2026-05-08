const legalDefaults = require('../constants/legal-document.defaults.json');

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Merge stored CMS patch over packaged defaults (by section id).
 */
function mergeLegalDocument(storedPatch) {
  const base = clone(legalDefaults);
  if (!storedPatch || typeof storedPatch !== 'object') {
    return base;
  }

  const out = { ...base, sections: clone(base.sections) };

  if (storedPatch.intro && Array.isArray(storedPatch.intro) && storedPatch.intro.length > 0) {
    out.intro = storedPatch.intro;
  }
  if (storedPatch.introHtml !== undefined && storedPatch.introHtml !== null) {
    out.introHtml = storedPatch.introHtml;
  }
  if (storedPatch.meta && typeof storedPatch.meta === 'object') {
    out.meta = { ...base.meta, ...storedPatch.meta };
  }

  if (storedPatch.sections && Array.isArray(storedPatch.sections)) {
    const patchById = new Map(storedPatch.sections.map((s) => [s.id, s]));
    out.sections = base.sections.map((sec) => {
      const p = patchById.get(sec.id);
      if (!p) return { ...sec };
      const merged = {
        ...sec,
        ...p,
        paragraphs:
          p.paragraphs && Array.isArray(p.paragraphs) && p.paragraphs.length > 0
            ? p.paragraphs
            : sec.paragraphs,
      };
      if (p.bodyHtml !== undefined) merged.bodyHtml = p.bodyHtml;
      return merged;
    });
    for (const p of storedPatch.sections) {
      if (p && p.id && !out.sections.some((s) => s.id === p.id)) {
        out.sections.push(p);
      }
    }
  }

  return out;
}

module.exports = { mergeLegalDocument, legalDefaults: () => clone(legalDefaults) };
