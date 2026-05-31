import type { Program } from '@/api/public/programs';

export const COLLEGE_DIRECTORY_PREVIEW_COUNT = 5;

/** Tab order for the public college directory. */
export const COLLEGE_DIRECTORY_PROGRAM_ORDER = [
  'B.A',
  'B.Com',
  'B.Tech',
  'B.Sc',
  'B.Ed',
] as const;

export function normalizeProgramLabel(name: string): string {
  return name.trim().toLowerCase().replace(/\./g, '').replace(/\s+/g, '');
}

function programMatchScore(programName: string, tabLabel: string): number {
  const name = programName.trim();
  const label = tabLabel.trim();
  if (name.toLowerCase() === label.toLowerCase()) return 1000;
  if (normalizeProgramLabel(name) !== normalizeProgramLabel(label)) return 0;
  const labelHasDot = label.includes('.');
  const nameHasDot = name.includes('.');
  if (labelHasDot && nameHasDot) return 500;
  if (labelHasDot && !nameHasDot) return 100;
  return 200;
}

/** When several DB rows share a normalized key (e.g. "Ba" vs "B.A"), pick the best tab match. */
export function pickProgramForDirectoryTab(
  programs: Program[],
  tabLabel: string
): Program | null {
  const targetNorm = normalizeProgramLabel(tabLabel);
  const candidates = programs.filter((p) => normalizeProgramLabel(p.name) === targetNorm);
  if (!candidates.length) return null;
  return [...candidates].sort((a, b) => {
    const scoreDiff = programMatchScore(b.name, tabLabel) - programMatchScore(a.name, tabLabel);
    if (scoreDiff !== 0) return scoreDiff;
    return a.id - b.id;
  })[0];
}

export type CollegeDirectoryProgram = Program & { displayName: string };

/**
 * Resolve taxonomy programs for directory tabs (fixed order).
 * Matches DB names like "Ba" to tab label "B.A" and prefers the canonical dotted form.
 */
export function resolveCollegeDirectoryPrograms(programs: Program[]): CollegeDirectoryProgram[] {
  return COLLEGE_DIRECTORY_PROGRAM_ORDER.flatMap((label) => {
    const program = pickProgramForDirectoryTab(programs, label);
    if (!program) return [];
    return [{ ...program, displayName: label }];
  });
}

export function splitCollegesForPublicDirectory<T>(colleges: T[]): {
  visible: T[];
  lockedPreview: T | null;
  hasMoreLocked: boolean;
} {
  const visible = colleges.slice(0, COLLEGE_DIRECTORY_PREVIEW_COUNT);
  const lockedPreview = colleges[COLLEGE_DIRECTORY_PREVIEW_COUNT] ?? null;
  return {
    visible,
    lockedPreview,
    hasMoreLocked: colleges.length > COLLEGE_DIRECTORY_PREVIEW_COUNT,
  };
}
