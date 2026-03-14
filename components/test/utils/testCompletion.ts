'use client';

import type { TestResultsData } from '../interface/types';

/** Accepts API response from completeTest() - structure may vary. */
type CompleteResponse = {
  success?: boolean;
  data?: unknown;
  message?: string;
};

/** API response from getTestResults(); structure may use different key names. */
type ResultsResponse = { data?: unknown } | null;

/**
 * Normalize API responses from completeTest + getTestResults into TestResultsData.
 */
export function normalizeTestResults(
  completeResponse: CompleteResponse,
  resultsResponse?: ResultsResponse | null
): TestResultsData {
  const responseData = (completeResponse as { data?: { summary?: unknown; test_attempt?: unknown } }).data;
  const summary = responseData?.summary ?? responseData;
  let question_attempts: TestResultsData['question_attempts'] = [];
  let test_attempt: Record<string, unknown> | undefined = (responseData as { test_attempt?: Record<string, unknown> })?.test_attempt;

  const resData = resultsResponse && typeof resultsResponse === 'object' && 'data' in resultsResponse ? (resultsResponse as { data?: { question_attempts?: unknown; test_attempt?: unknown } }).data : undefined;
  if (resData) {
    question_attempts = (resData.question_attempts ?? []) as TestResultsData['question_attempts'];
    if (resData.test_attempt != null) {
      test_attempt = resData.test_attempt as Record<string, unknown>;
    }
  }

  const s = summary as TestResultsData['summary'] | undefined;
  const t = test_attempt;

  return {
    summary: s
      ? {
          total_score: s.total_score ?? 0,
          total_questions: s.total_questions ?? 0,
          attempted: s.attempted ?? 0,
          correct: s.correct ?? 0,
          incorrect: s.incorrect ?? 0,
          skipped: s.skipped ?? 0,
          accuracy: s.accuracy ?? 0,
          time_taken: s.time_taken ?? 0,
        }
      : {
          total_score: (t?.total_score as number) ?? 0,
          total_questions: 0,
          attempted: (t?.attempted_count as number) ?? 0,
          correct: (t?.correct_count as number) ?? 0,
          incorrect: (t?.incorrect_count as number) ?? 0,
          skipped: (t?.skipped_count as number) ?? 0,
          accuracy: (t?.accuracy_percentage as number) ?? 0,
          time_taken: (t?.time_spent_minutes as number) ?? 0,
        },
    question_attempts: question_attempts ?? [],
  };
}
