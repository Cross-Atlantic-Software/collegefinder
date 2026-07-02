// Expands the hand-written templates (src/sliderTemplates.js, src/scenarioTemplates.js)
// against the context/setting lists (src/contexts.js) into the full scored question pool:
//   125 slider templates  x 40 contexts = 5000 slider questions  (200/theme)
//   50  scenario templates x 30 settings = 1500 scenario questions (300/domain)
//   = 6500 total, same 10:3 ratio as the original 65-question set.
// Every generated item carries the same {theme}/{options[].theme} shape the engine
// already scores against, so engine.js needs no changes to consume this pool.

import { SLIDER_TEMPLATES } from "./sliderTemplates.js";
import { SCENARIO_TEMPLATES } from "./scenarioTemplates.js";
import { SLIDER_CONTEXTS, SCENARIO_SETTINGS } from "./contexts.js";

function generateSliderPool() {
  const pool = [];
  SLIDER_TEMPLATES.forEach(({ theme, templates }) => {
    templates.forEach((tpl, tIdx) => {
      SLIDER_CONTEXTS.forEach((ctx, cIdx) => {
        pool.push({
          id: `sl_${theme}_${tIdx}_${cIdx}`,
          theme,
          text: tpl.replace("{{context}}", ctx),
        });
      });
    });
  });
  return pool;
}

function generateScenarioPool() {
  const pool = [];
  SCENARIO_TEMPLATES.forEach((tpl, tIdx) => {
    SCENARIO_SETTINGS.forEach((setting, sIdx) => {
      pool.push({
        id: `sc_${tpl.domain}_${tIdx}_${sIdx}`,
        domain: tpl.domain,
        prompt: tpl.prompt.replace("{{setting}}", setting),
        options: tpl.options.map((o) => ({ ...o })),
      });
    });
  });
  return pool;
}

const SLIDER_QUESTION_POOL = generateSliderPool();
const SCENARIO_QUESTION_POOL = generateScenarioPool();

export { generateSliderPool, generateScenarioPool, SLIDER_QUESTION_POOL, SCENARIO_QUESTION_POOL };
