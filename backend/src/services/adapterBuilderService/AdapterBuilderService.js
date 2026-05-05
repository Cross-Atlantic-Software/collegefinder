/**
 * AdapterBuilderService
 *
 * Wraps the existing GeminiService to produce ExamFill adapter sections from
 * a scraped page. The flow is:
 *
 *   1. Caller sends { exam_name, page: { url, title, headings, fields[] } }
 *   2. We build a strict prompt that lists the profile schema (whitelist) and
 *      the scraped fields, asking Gemini to emit one adapter section as JSON.
 *   3. We parse + validate the JSON, dropping any field whose `source` is
 *      not on the whitelist.
 *   4. Return the sanitized section spec, ready to persist into
 *      `exam_adapters.adapter_config.sections[]`.
 *
 * Why a separate service: keeps the Gemini prompt and validation co-located,
 * keeps GeminiService generic, and lets us swap the LLM later without
 * touching the controller.
 */

const GeminiService = require('../geminiService/GeminiService');
const { getPromptSchema, isValidSource } = require('./profileSchema');

const ALLOWED_FIELD_TYPES = new Set([
  'text', 'select', 'date', 'radio', 'checkbox', 'file', 'select_or_text', 'text_or_select'
]);

const ALLOWED_FORMATS = new Set([
  'UPPERCASE', 'TITLECASE', 'PHONE', 'digits_only'
]);

class AdapterBuilderService {
  constructor() {
    this.gemini = new GeminiService();
  }

  /**
   * Build a single adapter section from a scraped page.
   *
   * @param {object} args
   * @param {string} args.exam_name
   * @param {object} args.page  { url, title, headings:[], fields:[{label,id,name,placeholder,type,options?,idx,required?}] }
   * @returns {Promise<object>} sanitized section spec
   */
  async generateSection({ exam_name, page }) {
    if (!page || !Array.isArray(page.fields) || page.fields.length === 0) {
      throw new Error('AdapterBuilderService.generateSection: page.fields[] is required and must be non-empty');
    }

    const prompt = buildAdapterPrompt({ exam_name, page });
    const parsed = await this.gemini.generateJSON(prompt, { temperature: 0.15, maxOutputTokens: 8192 });
    return sanitizeSection(parsed, page);
  }

  /**
   * True if the GeminiService can serve a request. We check `genAI` directly
   * (rather than relying on `gemini.isAvailable()`) because the latter also
   * requires the model to be resolved, which only happens lazily after the
   * first `ensureInitialized()` call.
   */
  isAvailable() {
    return this.gemini.genAI !== null;
  }
}

// ─── Prompt ────────────────────────────────────────────────────────────────

