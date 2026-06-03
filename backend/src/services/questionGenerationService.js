/**
 * Unified AI question generation: OpenAI (preferred when configured) with Gemini fallback.
 *
 * QUESTION_AI_PROVIDER=openai | gemini | auto (default auto)
 */
const geminiService = require('./geminiService');
const openaiService = require('./openaiQuestionService');
const { isRetryableError } = require('./geminiService/requestHelper');

function resolveProviderOrder() {
  const configured = (process.env.QUESTION_AI_PROVIDER || 'auto').toLowerCase().trim();

  if (configured === 'openai') {
    return ['openai', 'gemini'];
  }
  if (configured === 'gemini') {
    return ['gemini', 'openai'];
  }

  // auto: OpenAI first when key is present (Gemini free tier is often exhausted)
  if (openaiService.isAvailable()) {
    return ['openai', 'gemini'];
  }
  return ['gemini', 'openai'];
}

function getService(name) {
  if (name === 'openai') return openaiService;
  return geminiService;
}

function isProviderUsable(name) {
  if (name === 'openai') return openaiService.isAvailable();
  return geminiService.isAvailable?.() ?? Boolean(process.env.GOOGLE_API_KEY);
}

async function generateQuestion(params) {
  const order = resolveProviderOrder();
  let lastError;

  for (const provider of order) {
    if (!isProviderUsable(provider)) continue;
    try {
      return await getService(provider).generateQuestion(params);
    } catch (err) {
      lastError = err;
      const retryable = isRetryableError(err) || String(err.message).includes('quota');
      console.warn(`⚠️  [QuestionAI] ${provider} failed: ${err.message.slice(0, 160)}`);
      if (!retryable && order.indexOf(provider) < order.length - 1) {
        console.log(`↪️  [QuestionAI] Trying next provider...`);
      }
    }
  }

  throw lastError || new Error('No AI provider available for question generation');
}

async function generateQuestionsBatch(paramsArray, maxConcurrent = 2) {
  const order = resolveProviderOrder();

  for (const provider of order) {
    if (!isProviderUsable(provider)) continue;
    try {
      const result = await getService(provider).generateQuestionsBatch(paramsArray, maxConcurrent);
      if (result.successCount > 0) {
        return result;
      }
      if (order.indexOf(provider) < order.length - 1) {
        console.warn(`⚠️  [QuestionAI] ${provider} batch had 0 successes — trying fallback`);
      }
    } catch (err) {
      console.warn(`⚠️  [QuestionAI] ${provider} batch failed: ${err.message.slice(0, 160)}`);
    }
  }

  return {
    successful: [],
    failed: paramsArray.map((_, index) => ({ index, error: 'All AI providers failed' })),
    totalRequested: paramsArray.length,
    successCount: 0,
    errorCount: paramsArray.length,
  };
}

module.exports = {
  generateQuestion,
  generateQuestionsBatch,
  resolveProviderOrder,
};
