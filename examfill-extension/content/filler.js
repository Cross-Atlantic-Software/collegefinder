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

    el.focus();

    // Strategy 1: Call React's onChange prop directly via the fiber tree.
    // This updates React's own state, so the value survives reconciliation.
    if (this._callReactOnChange(el, strVal)) {
      el.dispatchEvent(new Event('blur', { bubbles: true }));
      return { status: 'filled', note: null };
    }

    // Strategy 2: execCommand — goes through browser's native editing pipeline
    // which React also intercepts (isTrusted=true events).
    el.select();
    const execOk = document.execCommand('insertText', false, strVal);
    if (execOk && el.value === strVal) {
      el.dispatchEvent(new Event('blur', { bubbles: true }));
      return { status: 'filled', note: null };
    }

    // Strategy 3: native setter + tracker + events (last resort)
    this._setNativeValue(el, strVal);
    this._dispatchEvents(el);

    return { status: 'filled', note: null };
  },

  // ─── Date ───

  async _fillDate(el, value, fieldConfig) {
    const dateConfig = fieldConfig.date_config || {};
    const variant = dateConfig.variant || 'text';

    if (variant === 'native' || el.type === 'date') {
      el.focus();
      this._setNativeValue(el, value);
      this._dispatchEvents(el);
      return { status: 'filled', note: null };
    }

    if (variant === 'text') {
      const format = dateConfig.format || 'DD/MM/YYYY';
      const Formatter = window.ExamFillFormatter;
      const formatted = Formatter ? Formatter.formatDate(value, format) : value;
      el.focus();
      if (!this._callReactOnChange(el, formatted)) {
        el.select();
        const ok = document.execCommand('insertText', false, formatted);
        if (!ok || el.value !== formatted) {
          this._setNativeValue(el, formatted);
          this._dispatchEvents(el);
        }
      }
      el.dispatchEvent(new Event('blur', { bubbles: true }));
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
    const strVal = String(value ?? '').trim();
    const valueMap = fieldConfig.value_map || {};
    const allVariants = this._getValueVariants(strVal, valueMap);

    // Wait for options to load if still empty
    if (Waiter && el.options.length <= 1) {
      await Waiter.waitForSelectOptions(el, 1, fieldConfig.cascade_wait_ms || 3000);
    }

    // Find the matching option value
    const matchedOptValue = this._matchSelectOption(el, allVariants);
    if (matchedOptValue === null) {
      // Native options didn't match — try click-based custom dropdown (react-select etc.)
      const cs = window.getComputedStyle(el);
      const isHidden = cs.display === 'none' || cs.visibility === 'hidden' ||
                       el.getAttribute('aria-hidden') === 'true' ||
                       parseFloat(cs.opacity) < 0.05;
      const customResult = await this._fillCustomDropdown(el, allVariants, strVal, isHidden);
      return customResult;
    }

    // Matched a native option — use React fiber call to update React state directly
    el.focus();
    if (!this._callReactOnChange(el, matchedOptValue)) {
      // Fiber not found — fall back to native setter + events
      this._setNativeValue(el, matchedOptValue);
      this._dispatchEvents(el);
    }

    return { status: 'filled', note: null };
  },

  /**
   * Find the value attribute of the best matching <option>.
   * Returns the option.value string, or null if nothing matched.
   */
  _matchSelectOption(el, allVariants) {
    // Pass 1: exact text match
    for (const opt of el.options) {
      const optText = opt.textContent.trim().toLowerCase();
      for (const v of allVariants) {
        if (optText === v.toLowerCase()) return opt.value;
      }
    }
    // Pass 2: option value match
    for (const opt of el.options) {
      const optVal = opt.value.trim().toLowerCase();
      for (const v of allVariants) {
        if (optVal === v.toLowerCase()) return opt.value;
      }
    }
    // Pass 3: partial match
    for (const opt of el.options) {
      const optText = opt.textContent.trim().toLowerCase();
      if (optText.length <= 1) continue;
      for (const v of allVariants) {
        if (optText.includes(v.toLowerCase()) || v.toLowerCase().includes(optText)) {
          return opt.value;
        }
      }
    }
    return null;
  },

  /**
   * Fill a custom dropdown component (react-select, Ant Design, MUI, etc.)
   * by clicking the trigger and then clicking the matching option.
   * @param {HTMLSelectElement} hiddenSelect - The underlying hidden native <select>
   * @param {string[]} allVariants - All value variants to match against
   * @param {string} strVal - Original string value for fallback notes
   */
  async _fillCustomDropdown(el, allVariants, strVal, isHiddenEl = false) {
    const delay = ms => new Promise(r => setTimeout(r, ms));

    // For a visible <select>, click it directly to open the native picker.
    // Some frameworks style a <select> but keep it functional (NATA does this).
    if (!isHiddenEl && el.tagName === 'SELECT') {
      // Try clicking the select itself — browser opens native picker but React
      // also attaches to it via fiber. We match via fiber onChange instead.
      // Use the option list that was already confirmed empty — just report.
      return { status: 'failed', note: `No option matched for "${strVal}" in native select` };
    }

    // Walk up to find a visible custom trigger (react-select, Ant Design, MUI, etc.)
    const TRIGGER_SEL =
      '[role="combobox"], [class*="control"]:not(select), [class*="select__control"], ' +
      '[class*="select-trigger"], [class*="SelectTrigger"], ' +
      'button[aria-haspopup], [aria-expanded], [class*="dropdown-toggle"]';

    let wrapper = isHiddenEl ? el.parentElement : el;
    for (let i = 0; i < 6 && wrapper; i++) {
      const trigger = wrapper.matches?.(TRIGGER_SEL)
        ? wrapper
        : wrapper.querySelector(TRIGGER_SEL);

      if (trigger && trigger !== el) {
        // Open the dropdown
        trigger.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
        trigger.click();
        await delay(400);

        // Options may be portaled to document.body — search the whole document
        const OPTION_SELS = [
          '[role="option"]',
          '[role="listbox"] li',
          '[class*="select__option"]',
          '[class*="option"]:not(select):not(input)',
          '[class*="Option"]:not(select)',
          '[class*="menu-item"]',
          '[class*="dropdown-item"]',
        ];

        for (const sel of OPTION_SELS) {
          const opts = Array.from(document.querySelectorAll(sel)).filter(o => {
            const s = window.getComputedStyle(o);
            return s.display !== 'none' && s.visibility !== 'hidden' && o.offsetParent !== null;
          });
          if (opts.length === 0) continue;

          for (const opt of opts) {
            const optText = opt.textContent.trim().toLowerCase();
            for (const v of allVariants) {
              if (optText === v.toLowerCase() || optText.includes(v.toLowerCase())) {
                opt.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
                opt.click();
                await delay(200);
                return { status: 'filled', note: `Custom dropdown: "${opt.textContent.trim()}"` };
              }
            }
          }
        }

        // Close dropdown and report
        trigger.click();
        return { status: 'failed', note: `Custom dropdown opened but no option matched "${strVal}"` };
      }
      wrapper = wrapper.parentElement;
    }

    return { status: 'failed', note: `No custom dropdown trigger found for "${strVal}"` };
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
    let blob = new Blob([bytes], { type: mimeType });

    const rawName = url.split('/').pop().split('?')[0] || '';

    // Compress images that exceed the portal's 500 KB limit
    const MAX_BYTES = 490 * 1024; // 490 KB — safe margin under 500 KB
    if (blob.size > MAX_BYTES && mimeType.startsWith('image/')) {
      blob = await this._compressImage(blob, MAX_BYTES);
    }

    const finalMime = blob.type || mimeType;
    const ext = finalMime.includes('pdf') ? '.pdf'
              : finalMime.includes('png') ? '.png'
              : (finalMime.includes('jpeg') || finalMime.includes('jpg')) ? '.jpg'
              : '';
    const filename = (rawName || `${fieldConfig.field_id || 'document'}`) + (rawName.includes('.') ? '' : ext);

    const file = new File([blob], filename, { type: finalMime, lastModified: Date.now() });

    // Inject via DataTransfer
    const dt = new DataTransfer();
    dt.items.add(file);

    // Some frameworks override the files setter — try native descriptor first
    const nativeFilesSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'files')?.set;
    if (nativeFilesSetter) {
      nativeFilesSetter.call(el, dt.files);
    } else {
      el.files = dt.files;
    }

    // Verify the files actually stuck
    if (!el.files || el.files.length === 0) {
      return { status: 'failed', note: 'DataTransfer injection failed — browser may have blocked it' };
    }

    // Dispatch events in the order browsers do natively after user picks a file:
    // 1. input event (React 17+ uses this)
    // 2. change event (classic handler)
    // Both need bubbles:true so delegation-based frameworks see them.
    el.dispatchEvent(new Event('input',  { bubbles: true, cancelable: false }));
    el.dispatchEvent(new Event('change', { bubbles: true, cancelable: false }));

    // Some React portals wrap file inputs and listen on a parent — also trigger on parent
    if (el.parentElement) {
      el.parentElement.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Final verify: re-check files after event handlers may have cleared them
    const finalCount = el.files?.length || 0;
    if (finalCount === 0) {
      return { status: 'failed', note: 'File was set but portal cleared it during event handling' };
    }

    const kb = Math.round(blob.size / 1024);
    return { status: 'filled', note: `${filename} (${kb} KB)` };
  },

  // ─── Image Compressor ───

  /**
   * Compress an image Blob using Canvas until it fits within maxBytes.
   * Falls back to progressively lower JPEG quality, then smaller dimensions.
   * Returns the compressed Blob (always image/jpeg for maximum compression).
   */
  _compressImage(blob, maxBytes) {
    return new Promise((resolve) => {
      const img = new Image();
      const blobUrl = URL.createObjectURL(blob);

      img.onload = () => {
        URL.revokeObjectURL(blobUrl);

        const canvas = document.createElement('canvas');
        let { naturalWidth: w, naturalHeight: h } = img;

        // Scale down large dimensions first — keeps quality higher at target size
        const MAX_DIM = 1600;
        if (w > MAX_DIM || h > MAX_DIM) {
          const ratio = Math.min(MAX_DIM / w, MAX_DIM / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }

        canvas.width  = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);

        let quality = 0.85;

        const tryNext = () => {
          canvas.toBlob((compressed) => {
            if (!compressed) { resolve(blob); return; }

            if (compressed.size <= maxBytes || quality <= 0.2) {
              resolve(compressed);
            } else {
              quality = parseFloat((quality - 0.1).toFixed(1));
              tryNext();
            }
          }, 'image/jpeg', quality);
        };

        tryNext();
      };

      img.onerror = () => {
        URL.revokeObjectURL(blobUrl);
        resolve(blob); // fallback: use original
      };

      img.src = blobUrl;
    });
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

  // ─── React Fiber Direct Updater ───

  /**
   * Directly invoke the React onChange/onInput prop on an element
   * by walking its fiber tree. This updates React's internal state so
   * the value survives reconciliation — unlike synthetic events which
   * React may ignore depending on version / event delegation setup.
   *
   * Sets el.value via native setter first so e.target.value is correct
   * when the handler reads it.
   *
   * @returns {boolean} true if an onChange/onInput handler was found and called
   */
  _callReactOnChange(el, value) {
    // 1. Set native value so e.target.value is correct when handler reads it
    const tag = el.tagName;
    const proto = tag === 'TEXTAREA' ? HTMLTextAreaElement.prototype
               : tag === 'SELECT'   ? HTMLSelectElement.prototype
               :                       HTMLInputElement.prototype;
    const tracker = el._valueTracker;
    if (tracker) tracker.setValue(el.value ?? '');
    const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value');
    if (nativeSetter?.set) nativeSetter.set.call(el, value);
    else el.value = value;

    // Build the synthetic event once — reused for all handler attempts
    const nativeEvt = new Event('change', { bubbles: true });
    Object.defineProperty(nativeEvt, 'target', { writable: false, value: el });
    const syntheticEvent = {
      target:               el,
      currentTarget:        el,
      type:                 'change',
      bubbles:              true,
      cancelable:           true,
      defaultPrevented:     false,
      nativeEvent:          nativeEvt,
      preventDefault:       () => {},
      stopPropagation:      () => {},
      persist:              () => {},
      isPropagationStopped: () => false,
      isDefaultPrevented:   () => false,
    };

    const callHandler = (handler) => {
      try { handler(syntheticEvent); return true; } catch (_) { return false; }
    };

    // 2. React 16: handlers stored on __reactEventHandlers* key directly on the DOM node
    const eventHandlerKey = Object.keys(el).find(k => k.startsWith('__reactEventHandlers'));
    if (eventHandlerKey) {
      const handlers = el[eventHandlerKey];
      const h = handlers?.onChange || handlers?.onInput;
      if (typeof h === 'function' && callHandler(h)) return true;
    }

    // 3. React 17+: walk up the fiber tree looking for onChange / onInput prop
    const fiberKey = Object.keys(el).find(k =>
      k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance')
    );
    if (!fiberKey) return false;

    let fiber = el[fiberKey];
    let depth = 0;
    while (fiber && depth < 40) {
      const props = fiber.memoizedProps || fiber.pendingProps;
      const h = props?.onChange || props?.onInput;
      if (typeof h === 'function' && callHandler(h)) return true;
      fiber = fiber.return;
      depth++;
    }

    return false;
  },

  // ─── Shared Helpers ───

  _setNativeValue(el, value) {
    const tag = el.tagName;
    const proto = tag === 'TEXTAREA' ? HTMLTextAreaElement.prototype
               : tag === 'SELECT'   ? HTMLSelectElement.prototype
               :                       HTMLInputElement.prototype;

    // CRITICAL: save current value to tracker BEFORE changing it.
    // React's onChange fires only when el.value !== tracker.getValue().
    // Setting tracker to the old value ensures React sees the diff.
    const tracker = el._valueTracker;
    if (tracker) {
      tracker.setValue(el.value ?? '');
    }

    const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value');
    if (nativeSetter && nativeSetter.set) {
      nativeSetter.set.call(el, value);
    } else {
      el.value = value;
    }
  },

  _setSelectValue(el, optionValue) {
    el.focus();
    if (!this._callReactOnChange(el, optionValue)) {
      this._setNativeValue(el, optionValue);
      this._dispatchEvents(el);
    }
  },

  _dispatchEvents(el) {
    el.dispatchEvent(new Event('input',  { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur',   { bubbles: true }));
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