function buildAdapterPrompt({ exam_name, page }) {
  const schema = getPromptSchema();

  // We pass the schema and scraped fields as JSON blocks so the model can
  // line them up. Examples ground the format expected back.
  const schemaBlock = JSON.stringify(schema, null, 2);
  const pageBlock = JSON.stringify(
    {
      url: page.url || '',
      title: page.title || '',
      headings: Array.isArray(page.headings) ? page.headings.slice(0, 10) : [],
      fields: (page.fields || []).map((f) => ({
        label: f.label || '',
        id: f.id || '',
        name: f.name || '',
        placeholder: f.placeholder || '',
        type: f.type || 'text',
        idx: typeof f.idx === 'number' ? f.idx : undefined,
        required: !!f.required,
        options: Array.isArray(f.options) && f.options.length > 0
          ? f.options.slice(0, 60).map((opt) => String(opt).slice(0, 80))
          : undefined
      }))
    },
    null,
    2
  );

  return `You are an expert at mapping HTML form fields to a student profile schema for an automatic form-filling tool.

## TASK

Given:
1. A whitelist of profile data paths (PROFILE_SCHEMA) that the student data system can provide.
2. A list of form fields scraped from one page of an exam registration portal (PAGE).

Produce ONE adapter section JSON that maps each scraped field to the best-matching profile path. Be aggressive: try to map every field whose meaning clearly matches a schema entry. Skip a field (set "source": null) only if no schema entry plausibly applies.

## EXAM
${JSON.stringify({ exam_name: exam_name || 'Unknown Exam' })}

## PROFILE_SCHEMA (whitelist — every "source" you emit MUST be one of these path strings, or null)
${schemaBlock}

## PAGE (scraped form fields)
${pageBlock}

## OUTPUT RULES (very strict)

Return ONLY valid JSON, no prose, no markdown. Shape:

{
  "section_id": "snake_case_id_for_this_page",
  "section_name": "Human Readable Name",
  "page_indicator": { "type": "url_contains" | "page_text_contains" | "step_number", "value": "<string or number>" },
  "fields": [
    {
      "field_id": "snake_case_field_id",
      "label": "Field label as shown to user",
      "source": "<one of PROFILE_SCHEMA.path or null>",
      "type": "text" | "select" | "date" | "radio" | "checkbox" | "file" | "select_or_text",
      "required": true | false,
      "selectors": {
        "by_id":          ["..."],
        "by_name":        ["..."],
        "by_placeholder": ["..."],
        "by_label":       ["..."],
        "by_index":       <number, optional>
      },
      "value_map": { "<canonical>": ["<observed option label>", "..."] },   // ONLY for select/radio
      "format": "UPPERCASE" | "TITLECASE" | "PHONE" | "digits_only",        // optional
      "date_config": { "variant": "masked_text" | "text", "format": "DDMMYYYY" | "DD/MM/YYYY" | "YYYY-MM-DD" }  // ONLY for date
    }
  ]
}

## GUIDELINES

- "section_id": derive from the page (e.g. "basic_information", "documents", "education_details"). Use snake_case.
- "section_name": short human title (e.g. "Basic Information").
- "page_indicator":
  - If the URL has a clear unique segment, use {"type":"url_contains","value":"<segment>"}.
  - Else use {"type":"page_text_contains","value":"<the most distinctive heading>"}.
- "selectors":
  - by_id, by_name → use the scraped field's id/name (and obvious variants like camelCase ↔ snake_case).
  - by_placeholder → the scraped placeholder verbatim, plus 1–2 common variants.
  - by_label → the scraped label verbatim, plus 1–2 common variants. NEVER include trailing "*".
  - by_index → echo the scraped "idx" only when the same label/placeholder appears multiple times on the page (e.g. two "Marks Obtained" fields, one for class 10 and one for class 12). Otherwise omit.
- "value_map":
  - Only for type "select" or "radio".
  - Keys are our canonical values from the profile (e.g. "Male", "Female", "OBC-NCL", "CBSE", "Yes", "No").
  - Values are arrays of EVERY observed option label from the scraped "options" that means the same thing (case variants, abbreviations, full names). Always include the canonical itself.
  - For boolean Yes/No radios, also include "1"/"0", "true"/"false".
- "type":
  - "text" for input[type=text|email|tel|number|password], textarea.
  - "select" for <select> and combobox-style dropdowns.
  - "date" if the field is clearly a DOB / date picker.
  - "radio" if scraped type is radio.
  - "checkbox" if scraped type is checkbox.
  - "file" if scraped type is file or upload.
  - "select_or_text" only if you genuinely cannot tell.
- "format":
  - "digits_only" for Aadhaar / phone-only fields.
  - "PHONE" for full phone-number fields.
  - "UPPERCASE" / "TITLECASE" only when clearly required.
- "date_config":
  - Required for "date". If the placeholder or label hints at "DD/MM/YYYY" use {"variant":"text","format":"DD/MM/YYYY"}. If it's a masked numeric input (no slashes shown) use {"variant":"masked_text","format":"DDMMYYYY"}.
- Never fabricate a profile path. If unsure, set "source": null. The validator will drop fields with invalid sources.
- "field_id" must be unique within the section.
- Do NOT wrap the JSON in markdown code fences.
- Do NOT include explanations.

Return the JSON now.`;
}

// ─── Validation / sanitization ─────────────────────────────────────────────

