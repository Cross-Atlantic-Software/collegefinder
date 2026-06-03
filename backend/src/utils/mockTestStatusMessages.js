/**
 * User-facing messages for mock test generation / start states.
 */

function isQuotaError(message) {
  if (!message) return false;
  const m = String(message);
  return m.includes('429') || m.includes('Quota exceeded') || m.includes('quota');
}

function messageForMockStatus(status, generationError) {
  if (status === 'ready') {
    return null;
  }
  if (status === 'failed') {
    if (isQuotaError(generationError)) {
      return `Mock test generation failed: Gemini API daily quota exceeded. OpenAI is configured as fallback — ensure OPENAI_API_KEY is set, or set MOCK_USE_TEMPLATE_QUESTIONS=true for local placeholders only.`;
    }
    if (generationError) {
      return `Mock test generation failed: ${generationError}`;
    }
    return 'Mock test generation failed. Please try again later or contact support.';
  }
  if (status === 'generating') {
    return 'Your mock test is being generated. This usually takes a few minutes — please wait and try again.';
  }
  return 'Mock test is not available yet.';
}

module.exports = { isQuotaError, messageForMockStatus };
