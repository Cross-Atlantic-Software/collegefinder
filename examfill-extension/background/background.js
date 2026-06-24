/**
 * Background Service Worker
 *
 * Responsibilities:
 * - Detect when student navigates to a registered exam portal (patterns
 *   are fetched from the backend, NOT hard-coded — admins register new
 *   exams via the CMS).
 * - Fetch adapter config + student profile from backend API.
 * - Route messages between sidebar and content script.
 * - Open side panel on registered portals.
 * - Handle auth token management.
 * - Drive the admin-only "Build Adapter" flow that calls Gemini server-side.
 */

// API base. Production CollegeFinder backend. A staging override may be set via
// chrome.storage.local ('examfill_api_base'); absent that, this is used.
const DEFAULT_API_BASE = 'https://unitracko.com/api';
let _apiBaseCache = null;

async function apiBase() {
  if (_apiBaseCache) return _apiBaseCache;
  try {
    const { examfill_api_base } = await chrome.storage.local.get('examfill_api_base');
    _apiBaseCache = (examfill_api_base && /^https?:\/\//.test(examfill_api_base))
      ? examfill_api_base.replace(/\/+$/, '')
      : DEFAULT_API_BASE;
  } catch (_) {
    _apiBaseCache = DEFAULT_API_BASE;
  }
  return _apiBaseCache;
}

// Invalidate the cache when the override changes.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.examfill_api_base) _apiBaseCache = null;
});

