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

module.exports = GeminiService;
