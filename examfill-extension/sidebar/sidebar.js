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
  let isAdmin = false;      // populated from background after login
  let hasPublishedAdapter = false; // false → admin sees Builder by default
  let profileSchemaPaths = []; // populated lazily for the Builder source dropdown
  let builderState = {
    section: null,        // last AI-generated section (sanitized) currently being edited
    fillReports: {}       // field_id → status returned by the live filler
  };

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
    error:       $('stateError'),
    noAdapter:   $('stateNoAdapter'),
    builder:     $('stateBuilder')
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
    isAdmin  = detection.is_admin === true;
    hasPublishedAdapter = detection.has_published_adapter === true;
    showExamBadge(examName);

    // Is this a portal's own auth/login page?
    const isPortalLoginPage = isLoginPage(currentTabUrl);

    // Check ExamFill auth
    const auth = await msg('GET_AUTH_STATUS');
    if (!auth.authenticated) {
      showView('login');
      return;
    }
    if (auth.is_admin === true) isAdmin = true;

    // Fetch profile (always) + adapter (might 404 for new exams)
    const [profileRes, adapterRes] = await Promise.all([
      msg('GET_PROFILE'),
      msg('GET_ADAPTER', { exam_id: examId })
    ]);

    if (!profileRes.success) {
      if ((profileRes.error || '').includes('Token expired')) { showView('login'); return; }
      showError(profileRes.error || 'Failed to load your profile');
      return;
    }

    profile  = profileRes.data;
    adapter  = adapterRes.success ? adapterRes.data : null;
    if (adapter && adapter.exam_name) examName = adapter.exam_name;

    if (isPortalLoginPage) {
      showPortalLoginGuide();
      return;
    }

    // No published adapter for this exam yet
    if (!adapter || !Array.isArray(adapter.sections) || adapter.sections.length === 0) {
      showNoAdapterState();
      return;
    }

    showReadyState();
  }

  function showNoAdapterState() {
    showView('noAdapter');
    $('noAdapterHeading').textContent = `${examName} — Adapter not ready`;
    $('noAdapterAdminCta').style.display    = isAdmin ? 'block' : 'none';
    $('noAdapterStudentCta').style.display  = isAdmin ? 'none'  : 'block';
    $('noAdapterSub').textContent = isAdmin
      ? 'Use the Builder to scan this page and let AI map every field.'
      : 'This exam is registered but our team is still preparing the field mappings. Please check back soon.';
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

    // Admin: show the Builder toggle so they can refine the existing adapter
    $('adminToggleCard').style.display = isAdmin ? 'flex' : 'none';

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

  // ─── Builder (admin-only) ───

  async function openBuilder() {
    showView('builder');
    $('builderTitle').textContent = `Build Adapter — ${examName}`;
    $('builderSub').textContent = 'Click "Scan This Page", then review and apply the AI mapping.';
    $('builderResultArea').style.display = 'none';
    $('builderResult').style.display = 'none';
    builderState = { section: null, fillReports: {} };

    if (profileSchemaPaths.length === 0) {
      try {
        // Lightweight fallback list — covers everything in profileSchema.js.
        // Pulled at runtime would require an admin-token call from the sidebar;
        // we instead bundle a stable subset here. The CMS editor uses the live
        // /admin/exam-adapters/profile-schema endpoint for the same purpose.
        profileSchemaPaths = DEFAULT_PROFILE_PATHS;
      } catch (_) { /* noop */ }
    }
  }

  async function runScanAndBuild() {
    setLoadingState('scanPageBtn', 'scanPageBtnText', 'scanPageSpinner', true, 'Scanning…');
    $('builderResult').style.display = 'none';

    const scan = await msg('SCAN_PAGE');
    if (!scan?.success) {
      setLoadingState('scanPageBtn', 'scanPageBtnText', 'scanPageSpinner', false, 'Scan This Page');
      showBuilderResult('error', scan?.error || 'Failed to scan page');
      return;
    }

    if (!scan.page?.fields?.length) {
      setLoadingState('scanPageBtn', 'scanPageBtnText', 'scanPageSpinner', false, 'Scan This Page');
      showBuilderResult('error', 'No form fields detected on this page. Make sure the registration form is visible and try again.');
      return;
    }

    setLoadingState('scanPageBtn', 'scanPageBtnText', 'scanPageSpinner', true, 'Building with AI…');

    const build = await msg('BUILD_ADAPTER_SECTION', { exam_id: examId, page: scan.page });
    setLoadingState('scanPageBtn', 'scanPageBtnText', 'scanPageSpinner', false, 'Re-scan This Page');

    if (!build?.success) {
      showBuilderResult('error', build?.error || 'AI build failed');
      return;
    }

    builderState.section = build.data.section;
    builderState.fillReports = {};

    renderBuilderSection(builderState.section);
    showBuilderResult('success', `Mapped ${builderState.section.fields.length} fields. Click "Apply & Fill" to test or "Save Section" to persist edits.`);
  }

  function renderBuilderSection(section) {
    $('builderResultArea').style.display = 'block';
    $('builderSectionName').value = section.section_name || '';
    const pi = section.page_indicator || { type: 'url_contains', value: '' };
    $('builderPageIndicatorType').value = pi.type;
    $('builderPageIndicatorValue').value = pi.value;
    $('builderFieldCount').textContent = section.fields.length;

    const list = $('builderFieldsList');
    list.innerHTML = '';

    section.fields.forEach((f, idx) => {
      const row = document.createElement('div');
      row.className = 'builder-field-row';
      row.dataset.idx = idx;

      const sourceOptions = profileSchemaPaths.map((p) => {
        const sel = p.path === f.source ? ' selected' : '';
        return `<option value="${escAttr(p.path)}"${sel}>${escHtml(p.path)}</option>`;
      }).join('');

      const typeOptions = ['text', 'select', 'date', 'radio', 'checkbox', 'file', 'select_or_text']
        .map((t) => `<option value="${t}"${t === f.type ? ' selected' : ''}>${t}</option>`).join('');

      const status = builderState.fillReports[f.field_id];
      const statusBadge = status ? `<span class="row-status ${status}">${status}</span>` : '';

      row.innerHTML = `
        <div class="row-top">
          <span class="row-label" title="${escAttr(f.label)}">${escHtml(f.label || f.field_id)}</span>
          ${statusBadge}
        </div>
        <div class="row-top">
          <select class="row-source"><option value="">— skip —</option>${sourceOptions}</select>
          <select class="row-type">${typeOptions}</select>
        </div>
        <div class="row-meta">id: ${escHtml(f.field_id)}</div>
      `;
      row.querySelector('.row-source').addEventListener('change', (e) => {
        section.fields[idx].source = e.target.value || null;
      });
      row.querySelector('.row-type').addEventListener('change', (e) => {
        section.fields[idx].type = e.target.value;
      });
      list.appendChild(row);
    });
  }

  async function applyAndFillFromBuilder() {
    const section = currentSectionFromBuilderUI();
    if (!section || section.fields.length === 0) {
      showBuilderResult('error', 'No fields to fill');
      return;
    }
    const fields = section.fields.filter((f) => f.source);
    if (fields.length === 0) {
      showBuilderResult('error', 'Pick at least one source path before filling');
      return;
    }

    showBuilderResult('info', 'Filling on the live page…');
    const result = await msg('FILL_SECTION', {
      section: section.section_id,
      fields,
      userData: profile
    });

    if (!result?.success) {
      showBuilderResult('error', result?.error || 'Fill failed');
      return;
    }
    builderState.fillReports = {};
    for (const r of result.report?.results || []) {
      builderState.fillReports[r.field_id] =
        r.status === 'filled' ? 'filled' :
        r.status === 'check'  ? 'check'  :
        r.status === 'not_found' ? 'failed' : 'failed';
    }
    renderBuilderSection(builderState.section);
    const s = result.report?.summary || {};
    showBuilderResult('success',
      `Live fill: ${s.filled || 0} filled · ${s.check || 0} check · ${(s.failed || 0) + (s.not_found || 0)} failed`
    );
  }

  async function saveBuilderSection() {
    const section = currentSectionFromBuilderUI();
    if (!section) return;

    setLoadingState('builderSaveBtn', 'builderSaveBtnText', 'builderSaveSpinner', true, 'Saving…');

    const result = await msg('BUILD_ADAPTER_SECTION', {
      exam_id: examId,
      // Re-scan so the backend's selectors match what's actually on the page now.
      // Using the AI build endpoint here ALSO lets us merge by section_id.
      page: await reuseLastScannedPage(section)
    });
    setLoadingState('builderSaveBtn', 'builderSaveBtnText', 'builderSaveSpinner', false, 'Save Section');

    if (!result?.success) {
      showBuilderResult('error', result?.error || 'Save failed');
      return;
    }
    showBuilderResult('success', `Saved. Adapter version: ${result.data.version}`);
  }

  /**
   * Until we add a dedicated PATCH-section call from the extension, "Save"
   * re-runs the build (idempotent — same section_id replaces the existing entry).
   * This keeps the extension's payload tiny.
   */
  async function reuseLastScannedPage(section) {
    const scan = await msg('SCAN_PAGE');
    if (scan?.success && scan.page) return scan.page;
    // Fallback: synthesize a minimal page from the editor (no fields options though)
    return {
      url: currentTabUrl,
      title: section.section_name,
      headings: [section.section_name],
      fields: section.fields.map((f) => ({
        label: f.label,
        id: (f.selectors?.by_id || [])[0] || '',
        name: (f.selectors?.by_name || [])[0] || '',
        placeholder: (f.selectors?.by_placeholder || [])[0] || '',
        type: f.type,
        idx: typeof f.selectors?.by_index === 'number' ? f.selectors.by_index : 0
      }))
    };
  }

  function currentSectionFromBuilderUI() {
    if (!builderState.section) return null;
    const section = builderState.section;
    section.section_name = $('builderSectionName').value.trim() || section.section_name;
    section.page_indicator = {
      type: $('builderPageIndicatorType').value,
      value: $('builderPageIndicatorValue').value.trim()
    };
    return section;
  }

  async function publishAdapterFromBuilder() {
    if (!confirm('Publish this adapter so all students can use it?')) return;
    showBuilderResult('info', 'Publishing…');
    const result = await msg('PUBLISH_ADAPTER', { exam_id: examId, status: 'published' });
    if (!result?.success) {
      showBuilderResult('error', result?.error || 'Publish failed');
      return;
    }
    showBuilderResult('success', 'Published! Students can now use this adapter.');
    hasPublishedAdapter = true;
  }

  function showBuilderResult(kind, msg) {
    const el = $('builderResult');
    el.className = `alert alert-${kind === 'error' ? 'error' : kind === 'success' ? 'success' : 'info'}`;
    el.textContent = msg;
    el.style.display = 'flex';
  }

  function escAttr(s) { return escHtml(s).replace(/"/g, '&quot;'); }

  // Inline copy of the most common profile paths (mirrors backend/src/services/adapterBuilderService/profileSchema.js).
  const DEFAULT_PROFILE_PATHS = [
    'student.full_name', 'student.first_name', 'student.last_name', 'student.name',
    'student.father_name', 'student.mother_name', 'student.guardian_name',
    'student.dob', 'student.gender', 'student.category', 'student.sub_category',
    'student.disability', 'student.nationality', 'student.religion', 'student.marital_status',
    'student.mother_tongue', 'student.annual_family_income',
    'student.occupation_of_father', 'student.occupation_of_mother',
    'student.aadhar_no', 'student.id_document_type', 'student.pan_no', 'student.apaar_id',
    'student.mobile', 'student.alternate_mobile', 'student.email', 'student.landline',
    'address.line1', 'address.line2', 'address.city', 'address.district',
    'address.state', 'address.pincode', 'address.country',
    'education.class_10.board', 'education.class_10.school', 'education.class_10.passing_year',
    'education.class_10.roll_no', 'education.class_10.total_marks', 'education.class_10.obtained_marks',
    'education.class_10.percentage', 'education.class_10.state', 'education.class_10.city',
    'education.class_10.school_pincode', 'education.class_10.marks_type', 'education.class_10.result_status',
    'education.class_12.board', 'education.class_12.school', 'education.class_12.passing_year',
    'education.class_12.roll_no', 'education.class_12.total_marks', 'education.class_12.obtained_marks',
    'education.class_12.percentage', 'education.class_12.state', 'education.class_12.city',
    'education.class_12.school_pincode', 'education.class_12.stream', 'education.class_12.is_appearing',
    'education.class_12.marks_type', 'education.class_12.cgpa', 'education.class_12.result_status',
    'education.class_12.pass_status', 'education.class_12.education_type',
    'documents.photo', 'documents.signature', 'documents.id_proof', 'documents.aadhar_card',
    'documents.matric_marksheet', 'documents.postmatric_marksheet',
    'documents.sc_certificate', 'documents.st_certificate', 'documents.obc_certificate',
    'documents.ews_certificate', 'documents.pwbd_certificate', 'documents.category_certificate',
    'other.medium', 'other.language'
  ].map((p) => ({ path: p }));

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

    // Builder admin entry points
    $('openBuilderBtn').addEventListener('click', () => openBuilder());
    $('startBuilderBtn').addEventListener('click', () => openBuilder());
    $('exitBuilderBtn').addEventListener('click', () => {
      if (adapter && adapter.sections?.length) showReadyState();
      else showNoAdapterState();
    });
    $('scanPageBtn').addEventListener('click', () => runScanAndBuild());
    $('builderApplyFillBtn').addEventListener('click', () => applyAndFillFromBuilder());
    $('builderSaveBtn').addEventListener('click', () => saveBuilderSection());
    $('publishAdapterBtn').addEventListener('click', () => publishAdapterFromBuilder());

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
