/**
 * Gemini service: question generation, model resolution, and batch operations.
 * Composes config, modelResolver, prompts, diagram, parser, requestHelper; uses p-limit for concurrency.
 */
const pLimit = require('p-limit').default || require('p-limit');
const { GENERATION_CONFIG } = require('./config');
const { fetchAndPickModelName } = require('./modelResolver');
const { buildQuestionPrompt, buildBatchQuestionPrompt, substitutePromptPlaceholders } = require('./prompts');
const { setDiagramImageUrl } = require('./diagram');
const { parseQuestionResponse, parseQuestionBatchResponse } = require('./parser');
const { withRetry, isRetryableError } = require('./requestHelper');

const GEMINI_CONCURRENCY = 3;
const apiLimit = pLimit(GEMINI_CONCURRENCY);

class GeminiService {
  constructor() {
    this.genAI = null;
    this.model = null;
    this._initError = null;
    this._modelName = null;
    this._initPromise = null;
    this._excludedModelNames = new Set();

    if (!process.env.GOOGLE_API_KEY) {
      this._initError = 'GOOGLE_API_KEY is not set. Add it to backend/.env (see .env.example) and restart the backend for mock test generation.';
      console.warn('⚠️  GOOGLE_API_KEY not found. Mock test generation will fail until you add GOOGLE_API_KEY to backend/.env and restart.');
      return;
    }

    try {
      const pkg = require('@google/generative-ai');
      const GoogleGenerativeAI = pkg.GoogleGenerativeAI || (pkg.default && pkg.default.GoogleGenerativeAI) || pkg.default;
      if (!GoogleGenerativeAI || typeof GoogleGenerativeAI !== 'function') {
        throw new Error('@google/generative-ai did not export GoogleGenerativeAI constructor (got ' + typeof pkg.GoogleGenerativeAI + ')');
      }
      this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
      if (process.env.GEMINI_MODEL) {
        this._modelName = process.env.GEMINI_MODEL;
        this.model = this.genAI.getGenerativeModel({
          model: this._modelName,
          generationConfig: GENERATION_CONFIG,
        });
        console.log('✅ Gemini service initialized with GEMINI_MODEL:', this._modelName);
      } else {
        console.log('🔄 Gemini: will resolve model from API list on first use');
      }
    } catch (err) {
      this._initError = err.message || String(err);
      console.warn('⚠️  Gemini service unavailable:', this._initError);
      console.warn('   Install with: npm install @google/generative-ai (then rebuild Docker image if using Docker)');
    }
  }

  async _fetchAndPickModelName() {
    return fetchAndPickModelName(process.env.GOOGLE_API_KEY, this._excludedModelNames);
  }

  async ensureInitialized() {
    if (this.genAI === null) {
      throw new Error(this._initError || 'Gemini service is not available.');
    }
    if (this.model !== null) return;
    if (this._initPromise === null) {
      this._initPromise = (async () => {
        if (this._modelName == null) {
          this._modelName = await this._fetchAndPickModelName();
        }
        this.model = this.genAI.getGenerativeModel({
          model: this._modelName,
          generationConfig: GENERATION_CONFIG,
        });
        console.log('✅ Gemini service ready with model:', this._modelName);
      })();
    }
    await this._initPromise;
  }

  isAvailable() {
    return this.genAI !== null && (this.model !== null || this._initPromise !== null);
  }

  substitutePromptPlaceholders(template, vars) {
    return substitutePromptPlaceholders(template, vars);
  }

  buildQuestionPrompt(exam_name, subject, question_type, section_name, section_type, options = {}) {
    return buildQuestionPrompt(exam_name, subject, question_type, section_name, section_type, options);
  }

