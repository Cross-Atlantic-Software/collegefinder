/**
 * Waiter — MutationObserver + timeout utilities so the fill engine
 * can wait for dynamically loaded fields without hanging.
 */

const Waiter = {
  /**
   * Wait for an element matching `selector` to appear in the DOM.
   * Uses MutationObserver and falls back after `timeoutMs`.
   * @returns {Promise<Element|null>}
   */
  waitForElement(selector, timeoutMs = 5000) {
    return new Promise((resolve) => {
      const existing = document.querySelector(selector);
      if (existing) return resolve(existing);

      let resolved = false;
      const observer = new MutationObserver(() => {
        const el = document.querySelector(selector);
        if (el && !resolved) {
          resolved = true;
          observer.disconnect();
          resolve(el);
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });

      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          observer.disconnect();
          resolve(null);
        }
      }, timeoutMs);
    });
  },

  /**
   * Wait for a <select> element to have more than `minOptions` options
   * (useful after cascade-dependent dropdowns load their data).
   * @returns {Promise<boolean>} true if options loaded, false if timed out.
   */
  waitForSelectOptions(selectEl, minOptions = 1, timeoutMs = 3000) {
    return new Promise((resolve) => {
      if (selectEl.options.length > minOptions) return resolve(true);

      let resolved = false;
      const observer = new MutationObserver(() => {
        if (selectEl.options.length > minOptions && !resolved) {
          resolved = true;
          observer.disconnect();
          resolve(true);
        }
      });

      observer.observe(selectEl, { childList: true, subtree: true });

      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          observer.disconnect();
          resolve(selectEl.options.length > minOptions);
        }
      }, timeoutMs);
    });
  },

  /**
   * Simple delay.
   */
  delay(ms) {
    return new Promise(r => setTimeout(r, ms));
  }
};

if (typeof window !== 'undefined') {
  window.ExamFillWaiter = Waiter;
}
