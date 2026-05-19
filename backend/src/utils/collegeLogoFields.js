function isLikelyS3Url(url) {
  if (!url || typeof url !== 'string') return false;
  return url.includes('.amazonaws.com/') || /s3[.-][^.]+\.amazonaws\.com/i.test(url);
}

function isHttpUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return /^https?:\/\//i.test(url.trim());
}

/** First displayable logo: S3/uploaded URL, then external logo_url, then logo_filename if it is a URL. */
function resolveCollegeLogoDisplayUrl(row) {
  if (!row) return null;
  const cl = row.college_logo != null ? String(row.college_logo).trim() : '';
  if (cl) return cl;
  const lu = row.logo_url != null ? String(row.logo_url).trim() : '';
  if (lu) return lu;
  const lf = row.logo_filename != null ? String(row.logo_filename).trim() : '';
  if (lf && isHttpUrl(lf)) return lf;
  return null;
}

/** Derive stored college_logo + logo_url from a single client-provided image URL (external link or S3). */
function normalizeCollegeLogoFields(collegeLogoRaw) {
  const u = collegeLogoRaw != null ? String(collegeLogoRaw).trim() || null : null;
  if (!u) return { college_logo: null, logo_url: null };
  if (isLikelyS3Url(u)) return { college_logo: u, logo_url: null };
  return { college_logo: u, logo_url: u };
}

/**
 * Parse logo fields from API body or bulk row cells.
 * college_logo = S3 or pasted full URL; logo_url = external image link; logo_filename = ZIP match name.
 */
function parseCollegeLogoFields({ college_logo, logo_url, logo_filename } = {}) {
  let outCollegeLogo = null;
  let outLogoUrl = null;
  let outLogoFilename = null;

  if (logo_filename !== undefined && logo_filename !== null) {
    outLogoFilename = String(logo_filename).trim() || null;
  }

  if (logo_url !== undefined && logo_url !== null) {
    const u = String(logo_url).trim() || null;
    if (u && isHttpUrl(u)) {
      outLogoUrl = u;
    } else if (u) {
      outLogoFilename = outLogoFilename || u;
    }
  }

  if (college_logo !== undefined && college_logo !== null) {
    const raw = String(college_logo).trim() || null;
    if (raw) {
      if (isLikelyS3Url(raw) || !isHttpUrl(raw)) {
        const norm = normalizeCollegeLogoFields(raw);
        outCollegeLogo = norm.college_logo;
        if (norm.logo_url && !outLogoUrl) outLogoUrl = norm.logo_url;
      } else {
        const norm = normalizeCollegeLogoFields(raw);
        outCollegeLogo = norm.college_logo;
        if (norm.logo_url && !outLogoUrl) outLogoUrl = norm.logo_url;
      }
    }
  }

  return {
    college_logo: outCollegeLogo,
    logo_url: outLogoUrl,
    logo_filename: outLogoFilename,
  };
}

/** Bulk Excel: separate logo_url and logo_filename columns. */
function parseCollegeLogoBulkCells(logoUrlRaw, logoFilenameRaw) {
  const urlCell = logoUrlRaw != null ? String(logoUrlRaw).trim() : '';
  const fnCell = logoFilenameRaw != null ? String(logoFilenameRaw).trim() : '';
  return parseCollegeLogoFields({
    logo_url: urlCell || undefined,
    logo_filename: fnCell || undefined,
    college_logo: urlCell && !isHttpUrl(urlCell) ? urlCell : undefined,
  });
}

module.exports = {
  isLikelyS3Url,
  isHttpUrl,
  resolveCollegeLogoDisplayUrl,
  normalizeCollegeLogoFields,
  parseCollegeLogoFields,
  parseCollegeLogoBulkCells,
};
