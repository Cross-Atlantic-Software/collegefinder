/**
 * Content Script — Fill Pipeline Orchestrator
 * 
 * Injected into exam portal pages. Listens for messages from background.js,
 * runs the detect → fill → verify → highlight pipeline for each field,
 * and sends fill reports back.
 * 
 * This is the ONLY script that touches the portal DOM.
 */

(function () {
  'use strict';

  const Detector   = window.ExamFillDetector;
  const Filler     = window.ExamFillFiller;
  const Verifier   = window.ExamFillVerifier;
  const Highlighter = window.ExamFillHighlighter;
  const Resolver   = window.ExamFillResolver;
  const Formatter  = window.ExamFillFormatter;
  const Waiter     = window.ExamFillWaiter;
  const PageScanner = window.ExamFillPageScanner;

  let isRunning = false;

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'FILL_SECTION') {
      handleFillSection(message.payload)
        .then(report => sendResponse({ success: true, report }))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true; // async response
    }

    if (message.type === 'CLEAR_HIGHLIGHTS') {
      Highlighter.clearAll();
      sendResponse({ success: true });
      return false;
    }

    if (message.type === 'PING') {
      sendResponse({ alive: true });
      return false;
    }

    if (message.type === 'SCAN_PAGE') {
      try {
        if (!PageScanner) {
          sendResponse({ success: false, error: 'PageScanner not loaded' });
          return false;
        }
        const page = PageScanner.scan();
        sendResponse({ success: true, page });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
      return false;
    }
  });

  /**
   * Returns true if the current page satisfies the section's page_indicator.
   *
   * For page_text_contains we check the page's HEADING elements (h1/h2/h3) and the
   * document title ONLY — not the full body text. The NATA portal (and most portals)
   * show all step names in the nav/stepper, so a body-wide search would match the
   * "wrong" step's text. The active page heading is the reliable discriminator.
   */
  function pageMatchesIndicator(pageIndicator) {
    if (!pageIndicator) return true; // no indicator = always match

    if (pageIndicator.type === 'url_contains') {
      return window.location.href.includes(pageIndicator.value);
    }

    if (pageIndicator.type === 'page_text_contains') {
      const needle = String(pageIndicator.value).toLowerCase();

      // 1. Check page <title>
      if (document.title.toLowerCase().includes(needle)) return true;

      // 2. Check visible headings (h1 → h3) — the active section heading
      const headings = document.querySelectorAll('h1, h2, h3');
      for (const h of headings) {
        if (h.offsetParent !== null && h.textContent.toLowerCase().includes(needle)) return true;
      }

      // 3. Check elements that portals commonly use as "page/section titles"
      //    (.page-title, .section-title, [class*="heading"], [class*="title"])
      const titleEls = document.querySelectorAll(
        '.page-title, .section-title, .form-title, .card-title, ' +
        '[class*="pageTitle"], [class*="sectionTitle"], [class*="formTitle"]'
      );
      for (const el of titleEls) {
        if (el.offsetParent !== null && el.textContent.toLowerCase().includes(needle)) return true;
      }

      return false;
    }

    if (pageIndicator.type === 'step_number') {
      // Look for active step indicators
      const stepEls = document.querySelectorAll(
        '[aria-current="step"], .step.active, .stepper-item.active, ' +
        '[class*="step"][class*="active"], [class*="active"][class*="step"]'
      );
      for (const el of stepEls) {
        const txt = el.textContent.trim();
        if (txt === String(pageIndicator.value) || txt.includes(`Step ${pageIndicator.value}`)) return true;
      }
      return window.location.href.includes(`step=${pageIndicator.value}`) ||
             window.location.href.includes(`step-${pageIndicator.value}`);
    }

    return true; // unknown type = allow
  }

  /**
   * Fill all fields in a section.
   * @param {object} payload  { section, fields, userData, adapter, page_indicator }
   */
  async function handleFillSection(payload) {
    if (isRunning) {
      return { error: 'Fill already in progress' };
    }

    // Check page_indicator — if the current page doesn't match this section,
    // abort with a clear message so the user knows to navigate to the right page.
    const pageIndicator = payload.page_indicator || null;
    if (pageIndicator && !pageMatchesIndicator(pageIndicator)) {
      return {
        results: [],
        summary: { total: 0, filled: 0, check: 0, failed: 0, skipped: 0, not_found: 0 },
        page_mismatch: true,
        page_mismatch_note: `This section is for a different page. Please navigate to the correct step first.`
      };
    }

    isRunning = true;
    const results = [];

    try {
      const { fields, userData } = payload;

      // Admin-validation only: build the authoritative "mapped" set so we can later
      // surface page fields that AREN'T in the adapter. touchedKeys is seeded from
      // EVERY mapped field's by_id/by_name/by_label up front — a field is mapped the
      // moment it's in payload.fields, regardless of fill outcome (leave_blank and
      // "no profile data" both return BEFORE element resolution, so recording only at
      // resolution time would re-flag them as unmapped every run). touchedEls
      // additionally captures elements resolved at runtime for fields mapped only by
      // index/placeholder/proximity that have no stable id/name key in config.
      const adminValidate = payload.admin_validate === true;
      const touchedEls = adminValidate ? new Set() : null;
      const touchedKeys = adminValidate ? seedTouchedKeys(fields) : null;

      // Sort fields: fill non-dependent fields first, then cascade-dependent ones
      const sorted = sortByCascade(fields);

      for (const fieldConfig of sorted) {
        try {
          const result = await fillOneField(fieldConfig, userData, touchedEls);
          results.push(result);
        } catch (fieldErr) {
          results.push({
            field_id: fieldConfig.field_id || '__unknown',
            label: fieldConfig.label || fieldConfig.field_id || 'Unknown Field',
            status: 'failed',
            note: fieldErr.message,
            value: null
          });
        }

        // Small delay between fields to let portals process events
        if (Waiter) await Waiter.delay(150);
      }

      // Admin-validation only: append page fields that matched no mapped field.
      if (adminValidate) {
        try {
          results.push(...collectUnmapped(touchedEls, touchedKeys));
        } catch (scanErr) {
          // Non-fatal — a scan failure must never break the fill report.
          console.warn('[ExamFill] unmapped scan failed:', scanErr.message);
        }
      }
    } catch (err) {
      results.push({
        field_id: '__pipeline_error',
        label: 'Pipeline Error',
        status: 'failed',
        note: err.message,
        value: null
      });
    } finally {
      isRunning = false;
    }

    return {
      results,
      summary: summarise(results)
    };
  }

  /**
   * Fill a single field: resolve value → detect element → fill → verify → highlight.
   */
  async function fillOneField(fieldConfig, userData, touched = null) {
    const fieldId = fieldConfig.field_id;
    const label = fieldConfig.label || fieldId;

    // 0. Admin "Leave Blank" (Captcha/OTP/manual fields): short-circuit BEFORE any
    // selector work so the field never attempts a fill and never counts as
    // failed/not_found — it reports 'skipped', which never blocks approval.
    if (fieldConfig.leave_blank === true) {
      return {
        field_id: fieldId,
        label,
        type: fieldConfig.type,
        status: 'skipped',
        note: 'Configured to leave blank',
        value: null
      };
    }

    // 1. Resolve value from user profile
    let rawValue = Resolver.resolve(fieldConfig.source, userData);

    if (!Resolver.hasValue(rawValue)) {
      return {
        field_id: fieldId,
        label,
        status: 'not_found',
        note: `No data in profile for "${fieldConfig.source}"`,
        value: null
      };
    }

    // 2. Format the value
    rawValue = formatValue(rawValue, fieldConfig);

    // 3. Wait for cascade dependency if needed
    if (fieldConfig.cascade_dependency && Waiter) {
      await Waiter.delay(fieldConfig.cascade_wait_ms || 1500);
    }

    // 4. Detect the element
    let el;
    if (fieldConfig.type === 'radio') {
      el = Detector.findRadioGroup(fieldConfig);
      if (!el || (el.length !== undefined && el.length === 0)) {
        if (Waiter) {
          await Waiter.delay(1000);
          el = Detector.findRadioGroup(fieldConfig);
        }
      }
      if (!el || (el.length !== undefined && el.length === 0)) {
        return {
          field_id: fieldId,
          label,
          status: 'not_found',
          note: 'Radio group not found on page',
          value: String(rawValue)
        };
      }
    } else {
      el = Detector.findField(fieldConfig);
      if (!el && Waiter) {
        if (fieldConfig.type === 'file') {
          // File inputs may load late — simple retry with delay
          await Waiter.delay(1500);
          el = Detector.findField(fieldConfig);
        } else {
          // Retry with MutationObserver for non-file fields
          const selectors = fieldConfig.selectors || {};
          const ids = selectors.by_id || [];
          for (const id of ids) {
            el = await Waiter.waitForElement(`#${id}`, 3000);
            if (el) break;
          }
          if (!el) {
            el = Detector.findField(fieldConfig);
          }
        }
      }

      if (!el) {
        return {
          field_id: fieldId,
          label,
          status: 'not_found',
          note: fieldConfig.type === 'file'
            ? 'File input not found on page — check if field is visible'
            : 'Field not found on page',
          value: String(rawValue)
        };
      }
    }

    // Admin-validation: record the resolved element(s) so the post-fill diff knows
    // this page node is mapped (covers index/placeholder/proximity matches that have
    // no stable id/name key in the adapter config).
    if (touched) recordTouched(touched, el);

    // 5. Fill
    const fillResult = await Filler.fill(el, rawValue, fieldConfig);

    // Let React reconcile before verifying — without this, the verifier reads
    // the native DOM value we just set, but React may reset it a frame later.
    await new Promise(r => setTimeout(r, 80));

    // 6. Verify
    const verifyResult = Verifier.verify(el, rawValue, fieldConfig, fillResult);

    // 7. Highlight
    const primaryEl = (el instanceof NodeList || Array.isArray(el))
      ? (el[0] || null)
      : el;
    if (primaryEl) {
      Highlighter.highlight(primaryEl, verifyResult.status, verifyResult.note);
    }

    return {
      field_id: fieldId,
      label,
      type: fieldConfig.type,
      status: verifyResult.status,
      note: verifyResult.note,
      value: String(rawValue)
    };
  }

  function formatValue(value, fieldConfig) {
    if (!Formatter) return value;

    if (fieldConfig.type === 'date' && fieldConfig.date_config) {
      const variant = fieldConfig.date_config.variant || 'text';
      if (variant === 'text' && fieldConfig.date_config.format) {
        return Formatter.formatDate(value, fieldConfig.date_config.format);
      }
    }

    if (fieldConfig.format === 'UPPERCASE')   return Formatter.upperCase(value);
    if (fieldConfig.format === 'TITLECASE')   return Formatter.titleCase(value);
    if (fieldConfig.format === 'PHONE')       return Formatter.cleanPhone(value);
    if (fieldConfig.format === 'digits_only') return String(value).replace(/\D/g, '');
    if (fieldConfig.format === 'EMAIL_LOCAL')     return Formatter.emailLocal(value);
    if (fieldConfig.format === 'EMAIL_DOMAIN')    return Formatter.emailDomain(value);
    if (fieldConfig.format === 'EMAIL_DOMAIN_AT') return Formatter.emailDomainAt(value);

    return value;
  }

  function sortByCascade(fields) {
    const noDep = fields.filter(f => !f.cascade_dependency);
    const withDep = fields.filter(f => f.cascade_dependency);
    return [...noDep, ...withDep];
  }

  function summarise(results) {
    let filled = 0, check = 0, failed = 0, notFound = 0;
    for (const r of results) {
      if (r.status === 'filled') filled++;
      else if (r.status === 'check') check++;
      else if (r.status === 'failed') failed++;
      else if (r.status === 'not_found') notFound++;
    }
    return { filled, check, failed, not_found: notFound, total: results.length };
  }

  // ─── Admin-validation: unmapped-field detection ───────────────────────────

  /** Normalise a selector / scanned key for case-insensitive matching. */
  function normalizeKey(s) {
    return String(s == null ? '' : s).trim().toLowerCase();
  }

  /**
   * The authoritative mapped set: every by_id / by_name / by_label value across all
   * mapped fields. A field is "mapped" the moment it's in payload.fields — outcome
   * (filled / not_found / leave_blank) is irrelevant.
   *
   * Limitation: a field mapped ONLY by by_placeholder/by_index that also never resolves
   * at runtime (e.g. a placeholder-only leave_blank Captcha) would surface as unmapped.
   * No such field exists in any current adapter (all leave_blank/placeholder-only fields
   * also carry by_id/by_name/by_label), so by_placeholder is intentionally not seeded.
   */
  function seedTouchedKeys(fields) {
    const keys = new Set();
    for (const f of fields || []) {
      const sel = (f && f.selectors) || {};
      for (const k of ['by_id', 'by_name', 'by_label']) {
        const vals = sel[k];
        if (!Array.isArray(vals)) continue;
        for (const v of vals) {
          const norm = normalizeKey(v);
          if (norm) keys.add(norm);
        }
      }
    }
    return keys;
  }

  /** Record a resolved element or radio NodeList into the touched-elements set. */
  function recordTouched(touched, el) {
    if (!touched || !el) return;
    if (el instanceof Element) { touched.add(el); return; }
    if (el instanceof NodeList || Array.isArray(el)) {
      for (const e of el) if (e instanceof Element) touched.add(e);
    }
  }

  /**
   * Diff every usable page field (PageScanner's enumeration — the SAME definition of
   * "a field" used at build time) against the mapped set. An element is unmapped only
   * if it matches NEITHER a resolved element (by reference) NOR a seeded selector key
   * (by scanned id / name / label). Returns result entries with status 'unmapped',
   * which summarise() leaves uncounted and the backend stores as-is.
   */
  function collectUnmapped(touchedEls, touchedKeys) {
    if (!PageScanner || typeof PageScanner.scanElements !== 'function') return [];
    const out = [];
    let i = 0;
    for (const { el, field } of PageScanner.scanElements()) {
      i++;
      const byRef = !!(touchedEls && touchedEls.has(el));
      const idKey = normalizeKey(field.id);
      const nameKey = normalizeKey(field.name);
      const labelKey = normalizeKey(field.label);
      const byKey = !!(touchedKeys && (
        (idKey && touchedKeys.has(idKey)) ||
        (nameKey && touchedKeys.has(nameKey)) ||
        (labelKey && touchedKeys.has(labelKey))
      ));
      if (byRef || byKey) continue;
      out.push({
        field_id: `__unmapped_${field.id || field.name || `${field.type}_${i}`}`,
        label: field.label || field.id || field.name || '(no label)',
        status: 'unmapped',
        value: null,
        note: 'On page, not in adapter',
        scanned: {
          label: field.label,
          id: field.id,
          name: field.name,
          type: field.type,
          options: field.options
        }
      });
    }
    return out;
  }

  // Signal readiness
  console.log('[ExamFill] Content script loaded on', window.location.hostname);
})();
