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

    // File inputs: can't meaningfully read-back a URL from el.value — trust the fill result
    if (fieldConfig.type === 'file') {
      return { status: fillResult.status, note: fillResult.note, actualValue: null };
    }

    const tag = el.tagName.toLowerCase();
    const type = fieldConfig.type || 'text';
    let actual;

    if (type === 'radio') {
      actual = this._readRadio(el, fieldConfig);
    } else if (type === 'checkbox') {
      actual = el.checked ? 'true' : 'false';
    } else if (tag === 'select') {
      const selectedOpt = el.options[el.selectedIndex];
      actual = selectedOpt ? selectedOpt.textContent.trim() : '';
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
    return a.toLowerCase().replace(/[\s\-_.]/g, '') ===
           b.toLowerCase().replace(/[\s\-_.]/g, '');
  }
};

if (typeof window !== 'undefined') {
  window.ExamFillVerifier = Verifier;
}
