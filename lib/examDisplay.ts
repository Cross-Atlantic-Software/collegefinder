import type { Exam } from "@/api/exams";

export const EXAM_LOGO_PLACEHOLDER = "/cbse.png";

/** First integer in stored papers text for mock tests; default 1. */
export function parseExamPaperCount(raw: string | number | null | undefined): number {
  if (raw == null || String(raw).trim() === "") return 1;
  const match = String(raw).trim().match(/\d+/);
  if (!match) return 1;
  const n = parseInt(match[0], 10);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

export function examLogoSrc(exam: Pick<Exam, "exam_logo">): string {
  const url = exam.exam_logo?.trim();
  if (url && (url.startsWith("http") || url.startsWith("/"))) return url;
  return EXAM_LOGO_PLACEHOLDER;
}

export function hasCustomExamLogo(exam: Pick<Exam, "exam_logo">): boolean {
  const url = exam.exam_logo?.trim();
  return Boolean(url && (url.startsWith("http") || url.startsWith("/")));
}

export function formatIsoDateLabel(raw: string | Date | null | undefined): string | null {
  if (raw == null) return null;
  if (raw instanceof Date) {
    if (Number.isNaN(raw.getTime())) return null;
    return raw.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
  }
  const text = String(raw).trim();
  if (!text) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    try {
      const dt = new Date(text);
      if (!Number.isNaN(dt.getTime())) {
        return dt.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
      }
    } catch {
      /* show stored text */
    }
  }
  return text;
}

function pickRecordField<T>(source: Record<string, unknown>, camel: string, snake: string): T | undefined {
  const val = source[camel] ?? source[snake];
  return val as T | undefined;
}

/** Merge taxonomy + related rows whether nested on `exam` or at response root (public/admin shapes). */
export function normalizeEnrichedExam(input: unknown): Exam {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid exam payload");
  }

  const raw = input as Record<string, unknown>;
  const base: Record<string, unknown> =
    raw.exam && typeof raw.exam === "object" ? { ...(raw.exam as Record<string, unknown>) } : { ...raw };

  const root = raw.exam && typeof raw.exam === "object" ? raw : base;

  const exam = {
    ...base,
    examDates:
      pickRecordField(base, "examDates", "exam_dates") ??
      pickRecordField(root, "examDates", "exam_dates") ??
      null,
    eligibilityCriteria:
      pickRecordField(base, "eligibilityCriteria", "eligibility_criteria") ??
      pickRecordField(root, "eligibilityCriteria", "eligibility_criteria") ??
      null,
    examPattern:
      pickRecordField(base, "examPattern", "exam_pattern") ??
      pickRecordField(root, "examPattern", "exam_pattern") ??
      null,
    examCutoff:
      pickRecordField(base, "examCutoff", "exam_cutoff") ??
      pickRecordField(root, "examCutoff", "exam_cutoff") ??
      null,
    linkedCareerGoals:
      pickRecordField<Exam["linkedCareerGoals"]>(base, "linkedCareerGoals", "linked_career_goals") ??
      pickRecordField<Exam["linkedCareerGoals"]>(root, "linkedCareerGoals", "linked_career_goals") ??
      [],
    linkedPrograms:
      pickRecordField<Exam["linkedPrograms"]>(base, "linkedPrograms", "linked_programs") ??
      pickRecordField<Exam["linkedPrograms"]>(root, "linkedPrograms", "linked_programs") ??
      [],
    linkedColleges:
      pickRecordField<Exam["linkedColleges"]>(base, "linkedColleges", "linked_colleges") ??
      pickRecordField<Exam["linkedColleges"]>(root, "linkedColleges", "linked_colleges") ??
      [],
  } as Exam;

  return exam;
}

export function examHasEnrichedDetails(exam: Exam | null | undefined): boolean {
  if (!exam) return false;
  return Boolean(
    exam.examDates ||
      exam.examPattern ||
      exam.eligibilityCriteria ||
      exam.examCutoff ||
      (exam.linkedCareerGoals?.length ?? 0) > 0 ||
      (exam.linkedPrograms?.length ?? 0) > 0
  );
}

export function formatApplicationDateRange(exam: Exam): string {
  const d = exam.examDates;
  if (!d) return "—";
  const a = formatIsoDateLabel(d.application_start_date);
  const b = formatIsoDateLabel(d.application_close_date);
  if (a && b) return `${a} – ${b}`;
  return a || b || "—";
}

