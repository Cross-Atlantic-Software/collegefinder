/**
 * Prompt building for question generation: placeholders, format instructions, difficulty, diagrams.
 */

function substitutePromptPlaceholders(template, vars) {
  if (!template || typeof template !== 'string') return template;
  let out = template;
  const map = {
    '{{exam_name}}': vars.exam_name ?? '',
    '{{subject}}': vars.subject ?? '',
    '{{section_name}}': vars.section_name ?? '',
    '{{section_type}}': vars.section_type ?? '',
    '{{question_type}}': vars.question_type ?? '',
    '{{question_number}}': vars.question_number ?? '',
    '{{total_in_section}}': vars.total_in_section ?? '',
    /* Legacy placeholders (no longer set by worker; empty for backward compatibility) */
    '{{difficulty}}': vars.difficulty ?? '',
    '{{topic}}': vars.topic ?? '',
  };
  for (const [key, value] of Object.entries(map)) {
    out = out.split(key).join(value);
  }
  return out;
}

function getDifficultyDescription(difficulty) {
  switch ((difficulty || '').toLowerCase()) {
    case 'easy':
      return 'EASY LEVEL: Focus on basic concepts, direct application of formulas, and fundamental understanding. Should be solvable by most students with basic preparation.';
    case 'medium':
      return 'MEDIUM LEVEL: Requires good conceptual understanding, may involve 2-3 step solutions, and application of multiple concepts. Should challenge students but be solvable with proper preparation.';
    case 'hard':
      return 'HARD LEVEL: Requires deep conceptual understanding, multi-step problem solving, integration of multiple concepts, and analytical thinking. Should challenge even well-prepared students.';
    default:
      return 'Focus on appropriate level concepts and problem-solving skills.';
  }
}

function getDiagramInstructions(subject) {
  const subjectLower = (subject || '').toLowerCase();
  if (!subjectLower.includes('physics') && !subjectLower.includes('chemistry')) return '';
  return `

DIAGRAM-BASED QUESTIONS (for ${subject}):
- Optionally generate a question that refers to a diagram/figure (e.g. circuits, free body diagrams, ray diagrams).
- When the question is based on a diagram, set "diagram_type" in your JSON to exactly one of: circuit, free_body, ray_diagram, kinematics_graph, field_lines, optics_setup, pulley_system, thermodynamics.
- The question_text should reference the figure (e.g. "Consider the circuit shown...", "Refer to the free body diagram...", "In the ray diagram shown...").
- If this question does NOT use a diagram, omit "diagram_type" entirely.`;
}

function getFormatInstructionsForAnyType() {
  return `CRITICAL: Respond with ONLY valid JSON (no markdown, no extra text, no backticks).

You MUST include "question_type" in your JSON. It must be exactly one of: mcq_single, mcq_multiple, paragraph, assertion_reason, match_following, true_false, fill_blank.

Then output the correct structure for that type:

- mcq_single: question_text, options (4 items with key A-D), correct_option (one letter), solution_text, concept_tags, unit, topic, sub_topic.
- mcq_multiple: same but correct_option is comma-separated e.g. "A,C". Question must say "select all correct".
- paragraph: paragraph_context (150-250 words), question_text, options (4), correct_option, solution_text, concept_tags, unit, topic, sub_topic.
- assertion_reason: assertion, reason, question_text, options (standard 4 assertion-reason choices), correct_option, solution_text, concept_tags, unit, topic, sub_topic.
- match_following: question_text, match_pairs (array of {left, right, correct_match}, 4 pairs), options (4 matching combinations), correct_option, solution_text, concept_tags, unit, topic, sub_topic.
- true_false: question_text (declarative statement), options (A: True, B: False), correct_option (A or B), solution_text, concept_tags, unit, topic, sub_topic.
- fill_blank: question_text (with _______), options (4), correct_option, solution_text, concept_tags, unit, topic, sub_topic.

Common rules: No unescaped quotes in strings; solution_text under 400 words; all required fields present for your chosen type.`;
}

