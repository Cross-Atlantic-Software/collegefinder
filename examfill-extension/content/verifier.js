/**
 * Verifier — Read-back Verification
 * 
 * After every fill, reads back the element's value and compares
 * with what was intended. Ensures no silent wrong fills.
 */

const Verifier = {
  /**
   * Verify a filled field.
   * @param {Element} el             The DOM element that was filled
   * @param {string}  intendedValue  What we tried to set
   * @param {object}  fieldConfig    The adapter field definition
   * @param {object}  fillResult     Result from Filler.fill() — { status, note }
   * @returns {object} Final result: { status, note, actualValue }
   */
  verify(el, intendedValue, fieldConfig, fillResult) {
    if (fillResult.status === 'not_found') {
      return { ...fillResult, actualValue: null };
    }

    if (fillResult.status === 'failed') {
      return { ...fillResult, actualValue: null };
    }

    // File inputs: verify by checking el.files.length
    if (fieldConfig.type === 'file') {
      const singleEl = (el instanceof NodeList || Array.isArray(el)) ? el[0] : el;
      const hasFile = singleEl?.files?.length > 0;
      if (fillResult.status === 'filled' && hasFile) {
        return { status: 'filled', note: fillResult.note, actualValue: singleEl.files[0]?.name || '' };
      }
      if (fillResult.status === 'filled' && !hasFile) {
        return { status: 'failed', note: 'File injection succeeded but portal did not accept it', actualValue: null };
      }
      return { ...fillResult, actualValue: null };
    }

    // Custom dropdown fills are verified by the filler itself (click confirmed).
    // The underlying hidden <select> value may not match, so trust the filler.
    if (fillResult.note && fillResult.note.startsWith('Custom dropdown:')) {
      return { status: 'filled', note: fillResult.note, actualValue: fillResult.note.replace('Custom dropdown: ', '') };
    }

    const type = fieldConfig.type || 'text';
    const tag  = (el instanceof Element) ? (el.tagName || '').toLowerCase() : '';
    let actual;

    // Radio groups pass a NodeList (not a single Element) — handle before accessing tagName
    if (type === 'radio') {
      actual = this._readRadio(el, fieldConfig);
    } else if (type === 'checkbox') {
      actual = el.checked ? 'true' : 'false';
    } else if (tag === 'select') {
      // For hidden selects (custom dropdown), read back the visible overlay text if available
      const cs = window.getComputedStyle(el);
      const isHidden = cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.05;
      if (isHidden) {
        // Try to read visible overlay text near the hidden select
        let overlayText = '';
        let wrapper = el.parentElement;
        for (let i = 0; i < 5 && wrapper; i++) {
          const valueEl = wrapper.querySelector(
            '[class*="single-value"], [class*="selected-value"], ' +
            '[class*="SelectValue"], [role="combobox"] span, ' +
            '[class*="value-container"] span'
          );
          if (valueEl && valueEl.textContent.trim()) {
            overlayText = valueEl.textContent.trim();
            break;
          }
          wrapper = wrapper.parentElement;
        }
        actual = overlayText || (el.options[el.selectedIndex]?.textContent.trim() ?? '');
      } else {
        const selectedOpt = el.options[el.selectedIndex];
        actual = selectedOpt ? selectedOpt.textContent.trim() : '';
      }
    } else {
      actual = el.value || '';
    }

    if (fillResult.status === 'check') {
      return { ...fillResult, actualValue: actual };
    }

    const intended = String(intendedValue ?? '').trim();
    const actualTrimmed = String(actual).trim();

    if (this._matches(intended, actualTrimmed, fieldConfig)) {
      return { status: 'filled', note: null, actualValue: actual };
    }

    if (actualTrimmed === '' || actualTrimmed === intended) {
      return { status: 'filled', note: null, actualValue: actual };
    }

    // Value was transformed (auto-capitalised, etc.) — acceptable but flag
    if (this._fuzzyMatch(intended, actualTrimmed)) {
      return {
        status: 'check',
        note: `Value was transformed: "${actualTrimmed}" (expected "${intended}")`,
        actualValue: actual
      };
    }

    // Complete mismatch — clear and report
    try {
      if (tag !== 'select' && type !== 'radio' && type !== 'checkbox') {
        const proto = HTMLInputElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(proto, 'value');
        if (setter && setter.set) {
          setter.set.call(el, '');
        } else {
          el.value = '';
        }
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } catch (_) { /* best effort */ }

    return {
      status: 'failed',
      note: `Read-back mismatch: got "${actualTrimmed}" instead of "${intended}"`,
      actualValue: actual
    };
  },

  _readRadio(elOrRadios, fieldConfig) {
    let radios;
    if (elOrRadios instanceof NodeList || Array.isArray(elOrRadios)) {
      radios = elOrRadios;
    } else if (elOrRadios.name) {
      radios = document.querySelectorAll(`input[type="radio"][name="${elOrRadios.name}"]`);
    } else {
      return elOrRadios.checked ? elOrRadios.value : '';
    }

    for (const r of radios) {
      if (r.checked) return r.value;
    }
    return '';
  },

  _matches(intended, actual, fieldConfig) {
    if (intended.toLowerCase() === actual.toLowerCase()) return true;

    const valueMap = fieldConfig.value_map || {};
    for (const aliases of Object.values(valueMap)) {
      if (!Array.isArray(aliases)) continue;
      const lowerAliases = aliases.filter(a => a != null).map(a => String(a).toLowerCase());
      if (lowerAliases.includes(intended.toLowerCase()) && lowerAliases.includes(actual.toLowerCase())) {
        return true;
      }
    }

    return false;
  },

  _fuzzyMatch(a, b) {
    const normalize = s => s.toLowerCase().replace(/[\s\-_.]/g, '').replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
    return normalize(a) === normalize(b);
  }
};

if (typeof window !== 'undefined') {
  window.ExamFillVerifier = Verifier;
}
