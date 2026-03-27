/**
 * Gemini service: singleton export for backward compatibility.
 * Question generation uses config, modelResolver, prompts, diagram, and parser modules.
 */
const GeminiService = require('./GeminiService');
module.exports = new GeminiService();
