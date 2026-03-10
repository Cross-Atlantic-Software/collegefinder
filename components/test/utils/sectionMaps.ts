'use client';

import type { QuestionEntry, QuestionStatus } from '../interface/types';
import type { MockQuestion } from '@/api/tests';
import type { ExamFormat } from '@/api/tests';

export interface SubmitSummary {
  attempted: number;
  skipped: number;
  unattempted: number;
  total: number;
}

/**
 * Resolve section key to match format.sections (handles casing differences).
 */
function resolveSectionKey(
  sectionName: string | undefined,
  formatSections: ExamFormat['sections']
): string {
  const keys = Object.keys(formatSections);
  if (!sectionName || !keys.length) return keys[0] ?? '';
  if (formatSections[sectionName]) return sectionName;
  const lower = sectionName.toLowerCase();
  const found = keys.find((k) => k.toLowerCase() === lower);
  return found ?? keys[0] ?? '';
}

/**
 * Build section -> question number -> entry map from flat list of mock questions.
 * Section keys are normalized to match format.sections so palette/section navigation works.
 */
export function buildSectionMaps(
  questions: MockQuestion[],
  format: { sections: ExamFormat['sections'] }
): Record<string, Record<number, QuestionEntry>> {
  const counters: Record<string, number> = {};
  const maps: Record<string, Record<number, QuestionEntry>> = {};
  const firstSection = Object.keys(format.sections)[0] ?? '';

  for (const q of questions) {
    const key = resolveSectionKey(q.section_name, format.sections) || firstSection;
    if (!maps[key]) maps[key] = {};
    if (!counters[key]) counters[key] = 0;
    counters[key]++;
    maps[key][counters[key]] = { question: q, status: 'not_visited', savedOption: '' };
  }
  return maps;
}

/**
 * Compute attempted / skipped / unattempted counts from section maps for submit confirmation.
 */
export function computeSubmitSummary(
  sectionMaps: Record<string, Record<number, QuestionEntry>>
): SubmitSummary {
  let attempted = 0;
  let skipped = 0;
  let unattempted = 0;
  for (const map of Object.values(sectionMaps)) {
    for (const entry of Object.values(map)) {
      if (entry.status === 'answered') attempted++;
      else if (entry.status === 'not_answered') skipped++;
      else unattempted++;
    }
  }
  return {
    attempted,
    skipped,
    unattempted,
    total: attempted + skipped + unattempted,
  };
}

/**
 * Get question statuses for the current section map (for palette).
 */
export function getQuestionStatusesFromMap(
  sectionMap: Record<number, QuestionEntry>
): Record<number, QuestionStatus> {
  const statuses: Record<number, QuestionStatus> = {};
  Object.entries(sectionMap).forEach(([numStr, entry]) => {
    statuses[parseInt(numStr, 10)] = entry.status;
  });
  return statuses;
}
