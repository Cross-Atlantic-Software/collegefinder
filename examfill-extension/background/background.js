/**
 * Background Service Worker
 * 
 * Responsibilities:
 * - Detect when student navigates to a known exam portal
 * - Fetch adapter config + student profile from backend API
 * - Route messages between sidebar and content script
 * - Open side panel when on an exam portal
 * - Handle auth token management
 */

const API_BASE = 'http://localhost:5001/api';

// ─── In-memory cache (never persisted to disk for privacy) ───

let cachedProfile = null;
let cachedProfileTimestamp = 0;
const PROFILE_CACHE_TTL = 10 * 60 * 1000; // 10 min

let cachedAdapters = {};  // keyed by exam_id
let currentExam = null;   // { exam_id, exam_name, adapter }

// ─── URL Detection ───

const PORTAL_PATTERNS = [
  { pattern: 'jeemain.nta.nic.in',     exam_id: 'jee_main' },
  { pattern: 'neet.nta.nic.in',        exam_id: 'neet_ug' },
  { pattern: 'cuet.samarth.ac.in',     exam_id: 'cuet_ug' },
  { pattern: 'mhtcet2025.mahacet.org', exam_id: 'mht_cet' },
  { pattern: 'bitsadmission.com',      exam_id: 'bitsat' },
  { pattern: 'viteee.vit.ac.in',       exam_id: 'viteee' },
  { pattern: 'nata-app.org',           exam_id: 'nata' },
  { pattern: 'stureg.nata-app.org',    exam_id: 'nata' },
];

function detectExam(url) {
  if (!url) return null;
  for (const p of PORTAL_PATTERNS) {
    if (url.includes(p.pattern)) return p;
  }
  return null;
}

// ─── Tab Navigation Listener ───

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab.url) return;

  const match = detectExam(tab.url);
  if (match) {
    currentExam = { exam_id: match.exam_id, tabId };
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

    case 'DETECT_EXAM':
      return detectCurrentExam(message.payload);

    case 'GET_ADAPTER':
      return getAdapter(message.payload.exam_id);

    case 'FILL_SECTION':
      return fillSection(message.payload);

    case 'SEND_FILL_REPORT':
      return sendFillReport(message.payload);

    case 'GET_SUPPORTED_EXAMS':
      return { success: true, exams: PORTAL_PATTERNS };

    case 'FETCH_FILE_AS_BASE64':
      return fetchFileAsBase64(message.payload);

    default:
      return { success: false, error: `Unknown message type: ${message.type}` };
  }
}

// ─── Auth ───

async function getAuthStatus() {
  const { examfill_token } = await chrome.storage.local.get('examfill_token');
  return { success: true, authenticated: !!examfill_token };
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
    // Backend returns token nested under data.data.token
    const token = data.token || data.data?.token;
    if (!data.success || !token) {
      return { success: false, error: data.message || 'Invalid OTP' };
    }
    await chrome.storage.local.set({ examfill_token: token });
    cachedProfile = null;
    cachedProfileTimestamp = 0;
    return { success: true };
  } catch (err) {
    return { success: false, error: `Network error: ${err.message}` };
  }
}

// Keep LOGIN as alias calling sendOtp for backward compat
async function login(payload) {
  return sendOtp(payload);
}

async function logout() {
  await chrome.storage.local.remove('examfill_token');
  cachedProfile = null;
  cachedProfileTimestamp = 0;
  currentExam = null;
  return { success: true };
}

async function getToken() {
  const { examfill_token } = await chrome.storage.local.get('examfill_token');
  return examfill_token || null;
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

// ─── Exam Detection ───

const EXAM_DISPLAY_NAMES = {
  jee_main: 'JEE Main',
  neet_ug:  'NEET UG',
  cuet_ug:  'CUET',
  mht_cet:  'MHT-CET',
  bitsat:   'BITSAT',
  viteee:   'VITEEE',
  nata:     'NATA 2026'
};

function detectCurrentExam(payload) {
  const url = payload?.url || '';
  const match = detectExam(url);
  if (!match) return { success: false, detected: false };

  return {
    success: true,
    detected: true,
    exam_id: match.exam_id,
    exam_name: EXAM_DISPLAY_NAMES[match.exam_id] || match.exam_id
  };
}

// ─── Adapter ───

async function getAdapter(examId) {
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

// ─── Fill Orchestration ───

async function fillSection(payload) {
  const { section, fields, userData, tabId } = payload;

  // Find the tab to send to
  let targetTabId = tabId;
  if (!targetTabId) {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    targetTabId = activeTab?.id;
  }

  if (!targetTabId) {
    return { success: false, error: 'No active tab found' };
  }

  try {
    const response = await chrome.tabs.sendMessage(targetTabId, {
      type: 'FILL_SECTION',
      payload: { section, fields, userData }
    });

    return response;
  } catch (err) {
    return { success: false, error: `Content script not responding: ${err.message}` };
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

    // Convert ArrayBuffer → base64
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
