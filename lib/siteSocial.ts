/**
 * Public social URLs for marketing pages (blogs cards, etc.).
 * Set in `.env.local`: NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL, LINKEDIN_URL, X_URL
 * Email: NEXT_PUBLIC_SOCIAL_EMAIL_URL (full mailto:...) or NEXT_PUBLIC_UNITRACKO_CONTACT_EMAIL (address only).
 */
function siteMailtoHref(): string {
  const url = process.env.NEXT_PUBLIC_SOCIAL_EMAIL_URL?.trim();
  if (url) return url;
  const addr = process.env.NEXT_PUBLIC_UNITRACKO_CONTACT_EMAIL?.trim();
  if (addr) return addr.startsWith("mailto:") ? addr : `mailto:${addr}`;
  return "mailto:privacy@unitracko.com";
}

export const siteSocialLinks = {
  instagram:
    process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL?.trim() ||
    process.env.NEXT_PUBLIC_UNITRACKO_INSTAGRAM_URL?.trim() ||
    "#",
  linkedin:
    process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN_URL?.trim() ||
    process.env.NEXT_PUBLIC_UNITRACKO_LINKEDIN_URL?.trim() ||
    "#",
  x:
    process.env.NEXT_PUBLIC_SOCIAL_X_URL?.trim() ||
    process.env.NEXT_PUBLIC_UNITRACKO_X_URL?.trim() ||
    "#",
  email: siteMailtoHref(),
} as const;
