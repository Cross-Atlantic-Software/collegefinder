/**
 * Parse and validate Gemini question JSON response.
 */

function getMarksForDifficulty(difficulty) {
  switch ((difficulty || '').toLowerCase()) {
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
 * Parse and validate the response from Gemini.
 */
function parseQuestionResponse(text, originalParams) {
  try {
    let cleanText = text.trim();
    cleanText = cleanText.replace(/```json\s*/g, '').replace(/```\s*/g, '');

    let jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      const openBraceIndex = cleanText.indexOf('{');
      if (openBraceIndex !== -1) {
        console.log('⚠️  Response appears truncated, attempting to parse partial JSON');
        throw new Error('Response was truncated - try increasing maxOutputTokens or using a shorter prompt');
      }
      throw new Error('No valid JSON found in response');
    }

    let jsonText = jsonMatch[0];
    jsonText = jsonText.replace(/,(\s*[}\]])/g, '$1');

    // Fix literal control characters inside JSON string values (Gemini sometimes returns unescaped \n, \r, \t)
    jsonText = jsonText.replace(/"((?:[^"\\]|\\.)*)"/g, (_, content) => {
      const fixed = content
        .replace(/\r\n/g, '\\n')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
      return '"' + fixed + '"';
    });

    const validEscapes = /^["\\/bfnrtu]$/;
    jsonText = jsonText.replace(/\\(.)/g, (_, c) => (validEscapes.test(c) ? '\\' + c : '\\\\' + c));

    const openBraces = (jsonText.match(/\{/g) || []).length;
    const closeBraces = (jsonText.match(/\}/g) || []).length;

    if (openBraces > closeBraces) {
      console.log('⚠️  JSON appears incomplete, attempting to fix...');
      const missing = openBraces - closeBraces;
      jsonText += '}'.repeat(missing);
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (parseError) {
      if (parseError.message.includes('Unterminated string') || parseError.message.includes('Expected ') || parseError.message.includes('Unexpected end')) {
        const solStart = jsonText.indexOf('"solution_text"');
        if (solStart !== -1) {
          const valueStart = jsonText.indexOf('"', solStart + 15) + 1;
          if (valueStart > 0) {
            console.log('⚠️  Fixing truncated or invalid solution_text in JSON...');
            const rawSol = jsonText.substring(valueStart);
            let salvaged = '';
            for (let ci = 0; ci < rawSol.length; ci++) {
              const ch = rawSol[ci];
              if (ch === '"' && (ci === 0 || rawSol[ci - 1] !== '\\')) break;
              if (ch === '\n' || ch === '\r' || ch === '\t') { salvaged += ' '; continue; }
              salvaged += ch;
            }
            salvaged = salvaged.replace(/\\$/, '');
            if (salvaged.length < 20) salvaged = 'Solution could not be fully parsed from AI response.';
            const before = jsonText.substring(0, valueStart);
            const closeNeeded = Math.max(1, (jsonText.match(/\{/g) || []).length - (jsonText.match(/\}/g) || []).length);
            jsonText = before + salvaged.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
            for (let i = 0; i < closeNeeded; i++) jsonText += '}';
            try {
              parsed = JSON.parse(jsonText);
            } catch (e) {
              throw parseError;
            }
          } else {
            throw parseError;
          }
        } else {
          const lastCompleteQuote = jsonText.lastIndexOf('"}');
          if (lastCompleteQuote > 0) {
            jsonText = jsonText.substring(0, lastCompleteQuote + 2) + '}';
            try {
              parsed = JSON.parse(jsonText);
            } catch (e) {
              throw parseError;
            }
          } else {
            throw parseError;
          }
        }
      } else if (parseError.message.includes('Bad escaped character')) {
        console.log('⚠️  Fixing bad escaped character (LaTeX backslashes)...');
        jsonText = jsonText.replace(/\\([A-Za-z])/g, (_, c) => (/[bfnrtu]/.test(c) ? '\\' + c : '\\\\' + c));
        try {
          parsed = JSON.parse(jsonText);
        } catch (e) {
          throw parseError;
        }
      } else if (parseError.message.includes('Bad control character')) {
        console.log('⚠️  Fixing bad control character (unescaped newlines/tabs in strings)...');
        jsonText = jsonText.replace(/"((?:[^"\\]|\\.)*)"/g, (_, content) => {
          const fixed = content
            .replace(/\r\n/g, '\\n')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
          return '"' + fixed + '"';
        });
        try {
          parsed = JSON.parse(jsonText);
        } catch (e) {
          throw parseError;
        }
      } else {
        throw parseError;
      }
    }

    const required = ['question_text', 'options', 'correct_option', 'solution_text'];
    if (originalParams.question_type === 'any') {
      required.push('question_type');
    }
    for (const field of required) {
      if (!parsed[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (typeof parsed.question_text !== 'string' || parsed.question_text.length < 10) {
      throw new Error('Question text must be a string with at least 10 characters');
    }

    const requestedAny = originalParams.question_type === 'any';
    const resolvedType = requestedAny
      ? (parsed.question_type || 'mcq_single')
      : (originalParams.question_type || 'mcq_single');
    const qType = resolvedType;

    const isNumerical = qType === 'numerical' || originalParams.section_type === 'Numerical';

    if (isNumerical) {
      if (!Array.isArray(parsed.options) || parsed.options.length !== 0) {
        console.warn('⚠️  Numerical question has non-empty options, clearing them');
        parsed.options = [];
      }
      const answerStr = String(parsed.correct_option).trim();
      const numAnswer = parseFloat(answerStr);
      if (isNaN(numAnswer)) {
        throw new Error(`Numerical answer "${parsed.correct_option}" is not a valid number`);
      }
      const roundedAnswer = Math.round(numAnswer);
      if (roundedAnswer < 0 || roundedAnswer > 9999) {
        console.warn(`⚠️  Numerical answer ${roundedAnswer} out of range, clamping to 0-9999`);
        parsed.correct_option = String(Math.max(0, Math.min(9999, roundedAnswer)));
      } else {
        parsed.correct_option = String(roundedAnswer);
      }
    } else if (qType === 'true_false') {
      if (!Array.isArray(parsed.options) || parsed.options.length !== 2) {
        throw new Error('True/False questions must have exactly 2 options');
      }
      const validKeys = ['A', 'B'];
      for (let i = 0; i < parsed.options.length; i++) {
        const option = parsed.options[i];
        if (!option.key || !validKeys.includes(option.key)) {
          throw new Error('True/False option key must be A or B');
        }
      }
      if (!['A', 'B'].includes(parsed.correct_option)) {
        throw new Error('True/False correct option must be A or B');
      }
    } else if (qType === 'mcq_multiple') {
      if (!Array.isArray(parsed.options) || parsed.options.length !== 4) {
        throw new Error('MCQ questions must have exactly 4 options');
      }
      const validKeys = ['A', 'B', 'C', 'D'];
      for (let i = 0; i < parsed.options.length; i++) {
        const option = parsed.options[i];
        if (!option.key || !validKeys.includes(option.key)) {
          throw new Error(`Option key must be one of: ${validKeys.join(', ')}`);
        }
        const text = option.text != null ? String(option.text).trim() : '';
        if (text.length === 0) {
          throw new Error(`Option ${i + 1} (${option.key}) has empty text`);
        }
        parsed.options[i].text = text;
      }
      const correctKeys = parsed.correct_option.split(',').map(k => k.trim());
      if (correctKeys.length < 2 || correctKeys.length > 3) {
        console.warn(`⚠️  mcq_multiple should have 2-3 correct answers, got ${correctKeys.length}`);
      }
      for (const key of correctKeys) {
        if (!validKeys.includes(key)) {
          throw new Error(`MCQ correct option key "${key}" must be one of: ${validKeys.join(', ')}`);
        }
      }
    } else {
      if (!Array.isArray(parsed.options) || parsed.options.length !== 4) {
        throw new Error('MCQ questions must have exactly 4 options');
      }
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
      if (!validKeys.includes(parsed.correct_option)) {
        throw new Error(`MCQ correct option must be one of: ${validKeys.join(', ')}`);
      }
    }

    if (qType === 'paragraph' && !parsed.paragraph_context) {
      console.warn('⚠️  Paragraph question missing paragraph_context');
    }
    if (qType === 'assertion_reason' && (!parsed.assertion || !parsed.reason)) {
      console.warn('⚠️  Assertion-reason question missing assertion or reason');
    }
    if (qType === 'match_following' && !parsed.match_pairs) {
      console.warn('⚠️  Match-following question missing match_pairs');
    }

    if (typeof parsed.solution_text !== 'string' || parsed.solution_text.length < 20) {
      throw new Error('Solution text must be a string with at least 20 characters');
    }

    const image_url = null;

    const processedData = {
      ...parsed,
      subject: originalParams.subject,
      section_name: originalParams.section_name || null,
      section_type: originalParams.section_type || null,
      concept_tags: Array.isArray(parsed.concept_tags) ? parsed.concept_tags : [],
      unit: parsed.unit || 'General',
      topic: parsed.topic || 'General Topic',
      sub_topic: parsed.sub_topic || 'General Sub-topic',
      difficulty: parsed.difficulty || originalParams.difficulty || 'medium',
      question_type: resolvedType,
      marks: getMarksForDifficulty(parsed.difficulty || originalParams.difficulty),
      negative_marks: 0.25,
      source: 'LLM',
      generation_prompt_version: 'v2.0',
      image_url,
      paragraph_context: parsed.paragraph_context || null,
      assertion: parsed.assertion || null,
      reason: parsed.reason || null,
      match_pairs: parsed.match_pairs || null,
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
 * Parse a batch response: JSON array of N question objects. Each element is parsed with parseQuestionResponse.
 * @param {string} text - Raw response text (may contain markdown or extra text).
 * @param {Array<object>} paramsArray - Array of param objects, one per expected question (same order as response).
 * @returns {Promise<Array<object>>} Array of processed question data.
 */
function parseQuestionBatchResponse(text, paramsArray) {
  try {
    let cleanText = (text || '').trim();
    cleanText = cleanText.replace(/```json\s*/g, '').replace(/```\s*/g, '');

    const arrayMatch = cleanText.match(/\[[\s\S]*\]/);
    if (!arrayMatch) {
      throw new Error('No JSON array found in batch response');
    }

    const arr = JSON.parse(arrayMatch[0]);
    if (!Array.isArray(arr)) {
      throw new Error('Batch response is not an array');
    }

    const results = [];
    for (let i = 0; i < arr.length; i++) {
      const params = paramsArray[i] || paramsArray[0];
      const itemStr = JSON.stringify(arr[i]);
      const processed = parseQuestionResponse(itemStr, params);
      results.push(processed);
    }
    return results;
  } catch (error) {
    console.error('❌ Failed to parse Gemini batch response:', error);
    throw new Error(`Invalid batch response format from Gemini API: ${error.message}`);
  }
}

module.exports = {
  parseQuestionResponse,
  parseQuestionBatchResponse,
  getMarksForDifficulty,
};
