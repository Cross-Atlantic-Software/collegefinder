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

// API base. Defaults to production. Override for local/staging testing via:
//   chrome.storage.local.set({ examfill_api_base: 'http://127.0.0.1:5001/api' })
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
  { exam_id: 'ssc_cgl',       exam_name: 'SSC CGL',               portal_url_pattern: 'ssc.gov.in',                    has_published_adapter: false, status: 'draft'     },
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

    const res = await fetch(`${await apiBase()}/extension/adapters/registered`, { headers });
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
      return tryWebSso(message.payload);

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

    case 'SYNC_PROFILE':
      return syncProfile(message.payload);

    case 'GET_FILL_PROGRESS':
      return getFillProgress(message.payload);

    case 'DETECT_EXAM':
      return detectCurrentExam(message.payload);

    case 'GET_ADAPTER':
      return getAdapter(message.payload.exam_id, {
        forceRefresh: message.payload.forceRefresh === true
      });

    case 'GET_ADAPTER_ADMIN':
      return getAdapterAdmin(message.payload.exam_id);

    case 'DELETE_SECTION':
      return deleteSection(message.payload);

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

    case 'GET_CREDIT_STATUS':
      return getCreditStatus(message.payload);

    case 'FILL_CHARGE':
      return createFillCharge(message.payload);

    case 'FILL_CHARGE_COMPLETE':
      return completeFillCharge(message.payload);

    case 'FILL_CHARGE_REFUND':
      return refundFillCharge(message.payload);

    case 'GET_SUPPORTED_EXAMS':
      return { success: true, exams: registeredExams };

    case 'FETCH_FILE_AS_BASE64':
      return fetchFileAsBase64(message.payload);

    case 'ADMIN_VALIDATE_REQUEST':
      return startAdminValidate(message.payload);

    default:
      return { success: false, error: `Unknown message type: ${message.type}` };
  }
}

// ─── Admin validation handoff ───

/**
 * Admin Apply: the CMS posted an ADMIN_VALIDATE_REQUEST (relayed by authSync.js).
 * Stash the target exam so the sidebar enters admin-validation mode when it boots
 * on the portal tab, then open the portal URL in a new tab and reveal the panel.
 */
async function startAdminValidate(payload) {
  const examId = payload && payload.exam_id ? String(payload.exam_id).trim() : '';
  const portalUrl = payload && payload.portal_url ? String(payload.portal_url).trim() : '';
  // Re-validate at the trust boundary (authSync already checked, defence in depth):
  // exam_id is a slug, portal_url must be http(s).
  if (!/^[a-z0-9_]+$/.test(examId) || !/^https?:\/\//i.test(portalUrl)) {
    return { success: false, error: 'A valid exam_id (slug) and http(s) portal_url are required' };
  }
  await chrome.storage.local.set({
    examfill_admin_validate: { exam_id: examId, portal_url: portalUrl }
  });
  const tab = await chrome.tabs.create({ url: portalUrl });
  let panelOpened = false;
  try {
    await chrome.sidePanel.setOptions({ tabId: tab.id, path: 'sidebar/sidebar.html', enabled: true });
    await chrome.sidePanel.open({ tabId: tab.id });
    panelOpened = true;
  } catch (e) {
    // sidePanel.open() needs a live user gesture; after the tab-create await it's gone,
    // so Chrome rejects it. Log instead of swallowing, and signal the UI to prompt a
    // manual open (click the ExamFill toolbar icon on the portal tab).
    console.warn('[ExamFill] sidePanel.open failed (user gesture lost after tab create); manual open required', e);
  }
  return { success: true, tab_id: tab.id, panel_opened: panelOpened };
}

// ─── Auth ───

