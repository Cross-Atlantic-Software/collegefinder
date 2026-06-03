/**
 * OpenAI-backed question generation — same prompts/parsers as Gemini.
 */
const pLimit = require('p-limit').default || require('p-limit');
const { buildQuestionPrompt } = require('./geminiService/prompts');
const { parseQuestionResponse } = require('./geminiService/parser');
const { setDiagramImageUrl } = require('./geminiService/diagram');
const { withRetry } = require('./geminiService/requestHelper');

const OPENAI_CONCURRENCY = 2;
const apiLimit = pLimit(OPENAI_CONCURRENCY);

function getApiKey() {
  return process.env.OPENAI_API_KEY && String(process.env.OPENAI_API_KEY).trim();
}

function getModel() {
  return process.env.OPENAI_MODEL || 'gpt-4o-mini';
}

function isAvailable() {
  return Boolean(getApiKey());
}

async function chatCompletion(prompt) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set in backend/.env');
  }

  const doRequest = async () => {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: getModel(),
        messages: [
          {
            role: 'system',
            content:
              'You are an expert exam question writer for Indian competitive exams (JEE, NEET, CUET, etc.). Respond with a single valid JSON object only. Use double quotes for all strings — never single quotes.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.75,
        response_format: { type: 'json_object' },
      }),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = body?.error?.message || res.statusText || 'OpenAI request failed';
      const err = new Error(msg);
      err.status = res.status;
      throw err;
    }

    const text = body?.choices?.[0]?.message?.content;
    if (!text || !String(text).trim()) {
      throw new Error('OpenAI returned an empty response');
    }
    return String(text).trim();
  };

  return withRetry(doRequest, { operationName: 'OpenAI chatCompletion' });
}

async function generateQuestion(params) {
  if (!isAvailable()) {
    throw new Error('OpenAI is not configured (OPENAI_API_KEY missing)');
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
    difficulty,
  } = params;

  if (!exam_name || !subject) {
    throw new Error('Missing required parameters: exam_name and subject are required');
  }

  const prompt = buildQuestionPrompt(exam_name, subject, question_type, section_name, section_type, {
    force_diagram,
    generation_prompt,
    question_number,
    total_in_section,
    difficulty,
  });

  return apiLimit(async () => {
    console.log(
      `🤖 [OpenAI] Generating ${question_type} question for ${exam_name} - ${subject}${question_number ? ` (Q${question_number}/${total_in_section})` : ''}`
    );
    const text = await chatCompletion(prompt);
    const processedData = parseQuestionResponse(text, params);
    await setDiagramImageUrl(processedData);
    console.log('✅ [OpenAI] Question generated successfully');
    return processedData;
  });
}

async function generateQuestionsBatch(paramsArray, maxConcurrent = OPENAI_CONCURRENCY) {
  if (!Array.isArray(paramsArray) || paramsArray.length === 0) {
    throw new Error('paramsArray must be a non-empty array');
  }

  console.log(`🤖 [OpenAI] Generating ${paramsArray.length} questions in batch (max ${maxConcurrent} concurrent)`);

  const results = [];
  const errors = [];

  for (let i = 0; i < paramsArray.length; i += maxConcurrent) {
    const batch = paramsArray.slice(i, i + maxConcurrent);
    const batchResults = await Promise.all(
      batch.map(async (params, index) => {
        try {
          const question = await generateQuestion(params);
          return { index: i + index, question, error: null };
        } catch (error) {
          return { index: i + index, question: null, error: error.message };
        }
      })
    );

    for (const result of batchResults) {
      if (result.error) {
        errors.push({ index: result.index, error: result.error });
      } else {
        results.push({ index: result.index, question: result.question });
      }
    }

    if (i + maxConcurrent < paramsArray.length) {
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
  }

  console.log(`✅ [OpenAI] Batch completed: ${results.length} successful, ${errors.length} failed`);

  return {
    successful: results,
    failed: errors,
    totalRequested: paramsArray.length,
    successCount: results.length,
    errorCount: errors.length,
  };
}

module.exports = {
  isAvailable,
  generateQuestion,
  generateQuestionsBatch,
};
