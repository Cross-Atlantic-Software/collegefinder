/**
 * Deep-merge partial CMS JSON over defaults. Arrays from stored replace defaults entirely when present.
 */
function deepMergeLandingContent(base, override) {
  if (override === undefined || override === null) {
    return base;
  }
  if (Array.isArray(override)) {
    return override.length ? override : base;
  }
  if (typeof override === 'object' && override !== null && !Array.isArray(override)) {
    if (typeof base !== 'object' || base === null || Array.isArray(base)) {
      return { ...override };
    }
    const out = { ...base };
    for (const key of Object.keys(override)) {
      out[key] = deepMergeLandingContent(base[key], override[key]);
    }
    return out;
  }
  return override;
}

module.exports = { deepMergeLandingContent };