async function getAuthStatus() {
  const { examfill_token } = await chrome.storage.local.get('examfill_token');
  if (!examfill_token) return { success: true, authenticated: false, is_admin: false };
  // The admin flag lives in an in-memory cache that's wiped whenever the service
  // worker restarts (which is constant). Refresh it from the server so the Builder
  // is correctly shown for admins regardless of how/when they authenticated.
  await refreshAuthMeta();
  return { success: true, authenticated: true, is_admin: cachedAuthMeta?.is_admin === true };
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
    // Explicit OTP login is a deliberate re-entry — clear the signed-out intent
    // so passive auto-SSO works again afterward.
    await chrome.storage.local.remove('examfill_signed_out');
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
  'https://*.unitracko.com/*',
  'http://localhost:3000/*',
  'http://127.0.0.1:3000/*'
];

/**
 * Validate a candidate JWT against /auth/me and, if valid, store it as the
 * ExamFill token. Returns { ok, is_admin }.
 */
/**
 * Map a session's origin to the API base it was issued by, so we always
 * validate/serve against the SAME backend that minted the token. This prevents
 * the classic "logged in locally but extension hits prod" mismatch.
 */
function apiBaseForOrigin(origin) {
  if (/localhost:3000|127\.0\.0\.1:3000/i.test(origin || '')) return 'http://127.0.0.1:5001/api';
  return DEFAULT_API_BASE; // unitracko.com / unknown -> production
}

/**
 * Validate a candidate token and, if valid, store it as the ExamFill token.
 * @param {string} token
 * @param {string} [sourceOrigin]  Where the token came from; pins the API base.
 */
