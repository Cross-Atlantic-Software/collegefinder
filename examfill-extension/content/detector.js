/**
 * Detector — Field Detection Engine
 * 
 * Finds form elements on the portal page using a 5-strategy fallback chain.
 * Each strategy is tried in order; first success wins.
 * After finding, the element is validated (visible, enabled, correct type).
 */

const Detector = {
  /**
   * Find a form element for the given field config.
   * @param {object} fieldConfig  Adapter field definition with .selectors, .type
   * @returns {Element|null}
   */
  findField(fieldConfig) {
    const selectors = fieldConfig.selectors || {};
    let el = null;

    // Strategy 1: by ID
    if (selectors.by_id) {
      for (const id of selectors.by_id) {
        el = document.getElementById(id);
        if (el && this._validate(el, fieldConfig.type)) return el;
        el = document.querySelector(`[id*="${id}" i]`);
        if (el && this._validate(el, fieldConfig.type)) return el;
      }
    }

    // Strategy 2: by name attribute
    if (selectors.by_name) {
      for (const name of selectors.by_name) {
        el = document.querySelector(`[name="${name}"]`);
        if (el && this._validate(el, fieldConfig.type)) return el;
        el = document.querySelector(`[name="${name}" i]`);
        if (el && this._validate(el, fieldConfig.type)) return el;
      }
    }

    // Strategy 3: by placeholder text
    if (selectors.by_placeholder) {
      for (const ph of selectors.by_placeholder) {
        el = document.querySelector(`[placeholder="${ph}"]`);
        if (el && this._validate(el, fieldConfig.type)) return el;
        el = this._findByPlaceholderPartial(ph);
        if (el && this._validate(el, fieldConfig.type)) return el;
      }
    }

    // Strategy 4: by label text (most reliable long-term)
    if (selectors.by_label) {
      for (const labelText of selectors.by_label) {
        el = this._findByLabel(labelText);
        if (el && this._validate(el, fieldConfig.type)) return el;
      }
    }

    // Strategy 5: fuzzy label match (last resort)
    if (selectors.by_label) {
      for (const labelText of selectors.by_label) {
        el = this._findByFuzzyLabel(labelText);
        if (el && this._validate(el, fieldConfig.type)) return el;
      }
    }

    return null;
  },

  /**
   * Find all radio inputs for a named group.
   * @param {object} fieldConfig
   * @returns {NodeList|Array}
   */
  findRadioGroup(fieldConfig) {
    const selectors = fieldConfig.selectors || {};

    if (selectors.by_name) {
      for (const name of selectors.by_name) {
        const radios = document.querySelectorAll(`input[type="radio"][name="${name}"]`);
        if (radios.length > 0) return radios;
      }
    }

    if (selectors.by_label) {
      for (const labelText of selectors.by_label) {
        const labelEl = this._findLabelElement(labelText);
        if (labelEl) {
          const container = labelEl.closest('fieldset') || labelEl.parentElement;
          if (container) {
            const radios = container.querySelectorAll('input[type="radio"]');
            if (radios.length > 0) return radios;
          }
        }
      }
    }

    return [];
  },

  // ─── Internal helpers ───

  _validate(el, fieldType) {
    if (!el) return false;
    if (!this._isVisible(el)) return false;
    if (el.disabled) return false;

    const tag = el.tagName.toLowerCase();
    const type = (el.type || '').toLowerCase();

    if (fieldType === 'select' || fieldType === 'text_or_select' || fieldType === 'select_or_text') {
      return tag === 'select' || tag === 'input' || tag === 'textarea';
    }
    if (fieldType === 'radio') {
      return tag === 'input' && type === 'radio';
    }
    if (fieldType === 'checkbox') {
      return tag === 'input' && type === 'checkbox';
    }

    return tag === 'input' || tag === 'select' || tag === 'textarea';
  },

  _isVisible(el) {
    if (!el) return false;
    if (el.offsetParent === null && el.type !== 'hidden') {
      const style = window.getComputedStyle(el);
      if (style.position === 'fixed' || style.position === 'sticky') return true;
      return false;
    }
    return true;
  },

  _findByPlaceholderPartial(text) {
    const inputs = document.querySelectorAll('input, textarea');
    const lower = text.toLowerCase();
    for (const inp of inputs) {
      if (inp.placeholder && inp.placeholder.toLowerCase().includes(lower)) {
        return inp;
      }
    }
    return null;
  },

  _findLabelElement(text) {
    const labels = document.querySelectorAll('label');
    const lower = text.toLowerCase().trim();
    for (const label of labels) {
      const labelText = (label.textContent || '').toLowerCase().trim().replace(/\s*\*\s*$/, '').trim();
      if (labelText === lower) return label;
    }
    return null;
  },

  _findByLabel(text) {
    const label = this._findLabelElement(text);
    if (!label) return null;

    // Method A: label has "for" attribute
    const forAttr = label.getAttribute('for');
    if (forAttr) {
      const el = document.getElementById(forAttr);
      if (el) return el;
    }

    // Method B: input is a direct child of the label
    const child = label.querySelector('input, select, textarea');
    if (child) return child;

    // Method C: find the nearest input sibling
    const parent = label.parentElement;
    if (parent) {
      const sibling = parent.querySelector('input, select, textarea');
      if (sibling) return sibling;
    }

    return null;
  },

  _findByFuzzyLabel(text) {
    const labels = document.querySelectorAll('label');
    const lower = text.toLowerCase().trim();
    const words = lower.split(/\s+/);

    let bestLabel = null;
    let bestScore = 0;

    for (const label of labels) {
      const labelText = (label.textContent || '').toLowerCase().trim().replace(/\s*\*\s*$/, '').trim();
      if (!labelText) continue;

      let score = 0;
      for (const word of words) {
        if (labelText.includes(word)) score++;
      }

      const ratio = score / words.length;
      if (ratio > bestScore && ratio >= 0.5) {
        bestScore = ratio;
        bestLabel = label;
      }
    }

    if (!bestLabel) return null;

    const forAttr = bestLabel.getAttribute('for');
    if (forAttr) return document.getElementById(forAttr);

    const child = bestLabel.querySelector('input, select, textarea');
    if (child) return child;

    const parent = bestLabel.parentElement;
    if (parent) return parent.querySelector('input, select, textarea');

    return null;
  }
};

if (typeof window !== 'undefined') {
  window.ExamFillDetector = Detector;
}
