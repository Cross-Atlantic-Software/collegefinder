/** Canonical public URL for a blog post (used when sharing from localhost). */
export function getPublicBlogShareUrl(slug: string): string {
  const configuredBase =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://unitracko.com";
  const base = configuredBase.replace(/\/+$/, "");
  return `${base}/blogs/${encodeURIComponent(slug)}`;
}