  /**
   * Generate up to 5 questions in a single API request. Uses same retry and concurrency as generateQuestion.
   * @param {Array<object>} paramsArray - Array of 1–5 param objects (same shape as generateQuestion).
   * @returns {Promise<Array<object>>} Array of processed question data.
   */
  async generateFiveQuestions(paramsArray) {
    await this.ensureInitialized();
    if (this.model === null) {
      throw new Error(this._initError || 'Gemini service is not available.');
    }
    if (!Array.isArray(paramsArray) || paramsArray.length === 0) {
      throw new Error('generateFiveQuestions requires a non-empty params array');
    }
    const slice = paramsArray.slice(0, 5);

    const prompt = buildBatchQuestionPrompt(slice);

    const doRequest = async () => {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const processedList = parseQuestionBatchResponse(text, slice);
      for (const data of processedList) {
        await setDiagramImageUrl(data);
      }
      return processedList;
    };

    return apiLimit(async () => {
      try {
        console.log(`🤖 Generating ${slice.length} questions in one request for ${slice[0]?.exam_name || 'exam'} - ${slice[0]?.subject || 'General'}`);
        const processedList = await withRetry(doRequest, { operationName: 'generateContent (batch of 5)' });
        console.log(`✅ Batch of ${processedList.length} questions generated successfully`);
        return processedList;
      } catch (error) {
        const isModelUnavailable = error.message && (
          error.message.includes('404') ||
          error.message.includes('no longer available') ||
          error.message.includes('is not found')
        );
        if (isModelUnavailable && this._modelName) {
          console.warn('⚠️  Model', this._modelName, 'unavailable; will refetch list and retry with another model');
          this._excludedModelNames.add(this._modelName);
          this.model = null;
          this._modelName = null;
          this._initPromise = null;
          await this.ensureInitialized();
          const processedList = await withRetry(doRequest, { operationName: 'generateContent (batch, new model)' });
          console.log(`✅ Batch of ${processedList.length} questions generated successfully`);
          return processedList;
        }
        if (error.message?.includes('API_KEY_INVALID')) {
          throw new Error('Invalid Google API key. Please check your GOOGLE_API_KEY configuration.');
        }
        if (error.message?.includes('QUOTA_EXCEEDED') || error.message?.includes('429')) {
          throw new Error('Google API quota exceeded. Please try again later or upgrade your plan.');
        }
        if (isRetryableError(error)) {
          throw new Error(`Gemini API batch failed after 5 retries. Last error: ${error.message}`);
        }
        throw new Error(`Failed to generate questions from Gemini API: ${error.message}`);
      }
    });
  }

  async generateQuestion(params) {
    await this.ensureInitialized();
    if (this.model === null) {
      const msg = this._initError
        ? `Gemini: ${this._initError}`
        : 'Gemini service is not available. Please check GOOGLE_API_KEY configuration.';
      throw new Error(msg);
    }

    const {
      exam_name,
      subject,
      question_type = 'mcq',
      section_name,
      section_type,
      force_diagram,
      generation_prompt,
      question_number,
      total_in_section,
      difficulty
    } = params;

    if (!exam_name || !subject) {
      throw new Error('Missing required parameters: exam_name and subject are required');
    }

    const prompt = this.buildQuestionPrompt(exam_name, subject, question_type, section_name, section_type, {
      force_diagram,
      generation_prompt,
      question_number,
      total_in_section,
      difficulty
    });

    const doRequest = async () => {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const processedData = parseQuestionResponse(text, params);
      await setDiagramImageUrl(processedData);
      return processedData;
    };

    const PARSE_ERROR_RETRIES = 2; // 2 retries (3 attempts total) when Gemini returns malformed JSON

    return apiLimit(async () => {
      try {
        console.log(`🤖 Generating ${question_type} question for ${exam_name} - ${subject}${question_number ? ` (Q${question_number}/${total_in_section})` : ''}`);
        let lastError;
        for (let parseAttempt = 1; parseAttempt <= PARSE_ERROR_RETRIES + 1; parseAttempt++) {
          try {
            const processedData = await withRetry(doRequest, { operationName: 'generateContent' });
            console.log('✅ Question generated successfully');
            return processedData;
          } catch (error) {
            const isParseError = error.message && (
              error.message.includes('Invalid response format') ||
              error.message.includes('Expected ') ||
              (error.message.includes('JSON') && (error.message.includes('position') || error.message.includes('parse')))
            );
            if (!isParseError || parseAttempt === PARSE_ERROR_RETRIES + 1) {
              throw error;
            }
            lastError = error;
            console.warn(`⚠️  Parse failed (attempt ${parseAttempt}/${PARSE_ERROR_RETRIES + 1}), retrying generation...`);
            await new Promise((r) => setTimeout(r, 2000));
          }
        }
        throw lastError;
      } catch (error) {
        const isModelUnavailable = error.message && (
          error.message.includes('404') ||
          error.message.includes('no longer available') ||
          error.message.includes('is not found')
        );
        if (isModelUnavailable && this._modelName) {
          console.warn('⚠️  Model', this._modelName, 'unavailable; will refetch list and retry with another model');
          this._excludedModelNames.add(this._modelName);
          this.model = null;
          this._modelName = null;
          this._initPromise = null;
          await this.ensureInitialized();
          const processedData = await withRetry(doRequest, { operationName: 'generateContent (new model)' });
          console.log('✅ Question generated successfully');
          return processedData;
        }

        if (error.message?.includes('API_KEY_INVALID')) {
          throw new Error('Invalid Google API key. Please check your GOOGLE_API_KEY configuration.');
        }
        if (error.message?.includes('QUOTA_EXCEEDED') || error.message?.includes('429')) {
          throw new Error('Google API quota exceeded. Please try again later or upgrade your plan.');
        }
        if (error.message?.includes('SAFETY')) {
          throw new Error('Content was blocked by safety filters. Please try with different parameters.');
        }
        if (isRetryableError(error)) {
          throw new Error(`Gemini API failed after 5 retries (503/429/network). Last error: ${error.message}`);
        }
        throw new Error(`Failed to generate question from Gemini API: ${error.message}`);
      }
    });
  }

