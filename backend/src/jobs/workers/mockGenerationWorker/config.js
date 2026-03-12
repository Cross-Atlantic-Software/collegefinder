/**
 * Mock generation worker configuration.
 */

const QUEUE_NAME = 'mock-generation';

/** Questions per batch to avoid Gemini API limits and enable resume. */
const BATCH_SIZE = 12;

/** Max concurrent Gemini calls within each batch. */
const GEMINI_CONCURRENCY = 3;

/** Question types supported by the schema and Gemini prompts. */
const KNOWN_TYPES = [
  'mcq_single',
  'mcq_multiple',
  'numerical',
  'paragraph',
  'assertion_reason',
  'match_following',
  'true_false',
  'fill_blank',
];

module.exports = {
  QUEUE_NAME,
  KNOWN_TYPES,
  BATCH_SIZE,
  GEMINI_CONCURRENCY,
};
