/**
 * ExamFill Sidebar — Interactive State Manager
 *
 * States handled:
 *  noPortal      — not on a known exam portal
 *  login         — ExamFill not authenticated
 *  loading       — fetching profile + adapter
 *  portalLogin   — on portal's own login/auth page (step guide)
 *  ready         — on registration form, ready to fill
 *  filling       — fill pipeline running (live progress ring)
 *  complete      — fill done, show per-field report
 *  error         — something went wrong
 */

(function () {
  'use strict';

  // ─── App State ───

  let profile = null;
  let adapter = null;
  let examId = null;
  let examName = null;
  let currentTabUrl = '';
  let sectionStates = {};   // section_id → { status, report }
  let nextSectionIdx = 0;   // for "Fill Next" button

  // ─── DOM ───

  const $ = id => document.getElementById(id);
  const $q = sel => document.querySelector(sel);

  const views = {
    noPortal:    $('stateNoPortal'),
    login:       $('stateLogin'),
    loading:     $('stateLoading'),
    portalLogin: $('statePortalLogin'),
    ready:       $('stateReady'),
    filling:     $('stateFilling'),
    complete:    $('stateComplete'),
    error:       $('stateError')
  };

  // ─── Init ───

  document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    boot();
  });

  async function boot() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTabUrl = tab?.url || '';
    await detectAndLoad();
  }

  async function detectAndLoad() {
    showView('loading');

    const detection = await msg('DETECT_EXAM', { url: currentTabUrl });

    if (!detection.detected) {
      showView('noPortal');
      renderSupportedExams();
      return;
    }

    examId   = detection.exam_id;
    examName = detection.exam_name || examId;
    showExamBadge(examName);

    // Is this a portal's own auth/login page?
    const isPortalLoginPage = isLoginPage(currentTabUrl);

    // Check ExamFill auth
    const auth = await msg('GET_AUTH_STATUS');
    if (!auth.authenticated) {
      showView('login');
      return;
    }

    // Fetch profile + adapter in parallel
    const [profileRes, adapterRes] = await Promise.all([
      msg('GET_PROFILE'),
      msg('GET_ADAPTER', { exam_id: examId })
    ]);

    if (!profileRes.success) {
      if ((profileRes.error || '').includes('Token expired')) { showView('login'); return; }
      showError(profileRes.error || 'Failed to load your profile');
      return;
    }
    if (!adapterRes.success) {
      showError(adapterRes.error || 'No adapter found for this exam');
      return;
    }

    profile  = profileRes.data;
    adapter  = adapterRes.data;
    examName = adapter.exam_name || examName;

    if (isPortalLoginPage) {
      showPortalLoginGuide();
    } else {
      showReadyState();
    }
  }

  // ─── Portal login page detection ───

  const LOGIN_PATH_PATTERNS = ['/auth/login', '/login', '/signin', '/sign-in', '/auth', '/account/login'];

  function isLoginPage(url) {
    if (!url) return false;
    const lower = url.toLowerCase();
    return LOGIN_PATH_PATTERNS.some(p => lower.includes(p));
  }

  // ─── Show/hide views ───

  function showView(name) {
    Object.values(views).forEach(el => { if (el) el.style.display = 'none'; });
    if (views[name]) views[name].style.display = 'block';

    const needLogout = name === 'ready' || name === 'filling' || name === 'complete' || name === 'portalLogin';
    $('logoutBtn').style.display = needLogout ? 'block' : 'none';

    // When showing login, always reset to email step
    if (name === 'login') {
      clearOtpTimer();
      $('loginStepEmail').style.display = 'block';
      $('loginStepOtp').style.display   = 'none';
      $('emailError').style.display     = 'none';
      $('otpError').style.display       = 'none';
    }
  }

  function showExamBadge(name) {
    const badge = $('examBadge');
    badge.textContent = name;
    badge.style.display = 'block';
  }

  function showError(message) {
    $('errorMessage').textContent = message;
    showView('error');
  }

  // ─── State: No portal ───

  function renderSupportedExams() {
    const exams = ['JEE Main', 'NEET UG', 'CUET', 'MHT-CET', 'BITSAT', 'VITEEE', 'NATA'];
    const container = $('supportedExamsList');
    container.innerHTML = '';
    exams.forEach(name => {
      const tag = document.createElement('div');
      tag.className = 'exam-tag';
      tag.textContent = name;
      container.appendChild(tag);
    });
  }

  // ─── State: Portal login guide ───

  function showPortalLoginGuide() {
    $('portalDetectedName').textContent = `${examName} portal detected`;

    // Show the email fill card if we have the user's email
    const email = profile?.student?.email;
    if (email) {
      $('portalFillEmailDisplay').textContent = email;
      $('portalLoginFillCard').style.display = 'flex';
    } else {
      $('portalLoginFillCard').style.display = 'none';
    }
    $('portalFillResult').style.display = 'none';

    showView('portalLogin');
  }

  async function fillPortalEmail() {
    const email = profile?.student?.email;
    if (!email) return;

    const btn = $('fillPortalEmailBtn');
    btn.disabled = true;
    btn.textContent = 'Filling…';

    // Use the content script to fill the email field
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const tabId = tab?.id;

    // Build a minimal field config matching the NATA login email field
    const loginFields = [
      {
        field_id: 'portal_email',
        label: 'Email',
        source: 'student.email',
        type: 'text',
        selectors: {
          by_label:       ['Email', 'Email Address', 'Registered Email'],
          by_placeholder: ['Email', 'Email Address', 'Enter your email'],
          by_id:          ['email', 'userEmail', 'loginEmail', 'username'],
          by_name:        ['email', 'username', 'userEmail']
        }
      }
    ];

    try {
      const result = await msg('FILL_SECTION', {
        section: 'portal_login',
        fields: loginFields,
        userData: profile,
        tabId
      });

      const resultEl = $('portalFillResult');
      const fieldResult = result?.report?.results?.[0];

      if (result.success && fieldResult?.status === 'filled') {
        resultEl.textContent = '✓ Email filled on portal!';
        resultEl.className = 'portal-fill-result ok';
      } else {
        resultEl.textContent = '⚠ Could not find email field — please type it manually.';
        resultEl.className = 'portal-fill-result failed';
      }
      resultEl.style.display = 'block';
    } catch (err) {
      const resultEl = $('portalFillResult');
      resultEl.textContent = '⚠ Fill failed — please type your email manually.';
      resultEl.className = 'portal-fill-result failed';
      resultEl.style.display = 'block';
    }

    btn.disabled = false;
    btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Fill Email on Portal`;
  }

  // ─── State: Ready ───

  function showReadyState() {
    showView('ready');

    // Profile strip
    const name = profile?.student?.full_name || profile?.student?.name || '—';
    $('profileName').textContent = name;
    $('profileAvatar').textContent = name.charAt(0).toUpperCase();

    const meta = [
      profile?.student?.mobile,
      profile?.address?.city,
      profile?.address?.state
    ].filter(Boolean).join(' · ');
    $('profileMeta').textContent = meta || examName;

    // Profile completeness
    const fields = [
      profile?.student?.full_name,
      profile?.student?.dob,
      profile?.student?.gender,
      profile?.address?.state,
      profile?.address?.city,
      profile?.address?.pincode,
      profile?.education?.class_12?.board,
      profile?.education?.class_12?.percentage
    ];
    const filled = fields.filter(v => v && String(v).trim()).length;
    const pct = Math.round((filled / fields.length) * 100);
    $('profileCompletion').textContent = `${pct}% complete`;

    // Sections
    renderSections();
  }

  /**
   * Returns true if the current tab URL / page title matches this section's
   * page_indicator. Supports: url_contains, step_number, page_text_contains.
   */
  function sectionMatchesCurrentPage(section) {
    const pi = section.page_indicator;
    if (!pi) return false;

    if (pi.type === 'url_contains') {
      return currentTabUrl.includes(pi.value);
    }
    if (pi.type === 'page_text_contains') {
      // We can't read the live DOM here (sidebar is a separate page),
      // so we embed the page title in the URL query param sent by the content script.
      // Fallback: always return true so the section is shown as potentially active.
      return true;
    }
    // step_number: not directly resolvable from the sidebar without querying the tab
    return false;
  }

  function renderSections() {
    const container = $('sectionsList');
    container.innerHTML = '';
    if (!adapter?.sections) return;

    adapter.sections.forEach((section, idx) => {
      const state = sectionStates[section.section_id] || {};
      const card = document.createElement('div');

      const icons = { done: '✅', check: '⚠️', failed: '❌' };
      const icon = icons[state.status] || '📝';

      const fieldCount = section.fields?.length || 0;
      let metaText = `${fieldCount} fields`;
      if (state.report?.summary) {
        const s = state.report.summary;
        metaText = `${s.filled} filled · ${s.check} check · ${s.failed + s.not_found} failed`;
      }

      let btnLabel = 'Fill';
      if (state.status === 'done')  btnLabel = 'Re-fill';
      if (state.status === 'check') btnLabel = 'Re-fill';

      card.className = `section-card ${state.status || ''}`;
      card.innerHTML = `
        <div class="section-icon">${icon}</div>
        <div class="section-body">
          <div class="section-name">${escHtml(section.section_name)}</div>
          <div class="section-meta">${metaText}</div>
        </div>
        <button class="btn-fill ${state.status || ''}">${btnLabel}</button>
      `;

      card.querySelector('.btn-fill').addEventListener('click', () => fillSection(section, idx));
      container.appendChild(card);
    });
  }

  // ─── Fill: single section ───

  async function fillSection(section, idx = 0) {
    nextSectionIdx = idx + 1;

    showView('filling');
    $('fillingSectionName').textContent = section.section_name;
    $('fillCount').textContent = '0';
    $('fillLiveList').innerHTML = '';
    setRingProgress(0, 0);

    const totalFields = section.fields?.length || 0;

    try {
      const result = await msg('FILL_SECTION', {
        section:       section.section_id,
        fields:        section.fields,
        userData:      profile,
        page_indicator: section.page_indicator || null
      });

      if (!result.success) { showError(result.error || 'Fill failed'); return; }

      const report = result.report;

      if (report?.page_mismatch) {
        showError(report.page_mismatch_note || 'Wrong page for this section — please navigate to the right step first.');
        return;
      }

      // Animate the live list
      let doneCount = 0;
      for (const r of report.results) {
        doneCount++;
        addLiveRow(r);
        $('fillCount').textContent = doneCount;
        setRingProgress(doneCount, totalFields);
        await sleep(60);
      }

      // Persist section state
      let sectionStatus = 'done';
      if (report.summary.failed > 0 || report.summary.not_found > 0) sectionStatus = 'failed';
      else if (report.summary.check > 0) sectionStatus = 'check';

      sectionStates[section.section_id] = { status: sectionStatus, report };

      // Fire-and-forget analytics
      msg('SEND_FILL_REPORT', {
        exam_id: examId,
        section: section.section_id,
        adapter_version: adapter.version || 1,
        results: report.results
      }).catch(() => {});

      await sleep(400);
      showCompleteState(section, report);

    } catch (err) {
      showError(err.message);
    }
  }

  // ─── Progress ring ───

  function setRingProgress(done, total) {
    const circumference = 163;
    const pct = total > 0 ? done / total : 0;
    const offset = circumference - pct * circumference;
    const ring = $('ringFill');
    if (ring) ring.style.strokeDashoffset = offset;
  }

  function addLiveRow(result) {
    const icons = { filling: '…', filled: '✓', check: '!', failed: '✗', not_found: '✗' };
    const row = document.createElement('div');
    row.className = `live-row ${result.status === 'filled' ? 'done' : result.status}`;
    const displayVal = formatReportValue(result.value);
    row.textContent = `${icons[result.status] || '?'}  ${result.label}${displayVal ? ' → ' + displayVal : ''}`;
    $('fillLiveList').appendChild(row);
    $('fillLiveList').scrollTop = $('fillLiveList').scrollHeight;
  }

  // ─── Complete state ───

  function showCompleteState(section, report) {
    showView('complete');

    const s = report.summary;
    const totalDone = s.filled + s.check;
    const hasFailed = s.failed + s.not_found > 0;
    const isClean   = s.check === 0 && !hasFailed;

    // Header
    const header = $('completeHeader');
    header.className = `complete-header ${isClean ? 'success' : hasFailed ? 'failed' : 'partial'}`;
    header.innerHTML = `
      <div class="complete-emoji">${isClean ? '🎉' : hasFailed ? '⚠️' : '✅'}</div>
      <div class="complete-title">${isClean ? 'Filled perfectly!' : hasFailed ? 'Some fields need attention' : 'Filled — verify highlighted'}</div>
      <div class="complete-sub">${section.section_name} · ${totalDone} of ${s.total} fields done</div>
    `;

    // Summary strip
    $('summaryStrip').innerHTML = `
      <div class="stat-pill filled"><span class="stat-num">${s.filled}</span><span class="stat-label">Filled</span></div>
      <div class="stat-pill check" ><span class="stat-num">${s.check}</span><span class="stat-label">Check</span></div>
      <div class="stat-pill failed"><span class="stat-num">${s.failed + s.not_found}</span><span class="stat-label">Failed</span></div>
    `;

    // Per-field report
    const container = $('fillReport');
    container.innerHTML = '';

    for (const r of report.results) {
      const iconMap = { filled: '✅', check: '⚠️', failed: '❌', not_found: '❌' };
      const row = document.createElement('div');
      row.className = `report-row status-${r.status}`;

      row.innerHTML = `
        <span class="report-icon">${iconMap[r.status] || '❓'}</span>
        <div class="report-content">
          <div class="report-label">${escHtml(r.label)}</div>
          ${r.value    ? `<div class="report-value">→ ${escHtml(formatReportValue(r.value))}</div>` : ''}
          ${r.note && (r.status === 'check')  ? `<div class="report-note">${escHtml(r.note)}</div>` : ''}
          ${r.note && (r.status === 'failed' || r.status === 'not_found') ? `<div class="report-note error">${escHtml(r.note)}</div>` : ''}
        </div>
      `;
      container.appendChild(row);
    }

    // "Fill Next" button
    const fillNextBtn = $('fillNextBtn');
    if (adapter?.sections && nextSectionIdx < adapter.sections.length) {
      fillNextBtn.style.display = 'block';
      fillNextBtn.textContent = `Fill ${adapter.sections[nextSectionIdx].section_name} →`;
    } else {
      fillNextBtn.style.display = 'none';
    }
  }

  // ─── OTP Login Flow ───

  let otpEmail = '';
  let otpTimerInterval = null;

  function bindLoginEvents() {
    // Step A: send OTP
    $('emailForm').addEventListener('submit', async e => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      if (!email) return;

      setLoadingState('sendOtpBtn', 'sendOtpBtnText', 'sendOtpSpinner', true, 'Sending…');
      $('emailError').style.display = 'none';

      const result = await msg('SEND_OTP', { email });

      setLoadingState('sendOtpBtn', 'sendOtpBtnText', 'sendOtpSpinner', false, 'Send OTP');

      if (!result.success) {
        $('emailError').textContent = result.error || 'Failed to send OTP';
        $('emailError').style.display = 'flex';
        return;
      }

      otpEmail = email;
      $('otpSentTo').textContent = `Code sent to ${email}`;
      $('loginStepEmail').style.display = 'none';
      $('loginStepOtp').style.display = 'block';

      setupOtpInputs();
      startOtpTimer(result.expiresIn || 600);
      // focus first digit
      document.querySelectorAll('.otp-digit')[0]?.focus();
    });

    // Step B: verify OTP
    $('otpForm').addEventListener('submit', async e => {
      e.preventDefault();
      const digits = [...document.querySelectorAll('.otp-digit')].map(d => d.value).join('');
      if (digits.length < 6) return;

      setLoadingState('verifyOtpBtn', 'verifyOtpBtnText', 'verifyOtpSpinner', true, 'Verifying…');
      $('otpError').style.display = 'none';

      const result = await msg('VERIFY_OTP', { email: otpEmail, code: digits });

      setLoadingState('verifyOtpBtn', 'verifyOtpBtnText', 'verifyOtpSpinner', false, 'Verify & Sign In');

      if (!result.success) {
        $('otpError').textContent = result.error || 'Invalid OTP — please try again';
        $('otpError').className = 'alert alert-error';
        $('otpError').style.display = 'flex';
        document.querySelectorAll('.otp-digit').forEach(d => {
          d.classList.add('error');
          setTimeout(() => d.classList.remove('error'), 500);
        });
        return;
      }

      // Show green success briefly before loading
      $('otpError').textContent = '✓ Verified! Loading your profile…';
      $('otpError').className = 'alert alert-success';
      $('otpError').style.display = 'flex';

      clearOtpTimer();
      await sleep(800);
      await detectAndLoad();
    });

    // Go back to email step
    $('changeEmailBtn').addEventListener('click', () => {
      clearOtpTimer();
      $('loginStepOtp').style.display = 'none';
      $('loginStepEmail').style.display = 'block';
      $('emailError').style.display = 'none';
    });
  }

  function setupOtpInputs() {
    const digits = [...document.querySelectorAll('.otp-digit')];
    digits.forEach((inp, i) => {
      inp.value = '';
      inp.classList.remove('filled', 'error');

      inp.addEventListener('input', () => {
        const val = inp.value.replace(/\D/g, '');
        inp.value = val ? val[0] : '';
        if (val) {
          inp.classList.add('filled');
          if (i < digits.length - 1) digits[i + 1].focus();
          else $('verifyOtpBtn').focus();
        } else {
          inp.classList.remove('filled');
        }
      });

      inp.addEventListener('keydown', e => {
        if (e.key === 'Backspace' && !inp.value && i > 0) {
          digits[i - 1].focus();
          digits[i - 1].value = '';
          digits[i - 1].classList.remove('filled');
        }
        if (e.key === 'ArrowLeft' && i > 0) digits[i - 1].focus();
        if (e.key === 'ArrowRight' && i < digits.length - 1) digits[i + 1].focus();
      });

      inp.addEventListener('paste', e => {
        e.preventDefault();
        const paste = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
        digits.forEach((d, idx) => {
          d.value = paste[idx] || '';
          d.classList.toggle('filled', !!d.value);
        });
        const next = Math.min(paste.length, digits.length - 1);
        digits[next].focus();
      });
    });
  }

  function startOtpTimer(seconds) {
    clearOtpTimer();
    let remaining = seconds;

    function tick() {
      if (remaining <= 0) {
        $('otpTimer').textContent = 'OTP expired — go back and request a new one';
        $('otpTimer').className = 'otp-timer expiring';
        $('verifyOtpBtn').disabled = true;
        return;
      }
      const mins = Math.floor(remaining / 60);
      const secs = String(remaining % 60).padStart(2, '0');
      $('otpTimer').textContent = `OTP expires in ${mins}:${secs}`;
      $('otpTimer').className = remaining <= 60 ? 'otp-timer expiring' : 'otp-timer';
      remaining--;
    }

    tick();
    otpTimerInterval = setInterval(tick, 1000);
  }

  function clearOtpTimer() {
    if (otpTimerInterval) { clearInterval(otpTimerInterval); otpTimerInterval = null; }
  }

  function setLoadingState(btnId, textId, spinnerId, loading, label) {
    const btn     = $(btnId);
    const txtEl   = $(textId);
    const spinner = $(spinnerId);
    btn.disabled = loading;
    txtEl.textContent = label;
    spinner.style.display = loading ? 'block' : 'none';
  }

  // ─── Events ───

  function bindEvents() {
    bindLoginEvents();

    // Fill portal email button
    $('fillPortalEmailBtn').addEventListener('click', () => fillPortalEmail());

    // Logout
    $('logoutBtn').addEventListener('click', async () => {
      await msg('LOGOUT');
      profile = null; adapter = null; sectionStates = {};
      showExamBadgeHide();
      await detectAndLoad();
    });

    // Back to sections
    $('backToSections').addEventListener('click', () => showReadyState());

    // Fill next section
    $('fillNextBtn').addEventListener('click', () => {
      if (adapter?.sections && nextSectionIdx < adapter.sections.length) {
        fillSection(adapter.sections[nextSectionIdx], nextSectionIdx);
      }
    });

    // Retry
    $('retryBtn').addEventListener('click', () => detectAndLoad());

    // Listen for tab URL changes (user navigates within portal)
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.active) {
        currentTabUrl = tab.url || currentTabUrl;
        detectAndLoad();
      }
    });
  }

  function showExamBadgeHide() {
    const badge = $('examBadge');
    if (badge) badge.style.display = 'none';
  }

  // ─── Utils ───

  function msg(type, payload) {
    return chrome.runtime.sendMessage({ type, payload });
  }

  /** Replace long document / S3 URLs with a short label in the sidebar */
  function formatReportValue(val) {
    if (val == null || val === '') return '';
    const s = String(val).trim();
    if (/^https?:\/\//i.test(s)) return 'uploaded';
    return s;
  }

  function escHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

})();
