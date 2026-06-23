/**
 * Page Scanner — fingerprints every visible form field on the current page.
 *
 * Output (sent to backend's AdapterBuilderService → Gemini):
 *   {
 *     url:      window.location.href,
 *     title:    document.title,
 *     headings: ["...", "..."],
 *     fields: [
 *       { label, id, name, placeholder, type, idx, required, options? }
 *     ]
 *   }
 *
 * Notes:
 *  - We deliberately keep the payload small (label/id/name/placeholder/type/options)
 *    so Gemini latency and token cost stay low.
 *  - For <select> we capture every option's visible text.
 *  - Hidden inputs and disabled inputs are skipped.
 *  - File inputs are NEVER skipped because they're often visually hidden behind
 *    a custom button — we want them in the adapter.
 *  - `idx` is the position of the field within its (label OR placeholder) bucket;
 *    used by the "by_index" disambiguator (e.g. 10th vs 12th "Marks Obtained").
 */

const PageScanner = {
  scan() {
    const url = window.location.href;
    const title = document.title || '';
    const headings = collectHeadings();
    const fields = scanFieldPairs().map((p) => p.field);
    return { url, title, headings, fields: dedupeRadios(fields) };
  },

  /**
   * Like scan(), but returns each field descriptor paired with its live DOM element:
   *   [{ el, field }]
   * Used IN-PAGE (admin validation) to diff page fields against the mapped set by
   * element identity. Radios are deduped to one entry per name, matching scan().
   * Element references never cross the message boundary — only the descriptor does.
   */
  scanElements() {
    return dedupeRadioPairs(scanFieldPairs());
  }
};

// ─── Helpers ────────────────────────────────────────────────────────────

/**
 * Enumerate every usable page field, returning { el, field } pairs in DOM order.
 * This is the single source of "what is a field" for both scan() (build time) and
 * scanElements() (in-page diff) — keep them in sync by going through here.
 */
function scanFieldPairs() {
  const elements = Array.from(document.querySelectorAll('input, select, textarea, [role="combobox"]'));

  const pairs = [];
  const labelBucket = new Map();      // label -> count
  const placeholderBucket = new Map();

  for (const el of elements) {
    if (!isUsable(el)) continue;

    const type = inferType(el);
    const label = labelFor(el);
    const placeholder = (el.placeholder || '').trim();
    const id = (el.id || '').trim();
    const name = (el.getAttribute('name') || '').trim();
    const required = !!(el.required || el.getAttribute('aria-required') === 'true');

    // Compute idx within the most-distinctive bucket (label preferred).
    let idx = 0;
    if (label) {
      const c = labelBucket.get(label) || 0;
      idx = c;
      labelBucket.set(label, c + 1);
    } else if (placeholder) {
      const c = placeholderBucket.get(placeholder) || 0;
      idx = c;
      placeholderBucket.set(placeholder, c + 1);
    }

    const field = {
      label,
      id,
      name,
      placeholder,
      type,
      idx,
      required
    };

    if (type === 'select' && el.tagName === 'SELECT') {
      field.options = Array.from(el.options || [])
        .map((o) => (o.textContent || '').trim())
        .filter((t) => t && t.toLowerCase() !== 'select')
        .slice(0, 60);
    } else if (type === 'radio') {
      // Capture sibling radios with the same name — their values become the options
      if (name) {
        const radios = document.querySelectorAll(`input[type="radio"][name="${cssEscape(name)}"]`);
        field.options = Array.from(radios)
          .map((r) => labelFor(r) || (r.value || '').trim())
          .filter(Boolean)
          .slice(0, 20);
      }
    }

    pairs.push({ el, field });
  }

  return pairs;
}

function collectHeadings() {
  const out = [];
  const nodes = document.querySelectorAll('h1, h2, h3, [class*="page-title"], [class*="section-title"], [class*="form-title"]');
  for (const n of nodes) {
    if (n.offsetParent === null && n.tagName !== 'H1') continue;
    const t = (n.textContent || '').trim().replace(/\s+/g, ' ');
    if (t && t.length < 200 && !out.includes(t)) out.push(t);
    if (out.length >= 8) break;
  }
  return out;
}

