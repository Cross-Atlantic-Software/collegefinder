"use client";

import type { Exam } from "@/api/exams";
import { ExamCardHoverField } from "@/components/dashboard/ExamCardHoverField";
import {
  examCardApplicationStartMonth,
  examCardDifficultyLevel,
  examCardDuration,
  examCardMode,
} from "@/lib/examDisplay";

export function ExamCardMetaChips({ exam }: { exam: Exam }) {
  const mode = examCardMode(exam);
  const duration = examCardDuration(exam);
  const applicationStartMonth = examCardApplicationStartMonth(exam);
  const difficultyLevel = examCardDifficultyLevel(exam);

  if (!mode && !duration && !applicationStartMonth && !difficultyLevel) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {mode ? <ExamCardHoverField label="Mode" value={mode} variant="chip" /> : null}
      {duration ? <ExamCardHoverField label="Duration" value={duration} variant="chip" /> : null}
      {applicationStartMonth ? (
        <ExamCardHoverField
          label="Application Start Month"
          value={applicationStartMonth}
          variant="chip"
        />
      ) : null}
      {difficultyLevel ? (
        <ExamCardHoverField label="Difficulty Level" value={difficultyLevel} variant="chip" />
      ) : null}
    </div>
  );
}
