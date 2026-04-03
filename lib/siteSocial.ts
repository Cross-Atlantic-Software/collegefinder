/**
 * Public social URLs for marketing pages (blogs cards, etc.).
 * Set in `.env.local`: NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL, LINKEDIN_URL, X_URL
 */
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
} as const;