async function adoptToken(token, sourceOrigin) {
  if (!token) return { ok: false };
  // If we know where the session came from, validate against THAT backend and
  // pin the API base to it (so all later calls match the token's issuer).
  const base = sourceOrigin ? apiBaseForOrigin(sourceOrigin) : await apiBase();
  try {
    const res = await fetch(`${base}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return { ok: false };       // expired / wrong token type / wrong backend
    const data = await res.json();
    if (data && data.success === false) return { ok: false };

    const toStore = { examfill_token: token };
    if (sourceOrigin) toStore.examfill_api_base = base; // pin to the session's backend
    await chrome.storage.local.set(toStore);
    if (sourceOrigin) _apiBaseCache = base;

    cachedProfile = null;
    cachedProfileTimestamp = 0;
    const isAdmin = !!(data.data?.user?.is_admin || data.data?.is_admin);
    cachedAuthMeta = { is_admin: isAdmin, fetchedAt: Date.now() };
    await ensureRegisteredExamsFresh(true);
    return { ok: true, is_admin: isAdmin };
  } catch (_) {
    return { ok: false };
  }
}

/** Push from the website content script (authSync.js). Adopt only if we don't already have a token. */
async function receiveWebSessionToken(payload = {}, sender) {
  const token = payload.token;
  if (!token) return { success: false };
  // Passive push from the website — respect an explicit logout (don't silently re-adopt).
  if (await isSignedOut()) return { success: true, signedOut: true };
  const existing = await getToken();
  if (existing) return { success: true, alreadyAuthenticated: true };
  const origin = sender?.origin || sender?.tab?.url || '';
  const adopted = await adoptToken(token, origin);
  return { success: adopted.ok, is_admin: adopted.is_admin === true };
}

// Candidate origins where the website drops the readable `auth_token` cookie.
const WEB_COOKIE_URLS = [
  'https://unitracko.com',
  'https://www.unitracko.com',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

/**
 * Read the auth token from the website's cookie store. Works even with NO
 * website tab open. Returns { token, origin } or null.
 */
async function readTokenFromCookies() {
  for (const url of WEB_COOKIE_URLS) {
    try {
      const cookie = await chrome.cookies.get({ url, name: 'auth_token' });
      const val = cookie?.value;
      if (val && val !== 'null' && val !== 'undefined') {
        const decoded = decodeURIComponent(val).trim();
        if (decoded) return { token: decoded, origin: url };
      }
    } catch (_) { /* no cookies permission for this url / not found */ }
  }
  return null;
}

/** Best available source of the web session token: cookie first, then open tabs. */
async function readWebToken() {
  return (await readTokenFromCookies()) || (await readTokenFromWebTabs());
}

/** Read the web token from any open CollegeFinder/CMS tab via scripting. Returns { token, origin } or null. */
async function readTokenFromWebTabs() {
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
          try {
            const u = localStorage.getItem('auth_token');
            if (u && u !== 'null' && u !== 'undefined' && u.trim()) return u.trim();
            const a = localStorage.getItem('admin_token');
            if (a && a !== 'null' && a !== 'undefined' && a.trim()) return a.trim();
          } catch (_) { /* blocked */ }
          return null;
        }
      });
      const token = results?.[0]?.result;
      if (token) {
        let origin = '';
        try { origin = new URL(tab.url).origin; } catch (_) {}
        return { token, origin };
      }
    } catch (_) { /* no host permission / restricted page — try next tab */ }
  }
  return null;
}

/**
 * Attempt single-sign-on from the website/CMS session.
 * Returns { success, authenticated, is_admin }.
 */
async function tryWebSso(payload = {}) {
  const existing = await getToken();
  if (existing) {
    await refreshAuthMeta();
    return { success: true, authenticated: true, is_admin: cachedAuthMeta?.is_admin === true };
  }

  if (payload?.userInitiated === true) {
    // Deliberate "Connect with CollegeFinder" click — clear the signed-out intent and adopt.
    await chrome.storage.local.remove('examfill_signed_out');
  } else if (await isSignedOut()) {
    // Passive auto-SSO (panel open / unauthenticated route) must respect a deliberate logout.
    return { success: true, authenticated: false };
  }

  const web = await readWebToken();
  if (!web?.token) return { success: true, authenticated: false };

  const adopted = await adoptToken(web.token, web.origin);
  return { success: true, authenticated: adopted.ok, is_admin: adopted.is_admin === true };
}

function isWebOrigin(url) {
  if (!url) return false;
  return /^https?:\/\/([^/]+\.)?unitracko\.com\//i.test(url) ||
         /^https?:\/\/(localhost|127\.0\.0\.1):3000\//i.test(url);
}

/** Best-effort: adopt the website session if we don't already have a token. */
async function autoAdoptFromWeb() {
  try {
    // Respect an explicit logout: covers onStartup/onInstalled/tabs.onUpdated/cookies.onChanged.
    if (await isSignedOut()) return;
    const existing = await getToken();
    if (existing) return;
    const web = await readWebToken();
    if (web?.token) await adoptToken(web.token, web.origin);
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
    if (domain.endsWith('unitracko.com') || domain === 'localhost' || domain === '127.0.0.1') {
      autoAdoptFromWeb();
    }
  });
}

async function logout() {
  await chrome.storage.local.remove('examfill_token');
  // Persist a "signed out" intent so passive SSO paths don't immediately re-adopt a
  // still-live web session. Cleared on a deliberate reconnect (Connect button / OTP login).
  await chrome.storage.local.set({ examfill_signed_out: true });
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

/**
 * True when the user explicitly logged out and hasn't deliberately reconnected.
 * Guards only the PASSIVE adoption paths — never getToken/getAuthStatus/the fill path.
 */
async function isSignedOut() {
  const { examfill_signed_out } = await chrome.storage.local.get('examfill_signed_out');
  return examfill_signed_out === true;
}

async function refreshAuthMeta() {
  const token = await getToken();
  if (!token) { cachedAuthMeta = null; return null; }
  if (cachedAuthMeta && (Date.now() - cachedAuthMeta.fetchedAt) < AUTH_META_TTL) return cachedAuthMeta;
  try {
    const res = await fetch(`${await apiBase()}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return cachedAuthMeta;
    const data = await res.json();
    const isAdmin = !!(data.data?.user?.is_admin || data.data?.is_admin);
    cachedAuthMeta = { is_admin: isAdmin, fetchedAt: Date.now() };
  } catch (_) { /* ignore */ }
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

// ─── Profile sync-back (Phase 2) ───
async function syncProfile(payload) {
  const token = await getToken();
  if (!token) return { success: false, error: 'Not authenticated' };

  const res = await fetch(`${await apiBase()}/extension/profile`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ changes: (payload && payload.changes) || {} })
  });

  if (res.status === 401) {
    await chrome.storage.local.remove('examfill_token');
    return { success: false, error: 'Token expired — please log in again' };
  }

  const data = await res.json().catch(() => ({}));
  // Invalidate the cached profile so the next sidebar open shows the saved edits.
  cachedProfile = null;
  return (data && typeof data === 'object') ? data : { success: false, error: 'Bad response' };
}