export function formatApplicationFee(exam: Exam): string {
  const raw = exam.examDates?.application_fees;
  if (raw == null || String(raw).trim() === "") return "—";
  const text = String(raw).trim();
  const n = Number(text.replace(/[^\d.-]/g, ""));
  if (Number.isFinite(n) && /^[\d.,\s₹$+-]+$/.test(text.replace(/\s/g, ""))) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n);
  }
  return text;
}

export function formatExamTypeLabel(examType: string | null | undefined): string | null {
  const raw = (examType || "").trim();
  return raw || null;
}

export function streamLabelsLine(exam: Exam): string {
  const streams = exam.eligibilityCriteria?.stream_labels?.filter(Boolean) ?? [];
  if (streams.length) return streams.slice(0, 4).join(", ");
  return "—";
}

export function subjectLabelsLine(exam: Exam): string {
  const subs = exam.eligibilityCriteria?.subject_labels?.filter(Boolean) ?? [];
  if (subs.length) return subs.slice(0, 4).join(", ");
  return "—";
}

export function textOrDash(val: string | null | undefined): string {
  const t = val != null ? String(val).trim() : "";
  return t || "—";
}

export function buildEligibilityLines(exam: Exam | null): string[] {
  if (!exam?.eligibilityCriteria) return [];
  const ec = exam.eligibilityCriteria;
  const rules: string[] = [];
  if (ec.stream_labels?.length) rules.push(`Streams: ${ec.stream_labels.join(", ")}`);
  if (ec.subject_labels?.length) rules.push(`Subjects: ${ec.subject_labels.join(", ")}`);
  if (ec.age_limit?.trim()) rules.push(`Age limit: ${ec.age_limit.trim()}`);
  if (ec.attempt_limit != null && String(ec.attempt_limit).trim() !== "")
    rules.push(`Attempt limit: ${String(ec.attempt_limit).trim()}`);
  if (ec.domicile?.trim()) rules.push(`Domicile: ${ec.domicile.trim()}`);
  return rules;
}

export function buildCutoffLines(exam: Exam | null): string[] {
  const c = exam?.examCutoff;
  if (!c) return [];
  const lines: string[] = [];
  const push = (label: string, val: string | null | undefined) => {
    if (val != null && String(val).trim() !== "") lines.push(`${label}: ${String(val).trim()}`);
  };
  push("Ranks / percentiles", c.ranks_percentiles);
  push("General", c.cutoff_general);
  push("OBC", c.cutoff_obc);
  push("SC", c.cutoff_sc);
  push("ST", c.cutoff_st);
  push("Target rank range", c.target_rank_range);
  return lines;
}

export type ExamTimelineItem = {
  label: string;
  date: string;
};

export function buildExamTimeline(exam: Exam | null): ExamTimelineItem[] {
  const dates = exam?.examDates;
  const dateValue = (raw: string | null | undefined) =>
    textOrNotConfigured(formatIsoDateLabel(raw));
  return [
    { label: "Application opens", date: dateValue(dates?.application_start_date) },
    { label: "Application closes", date: dateValue(dates?.application_close_date) },
    { label: "Exam date", date: dateValue(dates?.exam_date) },
    { label: "Result", date: dateValue(dates?.result_date) },
  ];
}

export function formatQuestionCount(exam: Exam): string {
  const n = exam.examPattern?.number_of_questions;
  if (n == null || String(n).trim() === "") return "—";
  return String(n).trim();
}

export function formatTotalMarks(exam: Exam): string {
  const n = exam.examPattern?.total_marks;
  if (n == null || String(n).trim() === "") return "—";
  return String(n).trim();
}

export function formatMode(exam: Exam): string {
  const mode = exam.examPattern?.mode;
  return mode != null && String(mode).trim() !== "" ? String(mode).trim() : "—";
}

export function formatDuration(exam: Exam): string {
  const raw = exam.examPattern?.duration_minutes;
  if (raw == null || String(raw).trim() === "") return "—";
  return String(raw).trim();
}

export function formatNegativeMarking(exam: Exam): string {
  const neg = exam.examPattern?.negative_marking;
  return neg != null && String(neg).trim() !== "" ? String(neg).trim() : "—";
}

export function formatPopularityRank(exam: Exam): string | null {
  const rankRaw = exam.exam_popularity_rank;
  if (rankRaw == null || Number.isNaN(Number(rankRaw))) return null;
  return String(Number(rankRaw));
}

export const NOT_CONFIGURED = "Not configured";

export function textOrNotConfigured(val: string | null | undefined): string {
  const t = val != null ? String(val).trim() : "";
  return t || NOT_CONFIGURED;
}

export function joinLabelsOrNotConfigured(labels: string[] | undefined): string {
  const list = labels?.filter(Boolean) ?? [];
  return list.length ? list.join(", ") : NOT_CONFIGURED;
}

