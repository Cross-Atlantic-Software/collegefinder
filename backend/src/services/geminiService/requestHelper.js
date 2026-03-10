/**
 * Reusable Gemini API request helper: exponential backoff retry and retryable error detection.
 * Retries only on 503, 429, and network errors. Delay pattern: 1s → 2s → 4s → 8s → 16s.
 */

const MAX_ATTEMPTS = 5;
const RETRY_DELAYS_MS = [1000, 2000, 4000, 8000, 16000];

/**
 * @param {Error} error
 * @returns {boolean} true if the error is retryable (503, 429, network/timeout)
 */
function isRetryableError(error) {
  if (!error || !error.message) return false;
  const msg = String(error.message);
  const status = error.status || error.statusCode;
  if (status === 503 || status === 429) return true;
  if (msg.includes('503') || msg.includes('Service Unavailable')) return true;
  if (msg.includes('429') || msg.includes('resource has been exhausted') || msg.includes('Quota exceeded')) return true;
  if (msg.includes('ECONNRESET') || msg.includes('ETIMEDOUT') || msg.includes('ENOTFOUND') || msg.includes('network')) return true;
  if (msg.includes('fetch') && (msg.includes('failed') || msg.includes('timeout'))) return true;
  return false;
}

/**
 * Execute an async function with exponential backoff retry.
 * @param {() => Promise<T>} fn - Async function that performs the API call (no args).
 * @param {object} [options]
 * @param {number} [options.maxAttempts=5]
 * @param {string} [options.operationName='Request'] - Used in log messages.
 * @returns {Promise<T>}
 * @throws {Error} After max attempts exceeded, throws with a clear message.
 */
async function withRetry(fn, options = {}) {
  const maxAttempts = options.maxAttempts ?? MAX_ATTEMPTS;
  const operationName = options.operationName ?? 'Request';
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const retryable = isRetryableError(error);
      if (!retryable || attempt === maxAttempts) {
        if (attempt > 1) {
          console.error(`❌ ${operationName} failed after ${attempt} attempts. Last error: ${error.message}`);
        }
        throw error;
      }
      const delayMs = RETRY_DELAYS_MS[Math.min(attempt - 1, RETRY_DELAYS_MS.length - 1)];
      console.warn(`⚠️  Gemini ${operationName} attempt ${attempt}/${maxAttempts} failed (retryable): ${error.message}`);
      console.warn(`   Retrying in ${delayMs / 1000}s...`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  throw lastError || new Error(`${operationName} failed after ${maxAttempts} attempts.`);
}

module.exports = {
  isRetryableError,
  withRetry,
  MAX_ATTEMPTS,
  RETRY_DELAYS_MS,
};
