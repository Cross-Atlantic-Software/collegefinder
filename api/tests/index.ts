import { apiRequest } from '../client';
import { ApiResponse } from '../types';

// Test related interfaces
export interface Test {
  id: number;
  exam_id: number;
  format_id?: string;
  title: string;
  test_type: 'full_length' | 'subject_wise' | 'topic_wise';
  total_questions: number;
  total_marks: number;
  duration_minutes: number;
  question_ids: number[];
  sections?: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExamFormat {
  format_id: string;
  name: string;
  duration_minutes: number;
  total_marks: number;
  difficulty_weightage?: { easy: number; medium: number; hard: number };
  sections: {
    [key: string]: {
      name: string;
      marks: number;
      subsections: {
        [key: string]: {
          type: 'MCQ' | 'Numerical';
          questions: number;
          marks_per_question: number;
          required?: number; // e.g. 5 for numerical "attempt any 5 of 10"
        };
      };
    };
  };
  marking_scheme: {
    correct: number;
    incorrect: number;
    unattempted: number;
  };
  rules: string[];
}

export interface FormatRules {
  format: ExamFormat;
  rules: string[];
  marking_scheme: {
    correct: number;
    incorrect: number;
    unattempted: number;
  };
  sections: Record<string, unknown>;
}

export interface Question {
  id: number;
  question_text: string;
  options: Array<{key: string, text: string}>;
  marks: number;
  difficulty: 'easy' | 'medium' | 'hard';
  subject: string;
  topic: string;
  question_type: 
    | 'mcq_single'           // MCQ with single correct answer
    | 'mcq_multiple'         // MCQ with multiple correct answers
    | 'numerical'            // Numerical/integer answer
    | 'paragraph'            // Paragraph/comprehension based
    | 'assertion_reason'     // Assertion-Reason type
    | 'match_following'      // Match the following
    | 'true_false'           // True/False
    | 'fill_blank';          // Fill in the blanks
  negative_marks: number;
  image_url?: string | null;
  
