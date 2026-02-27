class GeminiService {
  constructor() {
    this.genAI = null;
    this.model = null;
    this._initError = null;

    if (!process.env.GOOGLE_API_KEY) {
      console.warn('⚠️  GOOGLE_API_KEY not found in environment variables. Gemini service will not work.');
      return;
    }

    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
      const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
      this.model = this.genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 8192, // Further increased to prevent truncation
        }
      });
      console.log('✅ Gemini service initialized successfully');
    } catch (err) {
      this._initError = err.message || String(err);
      console.warn('⚠️  Gemini service unavailable:', this._initError);
      console.warn('   Install with: npm install @google/generative-ai (then rebuild Docker image if using Docker)');
    }
  }

  /**
   * Check if Gemini service is available
   */
  isAvailable() {
    return this.genAI !== null && this.model !== null;
  }

  /**
   * Generate a question using Gemini API
   */
  async generateQuestion(params) {
    if (!this.isAvailable()) {
      const msg = this._initError
        ? `Gemini package not installed: ${this._initError}. Run: npm install @google/generative-ai (rebuild Docker image if using Docker).`
        : 'Gemini service is not available. Please check GOOGLE_API_KEY configuration.';
      throw new Error(msg);
    }

    const { exam_name, subject, difficulty, topic, question_type = 'mcq', section_name, section_type } = params;
    
    // Validate required parameters
    if (!exam_name || !subject || !difficulty) {
      throw new Error('Missing required parameters: exam_name, subject, and difficulty are required');
    }

    const prompt = this.buildQuestionPrompt(exam_name, subject, difficulty, topic, question_type, section_name, section_type);
    
    try {
      console.log(`🤖 Generating ${difficulty} ${question_type} question for ${exam_name} - ${subject}${topic ? ` (${topic})` : ''}`);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('✅ Question generated successfully');
      return this.parseQuestionResponse(text, params);
    } catch (error) {
      console.error('❌ Gemini API Error:', error);
      
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
   * Build the prompt for question generation
   */
  buildQuestionPrompt(exam_name, subject, difficulty, topic, question_type, section_name, section_type) {
    const topicClause = topic ? ` specifically on the topic: "${topic}"` : '';
    const sectionClause = section_name ? ` for the ${section_name} section` : '';
    const sectionTypeClause = section_type ? ` (${section_type} type)` : '';
    const difficultyDescription = this.getDifficultyDescription(difficulty);
    
    // Handle special case for numerical questions
    const questionTypeDescription = question_type === 'numerical' || section_type === 'Numerical' 
      ? 'NUMERICAL' 
      : question_type.toUpperCase();
    
    return `You are an expert question creator for competitive exams in India. Generate a ${difficulty} level ${questionTypeDescription} question for the ${exam_name} exam in ${subject} subject${topicClause}${sectionClause}${sectionTypeClause}.

${difficultyDescription}

${this.getFormatInstructions(question_type, section_type)}

QUALITY REQUIREMENTS:
- Question must be factually accurate and appropriate for ${exam_name} level
- All options must be plausible but only one correct
- Avoid obvious wrong answers or trick questions
- Solution must explain the concept clearly with step-by-step reasoning
- Use proper scientific/mathematical notation if needed
- Question should test understanding, not just memorization
- Ensure the question is neither too easy nor impossibly hard for ${difficulty} level

CONTENT GUIDELINES:
- Focus on core concepts relevant to ${exam_name}
- Use clear, unambiguous language
- Include relevant formulas, constants, or data if needed
- Make sure all numerical values are realistic and appropriate
- Avoid controversial topics or outdated information

Remember: Respond with ONLY the JSON object, no additional text or formatting.`;
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
  "sub_topic": "Sub-topic name"
}

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
  "sub_topic": "Sub-topic name"
}

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
      
      // Check if JSON is complete (has closing brace)
      const openBraces = (jsonText.match(/\{/g) || []).length;
      const closeBraces = (jsonText.match(/\}/g) || []).length;
      
      if (openBraces > closeBraces) {
        console.log('⚠️  JSON appears incomplete, attempting to fix...');
        // Try to add missing closing braces
        const missing = openBraces - closeBraces;
        jsonText += '}'.repeat(missing);
      }

      // Fix unterminated strings (common issue with truncated responses)
      try {
        JSON.parse(jsonText);
      } catch (parseError) {
        if (parseError.message.includes('Unterminated string')) {
          console.log('⚠️  Fixing unterminated string in JSON...');
          // Find the last complete string and truncate there
          const lastCompleteQuote = jsonText.lastIndexOf('"}');
          if (lastCompleteQuote > 0) {
            jsonText = jsonText.substring(0, lastCompleteQuote + 2) + '}';
          } else {
            // If we can't fix it, throw the original error
            throw parseError;
          }
        } else {
          throw parseError;
        }
      }

      const parsed = JSON.parse(jsonText);
      
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

        // Validate each option
        const validKeys = ['A', 'B', 'C', 'D'];
        for (let i = 0; i < parsed.options.length; i++) {
          const option = parsed.options[i];
          if (!option.key || !option.text) {
            throw new Error(`Option ${i + 1} must have both 'key' and 'text' properties`);
          }
          if (!validKeys.includes(option.key)) {
            throw new Error(`Option key must be one of: ${validKeys.join(', ')}`);
          }
          if (typeof option.text !== 'string' || option.text.length < 2) {
            throw new Error(`Option text must be a string with at least 2 characters`);
          }
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
        generation_prompt_version: 'v1.0'
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
    if (!this.isAvailable()) {
      return { success: false, error: 'Service not available' };
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