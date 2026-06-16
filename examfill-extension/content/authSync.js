/**
 * Auth Sync — Website/CMS Session Bridge
 *
 * Runs on the CollegeFinder website (and CMS) origin. The web app stores its
 * JWT in localStorage ('auth_token' for users, 'admin_token' for CMS admins).
 * This content script reads that token and pushes it to the extension's
 * background worker, so a student already signed in on the website is logged
 * into ExamFill automatically — no separate OTP step.
 *
 * Security: the token is the user's own JWT, sent only to this extension's own
 * background worker (chrome.runtime). It is never exposed to any page or third party.
 */

(function () {
  'use strict';

  function readWebToken() {
    try {
      // Prefer the user token (extension authenticates as a user; admin powers
      // are derived server-side by matching the email against admin_users).
      const userToken = localStorage.getItem('auth_token');
      if (userToken && userToken !== 'null' && userToken !== 'undefined' && userToken.trim()) {
        return userToken.trim();
      }
      const adminToken = localStorage.getItem('admin_token');
      if (adminToken && adminToken !== 'null' && adminToken !== 'undefined' && adminToken.trim()) {
        return adminToken.trim();
      }
    } catch (_) { /* localStorage blocked */ }
    return null;
  }

  function pushToken(reason) {
    const token = readWebToken();
    if (!token) return;
    try {
      chrome.runtime.sendMessage({ type: 'WEB_SESSION_TOKEN', payload: { token, reason } }, () => {
        // Swallow "receiving end does not exist" when the worker is asleep — harmless.
        void chrome.runtime.lastError;
      });
    } catch (_) { /* extension context invalidated (e.g. reload) */ }
  }

  // 1) Push as soon as the page is ready.
  pushToken('load');

  // 2) Re-push when the tab regains focus (catches SPA logins that set the token
  //    after the initial load without a full page reload).
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') pushToken('focus');
  });

  // 3) Allow the background worker to pull the current token on demand.
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message && message.type === 'READ_WEB_SESSION') {
      sendResponse({ token: readWebToken() });
      return false;
    }
  });
})();
