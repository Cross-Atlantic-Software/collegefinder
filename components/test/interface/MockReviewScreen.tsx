'use client';
import { useState, useMemo } from 'react';
import { Button } from '@/components/shared';
import QuestionReviewDisplay, { type QuestionAttemptForReview } from './question/QuestionReviewDisplay';
import TestSidebars from './sidebar/TestSidebars';
import type { ReviewQuestionStatus } from './sidebar/TestSidebars';
import type { ExamFormat } from '@/api/tests';

interface MockReviewScreenProps {
  examName: string;
  questionAttempts: QuestionAttemptForReview[];
  format?: ExamFormat | null;
  onExit: () => void;
  exitLabel?: string;
}

function getReviewStatus(attempt: QuestionAttemptForReview): ReviewQuestionStatus {
  const attempted = attempt.selected_option != null && attempt.selected_option !== '';
  if (!attempted) return 'skipped';
  return attempt.is_correct ? 'correct' : 'wrong';
}

/** Build section blocks from format (section + subsection order) and assign question indices. */
function buildBlocksFromFormat(
  format: ExamFormat,
  totalQuestions: number
): { sectionKey: string; subsectionKey: string; startIndex: number; endIndex: number }[] {
  const blocks: { sectionKey: string; subsectionKey: string; startIndex: number; endIndex: number }[] = [];
  const sections = format.sections || {};
  let index = 0;
  const sectionKeys = Object.keys(sections);
  for (const sectionKey of sectionKeys) {
    const section = sections[sectionKey];
    const subsections = section?.subsections || {};
    const subKeys = Object.keys(subsections).sort((a, b) => (a === 'section_a' ? -1 : a.localeCompare(b)));
    for (const subKey of subKeys) {
      const sub = subsections[subKey];
      const count = sub?.questions ?? 0;
      if (count <= 0) continue;
      const startIndex = index;
      const endIndex = Math.min(index + count - 1, totalQuestions - 1);
      blocks.push({ sectionKey, subsectionKey: subKey, startIndex, endIndex });
      index = endIndex + 1;
      if (index >= totalQuestions) break;
    }
    if (index >= totalQuestions) break;
  }
  return blocks;
}

/** Convert ExamFormat.sections to SectionNavigation SectionDef shape (with subsections). */
function formatToSectionDef(
  format: ExamFormat
): Record<string, { name: string; subsections: Record<string, { questions: number; type?: string }> }> {
  const out: Record<string, { name: string; subsections: Record<string, { questions: number; type?: string }> }> = {};
  const sections = format.sections || {};
  for (const [key, sec] of Object.entries(sections)) {
    const subsections: Record<string, { questions: number; type?: string }> = {};
    for (const [subKey, sub] of Object.entries(sec.subsections || {})) {
      subsections[subKey] = {
        questions: sub?.questions ?? 0,
        type: sub?.type ?? (subKey === 'section_a' ? 'MCQ' : 'Numerical'),
      };
    }
    out[key] = { name: sec.name ?? key, subsections };
  }
  return out;
}

/** Group consecutive question attempts by subject (fallback when no format). */
function buildSectionsFromAttempts(attempts: QuestionAttemptForReview[]): { key: string; name: string; startIndex: number; endIndex: number }[] {
  if (attempts.length === 0) return [];
  const sections: { key: string; name: string; startIndex: number; endIndex: number }[] = [];
  let start = 0;
  let currentSubject = attempts[0].subject ?? 'Section';
  for (let i = 1; i <= attempts.length; i++) {
    const nextSubject = i < attempts.length ? (attempts[i].subject ?? 'Section') : null;
    const isLast = i === attempts.length;
    if (nextSubject !== currentSubject || isLast) {
      sections.push({
        key: currentSubject,
        name: currentSubject,
        startIndex: start,
        endIndex: i - 1,
      });
      if (!isLast && nextSubject !== null) {
        start = i;
        currentSubject = nextSubject;
      }
    }
  }
  return sections;
}