  // Additional fields for specific question types
  paragraph_context?: string;
  assertion?: string;
  reason?: string;
  match_pairs?: Array<{
    left: string;
    right: string;
    correct_match: string;
  }>;
  correct_option: string;
}

export interface TestAttempt {
  id: number;
  user_id: number;
  test_id: number;
  exam_id: number;
  total_score: number;
  percentile?: number;
  rank_position?: number;
  attempted_count: number;
  correct_count: number;
  incorrect_count: number;
  skipped_count: number;
  accuracy_percentage: number;
  time_spent_minutes: number;
  subject_wise_stats: Record<string, unknown>;
  difficulty_wise_stats: Record<string, unknown>;
  completed_at?: string;
  created_at: string;
}

export interface QuestionAttempt {
  id: number;
  user_id: number;
  question_id: number;
  test_attempt_id: number;
  selected_option?: string;
  is_correct: boolean;
  time_spent_seconds: number;
  attempt_order: number;
  created_at: string;
}

// Analytics interfaces

export interface AnalyticsDimensionRow {
  label: string;
  subject: string | null;
  topic: string | null;
  total_questions: number;
  attempted: number;
  correct: number;
  incorrect: number;
  skipped: number;
  attempt_rate: number;
  accuracy_percentage: number;
  total_time_seconds: number;
  avg_time_per_question: number;
  negative_marks_lost: number;
}

export interface AttemptOverallStats {
  total_questions: number;
  attempted: number;
  correct: number;
  incorrect: number;
  skipped: number;
  attempt_rate: number;
  accuracy_percentage: number;
  total_score: number;
  /** Max marks from exam format (e.g. 300 for JEE Main) when available */
  total_marks?: number;
  percentile: number | null;
  rank_position: number | null;
  total_time_seconds: number;
  avg_time_per_question: number;
  negative_marks_lost: number;
}

export interface AttemptAnalytics {
  attempt: {
    id: number;
    test_title: string;
    exam_name: string;
    completed_at: string;
    duration_minutes: number;
  };
  /** Format baseline (paper structure) when test has sections; used for "score out of 300" and attempt rate vs full paper */
  format_baseline?: { total_marks: number; total_questions: number } | null;
  overall: AttemptOverallStats;
  by_subject: AnalyticsDimensionRow[];
  by_topic: AnalyticsDimensionRow[];
  by_sub_topic: AnalyticsDimensionRow[];
}

export interface AggregateAnalytics {
  total_attempts: number;
  completed_attempts: number;
  avg_score: number;
  best_score: number;
  avg_accuracy: number;
  avg_time_minutes: number;
}

export interface AnalyticsSummaryAttempt {
  id: number;
  exam_id?: number;
  exam_mock_id?: number | null;
  mock_order_index?: number | null;
  paper_number?: number | null;
  test_title: string;
  exam_name: string;
  total_score: number;
  accuracy_percentage: number;
  percentile: number | null;
  rank_position: number | null;
  attempted_count: number;
  correct_count: number;
  incorrect_count: number;
  skipped_count: number;
  time_spent_minutes: number;
  subject_wise_stats: Record<string, unknown>;
  completed_at: string;
}

/** One paper within a combined full-exam session */
export interface CombinedSessionPaper {
  attempt_id: number;
  paper_number: number;
  total_score: number;
  accuracy_percentage: number;
  attempted_count: number;
  correct_count: number;
  incorrect_count: number;
  skipped_count: number;
  time_spent_minutes: number;
  completed_at: string;
}

/** Full exam session: all papers of a mock completed */
export interface CombinedSession {
  attempt_ids: number[];
  mock_order_index: number;
  exam_name: string;
  completed_at: string;
  combined_total_score: number;
  combined_attempted: number;
  combined_correct: number;
  combined_incorrect: number;
  combined_skipped: number;
  combined_accuracy: number;
  combined_time_minutes: number;
  papers: CombinedSessionPaper[];
}

// API Functions

/**
 * Get all tests
 */
export async function getAllTests(): Promise<ApiResponse<{ tests: Test[] }>> {
  return apiRequest<{ tests: Test[] }>('/tests', {
    method: 'GET',
  });
}

/**
 * Get test by ID
 */
export async function getTestById(testId: number): Promise<ApiResponse<{ test: Test }>> {
  return apiRequest<{ test: Test }>(`/tests/${testId}`, {
    method: 'GET',
  });
}

/**
 * Get tests by exam ID
 */
export async function getTestsByExam(examId: number): Promise<ApiResponse<{ tests: Test[] }>> {
  return apiRequest<{ tests: Test[] }>(`/tests/exams/${examId}`, {
    method: 'GET',
  });
}

/**
 * Create a new test (admin only)
 */
export async function createTest(testData: {
  exam_id: number;
  title: string;
  test_type: 'full_length' | 'subject_wise' | 'topic_wise';
  duration_minutes: number;
  total_marks?: number;
}): Promise<ApiResponse<{ test: Test }>> {
  return apiRequest<{ test: Test }>('/tests', {
    method: 'POST',
    body: JSON.stringify(testData),
  });
}

/**
 * Start a test attempt
 */
export async function startTest(testId: number): Promise<ApiResponse<{ 
  test_attempt_id: number; 
  is_resume: boolean;
}>> {
  return apiRequest<{ test_attempt_id: number; is_resume: boolean }>(`/tests/${testId}/start`, {
    method: 'POST',
  });
}

/**
 * Get next question for test attempt
 */
export async function getNextQuestion(
  testAttemptId: number,
  questionParams: {
    exam_id: number;
    subject: string;
    difficulty: 'easy' | 'medium' | 'hard';
    topic?: string;
    question_type?: 'mcq' | 'numerical';
  }
): Promise<ApiResponse<{ 
  question: Question;
  attempt_order: number;
  total_attempted: number;
}>> {
  return apiRequest<{ 
    question: Question;
    attempt_order: number;
    total_attempted: number;
  }>(`/tests/attempts/${testAttemptId}/next-question`, {
    method: 'POST',
    body: JSON.stringify(questionParams),
  });
}

/**
 * Submit answer for a question
 */
export async function submitAnswer(
  testAttemptId: number,
  questionId: number,
  answerData: {
    selected_option?: string;
    time_spent_seconds?: number;
  }
): Promise<ApiResponse<{
  is_correct: boolean;
  correct_option: string;
  solution_text: string;
  marks_awarded: number;
}>> {
  return apiRequest<{
    is_correct: boolean;
    correct_option: string;
    solution_text: string;
    marks_awarded: number;
  }>(`/tests/attempts/${testAttemptId}/questions/${questionId}/submit`, {
    method: 'POST',
    body: JSON.stringify(answerData),
  });
}

/**
 * Payload for completing a mock test (answers saved only on submit).
 */
export interface CompleteTestAnswersPayload {
  answers: Array<{
    question_id: number;
    selected_option?: string | null;
    time_spent_seconds?: number;
  }>;
}

/**
 * Complete test attempt. For mock tests, pass answers so they are persisted in one go.
 */
export async function completeTest(
  testAttemptId: number,
  payload?: CompleteTestAnswersPayload
): Promise<ApiResponse<{
  test_attempt: TestAttempt;
  summary: {
    total_score: number;
    total_questions: number;
    attempted: number;
    correct: number;
    incorrect: number;
    skipped: number;
    accuracy: number;
    percentile?: number;
    rank?: number;
    time_taken: number;
  };
}>> {
  return apiRequest<{
    test_attempt: TestAttempt;
    summary: {
      total_score: number;
      total_questions: number;
      attempted: number;
      correct: number;
      incorrect: number;
      skipped: number;
      accuracy: number;
      percentile?: number;
      rank?: number;
      time_taken: number;
    };
  }>(`/tests/attempts/${testAttemptId}/complete`, {
    method: 'POST',
    body: payload ? JSON.stringify(payload) : undefined,
  });
}

/**
 * Get test attempt results
 */
export async function getTestResults(testAttemptId: number): Promise<ApiResponse<{
  test_attempt: TestAttempt;
  question_attempts: QuestionAttempt[];
}>> {
  return apiRequest<{
    test_attempt: TestAttempt;
    question_attempts: QuestionAttempt[];
  }>(`/tests/attempts/${testAttemptId}/results`, {
    method: 'GET',
  });
}

/**
 * Get user's test history
 */
export async function getUserTestHistory(
  limit: number = 20,
  offset: number = 0
): Promise<ApiResponse<{ test_attempts: TestAttempt[] }>> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });

  return apiRequest<{ test_attempts: TestAttempt[] }>(`/tests/history?${params}`, {
    method: 'GET',
  });
}