/**
 * fetch() with a hard timeout. An MV3 service worker that awaits a fetch which
 * never resolves (e.g. an unreachable backend) will hold the sidebar's message
 * channel open until Chrome tears it down — surfacing as "the message channel
 * closed before a response was received". Bounding every network call prevents
 * that: an unreachable host fails fast instead of hanging.
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = 7000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ─── Hardcoded fallback exam list ────────────────────────────────
// These are always detected even when the backend is offline.
// The backend list (fetched below) supplements / overrides this.
const FALLBACK_EXAMS = [
  { exam_id: 'nata',          exam_name: 'NATA 2026',             portal_url_pattern: 'stureg.nata-app.org',           has_published_adapter: true,  status: 'published' },
  { exam_id: 'srmjeee_2026',  exam_name: 'SRMJEEE 2026',          portal_url_pattern: 'applications.srmist.edu.in',    has_published_adapter: false, status: 'draft'     },
  { exam_id: 'jee_main',      exam_name: 'JEE Main 2026',         portal_url_pattern: 'jeemain.nta.nic.in',            has_published_adapter: false, status: 'draft'     },
  { exam_id: 'neet',          exam_name: 'NEET UG 2026',          portal_url_pattern: 'neet.nta.nic.in',               has_published_adapter: false, status: 'draft'     },
  { exam_id: 'cuet',          exam_name: 'CUET 2026',             portal_url_pattern: 'cuet.samarth.ac.in',            has_published_adapter: false, status: 'draft'     },
  { exam_id: 'mhtcet',        exam_name: 'MHT-CET 2026',          portal_url_pattern: 'mhtcet2025.mahacet.org',        has_published_adapter: false, status: 'draft'     },
  { exam_id: 'bitsat',        exam_name: 'BITSAT 2026',           portal_url_pattern: 'bitsadmission.com',             has_published_adapter: false, status: 'draft'     },
  { exam_id: 'viteee',        exam_name: 'VITEEE 2026',           portal_url_pattern: 'viteee.vit.ac.in',              has_published_adapter: false, status: 'draft'     },
  { exam_id: 'kiitee_2026',   exam_name: 'KIITEE 2026',           portal_url_pattern: 'kiitee.eduquity.com',           has_published_adapter: false, status: 'draft'     },
  { exam_id: 'ssc_cgl',       exam_name: 'SSC CGL',               portal_url_pattern: 'ssc.gov.in',                    has_published_adapter: true,  status: 'published' },
];

// Content scripts to inject on-demand, in dependency order (mirrors manifest.json).
const CONTENT_SCRIPT_FILES = [
  'utils/resolver.js',
  'utils/formatter.js',
  'utils/waiter.js',
  'content/detector.js',
  'content/filler.js',
  'content/verifier.js',
  'content/highlighter.js',
  'content/pageScanner.js',
  'content/content_script.js'
];

// ─── In-memory cache (never persisted to disk for privacy) ───

let cachedProfile = null;
let cachedProfileTimestamp = 0;
const PROFILE_CACHE_TTL = 10 * 60 * 1000; // 10 min

let cachedAdapters = {};   // keyed by exam_id → { version, data }
// Start with fallback list; backend fetch merges/overrides below
let registeredExams = [...FALLBACK_EXAMS];
let registeredExamsFetchedAt = 0;
const REGISTERED_TTL = 10 * 60 * 1000; // 10 min

let cachedAuthMeta = null; // { is_admin: bool, fetchedAt: ts }
const AUTH_META_TTL = 5 * 60 * 1000;

// ─── URL Detection (now data-driven) ─────────────────────────────

async function ensureRegisteredExamsFresh(force = false) {
  const now = Date.now();
  if (!force && registeredExams.length > 0 && (now - registeredExamsFetchedAt) < REGISTERED_TTL) {
    return registeredExams;
  }

  // This endpoint is public — no token needed for URL-pattern detection
  try {
    const headers = {};
    const token = await getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetchWithTimeout(`${await apiBase()}/extension/adapters/registered`, { headers }, 6000);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        // Merge: backend data takes priority over fallback, keyed by exam_id
        const merged = new Map(FALLBACK_EXAMS.map(e => [e.exam_id, e]));
        for (const exam of data.data) {
          if (exam && exam.exam_id) merged.set(exam.exam_id, exam);
        }
        registeredExams = Array.from(merged.values());
        registeredExamsFetchedAt = now;
      }
    }
  } catch (err) {
    console.warn('[ExamFill] Failed to refresh registered exams (using fallback list):', err.message);
  }
  return registeredExams;
}

function detectExam(url) {
  if (!url) return null;
  for (const p of registeredExams) {
    if (!p || !p.portal_url_pattern) continue;
    if (url.includes(p.portal_url_pattern)) {
      return {
        exam_id: p.exam_id,
        exam_name: p.exam_name,
        has_published_adapter: !!p.has_published_adapter,
        status: p.status
      };
    }
  }
  return null;
}

// ─── Tab Navigation Listener ───

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab.url) return;
  await ensureRegisteredExamsFresh();
  const match = detectExam(tab.url);
  if (match) {
    try {
      await chrome.sidePanel.setOptions({
        tabId,
        path: 'sidebar/sidebar.html',
        enabled: true
      });
    } catch (_) { /* side panel API might not be available in older Chrome */ }
  }
});

chrome.action.onClicked.addListener(async (tab) => {
  await chrome.sidePanel.open({ tabId: tab.id });
});

// ─── Message Router ───

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse).catch(err => {
    sendResponse({ success: false, error: err.message });
  });
  return true;
});

async function handleMessage(message, sender) {
  switch (message.type) {
    case 'GET_AUTH_STATUS':
      return getAuthStatus();

    case 'WEB_SESSION_TOKEN':
      return receiveWebSessionToken(message.payload, sender);

    case 'TRY_WEB_SSO':
      return tryWebSso();

    case 'SEND_OTP':
      return sendOtp(message.payload);

    case 'VERIFY_OTP':
      return verifyOtp(message.payload);

    case 'LOGIN':
      return login(message.payload);

    case 'LOGOUT':
      return logout();

    case 'GET_PROFILE':
      return getProfile(message.payload);

    case 'DETECT_EXAM':
      return detectCurrentExam(message.payload);

    case 'GET_ADAPTER':
      return getAdapter(message.payload.exam_id, {
        forceRefresh: message.payload.forceRefresh === true
      });

    case 'GET_REGISTERED_EXAMS':
      return getRegisteredExamsForSidebar(message.payload);

    case 'GET_EXAM_CATALOG':
      return getExamCatalog();

    case 'ENSURE_INJECTED':
      return ensureInjected(message.payload);

    case 'FILL_SECTION':
      return fillSection(message.payload);

    case 'SCAN_PAGE':
      return scanPage(message.payload);

    case 'BUILD_ADAPTER_SECTION':
      return buildAdapterSection(message.payload);

    case 'PUBLISH_ADAPTER':
      return publishAdapter(message.payload);

    case 'SEND_FILL_REPORT':
      return sendFillReport(message.payload);

    case 'GET_SUPPORTED_EXAMS':
      return { success: true, exams: registeredExams };

    case 'FETCH_FILE_AS_BASE64':
      return fetchFileAsBase64(message.payload);

    default:
      return { success: false, error: `Unknown message type: ${message.type}` };
  }
}

