import { THEMES, DOMAINS, STREAMS } from "./themes.js";
import { EXAMS } from "./exams.js";
import { SLIDER_QUESTION_POOL, SCENARIO_QUESTION_POOL } from "./generator.js";

const SLIDER_WEIGHT = 1; // raw slider value (1-5) added straight to the theme
const SCENARIO_WEIGHT = 4; // a chosen scenario option counts for more than one slider tick

function sampleN(arr, n) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(n, copy.length));
}

// Draws a fresh, randomised assessment from the 6500-item generated pool
// (src/generator.js) each time it's called — every student effectively gets a
// different paper, while still scoring identically across the same 25 themes.
function buildAssessment({ slidersPerTheme = 2, scenariosPerDomain = 3 } = {}) {
  const sliderPool = SLIDER_QUESTION_POOL;
  const scenarioPool = SCENARIO_QUESTION_POOL;

  const chosenSliders = THEMES.flatMap((t) =>
    sampleN(sliderPool.filter((q) => q.theme === t.id), slidersPerTheme)
  );
  const chosenScenarios = DOMAINS.flatMap((d) =>
    sampleN(scenarioPool.filter((q) => q.domain === d.id), scenariosPerDomain)
  );

  const all = [
    ...chosenSliders.map((q) => ({ ...q, type: "slider" })),
    ...chosenScenarios.map((q) => ({ ...q, type: "scenario" })),
  ];
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all;
}

// questions: the exact list returned by buildAssessment() for this session —
// scoring is always relative to what was actually asked, not the whole pool.
// answers: { [questionId]: sliderValue (1-5) | optionIndex (for scenario) }
function scoreAnswers(answers, questions) {
  const raw = {};
  const maxPossible = {};
  THEMES.forEach((t) => {
    raw[t.id] = 0;
    maxPossible[t.id] = 0;
  });

  questions.forEach((q) => {
    if (q.type === "slider") {
      maxPossible[q.theme] += 5 * SLIDER_WEIGHT;
      const v = answers[q.id];
      if (typeof v === "number") raw[q.theme] += v * SLIDER_WEIGHT;
    } else {
      q.options.forEach((opt) => {
        maxPossible[opt.theme] += SCENARIO_WEIGHT;
      });
      const chosenIdx = answers[q.id];
      if (typeof chosenIdx === "number" && q.options[chosenIdx]) {
        raw[q.options[chosenIdx].theme] += SCENARIO_WEIGHT;
      }
    }
  });

  const scores = {};
  THEMES.forEach((t) => {
    const pct = maxPossible[t.id] > 0 ? (raw[t.id] / maxPossible[t.id]) * 100 : 0;
    scores[t.id] = Math.round(pct);
  });
  return scores;
}

function topThemes(scores, n = 5) {
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([id, score]) => ({ ...THEMES.find((t) => t.id === id), score }));
}

// For class 10 students who haven't picked a stream yet: recommend one based on
// which stream is most associated with their top themes.
function recommendStream(scores) {
  const top = topThemes(scores, 8); // wider net for a stable recommendation
  const tally = {};
  STREAMS.forEach((s) => (tally[s] = 0));
  top.forEach(({ id, score }) => {
    const theme = THEMES.find((t) => t.id === id);
    theme.streams.forEach((s, idx) => {
      // first-listed stream for a theme counts most
      tally[s] += score * (1 - idx * 0.25);
    });
  });
  return Object.entries(tally)
    .sort((a, b) => b[1] - a[1])
    .map(([stream, weight]) => ({ stream, weight: Math.round(weight) }));
}

// Rank exams by: must match student's stream (declared or recommended), then by
// how many of the exam's themes overlap with the student's top themes.
function suggestExams(scores, stream, n = 20) {
  const top = topThemes(scores, 10);
  const topIds = new Set(top.map((t) => t.id));
  const topRank = new Map(top.map((t, i) => [t.id, top.length - i])); // higher rank = more weight

  const eligible = EXAMS.filter((e) => e.streams.includes(stream));
  const pool = eligible.length >= n ? eligible : EXAMS; // fall back to all exams if too few match the stream

  const ranked = pool
    .map((exam) => {
      let fit = 0;
      exam.themes.forEach((themeId) => {
        if (topIds.has(themeId)) fit += topRank.get(themeId);
      });
      const streamBonus = exam.streams.includes(stream) ? 5 : 0;
      return { ...exam, fit: fit + streamBonus };
    })
    .sort((a, b) => b.fit - a.fit);

  return ranked.slice(0, n);
}

function buildReport({ name, grade, declaredStream, answers, questions }) {
  const scores = scoreAnswers(answers, questions);
  const top5 = topThemes(scores, 5);
  const byDomain = DOMAINS.map((d) => ({
    ...d,
    avgScore: Math.round(
      THEMES.filter((t) => t.domain === d.id).reduce((sum, t) => sum + scores[t.id], 0) /
        THEMES.filter((t) => t.domain === d.id).length
    ),
  }));

  const streamInfo = declaredStream
    ? { declared: true, stream: declaredStream, recommendations: null }
    : { declared: false, stream: recommendStream(scores)[0].stream, recommendations: recommendStream(scores) };

  const exams = suggestExams(scores, streamInfo.stream, 20);

  return {
    name,
    grade,
    scores,
    top5,
    byDomain,
    stream: streamInfo,
    exams,
  };
}

export { buildAssessment, scoreAnswers, topThemes, recommendStream, suggestExams, buildReport };
