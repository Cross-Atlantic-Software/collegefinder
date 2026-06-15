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

const API_BASE = 'https://unitracko.com/api';

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
];

// ─── In-memory cache (never persisted to disk for privacy) ───

let cachedProfile = null;
let cachedProfileTimestamp = 0;
const PROFILE_CACHE_TTL = 10 * 60 * 1000; // 10 min

let cachedAdapters = {};   // keyed by exam_id
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

    const res = await fetch(`${API_BASE}/extension/adapters/registered`, { headers });
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

    case 'SEND_OTP':
      return sendOtp(message.payload);

    case 'VERIFY_OTP':
      return verifyOtp(message.payload);

    case 'LOGIN':
      return login(message.payload);

    case 'LOGOUT':
      return logout();

    case 'GET_PROFILE':
      return getProfile();

    case 'SYNC_PROFILE':
      return syncProfile(message.payload);

    case 'GET_FILL_PROGRESS':
      return getFillProgress(message.payload);

    case 'DETECT_EXAM':
      return detectCurrentExam(message.payload);

    case 'GET_ADAPTER':
      return getAdapter(message.payload.exam_id, message.payload.force === true);

    case 'DELETE_SECTION':
      return deleteSection(message.payload);

    case 'GET_REGISTERED_EXAMS':
      return getRegisteredExamsForSidebar(message.payload);

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
  const { examfill_token } = await chrome.storage.local.get('examfill_token');
  return { success: true, authenticated: !!examfill_token, is_admin: cachedAuthMeta?.is_admin === true };
}

async function sendOtp({ email }) {
  try {
    const res = await fetch(`${API_BASE}/auth/send-otp`, {
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
    const res = await fetch(`${API_BASE}/auth/verify-otp`, {
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
    const res = await fetch(`${API_BASE}/auth/me`, {
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

async function getProfile() {
  const now = Date.now();
  if (cachedProfile && (now - cachedProfileTimestamp) < PROFILE_CACHE_TTL) {
    return { success: true, data: cachedProfile };
  }

  const token = await getToken();
  if (!token) return { success: false, error: 'Not authenticated' };

  const res = await fetch(`${API_BASE}/extension/fill-profile`, {
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

  const res = await fetch(`${API_BASE}/extension/profile`, {
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

  const res = await fetch(`${API_BASE}/extension/fill-progress?exam_id=${encodeURIComponent(examId)}`, {
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

// ─── Adapter ───

async function getAdapter(examId, force = false) {
  if (force) delete cachedAdapters[examId];
  if (cachedAdapters[examId]) {
    return { success: true, data: cachedAdapters[examId] };
  }

  const token = await getToken();
  if (!token) return { success: false, error: 'Not authenticated' };

  try {
    const res = await fetch(`${API_BASE}/extension/adapters/${examId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
      return { success: false, error: `Adapter fetch failed (${res.status})` };
    }

    const data = await res.json();
    if (data.success && data.data) {
      cachedAdapters[examId] = data.data;
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
    `${API_BASE}/extension/adapters/${encodeURIComponent(examId)}/sections/${encodeURIComponent(sectionId)}`,
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

  try {
    const response = await chrome.tabs.sendMessage(activeTab.id, { type: 'SCAN_PAGE' });
    return response;
  } catch (err) {
    return { success: false, error: `Page scanner not responding: ${err.message}. Reload the portal page and try again.` };
  }
}

// ─── Build adapter section (admin-only, calls Gemini via backend) ───

async function buildAdapterSection({ exam_id, page }) {
  const token = await getToken();
  if (!token) return { success: false, error: 'Not authenticated' };

  // The backend's AI ladder can run long; cap below the sidebar's 160s guard.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 150000);
  try {
    const res = await fetch(`${API_BASE}/extension/adapters/build`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ exam_id, page }),
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
    const res = await fetch(`${API_BASE}/extension/adapters/${exam_id}/status`, {
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
    const res = await fetch(`${API_BASE}/extension/fill-report`, {
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
