"use client";

import { ExamCardFeatureTickIndicator } from "@/components/dashboard/ExamCardFeatureTickIndicator";

type ExamCardNegativeMarkingIndicatorProps = {
  value: string;
  className?: string;
};

/** "Negative Marking:" + tick; same tooltip wrapper as ExamCardHoverField (hover the tick). */
export function ExamCardNegativeMarkingIndicator({
  value,
  className = "",
}: ExamCardNegativeMarkingIndicatorProps) {
  return (
    <ExamCardFeatureTickIndicator
      label="Negative Marking"
      tooltip={`Negative Marking: ${value}`}
      className={className}
    />
  );
}