function isUsable(el) {
  if (!el || el.disabled) return false;
  const tag = el.tagName.toLowerCase();
  const type = (el.type || '').toLowerCase();
  if (tag === 'input' && (type === 'hidden' || type === 'submit' || type === 'button' || type === 'reset')) return false;
  // For file inputs we DO want them even when "hidden" (they're commonly behind custom buttons)
  if (type === 'file') return true;
  if (!isVisible(el)) return false;
  return true;
}

function isVisible(el) {
  if (!el) return false;
  if (el.offsetParent !== null) return true;
  const cs = window.getComputedStyle(el);
  return cs.position === 'fixed' || cs.position === 'sticky';
}

function inferType(el) {
  const tag = el.tagName.toLowerCase();
  const type = (el.type || '').toLowerCase();
  if (tag === 'select') return 'select';
  if (tag === 'textarea') return 'text';
  if (el.getAttribute('role') === 'combobox') return 'select';
  if (type === 'radio') return 'radio';
  if (type === 'checkbox') return 'checkbox';
  if (type === 'file') return 'file';
  if (type === 'date' || type === 'datetime-local') return 'date';
  return 'text';
}

function labelFor(el) {
  // 1. <label for="...">
  if (el.id) {
    const lbl = document.querySelector(`label[for="${cssEscape(el.id)}"]`);
    if (lbl) return cleanText(lbl.textContent);
  }
  // 2. ancestor <label>
  const ancestorLabel = el.closest('label');
  if (ancestorLabel) {
    const text = cleanText(ancestorLabel.textContent);
    if (text) return text;
  }
  // 3. aria-label / aria-labelledby
  const aria = el.getAttribute('aria-label');
  if (aria) return cleanText(aria);
  const labelledBy = el.getAttribute('aria-labelledby');
  if (labelledBy) {
    const target = document.getElementById(labelledBy);
    if (target) return cleanText(target.textContent);
  }
  // 4. nearest preceding label-like sibling text
  let sibling = el.previousElementSibling;
  for (let i = 0; i < 3 && sibling; i++) {
    if (/label|span|div|strong|p/i.test(sibling.tagName)) {
      const t = cleanText(sibling.textContent);
      if (t && t.length < 80) return t;
    }
    sibling = sibling.previousElementSibling;
  }
  // 5. parent's leading text
  const parent = el.parentElement;
  if (parent) {
    const direct = Array.from(parent.childNodes)
      .filter((n) => n.nodeType === 3)
      .map((n) => (n.textContent || '').trim())
      .filter(Boolean)[0];
    if (direct && direct.length < 80) return cleanText(direct);
  }
  return '';
}

function cleanText(s) {
  return String(s || '')
    .replace(/\s+/g, ' ')
    .replace(/[\u00A0]/g, ' ')
    .replace(/\s*\*\s*$/, '')
    .trim()
    .slice(0, 120);
}

function cssEscape(s) {
  // Lightweight CSS.escape polyfill — handles most ID/name characters.
  if (typeof CSS !== 'undefined' && CSS.escape) return CSS.escape(s);
  return String(s).replace(/[^a-zA-Z0-9_-]/g, (c) => `\\${c}`);
}

/**
 * Radios with the same `name` are one logical field. After scan, keep only the
 * first occurrence per (name) bucket — its `options` already enumerates the rest.
 */
function dedupeRadios(fields) {
  const seenRadioNames = new Set();
  return fields.filter((f) => {
    if (f.type !== 'radio' || !f.name) return true;
    if (seenRadioNames.has(f.name)) return false;
    seenRadioNames.add(f.name);
    return true;
  });
}

/** Same radio dedupe as dedupeRadios, but over { el, field } pairs (for scanElements). */
function dedupeRadioPairs(pairs) {
  const seenRadioNames = new Set();
  return pairs.filter(({ field }) => {
    if (field.type !== 'radio' || !field.name) return true;
    if (seenRadioNames.has(field.name)) return false;
    seenRadioNames.add(field.name);
    return true;
  });
}

if (typeof window !== 'undefined') {
  window.ExamFillPageScanner = PageScanner;
}
