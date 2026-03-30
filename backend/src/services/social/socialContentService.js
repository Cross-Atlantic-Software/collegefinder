const geminiService = require('../geminiService');
const { buildSocialContentPrompt } = require('./socialContentPrompt');

function asStringArray(v) {
  if (Array.isArray(v)) {
    return v.map((x) => String(x ?? '').trim()).filter(Boolean);
  }
  if (typeof v === 'string' && v.trim()) {
    return [v.trim()];
  }
  return [];
}

function normalizeImagePrompts(raw, instagramSlideCount) {
  const ip = raw && typeof raw === 'object' ? raw : {};
  const linkedin = typeof ip.linkedin === 'string' ? ip.linkedin.trim() : '';
  const twitter = typeof ip.twitter === 'string' ? ip.twitter.trim() : '';
  let instagram = asStringArray(ip.instagram);

  if (instagram.length < instagramSlideCount) {
    while (instagram.length < instagramSlideCount) {
      instagram.push(
        `Minimal cohesive social graphic, slide ${instagram.length + 1}, soft gradient background, no text, brand-safe`
      );
    }
  } else if (instagramSlideCount > 0) {
    instagram = instagram.slice(0, instagramSlideCount);
  }

  return {
    linkedin:
      linkedin ||
      'Minimal professional abstract background, soft lighting, no text, editorial clean style',
    twitter:
      twitter ||
      'Bold simple composition, high contrast, energetic mood, no text overlay, social-safe',
    instagram,
  };
}

/**
 * @param {{ thoughts: string, accountType: 'project'|'founder', previousPosts?: string[] }} input
 * @returns {Promise<object>} Normalized content + imagePrompts
 */
async function generateSocialContent(input) {
  const { thoughts, accountType, previousPosts = [] } = input;

  if (!thoughts || typeof thoughts !== 'string' || !thoughts.trim()) {
    const err = new Error('Thoughts cannot be empty');
    err.statusCode = 400;
    throw err;
  }

  const at = accountType === 'founder' ? 'founder' : accountType === 'project' ? 'project' : null;
  if (!at) {
    const err = new Error('accountType must be "project" or "founder"');
    err.statusCode = 400;
    throw err;
  }

  const prev = Array.isArray(previousPosts) ? previousPosts : [];
  const prompt = buildSocialContentPrompt(thoughts, at, prev);

  let data;
  try {
    data = await geminiService.generateJsonFromPrompt(prompt);
  } catch (e) {
    const err = new Error(e.message || 'Failed to generate content with Gemini');
    err.statusCode = 502;
    err.cause = e;
    throw err;
  }

  const title = typeof data.title === 'string' ? data.title.trim() : '';
  const article = typeof data.article === 'string' ? data.article.trim() : '';
  const linkedin = typeof data.linkedin === 'string' ? data.linkedin.trim() : '';
  let twitter = asStringArray(data.twitter);
  let instagramSlides = asStringArray(data.instagramSlides);

  if (twitter.length > 5) twitter = twitter.slice(0, 5);
  if (twitter.length < 3 && twitter.length > 0) {
    /* keep as-is if model returned 1–2 */
  }
  if (instagramSlides.length > 7) instagramSlides = instagramSlides.slice(0, 7);
  if (instagramSlides.length < 5 && instagramSlides.length > 0) {
    /* allow 5–7 preferred but accept fewer */
  }

  const imagePrompts = normalizeImagePrompts(data.imagePrompts, instagramSlides.length);

  return {
    title: title || 'Untitled',
    article,
    linkedin,
    twitter,
    instagramSlides,
    imagePrompts,
  };
}

module.exports = {
  generateSocialContent,
};