// ─── Save & continue: per-section progress ───
async function getFillProgress(payload) {
  const token = await getToken();
  if (!token) return { success: false, error: 'Not authenticated' };

  const examId = payload && payload.exam_id;
  if (!examId) return { success: false, error: 'Missing exam_id' };

  const res = await fetch(`${await apiBase()}/extension/fill-progress?exam_id=${encodeURIComponent(examId)}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (res.status === 401) {
    await chrome.storage.local.remove('examfill_token');
    return { success: false, error: 'Token expired — please log in again' };
  }
  const data = await res.json().catch(() => ({}));
  return (data && typeof data === 'object') ? data : { success: false, error: 'Bad response' };
}

// ─── Exam Detection ───

async function detectCurrentExam(payload) {
  const url = payload?.url || '';
  await ensureRegisteredExamsFresh();
  const match = detectExam(url);
  if (!match) return { success: true, detected: false };

  // Refresh admin flag in parallel — needed for the Builder UI gate
  const authMeta = await refreshAuthMeta();

  return {
    success: true,
    detected: true,
    exam_id: match.exam_id,
    exam_name: match.exam_name,
    has_published_adapter: match.has_published_adapter,
    status: match.status,
    is_admin: authMeta?.is_admin === true
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

// Admin draft-load (validation mode): serves the adapter regardless of
// approval_status/is_active. Deliberately NOT cached — a draft must never leak
// into cachedAdapters where a later student GET_ADAPTER could read it.
async function getAdapterAdmin(examId) {
  const token = await getToken();
  if (!token) return { success: false, error: 'Not authenticated' };

  try {
    const res = await fetch(`${await apiBase()}/extension/adapters/${examId}/admin`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
      return { success: false, error: `Adapter fetch failed (${res.status})` };
    }

    const data = await res.json();
    if (data.success && data.data) {
      return { success: true, data: data.data };
    }
    return { success: false, error: data.message || 'Adapter not found' };
  } catch (err) {
    return { success: false, error: `Network error: ${err.message}` };
  }
}

// ─── Delete a section from an adapter (admin) ───
async function deleteSection(payload) {
  const token = await getToken();
  if (!token) return { success: false, error: 'Not authenticated' };

  const examId = payload && payload.exam_id;
  const sectionId = payload && payload.section_id;
  if (!examId || !sectionId) return { success: false, error: 'Missing exam_id or section_id' };

  const res = await fetch(
    `${await apiBase()}/extension/adapters/${encodeURIComponent(examId)}/sections/${encodeURIComponent(sectionId)}`,
    { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }
  );

  if (res.status === 401) {
    await chrome.storage.local.remove('examfill_token');
    return { success: false, error: 'Token expired — please log in again' };
  }

  const data = await res.json().catch(() => ({}));
  // Invalidate the cached adapter so a reopen reflects the deletion.
  if (cachedAdapters && examId) delete cachedAdapters[examId];
  return (data && typeof data === 'object') ? data : { success: false, error: 'Bad response' };
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

  // The backend's AI ladder can run long; cap below the sidebar's 160s guard.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 150000);
  try {
    const res = await fetch(`${await apiBase()}/extension/adapters/build`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ exam_id, page, exam_name, portal_url_pattern }),
      signal: controller.signal
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.message || `Build failed (${res.status})` };
    }
    // Bust the adapter cache for this exam so subsequent fills use the new section
    delete cachedAdapters[exam_id];
    return { success: true, data: data.data };
  } catch (err) {
    return {
      success: false,
      error: err.name === 'AbortError'
        ? 'Build timed out after 150s — the AI may be overloaded. Try again.'
        : `Network error: ${err.message}`
    };
  } finally {
    clearTimeout(timer);
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

// ─── Credits & fill charges ───

// GET /extension/credit-status?exam_id=  -> { balance, credit_cost, exam_fee, sufficient, has_active_charge }
async function getCreditStatus(payload) {
  const examId = payload?.exam_id;
  if (!examId) return { success: false, error: 'exam_id is required' };

  const token = await getToken();
  if (!token) return { success: false, error: 'Not authenticated' };

  try {
    const res = await fetch(
      `${await apiBase()}/extension/credit-status?exam_id=${encodeURIComponent(examId)}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    if (res.status === 401) {
      await chrome.storage.local.remove('examfill_token');
      return { success: false, error: 'Token expired — please log in again' };
    }
    const data = await res.json();
    if (!data.success) return { success: false, error: data.message || 'Failed to load credit status' };
    return { success: true, data: data.data };
  } catch (err) {
    return { success: false, error: `Network error: ${err.message}` };
  }
}