/**
 * Test Gemini service (for debugging)
 */
export async function testGeminiService(): Promise<ApiResponse<unknown>> {
  return apiRequest<unknown>('/tests/utils/test-gemini', {
    method: 'GET',
  });
}

// Helper functions

/**
 * Calculate test score based on question attempts
 */
export function calculateTestScore(
  questionAttempts: QuestionAttempt[],
  questions: Question[]
): number {
  let totalScore = 0;
  
  for (const attempt of questionAttempts) {
    const question = questions.find(q => q.id === attempt.question_id);
    if (!question) continue;
    
    if (attempt.is_correct) {
      totalScore += question.marks;
    } else if (attempt.selected_option) {
      // Only apply negative marking if an option was selected (not skipped)
      totalScore -= question.negative_marks;
    }
  }
  
  return totalScore;
}

/**
 * Format test duration
 */
export function formatTestDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Format test score with percentage
 */
export function formatTestScore(score: number, totalMarks: number): string {
  if (totalMarks === 0) return '0%';
  
  const percentage = Math.round((score / totalMarks) * 100);
  return `${score}/${totalMarks} (${percentage}%)`;
}

/**
 * Get difficulty color class
 */
export function getDifficultyColor(difficulty: 'easy' | 'medium' | 'hard'): string {
  switch (difficulty) {
    case 'easy':
      return 'text-green-400';
    case 'medium':
      return 'text-yellow-400';
    case 'hard':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
}

// Format-specific API functions

/**
 * Get available formats for an exam
 */
export async function getExamFormats(examId: number): Promise<ApiResponse<{ formats: { [key: string]: ExamFormat } }>> {
  return apiRequest<{ formats: { [key: string]: ExamFormat } }>(`/tests/exams/${examId}/formats`);
}

/**
 * Get format-specific test rules
 */
export async function getTestRules(examId: number, formatId: string): Promise<ApiResponse<FormatRules>> {
  return apiRequest<FormatRules>(`/tests/exams/${examId}/formats/${formatId}/rules`);
}

// ─── Mock Test API ────────────────────────────────────────────────────────────

export interface MockQuestion extends Question {
  mock_question_id: number;
  order_index: number;
  section_name?: string;
  section_type?: string;
}

/**
 * Start a mock test attempt.
 * Uses the pre-generated mock that matches the user's progression (completed mocks + 1).
 * Also triggers background generation of the next mock.
 * For multi-paper exams, pass paperNumber to specify which paper to start.
 */
export async function startMockTest(examId: number, paperNumber?: number): Promise<ApiResponse<{
  test_attempt_id: number;
  mock_test_id: number;
  mock_number: number;
  total_questions: number;
  is_resume: boolean;
  paper_number: number;
  number_of_papers: number;
  status?: string;
  next_mock_number?: number;
}>> {
  return apiRequest(`/mock-tests/exams/${examId}/start`, {
    method: 'POST',
    body: paperNumber ? JSON.stringify({ paper_number: paperNumber }) : undefined,
  });
}

/**
 * Get the next mock number for an exam (respects multi-paper: if Mock 1 Paper 2 is pending, returns 1).
 */
export async function getNextMockNumber(examId: number): Promise<ApiResponse<{
  mock: { id: number; order_index: number; status: string; total_questions: number } | null;
  next_mock_number: number;
  completed_mocks?: number;
  number_of_papers?: number;
  status?: string;
  message?: string;
}>> {
  return apiRequest(`/mock-tests/exams/${examId}/next`, { method: 'GET' });
}

/** Status of one paper within a multi-paper mock */
export interface PaperStatusItem {
  paper_number: number;
  status: 'locked' | 'unlocked' | 'in_progress' | 'completed' | 'generating' | 'not_generated';
  mock_id: number | null;
  attempt_id: number | null;
  attempt_data: {
    total_score: number;
    attempted_count: number;
    correct_count: number;
    incorrect_count: number;
    skipped_count: number;
    accuracy_percentage: number;
    time_spent_minutes: number;
    completed_at: string;
  } | null;
  total_questions: number;
}

/**
 * Get paper status for a specific mock number of a multi-paper exam.
 */
export async function getMockPaperStatus(examId: number, mockNumber: number): Promise<ApiResponse<{
  exam_id: number;
  mock_number: number;
  number_of_papers: number;
  papers: PaperStatusItem[];
}>> {
  return apiRequest(`/mock-tests/exams/${examId}/mock/${mockNumber}/paper-status`);
}

/**
 * Get all pre-generated questions for a mock test (no correct answers included).
 */
export async function getMockQuestions(mockTestId: number): Promise<ApiResponse<{
  mock_test_id: number;
  mock_number: number;
  total_questions: number;
  questions: MockQuestion[];
}>> {
  return apiRequest(`/mock-tests/${mockTestId}/questions`);
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Start a format-specific test
 */
export async function startFormatTest(examId: number, formatId: string): Promise<ApiResponse<{ test_attempt_id: number; is_resume: boolean }>> {
  return apiRequest<{ test_attempt_id: number; is_resume: boolean }>(`/tests/exams/${examId}/formats/${formatId}/start`, {
    method: 'POST',
    body: JSON.stringify({ format_id: formatId })
  });
}

/**
 * Get section-specific next question
 */
export async function getSectionQuestion(
  testAttemptId: number, 
  sectionName: string,
  params: {
    exam_id: number;
    subject: string;
    difficulty: 'easy' | 'medium' | 'hard';
    section_type?: 'MCQ' | 'Numerical';
    topic?: string;
    question_type?: 'mcq' | 'numerical';
    /** When true, backend generates a diagram-based question (e.g. circuit) for testing image flow */
    force_diagram?: boolean;
  }
): Promise<ApiResponse<{ question: Question }>> {
  return apiRequest<{ question: Question }>(
    `/tests/attempts/${testAttemptId}/sections/${sectionName}/next-question`,
    {
      method: 'POST',
      body: JSON.stringify({
        ...params,
        section_name: sectionName
      })
    },
    { timeout: 60000 }
  );
}

/**
 * Get section-wise progress
 */
export async function getSectionProgress(testAttemptId: number): Promise<ApiResponse<{
  section_progress: {
    [key: string]: {
      name: string;
      attempted: number;
      total: number;
      correct: number;
      marks_scored: number;
      total_marks?: number;
    };
  };
  overall: {
    total_attempted: number;
    total_correct: number;
    total_marks: number;
  };
}>> {
  return apiRequest(`/tests/attempts/${testAttemptId}/progress`);
}

/**
 * Get per-attempt full analytics matrix
 */
export async function getAttemptAnalytics(testAttemptId: number): Promise<ApiResponse<AttemptAnalytics>> {
  return apiRequest<AttemptAnalytics>(`/tests/attempts/${testAttemptId}/analytics`, {
    method: 'GET',
  });
}

/**
 * Get aggregate analytics summary for the current user
 */
export async function getUserAnalyticsSummary(examId?: number): Promise<ApiResponse<{
  aggregate: AggregateAnalytics;
  attempts: AnalyticsSummaryAttempt[];
  total_papers?: number;
  sessions?: CombinedSession[];
}>> {
  const params = examId ? `?examId=${examId}` : '';
  return apiRequest<{
    aggregate: AggregateAnalytics;
    attempts: AnalyticsSummaryAttempt[];
    total_papers?: number;
    sessions?: CombinedSession[];
  }>(`/tests/analytics${params}`, { method: 'GET' });
}

/**
 * Get performance color based on accuracy
 */
export function getPerformanceColor(accuracy: number): string {
  if (accuracy >= 80) return 'text-green-400';
  if (accuracy >= 60) return 'text-yellow-400';
  if (accuracy >= 40) return 'text-orange-400';
  return 'text-red-400';
}

/**
 * Format time spent in human readable format
 */
export function formatTimeSpent(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return `${hours}h ${remainingMinutes}m`;
}