// ─── Auth ───

async function getAuthStatus() {
  let token = await getToken();
  if (!token) return { success: true, authenticated: false, is_admin: false };
  // The admin flag lives in an in-memory cache that's wiped whenever the service
  // worker restarts (which is constant). Refresh it from the server so the Builder
  // is correctly shown for admins regardless of how/when they authenticated.
  const meta = await refreshAuthMeta();
  // refreshAuthMeta clears the token on 401/403 — re-read so a dead token reports
  // as "not authenticated" (which lets the sidebar trigger SSO) instead of a
  // broken authenticated state.
  token = await getToken();
  if (!token) return { success: true, authenticated: false, is_admin: false };
  return { success: true, authenticated: true, is_admin: meta?.is_admin === true };
}

async function sendOtp({ email }) {
  try {
    const res = await fetch(`${await apiBase()}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!data.success) return { success: false, error: data.message || 'Failed to send OTP' };
    const expiresIn = data.data?.expiresIn || data.expiresIn || 600;
    return { success: true, expiresIn };
  } catch (err) {
    return { success: false, error: `Network error: ${err.message}` };
  }
}

async function verifyOtp({ email, code }) {
  try {
    const res = await fetch(`${await apiBase()}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    });
    const data = await res.json();
    const token = data.token || data.data?.token;
    if (!data.success || !token) {
      return { success: false, error: data.message || 'Invalid OTP' };
    }
    await chrome.storage.local.set({ examfill_token: token });
    cachedProfile = null;
    cachedProfileTimestamp = 0;
    cachedAuthMeta = {
      is_admin: !!(data.data?.user?.is_admin || data.data?.is_admin),
      fetchedAt: Date.now()
    };
    // Refresh registered exam list now that we have a token
    await ensureRegisteredExamsFresh(true);
    return { success: true, is_admin: cachedAuthMeta.is_admin };
  } catch (err) {
    return { success: false, error: `Network error: ${err.message}` };
  }
}

async function login(payload) { return sendOtp(payload); }

// ─── Web/CMS session SSO ─────────────────────────────────────────
// The CollegeFinder website + CMS store their JWT in localStorage. A content
// script (authSync.js) pushes it here; we also pull it on demand. If the token
// validates, we adopt it as the ExamFill token so the student skips OTP login.

const WEB_TAB_PATTERNS = [
  'https://unitracko.com/*',
  'https://*.unitracko.com/*'
];

/**
 * Map a session's origin to the API base it was issued by. In production every
 * CollegeFinder session is minted by the unitracko.com backend.
 */
function apiBaseForOrigin(_origin) {
  return DEFAULT_API_BASE; // unitracko.com / unknown -> production
}

// Backends a session token might have been minted by. Production has one.
const KNOWN_API_BASES = [DEFAULT_API_BASE];

function candidateBasesForOrigin(sourceOrigin) {
  const ordered = [];
  if (sourceOrigin) ordered.push(apiBaseForOrigin(sourceOrigin));
  for (const b of KNOWN_API_BASES) ordered.push(b);
  return Array.from(new Set(ordered)); // dedupe, preserve order
}

