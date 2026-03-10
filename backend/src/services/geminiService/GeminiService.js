/**
 * Gemini service: question generation, model resolution, and batch operations.
 * Composes config, modelResolver, prompts, diagram, and parser modules.
 */
const { GENERATION_CONFIG } = require('./config');
const { fetchAndPickModelName } = require('./modelResolver');
const { buildQuestionPrompt, substitutePromptPlaceholders } = require('./prompts');
const { setDiagramImageUrl } = require('./diagram');
const { parseQuestionResponse } = require('./parser');

class GeminiService {
  constructor() {
    this.genAI = null;
    this.model = null;
    this._initError = null;
    this._modelName = null;
    this._initPromise = null;
    this._excludedModelNames = new Set();

    if (!process.env.GOOGLE_API_KEY) {
      console.warn('⚠️  GOOGLE_API_KEY not found in environment variables. Gemini service will not work.');
      return;
    }

    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
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

    try {
      console.log(`🤖 Generating ${question_type} question for ${exam_name} - ${subject}${question_number ? ` (Q${question_number}/${total_in_section})` : ''}`);

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log('✅ Question generated successfully');
      const processedData = parseQuestionResponse(text, params);
      await setDiagramImageUrl(processedData);
      return processedData;
    } catch (error) {
      console.error('❌ Gemini API Error:', error);

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
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log('✅ Question generated successfully');
        const processedData = parseQuestionResponse(text, params);
        await setDiagramImageUrl(processedData);
        return processedData;
      }

      if (error.message?.includes('API_KEY_INVALID')) {
        throw new Error('Invalid Google API key. Please check your GOOGLE_API_KEY configuration.');
      } else if (error.message?.includes('QUOTA_EXCEEDED')) {
        throw new Error('Google API quota exceeded. Please try again later or upgrade your plan.');
      } else if (error.message?.includes('SAFETY')) {
        throw new Error('Content was blocked by safety filters. Please try with different parameters.');
      }

      throw new Error(`Failed to generate question from Gemini API: ${error.message}`);
    }
  }

  async generateQuestionsBatch(paramsArray, maxConcurrent = 3) {
    if (!this.isAvailable()) {
      throw new Error('Gemini service is not available. Please check GOOGLE_API_KEY configuration.');
    }

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
