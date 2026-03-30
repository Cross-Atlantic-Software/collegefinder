/**
 * Builds the user prompt for multi-platform social content + image prompt placeholders.
 */

function formatPreviousPosts(previousPosts) {
  if (!Array.isArray(previousPosts) || previousPosts.length === 0) {
    return '(none — establish tone from account type only)';
  }
  const trimmed = previousPosts
    .map((p) => (typeof p === 'string' ? p.trim() : JSON.stringify(p)))
    .filter(Boolean)
    .slice(0, 12);
  return trimmed.length ? trimmed.map((t, i) => `${i + 1}. ${t}`).join('\n') : '(none)';
}

function buildSocialContentPrompt(thoughts, accountType, previousPosts) {
  const toneHint =
    accountType === 'founder'
      ? 'Founder account: storytelling, personal voice, emotional resonance, authentic; still professional.'
      : 'Project / brand account: informative, structured, clear value; professional and trustworthy.';

  const previousBlock = formatPreviousPosts(previousPosts);

  return `You are a professional social media content creator.

Inputs:
- Thoughts: ${thoughts.trim()}
- Account Type: ${accountType} (${accountType === 'founder' ? 'founder' : 'project'} voice)
- Previous Posts (for style reference only):
${previousBlock}

Tone rules:
- ${toneHint}
- If previous posts are provided, mirror their language register, pacing, and formatting habits without copying phrases verbatim.
- Avoid repeating the same hook across platforms; each surface should feel native.

Tasks:
1. Generate a compelling title for this batch of content.
2. Write a 300–500 word article expanding the thoughts (blog-style, coherent sections).
3. Create a LinkedIn post: professional, engaging, suitable as a single post (paragraphs ok).
4. Create a Twitter/X thread of 3–5 tweets (short lines; tweet 1 is the hook).
5. Create Instagram carousel slide copy: 5–7 slides, each slide one or two short lines (no slide numbers in text unless natural).
6. Propose image generation prompts for a future API (no images now):
   - linkedin: one string — minimal professional scene, no overlaid text in image, brand-safe.
   - twitter: one string — engaging visual suggestion; may reference mood/theme of the thread (still no text in image).
   - instagram: array of strings — one visual prompt per slide, same count as instagramSlides, cohesive aesthetic.

Return a single JSON object ONLY (no markdown fences) in this exact shape:
{
  "title": "",
  "article": "",
  "linkedin": "",
  "twitter": [],
  "instagramSlides": [],
  "imagePrompts": {
    "linkedin": "",
    "twitter": "",
    "instagram": []
  }
}`;
}

module.exports = {
  buildSocialContentPrompt,
  formatPreviousPosts,
};
