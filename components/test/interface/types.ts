export type QuestionType =
  | 'mcq_single'           // MCQ with single correct answer
  | 'mcq_multiple'         // MCQ with multiple correct answers
  | 'numerical'            // Numerical/integer answer
  | 'paragraph'            // Paragraph/comprehension based
  | 'assertion_reason'     // Assertion-Reason type
  | 'match_following'      // Match the following
  | 'true_false'           // True/False
  | 'fill_blank';          // Fill in the blanks

export interface Question {
  id: number;
  question_text: string;
  options: Array<{ key: string; text: string }>;
  marks: number;
  difficulty: 'easy' | 'medium' | 'hard';
  subject: string;
  topic: string;
  question_type: QuestionType;
  negative_marks: number;
  section_name?: string;
  section_type?: string;
  image_url?: string | null;
  
  // Additional fields for specific question types
  paragraph_context?: string;  // For paragraph and match_following types
  assertion?: string;          // For assertion_reason type
  reason?: string;             // For assertion_reason type
  match_pairs?: Array<{        // For match_following type
    left: string;
    right: string;
    correct_match: string;
  }>;
  correct_option: string;      // For validation
}

export type QuestionStatus = 'not_visited' | 'not_answered' | 'answered';

export interface QuestionEntry {
  question: Question;
  status: QuestionStatus;
  savedOption: string | string[]; // string[] for mcq_multiple and match_following
  /** Seconds spent on this question (set when leaving or on submit). */
  time_spent_seconds?: number;
}

export interface SectionProgress {
  [key: string]: {
    name: string;
    attempted: number;
    total: number;
    correct: number;
    marks_scored: number;
    total_marks?: number;
  };
}

export interface TestResultsData {
  summary: {
    total_score: number;
    total_questions: number;
    attempted: number;
    correct: number;
    incorrect: number;
    skipped: number;
    accuracy: number;
    time_taken: number;
  };
  question_attempts: Array<{
    question_text: string;
    correct_option: string;
    solution_text?: string;
    options?: Array<{ key: string; text: string }>;
    marks: number;
    subject: string;
    selected_option?: string;
    is_correct: boolean;
    question_type?: string;
  }>;
}
