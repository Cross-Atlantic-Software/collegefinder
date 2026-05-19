/** Shared college logo display: college_logo (S3), then logo_url, then logo_filename if it is a URL. */
export function isHttpUrl(s: string | null | undefined): boolean {
  return !!s?.trim() && /^https?:\/\//i.test(s.trim());
}

export function resolveCollegeLogoSrc(
  c: {
    college_logo?: string | null;
    logo_url?: string | null;
    logo_filename?: string | null;
  } | null | undefined
): string | null {
  if (!c) return null;
  const cl = c.college_logo?.trim();
  if (cl) return cl;
  const lu = c.logo_url?.trim();
  if (lu) return lu;
  const lf = c.logo_filename?.trim();
  if (lf && isHttpUrl(lf)) return lf;
  return null;
}