/** Validate a token against ONE backend. Returns { base, isAdmin } or null. */
async function validateTokenAgainst(base, token) {
  try {
    const res = await fetchWithTimeout(`${base}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }, 6000);
    if (!res.ok) return null;                 // 401/403 = wrong token type/expired/wrong backend
    const data = await res.json();
    if (data && data.success === false) return null;
    const isAdmin = !!(data.data?.user?.is_admin || data.data?.is_admin);
    return { base, isAdmin };
  } catch (_) {
    return null;                              // network error — try next backend
  }
}

/**
 * Validate a candidate token against every plausible backend and, if any
 * accepts it, store it as the ExamFill token + pin the API base to that backend.
 * @param {string} token
 * @param {string} [sourceOrigin]  Where the token came from; orders backend tries.
 */
async function adoptToken(token, sourceOrigin) {
  if (!token) return { ok: false };
  const bases = candidateBasesForOrigin(sourceOrigin);
  for (const base of bases) {
    const valid = await validateTokenAgainst(base, token);
    if (!valid) continue;

    await chrome.storage.local.set({ examfill_token: token, examfill_api_base: valid.base });
    _apiBaseCache = valid.base;
    cachedProfile = null;
    cachedProfileTimestamp = 0;
    cachedAuthMeta = { is_admin: valid.isAdmin, fetchedAt: Date.now() };
    await ensureRegisteredExamsFresh(true);
    return { ok: true, is_admin: valid.isAdmin };
  }
  return { ok: false };
}

/** Push from the website content script (authSync.js). Adopt only if we don't already have a token. */
async function receiveWebSessionToken(payload = {}, sender) {
  const token = payload.token;
  if (!token) return { success: false };
  const existing = await getToken();
  if (existing) return { success: true, alreadyAuthenticated: true };
  const origin = sender?.origin || sender?.tab?.url || '';
  const adopted = await adoptToken(token, origin);
  return { success: adopted.ok, is_admin: adopted.is_admin === true };
}

// Candidate origins where the website drops the readable `auth_token` cookie.
const WEB_COOKIE_URLS = [
  'https://unitracko.com',
  'https://www.unitracko.com'
];

/**
 * Read the auth token from the website's cookie store. Works even with NO
 * website tab open. Returns array of { token, origin }.
 */
async function readTokensFromCookies() {
  const out = [];
  for (const url of WEB_COOKIE_URLS) {
    try {
      const cookie = await chrome.cookies.get({ url, name: 'auth_token' });
      const val = cookie?.value;
      if (val && val !== 'null' && val !== 'undefined') {
        const decoded = decodeURIComponent(val).trim();
        if (decoded) out.push({ token: decoded, origin: url, src: 'cookie' });
      }
    } catch (_) { /* no cookies permission for this url / not found */ }
  }
  return out;
}

/**
 * Read user tokens from EVERY open CollegeFinder/CMS tab via scripting, checking
 * both localStorage and sessionStorage. Returns array of { token, origin }.
 * (We read the user `auth_token` only — an admin token can't fetch a student
 * profile, and adoptToken would reject it anyway.)
 */
async function readTokensFromWebTabs() {
  const out = [];
  let tabs = [];
  try {
    tabs = await chrome.tabs.query({ url: WEB_TAB_PATTERNS });
  } catch (_) { /* query may throw if patterns unsupported */ }

  for (const tab of tabs) {
    if (!tab.id) continue;
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const found = [];
          const stores = [];
          try { stores.push(localStorage); } catch (_) {}
          try { stores.push(sessionStorage); } catch (_) {}
          for (const store of stores) {
            try {
              const u = store.getItem('auth_token');
              if (u && u !== 'null' && u !== 'undefined' && u.trim()) found.push(u.trim());
            } catch (_) { /* blocked */ }
          }
          return found;
        }
      });
      const tokens = results?.[0]?.result || [];
      let origin = '';
      try { origin = new URL(tab.url).origin; } catch (_) {}
      for (const t of tokens) out.push({ token: t, origin, src: 'tab' });
    } catch (_) { /* no host permission / restricted page — try next tab */ }
  }
  return out;
}

/**
 * Gather every candidate web session token (cookies + all open tabs), deduped.
 * Returns { candidates: [{token, origin, src}], webTabCount }.
 */
async function collectWebTokens() {
  let webTabCount = 0;
  try {
    const tabs = await chrome.tabs.query({ url: WEB_TAB_PATTERNS });
    webTabCount = tabs.length;
  } catch (_) {}

  const all = [...(await readTokensFromCookies()), ...(await readTokensFromWebTabs())];
  const seen = new Set();
  const candidates = all.filter((c) => {
    if (!c.token || seen.has(c.token)) return false;
    seen.add(c.token);
    return true;
  });
  return { candidates, webTabCount };
}

/** Back-compat single-token helper (first valid-looking candidate). */
async function readWebToken() {
  const { candidates } = await collectWebTokens();
  return candidates[0] || null;
}

/**
 * Attempt single-sign-on from the website/CMS session.
 * Returns { success, authenticated, is_admin, diag } where diag explains the
 * outcome (surfaced in the sidebar console to debug failed connects).
 */
async function tryWebSso() {
  // 1. If we already hold a token, verify it. If it's stale/invalid, drop it so
  //    we can re-adopt a fresh one from the website instead of being stuck.
  const existing = await getToken();
  if (existing) {
    const meta = await refreshAuthMeta();
    const stillThere = await getToken(); // refreshAuthMeta clears on 401
    if (stillThere) {
      return { success: true, authenticated: true, is_admin: meta?.is_admin === true,
               diag: { source: 'stored_token' } };
    }
  }

  // 2. Collect every candidate token from cookies + open tabs and try each.
  const { candidates, webTabCount } = await collectWebTokens();
  const diag = { webTabCount, tokensFound: candidates.length, tried: 0 };

  for (const c of candidates) {
    diag.tried += 1;
    const adopted = await adoptToken(c.token, c.origin);
    if (adopted.ok) {
      return { success: true, authenticated: true, is_admin: adopted.is_admin === true,
               diag: { ...diag, adoptedFrom: c.src, origin: c.origin } };
    }
  }

  return { success: true, authenticated: false, diag };
}

function isWebOrigin(url) {
  if (!url) return false;
  return /^https?:\/\/([^/]+\.)?unitracko\.com\//i.test(url);
}

/** Best-effort: adopt the website session if we don't already have a token. */
async function autoAdoptFromWeb() {
  try {
    const existing = await getToken();
    if (existing) return;
    const { candidates } = await collectWebTokens();
    for (const c of candidates) {
      const adopted = await adoptToken(c.token, c.origin);
      if (adopted.ok) return;
    }
  } catch (_) { /* non-fatal */ }
}

// Capture the session as soon as the worker wakes or a CollegeFinder tab loads —
// so the user is already connected by the time they open the panel.
chrome.runtime.onStartup.addListener(autoAdoptFromWeb);
chrome.runtime.onInstalled.addListener(autoAdoptFromWeb);
chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && isWebOrigin(tab?.url)) autoAdoptFromWeb();
});

// Adopt the instant the user logs in on the website (auth_token cookie appears) —
// no tab focus, no panel open, no refresh needed.
if (chrome.cookies && chrome.cookies.onChanged) {
  chrome.cookies.onChanged.addListener(({ cookie, removed }) => {
    if (removed || cookie?.name !== 'auth_token') return;
    const domain = (cookie.domain || '').replace(/^\./, '');
    if (domain.endsWith('unitracko.com')) {
      autoAdoptFromWeb();
    }
  });
}

async function logout() {
  await chrome.storage.local.remove('examfill_token');
  cachedProfile = null;
  cachedProfileTimestamp = 0;
  cachedAuthMeta = null;
  cachedAdapters = {};
  return { success: true };
}

async function getToken() {
  const { examfill_token } = await chrome.storage.local.get('examfill_token');
  return examfill_token || null;
}

async function refreshAuthMeta() {
  const token = await getToken();
  if (!token) { cachedAuthMeta = null; return null; }
  if (cachedAuthMeta && (Date.now() - cachedAuthMeta.fetchedAt) < AUTH_META_TTL) return cachedAuthMeta;
  try {
    const res = await fetchWithTimeout(`${await apiBase()}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }, 6000);
    // Token rejected → it's expired/invalid/for-the-wrong-backend. Drop it so SSO
    // can re-adopt a fresh session instead of being wedged on a dead token.
    if (res.status === 401 || res.status === 403) {
      await chrome.storage.local.remove('examfill_token');
      cachedAuthMeta = null;
      return null;
    }
    if (!res.ok) return cachedAuthMeta; // transient (5xx/network) — keep what we have
    const data = await res.json();
    const isAdmin = !!(data.data?.user?.is_admin || data.data?.is_admin);
    cachedAuthMeta = { is_admin: isAdmin, fetchedAt: Date.now() };
  } catch (_) { /* network — keep cached */ }
  return cachedAuthMeta;
}

