/**
 * Resolve Gemini model name from API list or fallback.
 */
const { FALLBACK_MODEL_NAMES } = require('./config');

/**
 * Fetch available models from Gemini API and pick one that supports generateContent (multimodal).
 * Prefers flash for speed, then newest version. Excludes names in excludedSet.
 * @param {string} apiKey - GOOGLE_API_KEY
 * @param {Set<string>} excludedSet - Model names to skip (e.g. after 404)
 * @returns {Promise<string>} Model name
 */
async function fetchAndPickModelName(apiKey, excludedSet = new Set()) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}&pageSize=100`;
  const excluded = excludedSet || new Set();
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Models list API ${res.status}: ${await res.text()}`);
    }
    const data = await res.json();
    const models = data.models || [];
    const supported = models.filter((m) => {
      const methods = m.supportedGenerationMethods || m.supported_generation_methods || [];
      const str = methods.join(' ').toLowerCase();
      return str.includes('generatecontent');
    });
    if (supported.length === 0) {
      throw new Error('No models with generateContent found in API response');
    }
    let nameOnly = supported.map((m) => (m.name || '').replace(/^models\//i, '')).filter(Boolean);
    nameOnly = nameOnly.filter((n) => !excluded.has(n));
    if (nameOnly.length === 0) {
      throw new Error('All available models have been excluded (e.g. 404). Set GEMINI_MODEL in .env.');
    }
    nameOnly.sort((a, b) => {
      const score = (n) => {
        let s = 0;
        if (/3\.(1|0)/.test(n)) s += 300;
        else if (/2\.5/.test(n)) s += 250;
        else if (/2\.0/.test(n)) s += 200;
        else if (/1\.5/.test(n)) s += 150;
        if (/flash/i.test(n)) s += 10;
        else if (/pro/i.test(n)) s += 5;
        return s;
      };
      return score(b) - score(a);
    });
    const chosen = nameOnly[0];
    console.log('✅ Gemini: picked model from API list:', chosen);
    return chosen;
  } catch (err) {
    console.warn('⚠️  Could not fetch models list:', err.message, '- using fallback list');
    const fallback = FALLBACK_MODEL_NAMES.find((n) => !excluded.has(n));
    return fallback || FALLBACK_MODEL_NAMES[0];
  }
}

module.exports = { fetchAndPickModelName };
