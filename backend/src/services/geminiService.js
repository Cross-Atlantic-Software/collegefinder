const GENERATION_CONFIG = {
  temperature: 0.7,
  topP: 0.8,
  topK: 40,
  maxOutputTokens: 8192,
};

let uploadToS3 = null;
try {
  const s3 = require('../../utils/storage/s3Upload');
  uploadToS3 = s3.uploadToS3;
} catch (_) {
  // S3 optional for diagram upload; fallback to placeholder if missing
}

/** Model used for generating diagram images (text + image output). Uses REST API for responseModalities. */
const IMAGE_GENERATION_MODEL = 'gemini-2.0-flash-exp-image-generation';

/** Diagram type to placeholder image URL (fallback when image generation or S3 upload fails) */
const DIAGRAM_IMAGE_URLS = {
  circuit: 'https://placehold.co/480x280/1e293b/94a3b8?text=Circuit+Diagram',
  free_body: 'https://placehold.co/480x280/1e293b/94a3b8?text=Free+Body+Diagram',
  ray_diagram: 'https://placehold.co/480x280/1e293b/94a3b8?text=Ray+Diagram',
  kinematics_graph: 'https://placehold.co/480x280/1e293b/94a3b8?text=Kinematics+Graph',
  field_lines: 'https://placehold.co/480x280/1e293b/94a3b8?text=Field+Lines',
  optics_setup: 'https://placehold.co/480x280/1e293b/94a3b8?text=Optics+Setup',
  pulley_system: 'https://placehold.co/480x280/1e293b/94a3b8?text=Pulley+System',
  thermodynamics: 'https://placehold.co/480x280/1e293b/94a3b8?text=P-V+Diagram'
};

