/**
 * Node (Next server) → API on Windows + Docker: `localhost` often resolves to IPv6 (::1)
 * while the published port is IPv4-only, so fetch hangs and the browser sees "Failed to fetch"
 * for same-origin /api rewrites. Use 127.0.0.1 for loopback in that case.
 */
export function nodeFetchableApiBaseUrl(): string {
  const raw =
    process.env.API_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://127.0.0.1:5001/api';
  try {
    const u = new URL(raw);
    if (u.hostname === 'localhost' || u.hostname === '[::1]' || u.hostname === '::1') {
      u.hostname = '127.0.0.1';
    }
    const path = u.pathname.replace(/\/$/, '');
    return `${u.origin}${path}`;
  } catch {
    return raw;
  }
}
