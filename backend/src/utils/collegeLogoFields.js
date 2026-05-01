function isLikelyS3Url(url) {
  if (!url || typeof url !== 'string') return false;
  return url.includes('.amazonaws.com/') || /s3[.-][^.]+\.amazonaws\.com/i.test(url);
}

/** Derive stored college_logo + logo_url from a single client-provided image URL (external link or S3). */
function normalizeCollegeLogoFields(collegeLogoRaw) {
  const u = collegeLogoRaw != null ? String(collegeLogoRaw).trim() || null : null;
  if (!u) return { college_logo: null, logo_url: null };
  if (isLikelyS3Url(u)) return { college_logo: u, logo_url: null };
  return { college_logo: u, logo_url: u };
}

module.exports = { isLikelyS3Url, normalizeCollegeLogoFields };