/** Fallback model names to try if list-models API fails (newer first; all support generateContent + multimodal) */
const FALLBACK_MODEL_NAMES = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-preview-05-20',
  'gemini-2.5-pro-preview-05-06',
  'gemini-2.0-flash-exp',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
];

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

  /**
   * Fetch available models from Gemini API and pick one that supports generateContent (multimodal).
   * Prefers flash for speed, then newest version (3 > 2.5 > 2.0 > 1.5). Excludes names in this._excludedModelNames.
   */
  async _fetchAndPickModelName() {
    const apiKey = process.env.GOOGLE_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}&pageSize=100`;
    const excluded = this._excludedModelNames || new Set();
    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Models list API ${res.status}: ${await res.text()}`);
      }
      const data = await res.json();
      const models = data.models || [];
      const supported = models.filter((m) => {
        const methods = m.supportedGenerationMethods || m.supported_generation_methods || [];
        const str = methods.join(' ').toLowerCase();
        return str.includes('generatecontent');
      });
      if (supported.length === 0) {
        throw new Error('No models with generateContent found in API response');
      }
      let nameOnly = supported.map((m) => (m.name || '').replace(/^models\//i, '')).filter(Boolean);
      nameOnly = nameOnly.filter((n) => !excluded.has(n));
      if (nameOnly.length === 0) {
        throw new Error('All available models have been excluded (e.g. 404). Set GEMINI_MODEL in .env.');
      }
      nameOnly.sort((a, b) => {
        const score = (n) => {
          let s = 0;
          if (/3\.(1|0)/.test(n)) s += 300;
          else if (/2\.5/.test(n)) s += 250;
          else if (/2\.0/.test(n)) s += 200;
          else if (/1\.5/.test(n)) s += 150;
          if (/flash/i.test(n)) s += 10;
          else if (/pro/i.test(n)) s += 5;
          return s;
        };
        return score(b) - score(a);
      });
      const chosen = nameOnly[0];
      console.log('✅ Gemini: picked model from API list:', chosen);
      return chosen;
    } catch (err) {
      console.warn('⚠️  Could not fetch models list:', err.message, '- using fallback list');
      const fallback = FALLBACK_MODEL_NAMES.find((n) => !excluded.has(n));
      return fallback || FALLBACK_MODEL_NAMES[0];
    }
  }

  /**
   * Ensure model is resolved (from env, or from API list). Call before using this.model.
   */
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

  /**
   * Check if Gemini service is available (after ensureInitialized if not using GEMINI_MODEL).
   */
  isAvailable() {
    return this.genAI !== null && (this.model !== null || this._initPromise !== null);
  }

  /**
   * Generate a question using Gemini API.
   * Uses a model that supports generateContent and multimodal (image) input; you can pass image parts
   * via content with { inlineData: { mimeType, data } } in the future.
   */
  async generateQuestion(params) {
    await this.ensureInitialized();
    if (this.model === null) {
      const msg = this._initError
        ? `Gemini: ${this._initError}`
        : 'Gemini service is not available. Please check GOOGLE_API_KEY configuration.';
      throw new Error(msg);
    }

    const { exam_name, subject, difficulty, topic, question_type = 'mcq', section_name, section_type, force_diagram } = params;
    
    // Validate required parameters
    if (!exam_name || !subject || !difficulty) {
      throw new Error('Missing required parameters: exam_name, subject, and difficulty are required');
    }

    const prompt = this.buildQuestionPrompt(exam_name, subject, difficulty, topic, question_type, section_name, section_type, { force_diagram });
    
    try {
      console.log(`🤖 Generating ${difficulty} ${question_type} question for ${exam_name} - ${subject}${topic ? ` (${topic})` : ''}`);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('✅ Question generated successfully');
      const processedData = this.parseQuestionResponse(text, params);
      await this._setDiagramImageUrl(processedData);
      return processedData;
    } catch (error) {
      console.error('❌ Gemini API Error:', error);
      
      // If model not available (404 / no longer available), clear and retry once with next model from list
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
        const processedData = this.parseQuestionResponse(text, params);
        await this._setDiagramImageUrl(processedData);
        return processedData;
      }
      
      // Handle specific API errors
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

  /**
   * If processedData has diagram_type, generate diagram image (Gemini), upload to S3, set image_url; else use placeholder.
   * @param {Object} processedData - Parsed question data (mutated in place)
   */
  async _setDiagramImageUrl(processedData) {
    if (!processedData.diagram_type || typeof processedData.diagram_type !== 'string') return;
    const key = processedData.diagram_type.trim().toLowerCase().replace(/-/g, '_').replace(/\s+/g, '_');
    const questionText = processedData.question_text || '';
    if (!questionText) {
      processedData.image_url = DIAGRAM_IMAGE_URLS[key] || null;
      return;
    }
    const url = await this._generateAndUploadDiagram(questionText, processedData.diagram_type);
    processedData.image_url = url || DIAGRAM_IMAGE_URLS[key] || null;
    if (url) console.log(`📐 Diagram question: image_url set from generated image`);
    else console.log(`📐 Diagram question: using placeholder for ${processedData.diagram_type}`);
  }

  /**
   * Generate a diagram image for a question using Gemini image-generation model (REST API).
   * @param {string} questionText - The question text to illustrate
   * @param {string} diagramType - e.g. circuit, free_body, ray_diagram
   * @returns {Promise<{ buffer: Buffer, mimeType: string } | null>}
   */
  async _generateDiagramImageBuffer(questionText, diagramType) {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) return null;
    const prompt = `Generate a single clear, educational diagram or figure suitable for this exam question. Style: clean line diagram, labels where helpful. Do not add extra text explanation.

Question: ${questionText.substring(0, 1500)}

Output only the diagram image.`;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_GENERATION_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const body = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
        temperature: 0.6,
        maxOutputTokens: 4096,
      },
    };
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errText = await res.text();
        console.warn('⚠️  Diagram image API error:', res.status, errText?.slice(0, 200));
        return null;
      }
      const data = await res.json();
      const parts = data.candidates?.[0]?.content?.parts;
      if (!Array.isArray(parts)) return null;
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          const mimeType = part.inlineData.mimeType || 'image/png';
          const buffer = Buffer.from(part.inlineData.data, 'base64');
          return { buffer, mimeType };
        }
      }
      return null;
    } catch (err) {
      console.warn('⚠️  Diagram image generation failed:', err.message);
      return null;
    }
  }

  /**
   * Generate diagram image and upload to S3. Returns S3 URL or null.
   * @param {string} questionText
   * @param {string} diagramType
   * @returns {Promise<string | null>}
   */
  async _generateAndUploadDiagram(questionText, diagramType) {
    const result = await this._generateDiagramImageBuffer(questionText, diagramType);
    if (!result || !result.buffer || result.buffer.length === 0) return null;
    if (!uploadToS3) {
      console.warn('⚠️  S3 upload not available; diagram image not saved');
      return null;
    }
    const ext = (result.mimeType === 'image/png') ? 'png' : 'jpg';
    const fileName = `question-diagram-${Date.now()}.${ext}`;
    try {
      const url = await uploadToS3(result.buffer, fileName, 'question_diagrams');
      console.log('📐 Diagram image uploaded to S3:', url);
      return url;
    } catch (err) {
      console.warn('⚠️  S3 upload for diagram failed:', err.message);
      return null;
    }
  }

  /**
   * Build the prompt for question generation
   */
  buildQuestionPrompt(exam_name, subject, difficulty, topic, question_type, section_name, section_type, options = {}) {
    const { force_diagram } = options;
    const topicClause = topic ? ` specifically on the topic: "${topic}"` : '';
    const sectionClause = section_name ? ` for the ${section_name} section` : '';
    const sectionTypeClause = section_type ? ` (${section_type} type)` : '';
    const difficultyDescription = this.getDifficultyDescription(difficulty);
    
    // Handle special case for numerical questions
    const questionTypeDescription = question_type === 'numerical' || section_type === 'Numerical' 
      ? 'NUMERICAL' 
      : question_type.toUpperCase();
    
    const diagramRequirement = force_diagram
      ? `
MANDATORY DIAGRAM: This question MUST be based on a diagram/figure. Set "diagram_type" in your JSON to exactly: "circuit". Write a question about an electrical circuit (e.g. resistors, battery, current). The question_text must refer to "the circuit shown in the figure" or "consider the circuit diagram".`
      : '';
    
    return `You are an expert question creator for competitive exams in India. Generate a ${difficulty} level ${questionTypeDescription} question for the ${exam_name} exam in ${subject} subject${topicClause}${sectionClause}${sectionTypeClause}.

${difficultyDescription}
${diagramRequirement}

${this.getFormatInstructions(question_type, section_type)}

QUALITY REQUIREMENTS:
- Question must be factually accurate and appropriate for ${exam_name} level
- All options must be plausible but only one correct
- Avoid obvious wrong answers or trick questions
- Solution must explain the concept clearly in 3-6 steps; keep solution_text under 400 words so the response stays valid JSON
- Do not use unescaped double quotes (") inside any JSON string; use single quotes or \\" for quotes in text. In JSON strings use either plain text (e.g. Omega, ohms) or double backslashes for LaTeX (e.g. \\\\Omega not \\Omega). Single backslash before letters breaks JSON.
- Use proper scientific/mathematical notation if needed
- Question should test understanding, not just memorization
- Ensure the question is neither too easy nor impossibly hard for ${difficulty} level

CONTENT GUIDELINES:
- Focus on core concepts relevant to ${exam_name}
- Use clear, unambiguous language
- Include relevant formulas, constants, or data if needed
- Make sure all numerical values are realistic and appropriate
- Avoid controversial topics or outdated information
${this.getDiagramInstructions(subject)}

Remember: Respond with ONLY the JSON object, no additional text or formatting.`;
  }

  /**
   * For Physics/Chemistry: instruct to sometimes generate diagram-based questions (JEE-style figures)
   */
  getDiagramInstructions(subject) {
    const subjectLower = (subject || '').toLowerCase();
    if (!subjectLower.includes('physics') && !subjectLower.includes('chemistry')) return '';
    return `

DIAGRAM-BASED QUESTIONS (for ${subject}):
- About 30% of the time, generate a question that refers to a diagram/figure (like JEE Main Physics questions with circuits, FBDs, ray diagrams, etc.).
- When the question is based on a diagram, set "diagram_type" in your JSON to exactly one of: circuit, free_body, ray_diagram, kinematics_graph, field_lines, optics_setup, pulley_system, thermodynamics.
- The question_text should reference the figure (e.g. "Consider the circuit shown in the figure. If R1 = 2 Ω and R2 = 4 Ω...", "Refer to the free body diagram. The block of mass m...", "In the ray diagram shown, the object is placed...").
- If this question does NOT use a diagram, omit "diagram_type" entirely.
- Valid diagram_type values only: circuit, free_body, ray_diagram, kinematics_graph, field_lines, optics_setup, pulley_system, thermodynamics.`;
  }

  /**
   * Get difficulty-specific description
   */
  getDifficultyDescription(difficulty) {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'EASY LEVEL: Focus on basic concepts, direct application of formulas, and fundamental understanding. Should be solvable by most students with basic preparation.';
      case 'medium':
        return 'MEDIUM LEVEL: Requires good conceptual understanding, may involve 2-3 step solutions, and application of multiple concepts. Should challenge students but be solvable with proper preparation.';
      case 'hard':
        return 'HARD LEVEL: Requires deep conceptual understanding, multi-step problem solving, integration of multiple concepts, and analytical thinking. Should challenge even well-prepared students.';
      default:
        return 'Focus on appropriate level concepts and problem-solving skills.';
    }
  }

  /**
   * Get format-specific instructions based on question type
   */
  getFormatInstructions(question_type, section_type) {
    const isNumerical = question_type === 'numerical' || section_type === 'Numerical';
    
    if (isNumerical) {
      return `CRITICAL: Respond with ONLY valid JSON (no markdown, no extra text, no backticks). Use this EXACT format for NUMERICAL questions:
{
  "question_text": "Clear, concise question text here",
  "options": [],
  "correct_option": "123",
  "solution_text": "Detailed step-by-step solution",
  "concept_tags": ["concept1", "concept2"],
  "unit": "Unit name",
  "topic": "Generated topic",
  "sub_topic": "Sub-topic name",
  "diagram_type": "circuit"
}

Optional: include "diagram_type" only when the question refers to a diagram. Use one of: circuit, free_body, ray_diagram, kinematics_graph, field_lines, optics_setup, pulley_system, thermodynamics.

NUMERICAL QUESTION REQUIREMENTS:
- Answer must be a single integer between 0 and 9999
- No decimal points or fractions in the final answer
- Options array should be empty []
- correct_option should contain only the numerical answer as a string
- Question should be solvable to get an exact integer answer`;
    } else {
      return `CRITICAL: Respond with ONLY valid JSON (no markdown, no extra text, no backticks). Use this EXACT format for MCQ questions:
{
  "question_text": "Clear, concise question text here",
  "options": [
    {"key": "A", "text": "First option text"},
    {"key": "B", "text": "Second option text"},
    {"key": "C", "text": "Third option text"},
    {"key": "D", "text": "Fourth option text"}
  ],
  "correct_option": "A",
  "solution_text": "Detailed explanation",
  "concept_tags": ["concept1", "concept2"],
  "unit": "Unit name",
  "topic": "Generated topic",
  "sub_topic": "Sub-topic name",
  "diagram_type": "circuit"
}

Optional: include "diagram_type" only when the question refers to a diagram. Use one of: circuit, free_body, ray_diagram, kinematics_graph, field_lines, optics_setup, pulley_system, thermodynamics.

MCQ REQUIREMENTS:
- Exactly 4 options with keys A, B, C, D
- All options must be plausible but only one correct
- correct_option must be one of: A, B, C, D`;
    }
  }

  /**
   * Parse and validate the response from Gemini
   */
  parseQuestionResponse(text, originalParams) {
    try {
      // Clean the response text
      let cleanText = text.trim();
      
      // Remove any markdown formatting
      cleanText = cleanText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // Extract JSON from response (handle cases where AI adds extra text)
      let jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        // Try to find JSON without closing brace (truncated response)
        const openBraceIndex = cleanText.indexOf('{');
        if (openBraceIndex !== -1) {
          // Try to reconstruct the JSON if it's truncated
          console.log('⚠️  Response appears truncated, attempting to parse partial JSON');
          throw new Error('Response was truncated - try increasing maxOutputTokens or using a shorter prompt');
        }
        throw new Error('No valid JSON found in response');
      }

      let jsonText = jsonMatch[0];
      
      // Remove trailing commas (invalid in JSON but often emitted by LLMs)
      jsonText = jsonText.replace(/,(\s*[}\]])/g, '$1');

      // Fix invalid JSON escapes: LaTeX often has \Omega, \frac, \text etc; in JSON only \ " \ / b f n r t u are valid. Double backslash for others.
      const validEscapes = /^["\\/bfnrtu]$/;
      jsonText = jsonText.replace(/\\(.)/g, (_, c) => (validEscapes.test(c) ? '\\' + c : '\\\\' + c));

      // If solution_text is huge, it often contains unescaped quotes or truncation → truncate it to avoid parse errors
      const maxSolutionLength = 2800;
      const solutionMatch = jsonText.match(/"solution_text"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      if (solutionMatch && solutionMatch[1].length > maxSolutionLength) {
        const truncated = solutionMatch[1].substring(0, maxSolutionLength).replace(/\\.?$/, '') + ' [Solution truncated for length.]';
        jsonText = jsonText.replace(/"solution_text"\s*:\s*"((?:[^"\\]|\\.)*)"/, '"solution_text": "' + truncated.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"');
      }
      
      // Check if JSON is complete (has closing brace)
      const openBraces = (jsonText.match(/\{/g) || []).length;
      const closeBraces = (jsonText.match(/\}/g) || []).length;
      
      if (openBraces > closeBraces) {
        console.log('⚠️  JSON appears incomplete, attempting to fix...');
        // Try to add missing closing braces
        const missing = openBraces - closeBraces;
        jsonText += '}'.repeat(missing);
      }

      // Parse with retries for common LLM JSON issues
      let parsed;
      try {
        parsed = JSON.parse(jsonText);
      } catch (parseError) {
        if (parseError.message.includes('Unterminated string')) {
          console.log('⚠️  Fixing unterminated string in JSON...');
          const lastCompleteQuote = jsonText.lastIndexOf('"}');
          if (lastCompleteQuote > 0) {
            jsonText = jsonText.substring(0, lastCompleteQuote + 2) + '}';
            parsed = JSON.parse(jsonText);
          } else {
            throw parseError;
          }
        } else if (parseError.message.includes('Bad escaped character')) {
          // Second pass: double backslash only before letters that are not valid JSON escapes (b,f,n,r,t,u)
          console.log('⚠️  Fixing bad escaped character (LaTeX backslashes)...');
          jsonText = jsonText.replace(/\\([A-Za-z])/g, (_, c) => (/[bfnrtu]/.test(c) ? '\\' + c : '\\\\' + c));
          try {
            parsed = JSON.parse(jsonText);
          } catch (e) {
            throw parseError;
          }
        } else {
          throw parseError;
        }
      }
      
      // Validate required fields
      const required = ['question_text', 'options', 'correct_option', 'solution_text'];
      for (const field of required) {
        if (!parsed[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Validate question text
      if (typeof parsed.question_text !== 'string' || parsed.question_text.length < 10) {
        throw new Error('Question text must be a string with at least 10 characters');
      }

      // Validate options based on question type
      const isNumerical = originalParams.question_type === 'numerical' || originalParams.section_type === 'Numerical';
      
      if (isNumerical) {
        // For numerical questions, options should be empty
        if (!Array.isArray(parsed.options) || parsed.options.length !== 0) {
          throw new Error('Numerical questions must have an empty options array');
        }
        
        // Validate correct option is a number
        const numAnswer = parseInt(parsed.correct_option);
        if (isNaN(numAnswer) || numAnswer < 0 || numAnswer > 9999) {
          throw new Error('Numerical answer must be an integer between 0 and 9999');
        }
      } else {
        // For MCQ questions, validate 4 options
        if (!Array.isArray(parsed.options) || parsed.options.length !== 4) {
          throw new Error('MCQ questions must have exactly 4 options');
        }

        // Validate and normalize each option (allow short answers e.g. "R", "4R")
        const validKeys = ['A', 'B', 'C', 'D'];
        for (let i = 0; i < parsed.options.length; i++) {
          const option = parsed.options[i];
          if (!option.key) {
            throw new Error(`Option ${i + 1} must have a 'key' property`);
          }
          if (!validKeys.includes(option.key)) {
            throw new Error(`Option key must be one of: ${validKeys.join(', ')}`);
          }
          const text = option.text != null ? String(option.text).trim() : '';
          if (text.length === 0) {
            throw new Error(`Option ${i + 1} (${option.key}) has empty text`);
          }
          parsed.options[i].text = text;
        }

        // Validate correct option
        if (!validKeys.includes(parsed.correct_option)) {
          throw new Error(`MCQ correct option must be one of: ${validKeys.join(', ')}`);
        }
      }

      // Validate solution
      if (typeof parsed.solution_text !== 'string' || parsed.solution_text.length < 20) {
        throw new Error('Solution text must be a string with at least 20 characters');
      }

      // Diagram questions: image_url is set later by generateQuestion (Gemini image gen + S3) or fallback to placeholder
      const image_url = null;

      // Set default values for optional fields
      const processedData = {
        ...parsed,
        subject: originalParams.subject, // Ensure subject is included from original params
        section_name: originalParams.section_name || null, // Add section fields
        section_type: originalParams.section_type || null,
        concept_tags: Array.isArray(parsed.concept_tags) ? parsed.concept_tags : [],
        unit: parsed.unit || 'General',
        topic: parsed.topic || originalParams.topic || 'General Topic',
        sub_topic: parsed.sub_topic || 'General Sub-topic',
        difficulty: originalParams.difficulty,
        question_type: originalParams.question_type,
        marks: this.getMarksForDifficulty(originalParams.difficulty),
        negative_marks: 0.25,
        source: 'LLM',
        generation_prompt_version: 'v1.0',
        image_url
      };

      console.log('✅ Question parsed and validated successfully');
      return processedData;
      
    } catch (error) {
      console.error('❌ Failed to parse Gemini response:', error);
      console.error('Raw response:', text);
      throw new Error(`Invalid response format from Gemini API: ${error.message}`);
    }
  }

  /**
   * Get marks based on difficulty level
   */
  getMarksForDifficulty(difficulty) {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 1;
      case 'medium':
        return 2;
      case 'hard':
        return 3;
      default:
        return 1;
    }
  }

  /**
   * Generate multiple questions in batch
   */
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

    // Process in batches to avoid overwhelming the API
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

      // Add delay between batches to respect rate limits
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
   * Test the service with a simple question generation
   */
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
        difficulty: 'easy',
        topic: 'Basic Algebra',
        question_type: 'mcq'
      };

      const question = await this.generateQuestion(testParams);
      
      return {
        success: true,
        message: 'Gemini service is working correctly',
        sampleQuestion: {
          question_text: question.question_text,
          difficulty: question.difficulty,
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

// Export singleton instance
module.exports = new GeminiService();