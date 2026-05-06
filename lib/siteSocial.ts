/**
 * Public social URLs for marketing pages (blogs cards, etc.).
 * Set in `.env.local`: NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL, NEXT_PUBLIC_SOCIAL_LINKEDIN_URL,
 * NEXT_PUBLIC_SOCIAL_X_URL, NEXT_PUBLIC_SOCIAL_YOUTUBE_URL
 * Email: NEXT_PUBLIC_SOCIAL_EMAIL_URL (full mailto:...) or NEXT_PUBLIC_UNITRACKO_CONTACT_EMAIL (address only).
 */
function siteMailtoHref(): string {
  const url = process.env.NEXT_PUBLIC_SOCIAL_EMAIL_URL?.trim();
  if (url) return url;
  const addr = process.env.NEXT_PUBLIC_UNITRACKO_CONTACT_EMAIL?.trim();
  if (addr) return addr.startsWith("mailto:") ? addr : `mailto:${addr}`;
  return "mailto:contact@unitracko.com";
}

const DEFAULT_INSTAGRAM = "https://www.instagram.com/unitracko/";
const DEFAULT_LINKEDIN = "https://www.linkedin.com/company/unitracko1";
const DEFAULT_X = "https://x.com/UniTracko";
const DEFAULT_YOUTUBE = "https://www.youtube.com/@UniTracko_09";

export const siteSocialLinks = {
  instagram:
    process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL?.trim() ||
    process.env.NEXT_PUBLIC_UNITRACKO_INSTAGRAM_URL?.trim() ||
    DEFAULT_INSTAGRAM,
  linkedin:
    process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN_URL?.trim() ||
    process.env.NEXT_PUBLIC_UNITRACKO_LINKEDIN_URL?.trim() ||
    DEFAULT_LINKEDIN,
  x:
    process.env.NEXT_PUBLIC_SOCIAL_X_URL?.trim() ||
    process.env.NEXT_PUBLIC_UNITRACKO_X_URL?.trim() ||
    DEFAULT_X,
  youtube:
    process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE_URL?.trim() ||
    process.env.NEXT_PUBLIC_UNITRACKO_YOUTUBE_URL?.trim() ||
    DEFAULT_YOUTUBE,
  email: siteMailtoHref(),
} as const;