function getFormatInstructions(question_type, section_type) {
  const isNumerical = question_type === 'numerical' || section_type === 'Numerical';

  if (isNumerical) {
    return `CRITICAL: Respond with ONLY valid JSON (no markdown, no extra text, no backticks). Use this EXACT format for NUMERICAL questions:
{
  "question_text": "Clear, concise question text here",
  "options": [],
  "correct_option": "123",
  "solution_text": "Detailed step-by-step solution",
  "concept_tags": ["concept1", "concept2"],
  "unit": "Unit name",
  "topic": "Generated topic",
  "sub_topic": "Sub-topic name"
}

NUMERICAL QUESTION REQUIREMENTS:
- Answer must be a single integer between 0 and 9999
- No decimal points or fractions in the final answer
- Options array should be empty []
- correct_option should contain only the numerical answer as a string
- Question should be solvable to get an exact integer answer`;
  }

  const typeInstructions = {
    mcq_single: `MCQ WITH SINGLE CORRECT ANSWER:
{
  "question_text": "Clear question text",
  "options": [
    {"key": "A", "text": "Option 1"},
    {"key": "B", "text": "Option 2"},
    {"key": "C", "text": "Option 3"},
    {"key": "D", "text": "Option 4"}
  ],
  "correct_option": "A",
  "solution_text": "Detailed explanation",
  "concept_tags": ["concept1"],
  "unit": "Unit name",
  "topic": "Topic",
  "sub_topic": "Sub-topic"
}

REQUIREMENTS:
- Exactly 4 options with keys A, B, C, D
- Only ONE correct answer
- All options must be plausible
- correct_option must be one of: A, B, C, D`,

    mcq_multiple: `MCQ WITH MULTIPLE CORRECT ANSWERS:
{
  "question_text": "Clear question text (mention: select ALL correct answers)",
  "options": [
    {"key": "A", "text": "Option 1"},
    {"key": "B", "text": "Option 2"},
    {"key": "C", "text": "Option 3"},
    {"key": "D", "text": "Option 4"}
  ],
  "correct_option": "A,C",
  "solution_text": "Explain why A and C are correct, B and D are wrong",
  "concept_tags": ["concept1"],
  "unit": "Unit", "topic": "Topic", "sub_topic": "Sub-topic"
}

REQUIREMENTS:
- Exactly 4 options with keys A, B, C, D
- 2-3 correct answers (not all, not one)
- correct_option format: comma-separated keys like "A,C" or "B,C,D"
- Question text MUST mention to "select all correct answers"`,

    paragraph: `PARAGRAPH/COMPREHENSION TYPE:
{
  "paragraph_context": "A 150-250 word passage or scenario describing a scientific concept, experiment, or real-world application",
  "question_text": "Question based on the above passage",
  "options": [{"key": "A", "text": "..."}, {"key": "B", "text": "..."}, {"key": "C", "text": "..."}, {"key": "D", "text": "..."}],
  "correct_option": "B",
  "solution_text": "Reference passage and explain",
  "concept_tags": ["concept1"],
  "unit": "Unit", "topic": "Topic", "sub_topic": "Sub-topic"
}

REQUIREMENTS:
- paragraph_context is MANDATORY (150-250 words, scientific/technical passage)
- Question tests comprehension and application from the passage
- All 4 options must be plausible based on passage`,

    assertion_reason: `ASSERTION-REASON TYPE:
{
  "assertion": "Statement A: Clear factual claim (e.g., 'Water boils at 100°C at sea level')",
  "reason": "Statement R: Explanation or related fact (e.g., 'At sea level, atmospheric pressure is 1 atm')",
  "question_text": "Choose the correct option",
  "options": [
    {"key": "A", "text": "Both A and R are true, and R is the correct explanation of A"},
    {"key": "B", "text": "Both A and R are true, but R is NOT the correct explanation of A"},
    {"key": "C", "text": "A is true, but R is false"},
    {"key": "D", "text": "A is false, but R is true"}
  ],
  "correct_option": "A",
  "solution_text": "Explain truth of A and R, and their relationship",
  "concept_tags": ["concept1"],
  "unit": "Unit", "topic": "Topic", "sub_topic": "Sub-topic"
}

REQUIREMENTS:
- assertion and reason are MANDATORY fields
- Options are ALWAYS the standard 4 assertion-reason choices shown above
- Focus on conceptual understanding and cause-effect relationships`,

    match_following: `MATCH THE FOLLOWING TYPE:
{
  "question_text": "Match items in Column A with Column B",
  "match_pairs": [
    {"left": "A. Item 1", "right": "P. Match 1", "correct_match": "P"},
    {"left": "B. Item 2", "right": "Q. Match 2", "correct_match": "Q"},
    {"left": "C. Item 3", "right": "R. Match 3", "correct_match": "R"},
    {"left": "D. Item 4", "right": "S. Match 4", "correct_match": "S"}
  ],
  "options": [
    {"key": "A", "text": "A-P, B-Q, C-R, D-S"},
    {"key": "B", "text": "A-Q, B-P, C-S, D-R"},
    {"key": "C", "text": "A-R, B-S, C-P, D-Q"},
    {"key": "D", "text": "A-S, B-R, C-Q, D-P"}
  ],
  "correct_option": "A",
  "solution_text": "Explain each correct match",
  "concept_tags": ["concept1"],
  "unit": "Unit", "topic": "Topic", "sub_topic": "Sub-topic"
}

REQUIREMENTS:
- match_pairs is MANDATORY (4 pairs with left, right, correct_match)
- Options show 4 different matching combinations
- Only ONE option has all correct matches`,

    true_false: `TRUE/FALSE TYPE:
{
  "question_text": "Statement: [Clear declarative statement]. Is this statement TRUE or FALSE?",
  "options": [
    {"key": "A", "text": "True"},
    {"key": "B", "text": "False"}
  ],
  "correct_option": "A",
  "solution_text": "Explain why the statement is true/false with scientific reasoning",
  "concept_tags": ["concept1"],
  "unit": "Unit", "topic": "Topic", "sub_topic": "Sub-topic"
}

REQUIREMENTS:
- Question text contains a clear declarative statement
- ONLY 2 options: A (True), B (False)
- Statement should test conceptual understanding, not memorization`,

    fill_blank: `FILL IN THE BLANK TYPE:
{
  "question_text": "Complete the statement: The process of _______ involves the conversion of light energy to chemical energy.",
  "options": [
    {"key": "A", "text": "Photosynthesis"},
    {"key": "B", "text": "Respiration"},
    {"key": "C", "text": "Fermentation"},
    {"key": "D", "text": "Oxidation"}
  ],
  "correct_option": "A",
  "solution_text": "Explain the correct term and why others don't fit",
  "concept_tags": ["concept1"],
  "unit": "Unit", "topic": "Topic", "sub_topic": "Sub-topic"
}

REQUIREMENTS:
- Question has one or more blanks indicated by _______
- 4 options that could plausibly fill the blank(s)
- Only ONE option completes the statement correctly
- Test vocabulary and conceptual connections`
  };

  const instruction = typeInstructions[question_type] || typeInstructions.mcq_single;

  return `CRITICAL: Respond with ONLY valid JSON (no markdown, no extra text, no backticks). Use this EXACT format:

${instruction}

QUALITY REQUIREMENTS (ALL TYPES):
- Do not use unescaped double quotes (") inside any JSON string; use single quotes or \\" for quotes in text
- In JSON strings use either plain text (e.g. Omega, ohms) or double backslashes for LaTeX (e.g. \\\\Omega not \\Omega)
- Single backslash before letters breaks JSON
- Keep solution_text under 400 words for valid JSON
- All fields must be properly formatted JSON`;
}

