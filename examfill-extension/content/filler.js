/**
 * Filler — Field Filling Engine
 *
 * Sets values on detected form elements using the correct strategy
 * for each field type: text, select, radio, date, masked, checkbox, file.
 * Uses native prototype setters so React/Angular portals reconcile properly.
 *
 * File uploads: fetched from S3 via the background service worker (CORS bypass),
 * then injected via DataTransfer into <input type="file">.
 */

const Filler = {
  /**
   * Fill a single field.
   * @param {Element} el         The detected DOM element
   * @param {*} value            The value to set (already formatted)
   * @param {object} fieldConfig The adapter field definition
   * @returns {Promise<{status: string, note: string}>}
   */
  async fill(el, value, fieldConfig) {
    try {
      const type = fieldConfig.type || 'text';

      switch (type) {
        case 'text':
        case 'email':
        case 'tel':
        case 'number':
          return this._fillText(el, value, fieldConfig);

        case 'date':
          return await this._fillDate(el, value, fieldConfig);

        case 'select':
        case 'text_or_select':
        case 'select_or_text':
          return await this._fillSelect(el, value, fieldConfig);

        case 'radio':
          return this._fillRadio(el, value, fieldConfig);

        case 'checkbox':
          return this._fillCheckbox(el, value, fieldConfig);

        case 'file':
          return await this._fillFile(el, value, fieldConfig);

        default:
          return this._fillText(el, value, fieldConfig);
      }
    } catch (err) {
      return { status: 'failed', note: `Fill error: ${err.message}` };
    }
  },

  // ─── Text Input ───

  _fillText(el, value, fieldConfig) {
    const strVal = String(value ?? '');

    if (fieldConfig.format === 'MASKED' || this._hasMask(el)) {
      return this._fillMasked(el, strVal, fieldConfig);
    }

    this._setNativeValue(el, strVal);
    this._dispatchEvents(el);

    return { status: 'filled', note: null };
  },

  // ─── Date ───

  async _fillDate(el, value, fieldConfig) {
    const dateConfig = fieldConfig.date_config || {};
    const variant = dateConfig.variant || 'text';

    if (variant === 'native' || el.type === 'date') {
      this._setNativeValue(el, value);
      this._dispatchEvents(el);
      return { status: 'filled', note: null };
    }

    if (variant === 'text') {
      const format = dateConfig.format || 'DD/MM/YYYY';
      const Formatter = window.ExamFillFormatter;
      const formatted = Formatter ? Formatter.formatDate(value, format) : value;
      this._setNativeValue(el, formatted);
      this._dispatchEvents(el);
      return { status: 'filled', note: null };
    }

    if (variant === 'split_selects') {
      const Formatter = window.ExamFillFormatter;
      const parts = Formatter ? Formatter.splitDate(value) : {};
      const dayEl = el;
      const monthEl = fieldConfig._monthEl;
      const yearEl = fieldConfig._yearEl;

      if (dayEl) { await this._fillSelect(dayEl, parts.day, {}); }
      if (monthEl) { await this._fillSelect(monthEl, parts.month, {}); }
      if (yearEl) { await this._fillSelect(yearEl, parts.year, {}); }
      return { status: 'filled', note: null };
    }

    this._setNativeValue(el, value);
    this._dispatchEvents(el);
    return { status: 'check', note: 'Date picker variant unknown — please verify' };
  },

  // ─── Select / Dropdown ───

  async _fillSelect(el, value, fieldConfig) {
    const tag = el.tagName.toLowerCase();

    if (tag !== 'select') {
      this._fillText(el, value, fieldConfig);
      return { status: 'filled', note: null };
    }

    const Waiter = window.ExamFillWaiter;
    if (Waiter && el.options.length <= 1) {
      await Waiter.waitForSelectOptions(el, 1, fieldConfig.cascade_wait_ms || 3000);
    }

    const strVal = String(value ?? '').trim();
    const valueMap = fieldConfig.value_map || {};
    const allVariants = this._getValueVariants(strVal, valueMap);

    // Match 1: exact text match (case-insensitive)
    for (const opt of el.options) {
      const optText = opt.textContent.trim().toLowerCase();
      for (const v of allVariants) {
        if (optText === v.toLowerCase()) {
          el.value = opt.value;
          this._dispatchEvents(el);
          return { status: 'filled', note: null };
        }
      }
    }

    // Match 2: option value attribute match
    for (const opt of el.options) {
      const optVal = opt.value.trim().toLowerCase();
      for (const v of allVariants) {
        if (optVal === v.toLowerCase()) {
          el.value = opt.value;
          this._dispatchEvents(el);
          return { status: 'filled', note: null };
        }
      }
    }

    // Match 3: partial text match (last resort)
    for (const opt of el.options) {
      const optText = opt.textContent.trim().toLowerCase();
      for (const v of allVariants) {
        if (optText.includes(v.toLowerCase()) || v.toLowerCase().includes(optText)) {
          if (optText.length > 1) {
            el.value = opt.value;
            this._dispatchEvents(el);
            return {
              status: 'check',
              note: `Matched "${opt.textContent.trim()}" for "${strVal}" — please verify`
            };
          }
        }
      }
    }

    return { status: 'failed', note: `No option matched for "${strVal}"` };
  },

  // ─── Radio ───

  _fillRadio(radiosOrEl, value, fieldConfig) {
    let radios;
    if (radiosOrEl instanceof NodeList || Array.isArray(radiosOrEl)) {
      radios = radiosOrEl;
    } else {
      const name = radiosOrEl.name;
      radios = name ? document.querySelectorAll(`input[type="radio"][name="${name}"]`) : [radiosOrEl];
    }

    const strVal = String(value ?? '').trim();
    const valueMap = fieldConfig.value_map || {};
    const allVariants = this._getValueVariants(strVal, valueMap);

    // Try matching by value attribute
    for (const radio of radios) {
      const radioVal = radio.value.trim().toLowerCase();
      for (const v of allVariants) {
        if (radioVal === v.toLowerCase()) {
          radio.checked = true;
          radio.dispatchEvent(new Event('click', { bubbles: true }));
          radio.dispatchEvent(new Event('change', { bubbles: true }));
          return { status: 'filled', note: null };
        }
      }
    }

    // Try matching by label text of each radio
    for (const radio of radios) {
      const label = radio.closest('label') ||
                    document.querySelector(`label[for="${radio.id}"]`);
      if (label) {
        const labelText = label.textContent.trim().toLowerCase();
        for (const v of allVariants) {
          if (labelText.includes(v.toLowerCase())) {
            radio.checked = true;
            radio.dispatchEvent(new Event('click', { bubbles: true }));
            radio.dispatchEvent(new Event('change', { bubbles: true }));
            return { status: 'filled', note: null };
          }
        }
      }
    }

    return { status: 'failed', note: `No radio matched for "${strVal}"` };
  },

  // ─── Checkbox ───

  _fillCheckbox(el, value, _fieldConfig) {
    const shouldCheck = value === true || value === 'true' || value === '1' || value === 'yes';
    if (el.checked !== shouldCheck) {
      el.checked = shouldCheck;
      el.dispatchEvent(new Event('click', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
    return { status: 'filled', note: null };
  },

  // ─── File Upload (via S3 URL fetched by background) ───

  async _fillFile(el, url, fieldConfig) {
    if (!url) return { status: 'skipped', note: 'No document URL in profile' };
    if (el.type !== 'file') return { status: 'failed', note: 'Element is not a file input' };

    // Request background to fetch the file (bypasses CORS)
    const result = await new Promise(resolve => {
      chrome.runtime.sendMessage({ type: 'FETCH_FILE_AS_BASE64', payload: { url } }, resolve);
    });

    if (!result?.success) {
      return { status: 'failed', note: `Could not fetch file: ${result?.error || 'unknown'}` };
    }

    // Decode base64 → Uint8Array → Blob → File
    const binary = atob(result.base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    const mimeType = result.mimeType || 'application/octet-stream';
    const blob = new Blob([bytes], { type: mimeType });

    // Derive filename from URL, fallback to fieldConfig or generic name
    const rawName = url.split('/').pop().split('?')[0] || '';
    const ext = mimeType.includes('pdf') ? '.pdf'
              : mimeType.includes('png') ? '.png'
              : mimeType.includes('jpeg') || mimeType.includes('jpg') ? '.jpg'
              : '';
    const filename = rawName || `${fieldConfig.field_id || 'document'}${ext}`;

    const file = new File([blob], filename, { type: mimeType, lastModified: Date.now() });

    // Inject via DataTransfer (the only way to programmatically set input.files)
    const dt = new DataTransfer();
    dt.items.add(file);
    el.files = dt.files;

    // Fire change + input events so React / Angular picks up the new file
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('input',  { bubbles: true }));

    return { status: 'filled', note: `Uploaded ${filename} (${Math.round(bytes.length / 1024)} KB)` };
  },

  // ─── Masked input (char-by-char) ───

  _fillMasked(el, value, fieldConfig) {
    const Formatter = window.ExamFillFormatter;
    const formatted = fieldConfig.mask_pattern && Formatter
      ? Formatter.applyMask(value, fieldConfig.mask_pattern)
      : value;

    el.focus();
    el.value = '';
    el.dispatchEvent(new Event('input', { bubbles: true }));

    for (let i = 0; i < formatted.length; i++) {
      const char = formatted[i];
      el.dispatchEvent(new KeyboardEvent('keydown', { key: char, bubbles: true }));
      el.value += char;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new KeyboardEvent('keyup', { key: char, bubbles: true }));
    }

    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));

    return { status: 'filled', note: null };
  },

  // ─── Shared Helpers ───

  _setNativeValue(el, value) {
    const proto = el.tagName === 'TEXTAREA'
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;

    const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value');
    if (nativeSetter && nativeSetter.set) {
      nativeSetter.set.call(el, value);
    } else {
      el.value = value;
    }
  },

  _dispatchEvents(el) {
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
  },

  _hasMask(el) {
    return el.hasAttribute('data-mask') ||
           el.hasAttribute('data-inputmask') ||
           el.className.includes('mask');
  },

  /**
   * Build an array of all value variants for matching dropdown options.
   * Uses the adapter's value_map to expand the canonical value into
   * all known aliases for the portal.
   */
  _getValueVariants(canonicalValue, valueMap) {
    if (canonicalValue == null) return [];
    const cv = String(canonicalValue);
    const variants = [cv];

    if (!valueMap || typeof valueMap !== 'object') return variants;

    for (const [key, aliases] of Object.entries(valueMap)) {
      if (String(key).toLowerCase() === cv.toLowerCase()) {
        if (Array.isArray(aliases)) {
          variants.push(...aliases.filter(a => a != null).map(String));
        }
        break;
      }
      if (Array.isArray(aliases)) {
        for (const alias of aliases) {
          if (alias != null && String(alias).toLowerCase() === cv.toLowerCase()) {
            variants.push(String(key));
            variants.push(...aliases.filter(a => a != null && String(a).toLowerCase() !== cv.toLowerCase()).map(String));
            break;
          }
        }
      }
    }

    return [...new Set(variants)];
  }
};

if (typeof window !== 'undefined') {
  window.ExamFillFiller = Filler;
}
