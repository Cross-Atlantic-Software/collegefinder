/**
 * Detector — Field Detection Engine
 * 
 * Finds form elements on the portal page using a 5-strategy fallback chain.
 * Each strategy is tried in order; first success wins.
 * After finding, the element is validated (visible, enabled, correct type).
 *
 * File inputs get special treatment: they are almost always hidden behind
 * custom "Choose file" buttons, so visibility checks are skipped for them.
 */

const Detector = {
  /**
   * Find a form element for the given field config.
   * @param {object} fieldConfig  Adapter field definition with .selectors, .type
   * @returns {Element|null}
   */
  findField(fieldConfig) {
    // File inputs need a dedicated detection path (they're always hidden)
    if (fieldConfig.type === 'file') {
      return this._findFileInput(fieldConfig);
    }

    const selectors = fieldConfig.selectors || {};
    let el = null;

    // ── PRIORITY 1: by_index ──
    // When by_index is present, the adapter is telling us "this label/placeholder
    // appears multiple times on the page — pick the Nth one." This MUST run first;
    // all other strategies return the first match which would be wrong.
    if (selectors.by_index !== undefined) {
      const idx = selectors.by_index;
      const candidates = this._collectCandidates(selectors, fieldConfig.type);
      if (candidates[idx] && this._validate(candidates[idx], fieldConfig.type)) {
        return candidates[idx];
      }
    }

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

    // Strategy 4: by label text
    if (selectors.by_label) {
      for (const labelText of selectors.by_label) {
        el = this._findByLabel(labelText);
        if (el && this._validate(el, fieldConfig.type)) return el;
      }
    }

    // Strategy 5: fuzzy label match
    if (selectors.by_label) {
      for (const labelText of selectors.by_label) {
        el = this._findByFuzzyLabel(labelText);
        if (el && this._validate(el, fieldConfig.type)) return el;
      }
    }

    return null;
  },

  /**
   * Collect all candidate elements matching by_placeholder / by_label,
   * deduplicated and in DOM order. Used by by_index to pick the Nth match.
   */
  _collectCandidates(selectors, fieldType) {
    const candidateSet = new Set();
    const ordered = [];

    const add = (el) => {
      if (el && !candidateSet.has(el)) {
        candidateSet.add(el);
        ordered.push(el);
      }
    };

    // Gather ALL matching elements from placeholder
    if (selectors.by_placeholder) {
      for (const ph of selectors.by_placeholder) {
        const lower = ph.toLowerCase();
        const all = document.querySelectorAll('input, textarea, select');
        for (const e of all) {
          if (e.placeholder && e.placeholder.toLowerCase().includes(lower)) add(e);
        }
      }
    }

    // Gather ALL matching elements from label
    if (selectors.by_label) {
      for (const labelText of selectors.by_label) {
        for (const e of this._findAllByLabel(labelText)) add(e);
      }
    }

    // Sort by DOM order (compareDocumentPosition)
    ordered.sort((a, b) => {
      const pos = a.compareDocumentPosition(b);
      if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
      if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
      return 0;
    });

    return ordered;
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

  /**
   * Find <input type="file"> — dedicated path because file inputs are
   * almost always hidden (opacity:0, display:none, size:0) behind custom
   * "Choose file" / "Upload" buttons. We skip visibility checks entirely.
   */
  _findFileInput(fieldConfig) {
    const selectors = fieldConfig.selectors || {};

    // Strategy 1: by ID — most reliable
    if (selectors.by_id) {
      for (const id of selectors.by_id) {
        let el = document.getElementById(id);
        if (el && el.tagName === 'INPUT' && el.type === 'file') return el;
        el = document.querySelector(`input[type="file"][id*="${id}" i]`);
        if (el) return el;
      }
    }

    // Strategy 2: by name
    if (selectors.by_name) {
      for (const name of selectors.by_name) {
        const el = document.querySelector(`input[type="file"][name="${name}"]`)
                || document.querySelector(`input[type="file"][name*="${name}" i]`);
        if (el) return el;
      }
    }

    // Strategy 3: by label text — walk from <label> to nearest file input
    if (selectors.by_label) {
      for (const labelText of selectors.by_label) {
        const el = this._findFileNearLabel(labelText);
        if (el) return el;
      }
    }

    // Strategy 4: by accept attribute + position in DOM
    if (fieldConfig.accepted_types) {
      for (const mime of fieldConfig.accepted_types) {
        const candidates = document.querySelectorAll(`input[type="file"][accept*="${mime}"]`);
        if (candidates.length === 1) return candidates[0];
      }
    }

    // Strategy 5: Nth file input on the page (fallback using by_index)
    if (selectors.by_index !== undefined) {
      const allFileInputs = document.querySelectorAll('input[type="file"]');
      const idx = selectors.by_index;
      if (allFileInputs[idx]) return allFileInputs[idx];
    }

    return null;
  },

  /**
   * Walk from a label to the nearest <input type="file">.
   * Searches: label[for] → label children → parent container → grandparent → siblings.
   */
  _findFileNearLabel(text) {
    const label = this._findLabelElement(text);
    if (!label) {
      // Also try fuzzy text match on any element (div, span, p, strong)
      return this._findFileNearText(text);
    }

    // Method A: label[for]
    const forAttr = label.getAttribute('for');
    if (forAttr) {
      const el = document.getElementById(forAttr);
      if (el && el.type === 'file') return el;
    }

    // Method B: child of label
    const child = label.querySelector('input[type="file"]');
    if (child) return child;

    // Method C: walk up 1-3 parent levels and find the file input
    let container = label.parentElement;
    for (let i = 0; i < 3 && container; i++) {
      const fileInput = container.querySelector('input[type="file"]');
      if (fileInput) return fileInput;
      container = container.parentElement;
    }

    // Method D: next sibling / adjacent containers
    let sibling = label.nextElementSibling;
    while (sibling) {
      if (sibling.tagName === 'INPUT' && sibling.type === 'file') return sibling;
      const inner = sibling.querySelector('input[type="file"]');
      if (inner) return inner;
      sibling = sibling.nextElementSibling;
    }

    return null;
  },

  /**
   * Fallback: search for any text node containing the label text, then find
   * the nearest file input in its container. Handles portals that use <div>,
   * <span>, <p>, or <strong> instead of <label>.
   */
  _findFileNearText(text) {
    const lower = text.toLowerCase().trim();
    const allText = document.querySelectorAll('label, div, span, p, strong, h5, h6, td, th');

    for (const node of allText) {
      const nodeText = (node.textContent || '').toLowerCase().trim().replace(/\s*\*\s*$/, '').trim();
      if (!nodeText.includes(lower) && !lower.includes(nodeText)) continue;
      if (nodeText.length < 3) continue;

      // Walk up to find containing card / row / cell
      let container = node.parentElement;
      for (let i = 0; i < 4 && container; i++) {
        const fileInput = container.querySelector('input[type="file"]');
        if (fileInput) return fileInput;
        container = container.parentElement;
      }
    }
    return null;
  },

  _validate(el, fieldType) {
    if (!el) return false;
    // File inputs are always hidden — skip visibility for them
    if (fieldType === 'file') {
      return el.tagName === 'INPUT' && el.type === 'file' && !el.disabled;
    }
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

  /**
   * Find ALL form elements associated with a label — used for by_index deduplication.
   */
  _findAllByLabel(text) {
    const lower = text.toLowerCase().trim();
    const labels = document.querySelectorAll('label');
    const results = [];

    for (const label of labels) {
      const labelText = (label.textContent || '').toLowerCase().trim().replace(/\s*\*\s*$/, '').trim();
      if (labelText !== lower) continue;

      const forAttr = label.getAttribute('for');
      if (forAttr) {
        const el = document.getElementById(forAttr);
        if (el) { results.push(el); continue; }
      }
      const child = label.querySelector('input, select, textarea');
      if (child) { results.push(child); continue; }
      const parent = label.parentElement;
      if (parent) {
        const sib = parent.querySelector('input, select, textarea');
        if (sib) results.push(sib);
      }
    }
    return results;
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
