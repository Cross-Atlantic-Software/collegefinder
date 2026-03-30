/**
 * YouTube embed / URL parsing and Data API v3 snippet fetch (server-side only).
 * API key (in order): YOUTUBE_API_KEY, GOOGLE_YOUTUBE_API_KEY, or GOOGLE_API_KEY.
 * Prefer YOUTUBE_API_KEY if GOOGLE_API_KEY is an AI Studio (Gemini) key — that key cannot call YouTube Data API.
 */

const MAX_LECTURE_DESCRIPTION_LENGTH = 10000;

/**
 * Normalize pasted embed HTML (Word/docs curly quotes, escaped entities).
 * @param {string} raw
 * @returns {string}
 */
function normalizeYoutubeEmbedInput(raw) {
  if (!raw || typeof raw !== 'string') return '';
  let s = raw.trim();
  s = s.replace(/[\u201c\u201d]/g, '"').replace(/[\u2018\u2019]/g, "'");
  s = s
    .replace(/&quot;/gi, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#x22;/gi, '"')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
  return s;
}

/**
 * Extract YouTube video id from raw iframe HTML or a watch/embed/shorts URL.
 * @param {string} raw
 * @returns {string|null}
 */
function extractYouTubeVideoId(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const s = normalizeYoutubeEmbedInput(raw);
  let iframeMatch = s.match(/src\s*=\s*(["'])([^"']*)\1/i);
  if (!iframeMatch) {
    iframeMatch = s.match(/src\s*=\s*([^\s>]+)/i);
  }
  const urlToParse = iframeMatch ? (iframeMatch[2] || iframeMatch[1]).replace(/^["']|["']$/g, '') : s;

  let m = urlToParse.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (m) return m[1];
  m = urlToParse.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (m) return m[1];
  m = urlToParse.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (m) return m[1];
  m = urlToParse.match(/youtube-nocookie\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (m) return m[1];
  m = urlToParse.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (m) return m[1];
  return null;
}

/**
 * @param {string} videoId
 * @param {string} apiKey
 * @returns {Promise<{ title: string, description: string } | null>}
 */
async function fetchYouTubeSnippet(videoId, apiKey) {
  if (!videoId || !apiKey) return null;
  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${encodeURIComponent(videoId)}&key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) {
    const msg = data?.error?.message || `YouTube API HTTP ${res.status}`;
    throw new Error(msg);
  }
  const sn = data.items?.[0]?.snippet;
  if (!sn) return null;
  return {
    title: sn.title || '',
    description: (sn.description || '').trim(),
  };
}

/**
 * If existing description is non-empty, return it (capped). Otherwise try YouTube API from iframe.
 * @param {string|null|undefined} iframeCode
 * @param {string|null|undefined} existingDescription
 * @returns {Promise<string|null>}
 */
async function enrichDescriptionFromYoutubeIframe(iframeCode, existingDescription) {
  const trimmed =
    existingDescription != null && String(existingDescription).trim() !== ''
      ? String(existingDescription).trim()
      : '';
  if (trimmed) {
    return trimmed.length > MAX_LECTURE_DESCRIPTION_LENGTH
      ? trimmed.slice(0, MAX_LECTURE_DESCRIPTION_LENGTH)
      : trimmed;
  }

  if (!iframeCode || !String(iframeCode).trim()) return null;

  const apiKey =
    process.env.YOUTUBE_API_KEY ||
    process.env.GOOGLE_YOUTUBE_API_KEY ||
    process.env.GOOGLE_API_KEY;
  if (!apiKey) return null;

  const videoId = extractYouTubeVideoId(String(iframeCode));
  if (!videoId) return null;

  try {
    const meta = await fetchYouTubeSnippet(videoId, apiKey);
    if (!meta?.description) return null;
    const d = meta.description;
    return d.length > MAX_LECTURE_DESCRIPTION_LENGTH ? d.slice(0, MAX_LECTURE_DESCRIPTION_LENGTH) : d;
  } catch (e) {
    console.error('YouTube metadata fetch failed:', e.message || e);
    return null;
  }
}

module.exports = {
  extractYouTubeVideoId,
  fetchYouTubeSnippet,
  enrichDescriptionFromYoutubeIframe,
  MAX_LECTURE_DESCRIPTION_LENGTH,
};
