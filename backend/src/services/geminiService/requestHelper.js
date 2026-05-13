/**
 * Reusable Gemini API request helper: exponential backoff retry and retryable error detection.
 * Respects Google's retryDelay hint from 429 responses; shares a global cooldown across all
 * concurrent callers so parallel requests don't burn retries while the quota is exhausted.
 */

const MAX_ATTEMPTS = 5;
const BASE_DELAYS_MS = [2000, 4000, 8000, 16000, 30000];

/** Shared cooldown: no request should fire before this timestamp. */
let _globalCooldownUntil = 0;

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

function isRateLimitError(error) {
  if (!error || !error.message) return false;
  const msg = String(error.message);
  const status = error.status || error.statusCode;
  return status === 429 || msg.includes('429') || msg.includes('Quota exceeded') || msg.includes('resource has been exhausted');
}

/**
 * Parse Google's "retryDelay" hint from the error message.
 * Google returns strings like "retryDelay":"46s" or "Please retry in 13.329063474s".
 * @returns {number} milliseconds to wait, or 0 if not found
 */
function parseRetryDelayFromError(error) {
  if (!error || !error.message) return 0;
  const msg = String(error.message);

  const jsonMatch = msg.match(/"retryDelay"\s*:\s*"(\d+)s?"/);
  if (jsonMatch) return parseInt(jsonMatch[1], 10) * 1000;

  const proseMatch = msg.match(/retry in (\d+(?:\.\d+)?)s/i);
  if (proseMatch) return Math.ceil(parseFloat(proseMatch[1])) * 1000;

  return 0;
}

/**
 * Execute an async function with exponential backoff retry.
 * For 429 errors, respects Google's retryDelay and sets a global cooldown
 * so concurrent callers also wait.
 * @param {Function} fn - async function to execute
 * @param {Object} options
 * @param {number} [options.maxAttempts]
 * @param {string} [options.operationName]
 * @param {Function} [options.isCancelled] - if provided, checked before each attempt; throw if returns true
 */
async function withRetry(fn, options = {}) {
  const maxAttempts = options.maxAttempts ?? MAX_ATTEMPTS;
  const operationName = options.operationName ?? 'Request';
  const isCancelled = options.isCancelled;
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (isCancelled && isCancelled()) {
      throw new Error(`${operationName} cancelled (worker paused)`);
    }

    const cooldownRemaining = _globalCooldownUntil - Date.now();
    if (cooldownRemaining > 0) {
      console.warn(`⏳ ${operationName}: waiting ${Math.ceil(cooldownRemaining / 1000)}s (global rate-limit cooldown)...`);
      await new Promise((r) => setTimeout(r, cooldownRemaining));
    }

    if (isCancelled && isCancelled()) {
      throw new Error(`${operationName} cancelled (worker paused)`);
    }

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

      let delayMs = BASE_DELAYS_MS[Math.min(attempt - 1, BASE_DELAYS_MS.length - 1)];

      if (isRateLimitError(error)) {
        const googleHintMs = parseRetryDelayFromError(error);
        if (googleHintMs > 0) {
          delayMs = googleHintMs + 2000;
        } else {
          delayMs = Math.max(delayMs, 30000);
        }
        _globalCooldownUntil = Math.max(_globalCooldownUntil, Date.now() + delayMs);
      }

      console.warn(`⚠️  Gemini ${operationName} attempt ${attempt}/${maxAttempts} failed (retryable): ${error.message.slice(0, 120)}`);
      console.warn(`   Retrying in ${Math.ceil(delayMs / 1000)}s...`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  throw lastError || new Error(`${operationName} failed after ${maxAttempts} attempts.`);
}

module.exports = {
  isRetryableError,
  withRetry,
  MAX_ATTEMPTS,
  BASE_DELAYS_MS,
};