// POST /extension/fill-charge  { exam_id }
// Idempotent: an existing active charge is returned without re-debiting.
// On HTTP 402 we surface the INSUFFICIENT_CREDITS body so the sidebar can show the buy-block.
async function createFillCharge(payload) {
  const examId = payload?.exam_id;
  if (!examId) return { success: false, error: 'exam_id is required' };

  const token = await getToken();
  if (!token) return { success: false, error: 'Not authenticated' };

  try {
    const res = await fetch(`${await apiBase()}/extension/fill-charge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ exam_id: examId })
    });
    if (res.status === 401) {
      await chrome.storage.local.remove('examfill_token');
      return { success: false, error: 'Token expired — please log in again' };
    }
    const data = await res.json();

    // Not enough credits — pass the structured 402 body through, do NOT swallow it.
    if (res.status === 402 || data.code === 'INSUFFICIENT_CREDITS') {
      return {
        success: false,
        code: 'INSUFFICIENT_CREDITS',
        status: 402,
        shortfall: data.shortfall,
        wallet_url: data.wallet_url,
        error: data.message || 'You do not have enough credits'
      };
    }
    if (!data.success) return { success: false, error: data.message || 'Failed to start fill charge' };
    return { success: true, data: data.data };
  } catch (err) {
    return { success: false, error: `Network error: ${err.message}` };
  }
}

// POST /extension/fill-charge/complete  { exam_id }
async function completeFillCharge(payload) {
  const examId = payload?.exam_id;
  if (!examId) return { success: false, error: 'exam_id is required' };

  const token = await getToken();
  if (!token) return { success: false, error: 'Not authenticated' };

  try {
    const res = await fetch(`${await apiBase()}/extension/fill-charge/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ exam_id: examId })
    });
    const data = await res.json();
    if (!data.success) return { success: false, error: data.message || 'Failed to mark as submitted' };
    return { success: true, data: data.data };
  } catch (err) {
    return { success: false, error: `Network error: ${err.message}` };
  }
}

// POST /extension/fill-charge/refund  { exam_id }
async function refundFillCharge(payload) {
  const examId = payload?.exam_id;
  if (!examId) return { success: false, error: 'exam_id is required' };

  const token = await getToken();
  if (!token) return { success: false, error: 'Not authenticated' };

  try {
    const res = await fetch(`${await apiBase()}/extension/fill-charge/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ exam_id: examId })
    });
    const data = await res.json();
    if (!data.success) return { success: false, error: data.message || 'Failed to refund credits' };
    return { success: true, data: data.data };
  } catch (err) {
    return { success: false, error: `Network error: ${err.message}` };
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
