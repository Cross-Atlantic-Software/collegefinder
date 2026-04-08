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
  });

  /**
   * Fill all fields in a section.
   * @param {object} payload  { section, fields, userData, adapter }
   */
  async function handleFillSection(payload) {
    if (isRunning) {
      return { error: 'Fill already in progress' };
    }

    isRunning = true;
    const results = [];

    try {
      const { fields, userData } = payload;

      // Sort fields: fill non-dependent fields first, then cascade-dependent ones
      const sorted = sortByCascade(fields);

      for (const fieldConfig of sorted) {
        const result = await fillOneField(fieldConfig, userData);
        results.push(result);

        // Small delay between fields to let portals process events
        if (Waiter) await Waiter.delay(150);
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
  async function fillOneField(fieldConfig, userData) {
    const fieldId = fieldConfig.field_id;
    const label = fieldConfig.label || fieldId;

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
        // Retry with MutationObserver
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

      if (!el) {
        return {
          field_id: fieldId,
          label,
          status: 'not_found',
          note: 'Field not found on page',
          value: String(rawValue)
        };
      }
    }

    // 5. Fill
    const fillResult = await Filler.fill(el, rawValue, fieldConfig);

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

  // Signal readiness
  console.log('[ExamFill] Content script loaded on', window.location.hostname);
})();