function sanitizeSection(parsed, page) {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('AdapterBuilderService: Gemini did not return a JSON object');
  }

  const section_id = sanitizeId(parsed.section_id) || 'untitled_section';
  const section_name = String(parsed.section_name || 'Untitled Section').slice(0, 100);
  const page_indicator = sanitizePageIndicator(parsed.page_indicator, page);

  const rawFields = Array.isArray(parsed.fields) ? parsed.fields : [];
  const seenFieldIds = new Set();
  const fields = [];

  for (const f of rawFields) {
    if (!f || typeof f !== 'object') continue;

    // Drop entirely if no usable source AND no usable label/selectors.
    const source = typeof f.source === 'string' ? f.source.trim() : null;
    if (source && !isValidSource(source)) {
      // Invalid source path → drop field (cannot be filled safely)
      continue;
    }
    if (!source) {
      // No source means the AI couldn't map it — skip; admin can add manually in CMS.
      continue;
    }

    let field_id = sanitizeId(f.field_id) || sanitizeId(f.label) || `field_${fields.length + 1}`;
    while (seenFieldIds.has(field_id)) field_id = `${field_id}_${fields.length + 1}`;
    seenFieldIds.add(field_id);

    const type = ALLOWED_FIELD_TYPES.has(f.type) ? f.type : 'text';
    const selectors = sanitizeSelectors(f.selectors);

    const out = {
      field_id,
      label: String(f.label || field_id).slice(0, 200),
      source,
      type,
      selectors,
      required: !!f.required
    };

    if (typeof f.format === 'string' && ALLOWED_FORMATS.has(f.format)) {
      out.format = f.format;
    }

    if ((type === 'select' || type === 'radio') && f.value_map && typeof f.value_map === 'object') {
      out.value_map = sanitizeValueMap(f.value_map);
    }

    if (type === 'date' && f.date_config && typeof f.date_config === 'object') {
      const variant = f.date_config.variant === 'masked_text' ? 'masked_text' : 'text';
      const format = typeof f.date_config.format === 'string' ? f.date_config.format.slice(0, 20) : 'DD/MM/YYYY';
      out.date_config = { variant, format };
    }

    if (type === 'file' && Array.isArray(f.accepted_types)) {
      out.accepted_types = f.accepted_types
        .filter((t) => typeof t === 'string')
        .slice(0, 6)
        .map((t) => t.slice(0, 60));
    }

    fields.push(out);
  }

  return {
    section_id,
    section_name,
    page_indicator,
    fields
  };
}

function sanitizeId(value) {
  if (!value || typeof value !== 'string') return '';
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60);
}

function sanitizePageIndicator(pi, page) {
  const allowedTypes = new Set(['url_contains', 'page_text_contains', 'step_number']);
  if (pi && typeof pi === 'object' && allowedTypes.has(pi.type)) {
    const value = pi.type === 'step_number' ? Number(pi.value) || 1 : String(pi.value || '').slice(0, 200);
    if (value !== '' && value !== 0) return { type: pi.type, value };
  }
  // Fallback: heading or url segment
  const heading = Array.isArray(page?.headings) && page.headings[0] ? String(page.headings[0]) : '';
  if (heading) return { type: 'page_text_contains', value: heading.slice(0, 100) };
  return { type: 'url_contains', value: extractUrlSegment(page?.url || '') };
}

function extractUrlSegment(url) {
  try {
    const u = new URL(url);
    const seg = u.pathname.split('/').filter(Boolean).pop();
    return seg || u.hostname;
  } catch (_) {
    return url || '';
  }
}

function sanitizeSelectors(selectors) {
  const out = {};
  if (!selectors || typeof selectors !== 'object') return out;

  for (const key of ['by_id', 'by_name', 'by_placeholder', 'by_label']) {
    if (Array.isArray(selectors[key])) {
      const cleaned = selectors[key]
        .filter((v) => typeof v === 'string' && v.trim())
        .map((v) => v.trim().slice(0, 120))
        .slice(0, 8);
      if (cleaned.length) out[key] = Array.from(new Set(cleaned));
    }
  }

  if (typeof selectors.by_index === 'number' && Number.isInteger(selectors.by_index) && selectors.by_index >= 0) {
    out.by_index = selectors.by_index;
  }

  return out;
}

function sanitizeValueMap(vm) {
  const out = {};
  for (const [canonical, variants] of Object.entries(vm)) {
    if (typeof canonical !== 'string' || !canonical.trim()) continue;
    if (!Array.isArray(variants)) continue;
    const cleaned = variants
      .filter((v) => typeof v === 'string' && v.trim())
      .map((v) => v.trim().slice(0, 80))
      .slice(0, 20);
    if (cleaned.length) out[canonical.trim()] = Array.from(new Set(cleaned));
  }
  return out;
}

module.exports = {
  AdapterBuilderService,
  // Exposed for unit tests
  _internal: { sanitizeSection, sanitizeSelectors, sanitizeValueMap, buildAdapterPrompt }
};