// ─── Profile ───

async function getProfile(payload) {
  const now = Date.now();
  const force = payload?.force === true;
  if (!force && cachedProfile && (now - cachedProfileTimestamp) < PROFILE_CACHE_TTL) {
    return { success: true, data: cachedProfile };
  }

  const token = await getToken();
  if (!token) return { success: false, error: 'Not authenticated' };

  const res = await fetch(`${await apiBase()}/extension/fill-profile`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (res.status === 401) {
    await chrome.storage.local.remove('examfill_token');
    return { success: false, error: 'Token expired — please log in again' };
  }

  const data = await res.json();
  if (!data.success) {
    return { success: false, error: data.message || 'Failed to load profile' };
  }

  cachedProfile = data.data;
  cachedProfileTimestamp = now;
  return { success: true, data: cachedProfile };
}

// ─── Exam Detection ───

async function detectCurrentExam(payload) {
  const url = payload?.url || '';
  await ensureRegisteredExamsFresh();
  const match = detectExam(url);
  if (!match) return { success: true, detected: false };

  // Refresh admin flag in parallel — needed for the Builder UI gate
  refreshAuthMeta();

  return {
    success: true,
    detected: true,
    exam_id: match.exam_id,
    exam_name: match.exam_name,
    has_published_adapter: match.has_published_adapter,
    status: match.status,
    is_admin: cachedAuthMeta?.is_admin === true
  };
}

async function getRegisteredExamsForSidebar() {
  await ensureRegisteredExamsFresh();
  return { success: true, data: registeredExams };
}

// ─── Exam catalog (for manual picker dropdown) ───

async function getExamCatalog() {
  const token = await getToken();
  if (!token) return { success: false, error: 'Not authenticated' };

  try {
    const res = await fetch(`${await apiBase()}/extension/exams`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.status === 401) {
      await chrome.storage.local.remove('examfill_token');
      return { success: false, error: 'Token expired — please log in again' };
    }
    if (!res.ok) return { success: false, error: `Catalog fetch failed (${res.status})` };
    const data = await res.json();
    if (!data.success) return { success: false, error: data.message || 'Failed to load exam catalog' };
    return { success: true, data: data.data };
  } catch (err) {
    return { success: false, error: `Network error: ${err.message}` };
  }
}

// ─── On-demand content-script injection ───
// Used when the user manually selects an exam whose portal isn't in the
// static content_scripts list. Pings first to avoid double-injection on
// portals already covered by the manifest.

async function ensureInjected({ tabId } = {}) {
  let targetTabId = tabId;
  if (!targetTabId) {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    targetTabId = activeTab?.id;
  }
  if (!targetTabId) return { success: false, error: 'No active tab' };

  // Already injected? (statically-matched portals, or a previous manual inject)
  try {
    const pong = await chrome.tabs.sendMessage(targetTabId, { type: 'PING' });
    if (pong?.alive) return { success: true, alreadyInjected: true };
  } catch (_) { /* not injected yet — fall through */ }

  try {
    await chrome.scripting.executeScript({
      target: { tabId: targetTabId },
      files: CONTENT_SCRIPT_FILES
    });
    return { success: true, injected: true };
  } catch (err) {
    return { success: false, error: `Injection failed: ${err.message}. The page may block extensions, or permission was not granted.` };
  }
}

// ─── Adapter ───

async function getAdapter(examId, options = {}) {
  const forceRefresh = options.forceRefresh === true;
  const cached = cachedAdapters[examId];

  const token = await getToken();
  if (!token) return { success: false, error: 'Not authenticated' };

  try {
    const res = await fetch(`${await apiBase()}/extension/adapters/${examId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
      return { success: false, error: `Adapter fetch failed (${res.status})` };
    }

    const data = await res.json();
    if (!data.success || !data.data) {
      return { success: false, error: data.message || 'Adapter not found' };
    }

    const incomingVersion = data.data.version ?? null;
    if (
      !forceRefresh &&
      cached &&
      cached.version === incomingVersion &&
      cached.data
    ) {
      return { success: true, data: cached.data };
    }

    cachedAdapters[examId] = { version: incomingVersion, data: data.data };
    return { success: true, data: data.data };
  } catch (err) {
    return { success: false, error: `Network error: ${err.message}` };
  }
}

// ─── Fill Orchestration ───

async function fillSection(payload) {
  const { tabId } = payload;

  let targetTabId = tabId;
  if (!targetTabId) {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    targetTabId = activeTab?.id;
  }
  if (!targetTabId) return { success: false, error: 'No active tab found' };

  // Ensure the content script is present (manually-injected portals lose it on navigation).
  await ensureInjected({ tabId: targetTabId });

  try {
    const response = await chrome.tabs.sendMessage(targetTabId, {
      type: 'FILL_SECTION',
      payload
    });
    return response;
  } catch (err) {
    return { success: false, error: `Content script not responding: ${err.message}` };
  }
}

// ─── Scan page (for Builder) ───

async function scanPage() {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!activeTab?.id) return { success: false, error: 'No active tab' };

  // Ensure the page scanner is present (manually-injected portals lose it on navigation).
  await ensureInjected({ tabId: activeTab.id });

  try {
    const response = await chrome.tabs.sendMessage(activeTab.id, { type: 'SCAN_PAGE' });
    return response;
  } catch (err) {
    return { success: false, error: `Page scanner not responding: ${err.message}. Reload the portal page and try again.` };
  }
}

// ─── Build adapter section (admin-only, calls Gemini via backend) ───

async function buildAdapterSection({ exam_id, page, exam_name, portal_url_pattern }) {
  const token = await getToken();
  if (!token) return { success: false, error: 'Not authenticated' };

  try {
    const res = await fetch(`${await apiBase()}/extension/adapters/build`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ exam_id, page, exam_name, portal_url_pattern })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.message || `Build failed (${res.status})` };
    }
    // Bust the adapter cache for this exam so subsequent fills use the new section
    delete cachedAdapters[exam_id];
    return { success: true, data: data.data };
  } catch (err) {
    return { success: false, error: `Network error: ${err.message}` };
  }
}

// ─── Publish adapter (admin-only) ───

async function publishAdapter({ exam_id, status }) {
  const token = await getToken();
  if (!token) return { success: false, error: 'Not authenticated' };

  try {
    const res = await fetch(`${await apiBase()}/extension/adapters/${exam_id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: status || 'published' })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.message || `Publish failed (${res.status})` };
    }
    delete cachedAdapters[exam_id];
    await ensureRegisteredExamsFresh(true);
    return { success: true, data: data.data };
  } catch (err) {
    return { success: false, error: `Network error: ${err.message}` };
  }
}

// ─── Fill Report ───

async function sendFillReport(payload) {
  const token = await getToken();
  if (!token) return { success: false, error: 'Not authenticated' };

  try {
    const res = await fetch(`${await apiBase()}/extension/fill-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    return { success: data.success };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ─── File Fetcher (CORS bypass via service worker) ───

async function fetchFileAsBase64({ url }) {
  if (!url) return { success: false, error: 'No URL provided' };

  try {
    const res = await fetch(url);
    if (!res.ok) return { success: false, error: `HTTP ${res.status}` };

    const contentType = res.headers.get('content-type') || 'application/octet-stream';
    const buffer = await res.arrayBuffer();

    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    return { success: true, base64, mimeType: contentType };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

console.log('[ExamFill] Background service worker started');