/**
 * Build the prompt for question generation.
 * When options.generation_prompt (exam-specific) is set, use it with placeholder substitution; else use generic prompt.
 */
function buildQuestionPrompt(exam_name, subject, question_type, section_name, section_type, options = {}) {
  const { force_diagram, generation_prompt: customPrompt, question_number, total_in_section, difficulty } = options;
  const sectionClause = section_name ? ` for the ${section_name} section` : '';
  const sectionTypeClause = section_type ? ` (${section_type} type)` : '';
  const difficultyForGeneric = difficulty || 'medium';
  const difficultyDescription = getDifficultyDescription(difficultyForGeneric);

  if (customPrompt && typeof customPrompt === 'string' && customPrompt.trim()) {
    const substituted = substitutePromptPlaceholders(customPrompt.trim(), {
      exam_name,
      subject,
      section_name: section_name || '',
      section_type: section_type || '',
      question_type: question_type === 'any' ? 'any (you choose)' : question_type,
      question_number: question_number ?? '',
      total_in_section: total_in_section ?? '',
    });
    const isAny = question_type === 'any';
    const formatBlock = isAny ? getFormatInstructionsForAnyType() : getFormatInstructions(question_type, section_type);
    return `${substituted}

${formatBlock}

Remember: Respond with ONLY the JSON object, no additional text or formatting.`;
  }

  if (question_type === 'any') {
    return `You are an expert question creator for competitive entrance and board exams. Generate a ${difficultyForGeneric} level question for the exam "${exam_name}" in the subject ${subject}${sectionClause}${sectionTypeClause}.

CHOOSE THE QUESTION TYPE: Select the most appropriate type for this exam and subject from: mcq_single, mcq_multiple, paragraph, assertion_reason, match_following, true_false, fill_blank. Use the pattern that best fits the exam (single-correct MCQ, multiple-correct, comprehension, assertion-reason, match, true/false, or fill-in-blank). You MUST include "question_type" in your JSON with exactly one of these values.

${difficultyDescription}

COVERAGE: Ensure the question tests core syllabus for the given subject. Vary question types naturally across the paper. Follow standard exam-style wording and format for the chosen type.

${getFormatInstructionsForAnyType()}

QUALITY REQUIREMENTS:
- Factually accurate and appropriate for the exam level
- Solution must explain clearly; keep solution_text under 400 words for valid JSON
- Do not use unescaped double quotes (") inside JSON strings; use \\" or single quotes. Use double backslashes for LaTeX (e.g. \\\\Omega).
- Test understanding, not just memorization
${getDiagramInstructions(subject)}

Remember: Respond with ONLY the JSON object, no additional text or formatting.`;
  }

  const typeDescriptions = {
    mcq_single: 'MCQ (single correct answer)',
    mcq_multiple: 'MCQ (multiple correct answers)',
    numerical: 'NUMERICAL (integer answer)',
    paragraph: 'PARAGRAPH/COMPREHENSION',
    assertion_reason: 'ASSERTION-REASON',
    match_following: 'MATCH THE FOLLOWING',
    true_false: 'TRUE/FALSE',
    fill_blank: 'FILL IN THE BLANK'
  };
  const questionTypeDescription = typeDescriptions[question_type] || question_type.toUpperCase();
  const diagramRequirement = force_diagram
    ? `
MANDATORY DIAGRAM: This question MUST be based on a diagram/figure. Set "diagram_type" in your JSON to exactly: "circuit". Write a question about an electrical circuit (e.g. resistors, battery, current). The question_text must refer to "the circuit shown in the figure" or "consider the circuit diagram".`
    : '';

  return `You are an expert question creator for competitive entrance and board exams. Generate a ${difficultyForGeneric} level ${questionTypeDescription} question for the exam "${exam_name}" in the subject ${subject}${sectionClause}${sectionTypeClause}.

${difficultyDescription}
${diagramRequirement}

${getFormatInstructions(question_type, section_type)}

QUALITY REQUIREMENTS:
- Question must be factually accurate and appropriate for ${exam_name} level
- All options must be plausible but only one correct (unless multiple-correct type)
- Solution must explain the concept clearly; keep solution_text under 400 words so the response stays valid JSON
- Do not use unescaped double quotes (") inside any JSON string; use single quotes or \\" for quotes in text. In JSON strings use either plain text (e.g. Omega, ohms) or double backslashes for LaTeX (e.g. \\\\Omega not \\Omega). Single backslash before letters breaks JSON.
- Use proper scientific/mathematical notation if needed
- Question should test understanding, not just memorization
- Ensure the question is neither too easy nor impossibly hard for ${difficultyForGeneric} level

CONTENT GUIDELINES:
- Focus on core concepts relevant to ${exam_name}
- Use clear, unambiguous language
- Include relevant formulas, constants, or data if needed
- Make sure all numerical values are realistic and appropriate
- Avoid controversial topics or outdated information
${getDiagramInstructions(subject)}

Remember: Respond with ONLY the JSON object, no additional text or formatting.`;
}

module.exports = {
  substitutePromptPlaceholders,
  getDifficultyDescription,
  getDiagramInstructions,
  getFormatInstructionsForAnyType,
  getFormatInstructions,
  buildQuestionPrompt,
};