export default function MockReviewScreen({
  examName,
  questionAttempts,
  format: examFormat,
  onExit,
  exitLabel = 'Back',
}: MockReviewScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const totalQuestions = questionAttempts.length;
  const currentAttempt = questionAttempts[currentIndex] ?? null;

  const useFormat = examFormat?.sections && Object.keys(examFormat.sections).length > 0;

  const blocks = useMemo(() => {
    if (useFormat && examFormat) return buildBlocksFromFormat(examFormat, totalQuestions);
    return [];
  }, [useFormat, examFormat, totalQuestions]);

  const indexToSectionSubsection = useMemo(() => {
    const map: { sectionKey: string; subsectionKey: string }[] = [];
    for (const b of blocks) {
      for (let i = b.startIndex; i <= b.endIndex; i++) {
        map[i] = { sectionKey: b.sectionKey, subsectionKey: b.subsectionKey };
      }
    }
    return map;
  }, [blocks]);

  const sectionsFromAttempts = useMemo(() => buildSectionsFromAttempts(questionAttempts), [questionAttempts]);

  const currentSectionKey = useFormat
    ? indexToSectionSubsection[currentIndex]?.sectionKey ?? Object.keys(examFormat?.sections ?? {})[0]
    : sectionsFromAttempts.find((s) => currentIndex >= s.startIndex && currentIndex <= s.endIndex)?.key ?? sectionsFromAttempts[0]?.key;
  const currentSubsectionKey = useFormat ? (indexToSectionSubsection[currentIndex]?.subsectionKey ?? 'section_a') : 'section_a';

  const sectionDefs = useMemo(() => {
    if (useFormat && examFormat) return formatToSectionDef(examFormat);
    const defs: Record<string, { name: string; subsections: Record<string, { questions: number; type?: string }> }> = {};
    for (const s of sectionsFromAttempts) {
      defs[s.key] = {
        name: s.name,
        subsections: { section_a: { questions: s.endIndex - s.startIndex + 1, type: 'All' } },
      };
    }
    return defs;
  }, [useFormat, examFormat, sectionsFromAttempts]);

  const sectionProgress = useMemo(() => {
    const prog: Record<string, { name: string; attempted: number; total: number }> = {};
    if (useFormat && blocks.length > 0) {
      const bySection = new Map<string, { start: number; end: number }>();
      for (const b of blocks) {
        const existing = bySection.get(b.sectionKey);
        if (!existing) {
          bySection.set(b.sectionKey, { start: b.startIndex, end: b.endIndex });
        } else {
          existing.end = b.endIndex;
        }
      }
      const sec = examFormat?.sections ?? {};
      for (const [key, range] of bySection) {
        let attempted = 0;
        for (let i = range.start; i <= range.end; i++) {
          const qa = questionAttempts[i];
          if (qa && (qa.selected_option != null && qa.selected_option !== '')) attempted++;
        }
        prog[key] = {
          name: sec[key]?.name ?? key,
          attempted,
          total: range.end - range.start + 1,
        };
      }
    } else {
      for (const s of sectionsFromAttempts) {
        let attempted = 0;
        for (let i = s.startIndex; i <= s.endIndex; i++) {
          const qa = questionAttempts[i];
          if (qa && (qa.selected_option != null && qa.selected_option !== '')) attempted++;
        }
        prog[s.key] = { name: s.name, attempted, total: s.endIndex - s.startIndex + 1 };
      }
    }
    return prog;
  }, [useFormat, examFormat, blocks, sectionsFromAttempts, questionAttempts]);

  const currentSectionRange = useMemo(() => {
    if (useFormat && blocks.length > 0) {
      const sectionBlocks = blocks.filter((b) => b.sectionKey === currentSectionKey);
      if (sectionBlocks.length === 0) return null;
      const start = sectionBlocks[0].startIndex;
      const end = sectionBlocks[sectionBlocks.length - 1].endIndex;
      return { startIndex: start, endIndex: end };
    }
    const sec = sectionsFromAttempts.find((s) => s.key === currentSectionKey);
    return sec ? { startIndex: sec.startIndex, endIndex: sec.endIndex } : null;
  }, [useFormat, blocks, currentSectionKey, sectionsFromAttempts]);

  const questionStatuses = useMemo(() => {
    const map: Record<number, ReviewQuestionStatus> = {};
    questionAttempts.forEach((qa, idx) => {
      map[idx + 1] = getReviewStatus(qa);
    });
    return map;
  }, [questionAttempts]);

  const questionNumber = currentIndex + 1;
  const totalInSection = currentSectionRange ? currentSectionRange.endIndex - currentSectionRange.startIndex + 1 : 0;
  const questionNumberInSection = currentSectionRange ? currentIndex - currentSectionRange.startIndex + 1 : 1;
  const sectionStatuses: Record<number, ReviewQuestionStatus> = useMemo(() => {
    const out: Record<number, ReviewQuestionStatus> = {};
    if (!currentSectionRange) return out;
    for (let i = 0; i < totalInSection; i++) {
      const globalIdx = currentSectionRange.startIndex + i;
      out[i + 1] = questionStatuses[globalIdx + 1] ?? 'skipped';
    }
    return out;
  }, [currentSectionRange, totalInSection, questionStatuses]);

  const goToSection = (sectionKey: string) => {
    if (useFormat && blocks.length > 0) {
      const first = blocks.find((b) => b.sectionKey === sectionKey);
      if (first) setCurrentIndex(first.startIndex);
      return;
    }
    const sec = sectionsFromAttempts.find((s) => s.key === sectionKey);
    if (sec) setCurrentIndex(sec.startIndex);
  };

  const goToSubsection = (subsectionKey: 'section_a' | 'section_b') => {
    const block = blocks.find((b) => b.sectionKey === currentSectionKey && b.subsectionKey === subsectionKey);
    if (block) {
      setCurrentIndex(block.startIndex);
    } else if (currentSectionRange) {
      setCurrentIndex(currentSectionRange.startIndex);
    }
  };

  const handleSelectQuestionInSection = (localOneBased: number) => {
    if (!currentSectionRange) return;
    const globalIndex = currentSectionRange.startIndex + localOneBased - 1;
    setCurrentIndex(Math.max(0, Math.min(globalIndex, totalQuestions - 1)));
  };

  const handlePrev = () => setCurrentIndex((i) => Math.max(0, i - 1));
  const handleNext = () => setCurrentIndex((i) => Math.min(totalQuestions - 1, i + 1));

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900 flex flex-col">
      <div className="bg-slate-800 border-b border-slate-700 p-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-white">Review - {examName}</h1>
            {totalQuestions > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-700/80 border border-slate-600">
                <span className="text-slate-400 text-sm">Question</span>
                <span className="text-white font-semibold tabular-nums">{questionNumber}</span>
                <span className="text-slate-500 text-sm">of</span>
                <span className="text-slate-300 font-medium tabular-nums">{totalQuestions}</span>
              </div>
            )}
          </div>
          <Button onClick={onExit} size="sm" variant="themeButtonOutline">
            {exitLabel}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <TestSidebars
          mode="review"
          sections={sectionDefs}
          currentSection={currentSectionKey}
          sectionProgress={sectionProgress}
          currentSubsection={currentSubsectionKey as 'section_a' | 'section_b'}
          onSectionChange={goToSection}
          onSubsectionChange={goToSubsection}
          totalQuestionsInSection={totalInSection || 1}
          currentQuestionNumberInSection={questionNumberInSection}
          questionStatuses={sectionStatuses}
          onQuestionSelect={handleSelectQuestionInSection}
        >
          <div className="flex-1 flex flex-col min-w-0 overflow-auto">
            {currentAttempt ? (
              <QuestionReviewDisplay
                attempt={currentAttempt}
                questionNumber={questionNumber}
                totalQuestions={totalQuestions}
                onPrev={handlePrev}
                onNext={handleNext}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500">No questions to review.</div>
            )}
          </div>
        </TestSidebars>
      </div>
    </div>
  );
}
