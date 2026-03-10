/**
 * Resolve Gemini model name from the API list so we only use model IDs that exist (avoids 404).
 */
const { FALLBACK_MODEL_NAMES } = require('./config');

/** Exclude experimental/preview/lite models that often have high demand (503). */
function isStableModel(name) {
  const n = (name || '').toLowerCase();
  return !n.includes('preview') && !n.includes('-exp') && !n.includes('lite');
}

/**
 * Fetch available models from Gemini API and pick one that supports generateContent.
 * Always uses the list API first so the chosen model exists (avoids 404 on deprecated IDs).
 * @param {string} apiKey - GOOGLE_API_KEY
 * @param {Set<string>} excludedSet - Model names to skip (e.g. after 404)
 * @returns {Promise<string>} Model name
 */
async function fetchAndPickModelName(apiKey, excludedSet = new Set()) {
  const excluded = excludedSet || new Set();
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}&pageSize=100`;

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
    nameOnly = nameOnly.filter((n) => !excluded.has(n) && isStableModel(n));
    if (nameOnly.length === 0) {
      const anyStable = supported.map((m) => (m.name || '').replace(/^models\//i, '')).filter(Boolean).filter(isStableModel);
      nameOnly = anyStable.filter((n) => !excluded.has(n));
    }
    if (nameOnly.length === 0) {
      const fallback = FALLBACK_MODEL_NAMES.find((n) => !excluded.has(n));
      console.log('✅ Gemini: using fallback model:', fallback || FALLBACK_MODEL_NAMES[0]);
      return fallback || FALLBACK_MODEL_NAMES[0];
    }
    nameOnly.sort((a, b) => {
      const score = (n) => {
        let s = 0;
        if (/2\.5/.test(n)) s += 250;
        else if (/2\.0/.test(n) && !n.includes('-001')) s += 200;
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
    console.warn('⚠️  Could not fetch models list:', err.message, '- using fallback');
    const fallback = FALLBACK_MODEL_NAMES.find((n) => !excluded.has(n));
    return fallback || FALLBACK_MODEL_NAMES[0];
  }
}

module.exports = { fetchAndPickModelName };
