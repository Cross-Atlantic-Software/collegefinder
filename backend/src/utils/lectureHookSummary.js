/**
 * After a lecture row is saved (with YouTube + taxonomy junctions), generate a 2-sentence
 * student-facing hook via Gemini and persist to lectures.hook_summary.
 */
const Lecture = require('../models/taxonomy/Lecture');
const Topic = require('../models/taxonomy/Topic');
const Subtopic = require('../models/taxonomy/Subtopic');
const geminiService = require('../services/geminiService');

const MAX_PROMPT_FIELD = 8000;
const MAX_SUMMARY_LEN = 2000;

function truncate(s, max) {
  const t = String(s || '');
  return t.length <= max ? t : t.slice(0, max);
}

function joinTaxonomyNames(arr, nameKey = 'name') {
  if (!arr || !Array.isArray(arr)) return '';
  return arr.map((x) => x && x[nameKey]).filter(Boolean).join(', ') || '';
}

function stripOuterQuotes(text) {
  let t = String(text || '').trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith('“') && t.endsWith('”'))) {
    t = t.slice(1, -1).trim();
  }
  return t;
}

function buildHookPrompt(fields) {
  const {
    title,
    description,
    subject,
    topic,
    subtopic,
    topicsCovered,
    stream,
    examName,
  } = fields;

  return [
    'You are an AI assistant that generates short, engaging summaries for educational video content.',
    '',
    'Your task is to create a compelling 2-line summary (maximum 2 sentences) for a lecture video that motivates students to watch it.',
    '',
    'The summary should:',
    '- Be emotional, engaging, and slightly persuasive (like Netflix descriptions)',
    '- Clearly convey the value of the video',
    '- Answer: "Why should the user watch this video?"',
    '- Be concise (strictly 2 lines, no more)',
    '- Avoid technical jargon overload',
    '- Sound natural and human-like',
    '',
    'Input Data:',
    '- Title: ' + truncate(title, MAX_PROMPT_FIELD),
    '- Description: ' + truncate(description, MAX_PROMPT_FIELD),
    '- Subject: ' + truncate(subject, MAX_PROMPT_FIELD),
    '- Topic: ' + truncate(topic, MAX_PROMPT_FIELD),
    '- Subtopic: ' + truncate(subtopic, MAX_PROMPT_FIELD),
    '- Topics Covered: ' + truncate(topicsCovered, MAX_PROMPT_FIELD),
    '- Stream: ' + truncate(stream, MAX_PROMPT_FIELD),
    '- Exam: ' + truncate(examName, MAX_PROMPT_FIELD),
    '',
    'Output Format:',
    'Return ONLY the summary text (no labels, no extra explanation).',
    '',
    'Example Style:',
    '"Struggling to understand core concepts? This video breaks it down in a way that finally makes it click.',
    'Perfect for mastering the topic and boosting your confidence for exams."',
    '',
    'Now generate the summary.',
  ].join('\n');
}

/**
 * Loads lecture + topic/subtopic names, calls Gemini, saves hook_summary.
 * No-op if GOOGLE_API_KEY missing, lecture missing, or content is not VIDEO.
 */
async function generateAndPersistLectureHookSummary(lectureId) {
  if (!process.env.GOOGLE_API_KEY || !geminiService.genAI) {
    return;
  }

  const id = parseInt(lectureId, 10);
  if (Number.isNaN(id) || id <= 0) return;

  const lecture = await Lecture.findById(id);
  if (!lecture || lecture.content_type !== 'VIDEO') return;

  const [topicRow, subtopicRow] = await Promise.all([
    lecture.topic_id ? Topic.findById(lecture.topic_id) : null,
    lecture.subtopic_id ? Subtopic.findById(lecture.subtopic_id) : null,
  ]);

  const title = (lecture.youtube_title && String(lecture.youtube_title).trim()) || '';
  const description = lecture.description || '';
  const subject = joinTaxonomyNames(lecture.subjects);
  const topic = topicRow?.name || '';
  const subtopic = subtopicRow?.name || '';
  const topicsCovered = lecture.key_topics_to_be_covered || '';
  const stream = joinTaxonomyNames(lecture.streams);
  const examName = joinTaxonomyNames(lecture.exams);

  const prompt = buildHookPrompt({
    title,
    description,
    subject,
    topic,
    subtopic,
    topicsCovered,
    stream,
    examName,
  });

  let text = await geminiService.generatePlainText(prompt);
  text = stripOuterQuotes(text);
  if (!text) return;
  if (text.length > MAX_SUMMARY_LEN) {
    text = text.slice(0, MAX_SUMMARY_LEN).trim();
  }

  await Lecture.update(id, { hook_summary: text });
}

/**
 * Fire-and-forget so HTTP handlers are not blocked on Gemini latency.
 */
function scheduleLectureHookSummary(lectureId) {
  setImmediate(() => {
    generateAndPersistLectureHookSummary(lectureId).catch((err) => {
      console.error('lectureHookSummary:', err.message || err);
    });
  });
}

module.exports = {
  generateAndPersistLectureHookSummary,
  scheduleLectureHookSummary,
};
