'use client';

import type { QuestionEntry, QuestionStatus } from '../interface/types';
import type { MockQuestion } from '@/api/tests';
import type { ExamFormat } from '@/api/tests';

export interface SubmitSummary {
  attempted: number;
  skipped: number;
  unattempted: number;
  total: number;
  /** When format has compulsory structure (e.g. JEE 75): total compulsory questions */
  totalCompulsory?: number;
  /** Attempted count that count toward compulsory (MCQ + up to required numerical per section) */
  attemptedCompulsory?: number;
  /** totalCompulsory - attemptedCompulsory */
  unattemptedCompulsory?: number;
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

/** Get 1-based question number range and required count for numerical subsection in a section. */
function getNumericalRangeAndRequired(
  format: ExamFormat,
  sectionKey: string
): { start: number; end: number; required: number } | null {
  const section = format.sections?.[sectionKey];
  const subsections = section?.subsections;
  if (!subsections || typeof subsections !== 'object') return null;
  // Order: non-numerical (Section A / MCQ) first, then numerical (Section B)
  const subKeys = Object.keys(subsections).sort((a, b) => {
    const aNum = (subsections[a]?.type ?? '').toLowerCase() === 'numerical' ? 1 : 0;
    const bNum = (subsections[b]?.type ?? '').toLowerCase() === 'numerical' ? 1 : 0;
    return aNum - bNum;
  });
  let start = 1;
  for (const k of subKeys) {
    const sub = subsections[k];
    const qCount = sub?.questions ?? 0;
    const isNumerical = (sub?.type ?? '').toLowerCase() === 'numerical';
    if (isNumerical && qCount > 0) {
      const required = sub?.required ?? 5;
      return { start, end: start + qCount - 1, required };
    }
    start += qCount;
  }
  return null;
}

/**
 * Count how many numerical questions are answered in a section (for 5-per-subject cap).
 */
export function getNumericalAttemptedInSection(
  sectionMaps: Record<string, Record<number, QuestionEntry>>,
  sectionKey: string,
  format: ExamFormat
): number {
  const range = getNumericalRangeAndRequired(format, sectionKey);
  if (!range) return 0;
  const map = sectionMaps[sectionKey];
  if (!map) return 0;
  let count = 0;
  for (let n = range.start; n <= range.end; n++) {
    const entry = map[n];
    if (entry?.status === 'answered') count++;
  }
  return count;
}

/**
 * True if the current question (by section + question number) is in the numerical range for that section.
 */
export function isQuestionInNumericalSubsection(
  sectionKey: string,
  questionNumber: number,
  format: ExamFormat
): boolean {
  const range = getNumericalRangeAndRequired(format, sectionKey);
  if (!range) return false;
  return questionNumber >= range.start && questionNumber <= range.end;
}

/** Get the max allowed attempted numerical count for a section (e.g. 5 for JEE). */
export function getNumericalRequiredForSection(format: ExamFormat, sectionKey: string): number {
  const range = getNumericalRangeAndRequired(format, sectionKey);
  return range?.required ?? 5;
}

/**
 * Compute attempted / skipped / unattempted counts from section maps for submit confirmation.
 * When format is provided and has subsections with Numerical + required, also computes
 * totalCompulsory, attemptedCompulsory, unattemptedCompulsory (e.g. 75 for JEE Main).
 */
export function computeSubmitSummary(
  sectionMaps: Record<string, Record<number, QuestionEntry>>,
  format?: ExamFormat
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
  const total = attempted + skipped + unattempted;
  const base: SubmitSummary = { attempted, skipped, unattempted, total };

  if (!format?.sections || typeof format.sections !== 'object') return base;

  let totalCompulsory = 0;
  let attemptedCompulsory = 0;
  const sectionKeys = Object.keys(format.sections);
  for (const sk of sectionKeys) {
    const section = format.sections[sk];
    const subsections = section?.subsections;
    if (!subsections || typeof subsections !== 'object') continue;
    const subKeysOrdered = Object.keys(subsections).sort((a, b) => {
      const aNum = (subsections[a]?.type ?? '').toLowerCase() === 'numerical' ? 1 : 0;
      const bNum = (subsections[b]?.type ?? '').toLowerCase() === 'numerical' ? 1 : 0;
      return aNum - bNum;
    });
    let qStart = 1;
    const map = sectionMaps[sk] || {};
    for (const subKey of subKeysOrdered) {
      const sub = subsections[subKey];
      const qCount = sub?.questions ?? 0;
      const isNumerical = (sub?.type ?? '').toLowerCase() === 'numerical';
      const required = sub?.required ?? (isNumerical ? 5 : qCount);
      const compulsoryForSub = isNumerical ? Math.min(required, qCount) : qCount;
      totalCompulsory += compulsoryForSub;
      let answeredInSub = 0;
      for (let n = qStart; n < qStart + qCount; n++) {
        const entry = map[n];
        if (entry?.status === 'answered') answeredInSub++;
      }
      attemptedCompulsory += isNumerical ? Math.min(answeredInSub, required) : answeredInSub;
      qStart += qCount;
    }
  }
  return {
    ...base,
    totalCompulsory,
    attemptedCompulsory,
    unattemptedCompulsory: totalCompulsory - attemptedCompulsory,
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
