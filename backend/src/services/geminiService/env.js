/**
 * Resolve Google Gemini API key from environment.
 * Supports the same variable names commonly used with Python / Google SDK samples.
 */
function getGoogleApiKey() {
  const k = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  return k ? String(k).trim() : '';
}

module.exports = { getGoogleApiKey };
