/**
 * Modular utilities for logo/image upload from ZIP files.
 * Used by exams, career goals, colleges, institutes, loans for bulk and missing-logo uploads.
 */

const AdmZip = require('adm-zip');

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|bmp)$/i;

/**
 * Parse a ZIP buffer and extract image files.
 * Returns Map<lowercaseFilename, { buffer, originalname }>
 * @param {Buffer} zipBuffer - Raw ZIP file buffer
 * @returns {Map<string, { buffer: Buffer, originalname: string }>}
 */
function parseLogosFromZip(zipBuffer) {
  const logoMap = new Map();
  if (!zipBuffer || !Buffer.isBuffer(zipBuffer)) return logoMap;
  try {
    const zip = new AdmZip(zipBuffer);
    const entries = zip.getEntries();
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (entry.isDirectory) continue;
      const name = (entry.entryName || entry.name || '').replace(/^.*[\\/]/, '').trim();
      if (!name || !IMAGE_EXT.test(name)) continue;
      const buffer = entry.getData();
      if (buffer && buffer.length) {
        logoMap.set(name.toLowerCase(), { buffer, originalname: name });
      }
    }
  } catch (_) {
    // Return empty map on parse error; caller handles validation
  }
  return logoMap;
}

/**
 * Build logo map from multer files (logos_zip or individual logos).
 * @param {object} files - req.files from multer
 * @param {string} zipField - Field name for ZIP (e.g. 'logos_zip')
 * @param {string} multiField - Field name for multiple files (e.g. 'logos')
 * @returns {Map<string, { buffer: Buffer, originalname: string } | object>}
 */
function buildLogoMapFromRequest(files, zipField = 'logos_zip', multiField = 'logos') {
  const logoMap = new Map();
  const zipFile = files?.[zipField]?.[0];
  if (zipFile && zipFile.buffer) {
    const parsed = parseLogosFromZip(zipFile.buffer);
    parsed.forEach((v, k) => logoMap.set(k, v));
  } else {
    const logosRaw = files?.[multiField];
    const logoFiles = Array.isArray(logosRaw) ? logosRaw : (logosRaw ? [logosRaw] : []);
    logoFiles.forEach((f) => {
      if (f && (f.buffer || f.path)) {
        const name = (f.originalname || f.name || '').trim();
        if (name) logoMap.set(name.toLowerCase(), f);
      }
    });
  }
  return logoMap;
}

/**
 * Process "upload missing logos" flow: for each image in the map, find records
 * with matching logo_filename and no logo, upload to S3, update records.
 *
 * @param {Map<string, { buffer: Buffer, originalname: string }>} logoMap - From parseLogosFromZip
 * @param {object} options
 * @param {function(string): Promise<Array>} options.findRecordsByFilename - (filename) => records with logo_filename match and no logo
 * @param {function(Buffer, string, string): Promise<string>} options.uploadToS3 - (buffer, filename, folder) => S3 URL
 * @param {string} options.s3Folder - S3 folder (e.g. 'exam-logos', 'career-goals-taxonomies')
 * @param {string} options.logoColumn - DB column name for logo URL (e.g. 'exam_logo', 'logo')
 * @param {function(number, object): Promise<void>} options.updateRecord - (id, { [logoColumn]: url }) => update DB
 * @param {function(object): object} [options.toResultItem] - (record) => item for updated array
 * @returns {{ updated: Array, skipped: string[], errors: Array, summary: object }}
 */
async function processMissingLogosFromZip(logoMap, options) {
  const {
    findRecordsByFilename,
    uploadToS3,
    s3Folder,
    logoColumn,
    updateRecord,
    toResultItem = (r) => ({ id: r.id, name: r.name || r.label || r.institute_name || r.college_name || r.provider_name, logo_file_name: r.logo_file_name })
  } = options;

  const updated = [];
  const skipped = [];
  const errors = [];

  for (const [filenameLower, file] of logoMap) {
    const records = await findRecordsByFilename(file.originalname);
    if (!records || records.length === 0) {
      skipped.push(file.originalname);
      continue;
    }
    try {
      const logoUrl = await uploadToS3(file.buffer, file.originalname, s3Folder);
      for (const rec of records) {
        await updateRecord(rec.id, { [logoColumn]: logoUrl });
        updated.push(toResultItem(rec));
      }
    } catch (uploadErr) {
      errors.push({ file: file.originalname, message: uploadErr.message });
    }
  }

  return {
    updated,
    skipped,
    errors,
    summary: {
      logosAdded: updated.length,
      filesSkipped: skipped.length,
      uploadErrors: errors.length
    }
  };
}

module.exports = {
  parseLogosFromZip,
  buildLogoMapFromRequest,
  processMissingLogosFromZip,
  IMAGE_EXT
};
