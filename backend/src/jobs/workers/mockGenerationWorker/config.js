/**
 * Mock generation worker configuration.
 */

const QUEUE_NAME = 'mock-generation';

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
};