  async generateQuestionsBatch(paramsArray, maxConcurrent = 3) {
    // Ensure model is initialized (resolves lazily when GEMINI_MODEL env var is not set)
    await this.ensureInitialized();

    if (!Array.isArray(paramsArray) || paramsArray.length === 0) {
      throw new Error('paramsArray must be a non-empty array');
    }

    console.log(`🤖 Generating ${paramsArray.length} questions in batch (max ${maxConcurrent} concurrent)`);

    const results = [];
    const errors = [];

    for (let i = 0; i < paramsArray.length; i += maxConcurrent) {
      const batch = paramsArray.slice(i, i + maxConcurrent);
      const batchPromises = batch.map(async (params, index) => {
        try {
          const question = await this.generateQuestion(params);
          return { index: i + index, question, error: null };
        } catch (error) {
          return { index: i + index, question: null, error: error.message };
        }
      });

      const batchResults = await Promise.all(batchPromises);

      for (const result of batchResults) {
        if (result.error) {
          errors.push({ index: result.index, error: result.error });
        } else {
          results.push({ index: result.index, question: result.question });
        }
      }

      if (i + maxConcurrent < paramsArray.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`✅ Batch generation completed: ${results.length} successful, ${errors.length} failed`);

    return {
      successful: results,
      failed: errors,
      totalRequested: paramsArray.length,
      successCount: results.length,
      errorCount: errors.length
    };
  }

  /**
   * Short plain-text generation (e.g. lecture 2-line hook). Same model/retry as other calls.
   * @param {string} promptText - Full user prompt (instructions + data).
   * @returns {Promise<string>} Trimmed model output.
   */
  async generatePlainText(promptText, options = {}) {
    await this.ensureInitialized();
    if (this.model === null) {
      throw new Error(this._initError || 'Gemini service is not available.');
    }
    if (!promptText || !String(promptText).trim()) {
      throw new Error('generatePlainText requires a non-empty prompt');
    }

    const doRequest = async () => {
      const result = await this.model.generateContent(String(promptText));
      const response = await result.response;
      const t = response.text();
      return typeof t === 'string' ? t.trim() : '';
    };

    const retryOpts = { operationName: 'generatePlainText' };
    if (options.isCancelled) retryOpts.isCancelled = options.isCancelled;

    return apiLimit(() => withRetry(doRequest, retryOpts));
  }

  /**
   * Generic JSON-mode generation. No question parsing, no diagrams — just
   * "send a prompt, get a parsed JSON object back". Used by features that
   * need structured output (e.g. AdapterBuilderService).
   *
   * The model is configured with responseMimeType=application/json which
   * forces Gemini to emit valid JSON (no surrounding markdown).
   *
   * @param {string} prompt          Full prompt text.
   * @param {object} [opts]
   * @param {number} [opts.temperature=0.2]
   * @param {number} [opts.maxOutputTokens=8192]
   * @returns {Promise<any>} Parsed JSON
   */
  async generateJSON(prompt, opts = {}) {
    await this.ensureInitialized();
    if (this.genAI === null || this._modelName == null) {
      throw new Error(this._initError || 'Gemini service is not available.');
    }

    const temperature = typeof opts.temperature === 'number' ? opts.temperature : 0.2;
    // Thinking models (2.5+) spend reasoning tokens from this same budget — keep it generous.
    const maxOutputTokens = typeof opts.maxOutputTokens === 'number' ? opts.maxOutputTokens : 32768;

    // Per-attempt model factory: blocked (RECITATION) retries run hotter —
    // low temperature aggravates verbatim echo, which trips the recitation filter.
    const makeModel = (temp) => this.genAI.getGenerativeModel({
      model: this._modelName,
      generationConfig: {
        temperature: temp,
        topP: 0.8,
        topK: 40,
        maxOutputTokens,
        responseMimeType: 'application/json'
      }
    });

    const doRequest = async (promptText, temp) => {
      const result = await makeModel(temp).generateContent(promptText);
      const response = await result.response;
      const finishReason = response.candidates?.[0]?.finishReason;
      if (finishReason === 'MAX_TOKENS') {
        // SDK returns the partial text silently; surface it as a clear error instead
        // of letting JSON.parse fail with "Unterminated string".
        throw Object.assign(
          new Error(`Gemini output truncated (finishReason=MAX_TOKENS, budget=${maxOutputTokens})`),
          { failureClass: 'truncated' }
        );
      }
      const text = response.text();
      try {
        return JSON.parse(text);
      } catch (parseErr) {
        const repaired = tryRepairJson(text);
        if (repaired !== null) {
          console.warn(`[generateJSON] parse failed (${String(parseErr.message).slice(0, 80)}) — JSON repair pass succeeded | model=${this._modelName}`);
          return repaired;
        }
        const err = new Error(`Failed to parse Gemini JSON response: ${parseErr.message}. Raw: ${text.slice(0, 300)}`);
        err.failureClass = 'parse_error';
        err.parseMessage = parseErr.message;
        err.rawText = text;
        throw err;
      }
    };

    // Recovery ladder: repair pass (inside doRequest, zero extra LLM calls) →
    // self-correcting retry (parse error + broken output fed back) → final
    // retry. API errors (503/429/network) are withRetry's job — rethrown here.
    const MAX_GEN_ATTEMPTS = 3;
    const classify = (err) =>
      err.failureClass || (/RECITATION|SAFETY|blocked/i.test(String(err.message)) ? 'blocked' : 'api_error');

    const COMPACT_SUFFIX =
      '\n\nIMPORTANT: Your previous attempt was cut off or rejected. Emit the COMPLETE JSON object now, ' +
      'minified on a single line — no indentation, no newlines, no markdown, nothing except the JSON.';
    const BLOCKED_SUFFIX =
      '\n\nIMPORTANT: Your previous attempt was rejected by content filters (recitation). Re-generate the JSON. ' +
      'For the "label" and "section_name" values, paraphrase in your own words instead of echoing the scraped text verbatim. ' +
      'Selector arrays (by_id, by_name, by_placeholder, by_label) must still contain the exact scraped strings — only display text may be paraphrased. ' +
      'Emit only the complete, minified JSON object.';
    const selfCorrectSuffix = (err) => {
      const raw = err.rawText.length > 6000 ? `${err.rawText.slice(0, 6000)}\n…(truncated)` : err.rawText;
      return `\n\nYOUR PREVIOUS RESPONSE FAILED JSON PARSING.\nParse error: ${err.parseMessage}\n` +
        `Your previous (broken) response was:\n${raw}\n\n` +
        'Emit the corrected, COMPLETE JSON object now — minified on a single line, with every double quote ' +
        'inside string values properly escaped as \\", no markdown, nothing except the JSON.';
    };

    return apiLimit(async () => {
      let attemptPrompt = prompt;
      let attemptTemp = temperature;
      let lastErr = null;
      for (let attempt = 1; attempt <= MAX_GEN_ATTEMPTS; attempt++) {
        try {
          const parsed = await withRetry(() => doRequest(attemptPrompt, attemptTemp), { operationName: `generateJSON attempt ${attempt}` });
          if (attempt > 1) console.log(`[generateJSON] succeeded | attempt=${attempt}/${MAX_GEN_ATTEMPTS} | model=${this._modelName} | temp=${attemptTemp}`);
          return parsed;
        } catch (err) {
          const cls = classify(err);
          console.warn(`[generateJSON] attempt=${attempt}/${MAX_GEN_ATTEMPTS} failed | class=${cls} | model=${this._modelName} | temp=${attemptTemp} | ${String(err.message).slice(0, 160)}`);
          if (cls === 'api_error' || attempt === MAX_GEN_ATTEMPTS) throw err;
          lastErr = err;
          if (cls === 'parse_error' && err.rawText) {
            attemptPrompt = prompt + selfCorrectSuffix(err);
            attemptTemp = temperature;                 // JSON discipline: stay cold
          } else if (cls === 'blocked') {
            attemptPrompt = prompt + BLOCKED_SUFFIX;
            attemptTemp = Math.max(0.7, temperature);  // heat up to dodge recitation
          } else {
            attemptPrompt = prompt + COMPACT_SUFFIX;   // truncated
            attemptTemp = temperature;
          }
        }
      }
      throw lastErr;
    });
  }

  async testService() {
    if (this.genAI === null) {
      return { success: false, error: 'Service not available' };
    }
    try {
      await this.ensureInitialized();
    } catch (e) {
      return { success: false, error: e.message };
    }
    if (this.model === null) {
      return { success: false, error: 'Could not resolve a Gemini model' };
    }
    try {
      const testParams = {
        exam_name: 'JEE Main',
        subject: 'Mathematics',
        question_type: 'mcq'
      };

      const question = await this.generateQuestion(testParams);

      return {
        success: true,
        message: 'Gemini service is working correctly',
        sampleQuestion: {
          question_text: question.question_text,
          subject: testParams.subject
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

/**
 * Tolerant JSON repair for malformations Gemini actually produces here
 * (observed in adapter-builder logs): markdown fences despite
 * responseMimeType, trailing commas, and unescaped double quotes inside
 * string values (e.g. a scraped placeholder like: Enter "Your Email").
 * Returns the parsed object, or null if repair didn't yield valid JSON.
 */
function tryRepairJson(text) {
  if (!text || typeof text !== 'string') return null;
  let s = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();

  // Drop stray prose before the first { or after the last }.
  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (first === -1 || last <= first) return null;
  s = s.slice(first, last + 1);

  // Escape unescaped quotes inside strings: a quote only terminates a string
  // if the next non-space char is structural (, : } ]) or end of input.
  let out = '';
  let inString = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (!inString) {
      if (ch === '"') inString = true;
      out += ch;
      continue;
    }
    if (ch === '\\') { out += ch + (s[i + 1] || ''); i++; continue; }
    if (ch === '"') {
      let j = i + 1;
      while (j < s.length && /\s/.test(s[j])) j++;
      const next = s[j];
      if (next === undefined || next === ',' || next === ':' || next === '}' || next === ']') {
        inString = false;
        out += ch;
      } else {
        out += '\\"'; // content quote, not a terminator
      }
      continue;
    }
    out += ch;
  }

  out = out.replace(/,\s*([}\]])/g, '$1'); // trailing commas

  try { return JSON.parse(out); } catch (_) { return null; }
}

module.exports = GeminiService;
