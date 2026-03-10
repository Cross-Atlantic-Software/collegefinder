/**
 * Gemini service configuration and constants.
 */

const GENERATION_CONFIG = {
  temperature: 0.7,
  topP: 0.8,
  topK: 40,
  maxOutputTokens: 8192,
};

/** Model used for generating diagram images (text + image output). Uses REST API for responseModalities. */
const IMAGE_GENERATION_MODEL = 'gemini-2.0-flash-exp-image-generation';

/** Diagram type to placeholder image URL (fallback when image generation or S3 upload fails) */
const DIAGRAM_IMAGE_URLS = {
  circuit: 'https://placehold.co/480x280/1e293b/94a3b8?text=Circuit+Diagram',
  free_body: 'https://placehold.co/480x280/1e293b/94a3b8?text=Free+Body+Diagram',
  ray_diagram: 'https://placehold.co/480x280/1e293b/94a3b8?text=Ray+Diagram',
  kinematics_graph: 'https://placehold.co/480x280/1e293b/94a3b8?text=Kinematics+Graph',
  field_lines: 'https://placehold.co/480x280/1e293b/94a3b8?text=Field+Lines',
  optics_setup: 'https://placehold.co/480x280/1e293b/94a3b8?text=Optics+Setup',
  pulley_system: 'https://placehold.co/480x280/1e293b/94a3b8?text=Pulley+System',
  thermodynamics: 'https://placehold.co/480x280/1e293b/94a3b8?text=P-V+Diagram'
};

/** Fallback model names only when list-models API fails (prefer 2.5 then 2.0; short names may 404) */
const FALLBACK_MODEL_NAMES = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
];

let uploadToS3 = null;
try {
  const s3 = require('../../../utils/storage/s3Upload');
  uploadToS3 = s3.uploadToS3;
} catch (_) {
  // S3 optional for diagram upload; fallback to placeholder if missing
}

module.exports = {
  GENERATION_CONFIG,
  IMAGE_GENERATION_MODEL,
  DIAGRAM_IMAGE_URLS,
  FALLBACK_MODEL_NAMES,
  getUploadToS3: () => uploadToS3,
};