export type ExamDetailField = { label: string; value: string };

export type ExamDetailSection = {
  id: string;
  title: string;
  fields: ExamDetailField[];
};

/** All user-facing exam fields from DB, grouped by table — values always shown. */
export function buildExamDetailSections(exam: Exam): ExamDetailSection[] {
  const d = exam.examDates;
  const p = exam.examPattern;
  const e = exam.eligibilityCriteria;
  const c = exam.examCutoff;

  return [
    {
      id: "overview",
      title: "Exam overview",
      fields: [
        { label: "Exam code", value: textOrNotConfigured(exam.code) },
        { label: "Exam type", value: textOrNotConfigured(formatExamTypeLabel(exam.exam_type)) },
        { label: "Conducting authority", value: textOrNotConfigured(exam.conducting_authority) },
        {
          label: "Popularity rank",
          value: formatPopularityRank(exam) ? `#${formatPopularityRank(exam)}` : NOT_CONFIGURED,
        },
        {
          label: "Number of papers",
          value: textOrNotConfigured(
            exam.number_of_papers != null ? String(exam.number_of_papers) : null
          ),
        },
        { label: "Official website", value: textOrNotConfigured(exam.website) },
      ],
    },
    {
      id: "dates",
      title: "Important dates & fees",
      fields: [
        {
          label: "Application start",
          value: textOrNotConfigured(formatIsoDateLabel(d?.application_start_date)),
        },
        {
          label: "Application close",
          value: textOrNotConfigured(formatIsoDateLabel(d?.application_close_date)),
        },
        {
          label: "Application fee",
          value:
            d?.application_fees != null && String(d.application_fees).trim() !== ""
              ? formatApplicationFee(exam)
              : NOT_CONFIGURED,
        },
        { label: "Exam date", value: textOrNotConfigured(formatIsoDateLabel(d?.exam_date)) },
        { label: "Result date", value: textOrNotConfigured(formatIsoDateLabel(d?.result_date)) },
      ],
    },
    {
      id: "pattern",
      title: "Exam pattern",
      fields: [
        { label: "Mode", value: formatMode(exam) === "—" ? NOT_CONFIGURED : formatMode(exam) },
        {
          label: "Duration (hours)",
          value: formatDuration(exam) === "—" ? NOT_CONFIGURED : formatDuration(exam),
        },
        {
          label: "Number of questions",
          value:
            formatQuestionCount(exam) === "—" ? NOT_CONFIGURED : formatQuestionCount(exam),
        },
        {
          label: "Total marks",
          value: formatTotalMarks(exam) === "—" ? NOT_CONFIGURED : formatTotalMarks(exam),
        },
        {
          label: "Negative marking",
          value:
            formatNegativeMarking(exam) === "—" ? NOT_CONFIGURED : formatNegativeMarking(exam),
        },
        {
          label: "Subject weightage",
          value: textOrNotConfigured(p?.weightage_of_subjects),
        },
      ],
    },
    {
      id: "eligibility",
      title: "Eligibility",
      fields: [
        { label: "Eligible streams", value: joinLabelsOrNotConfigured(e?.stream_labels) },
        { label: "Required subjects", value: joinLabelsOrNotConfigured(e?.subject_labels) },
        { label: "Age limit", value: textOrNotConfigured(e?.age_limit) },
        {
          label: "Attempt limit",
          value:
            e?.attempt_limit != null && String(e.attempt_limit).trim() !== ""
              ? String(e.attempt_limit).trim()
              : NOT_CONFIGURED,
        },
        { label: "Domicile", value: textOrNotConfigured(e?.domicile) },
      ],
    },
    {
      id: "cutoff",
      title: "Cutoff & ranks",
      fields: [
        { label: "Ranks / percentiles", value: textOrNotConfigured(c?.ranks_percentiles) },
        { label: "General cutoff", value: textOrNotConfigured(c?.cutoff_general) },
        { label: "OBC cutoff", value: textOrNotConfigured(c?.cutoff_obc) },
        { label: "SC cutoff", value: textOrNotConfigured(c?.cutoff_sc) },
        { label: "ST cutoff", value: textOrNotConfigured(c?.cutoff_st) },
        { label: "Target rank range", value: textOrNotConfigured(c?.target_rank_range) },
      ],
    },
    {
      id: "application",
      title: "Application & counselling",
      fields: [
        { label: "Documents required", value: textOrNotConfigured(exam.documents_required) },
        { label: "Counselling", value: textOrNotConfigured(exam.counselling) },
      ],
    },
  ];
}
