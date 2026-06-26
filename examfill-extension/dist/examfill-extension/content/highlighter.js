/**
 * Highlighter — Visual Feedback on Filled Fields
 * 
 * Applies color-coded borders and backgrounds so the student
 * can instantly see what filled, what needs checking, and what failed.
 */

const Highlighter = {
  _styleId: 'examfill-highlight-styles',

  init() {
    if (document.getElementById(this._styleId)) return;

    const style = document.createElement('style');
    style.id = this._styleId;
    style.textContent = `
      .examfill-filled {
        border: 2px solid #22c55e !important;
        background-color: #f0fdf4 !important;
        transition: border-color 0.3s, background-color 0.3s;
      }
      .examfill-check {
        border: 2px solid #eab308 !important;
        background-color: #fefce8 !important;
        transition: border-color 0.3s, background-color 0.3s;
      }
      .examfill-failed {
        border: 2px solid #ef4444 !important;
        background-color: #fef2f2 !important;
        transition: border-color 0.3s, background-color 0.3s;
      }
      .examfill-tooltip {
        position: absolute;
        background: #1f2937;
        color: #fff;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        z-index: 99999;
        pointer-events: none;
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      }
    `;
    document.head.appendChild(style);
  },

  /**
   * Highlight a field based on its fill result.
   * @param {Element} el
   * @param {string} status  "filled" | "check" | "failed" | "not_found"
   * @param {string} [note]  Optional tooltip text
   */
  highlight(el, status, note) {
    if (!el) return;

    this.init();
    this._clearHighlight(el);

    const classMap = {
      filled: 'examfill-filled',
      check: 'examfill-check',
      failed: 'examfill-failed',
      not_found: 'examfill-failed'
    };

    const cls = classMap[status];
    if (cls) el.classList.add(cls);

    if (note && (status === 'check' || status === 'failed')) {
      el.title = `ExamFill: ${note}`;
    }
  },

  _clearHighlight(el) {
    el.classList.remove('examfill-filled', 'examfill-check', 'examfill-failed');
    if (el.title && el.title.startsWith('ExamFill:')) {
      el.title = '';
    }
  },

  /**
   * Clear all ExamFill highlights from the page.
   */
  clearAll() {
    document.querySelectorAll('.examfill-filled, .examfill-check, .examfill-failed')
      .forEach(el => this._clearHighlight(el));
  }
};

if (typeof window !== 'undefined') {
  window.ExamFillHighlighter = Highlighter;
}
