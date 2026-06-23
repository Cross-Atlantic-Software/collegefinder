import type { Exam } from "@/api/exams";
import { formatExamPatternDurationHours } from "@/lib/formatDuration";

/** Difficulty level shown on cards and detail pages. */
export function examCardDifficultyLevel(exam: Exam): string | null {
  const level = exam.difficulty_level?.trim();
  return level || null;
}

/** True when a scalar DB value should be shown in the UI. */
export function hasDisplayValue(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

export function examLogoUrl(
  exam: Pick<Exam, "exam_logo" | "logo_file_name">
): string | null {
  const u = exam.exam_logo?.trim() || exam.logo_file_name?.trim();
  return u || null;
}

export function formatExamDate(iso: string | null | undefined): string | null {
  if (!hasDisplayValue(iso)) return null;
  try {
    const d = new Date(String(iso));
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

/** Month label derived from an ISO date (no separate month column in DB). */
export function formatExamMonth(iso: string | null | undefined): string | null {
  if (!hasDisplayValue(iso)) return null;
  try {
    const d = new Date(String(iso));
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  } catch {
    return null;
  }
}

export function formatApplicationDateRange(exam: Exam): string | null {
  const d = exam.examDates;
  if (!d) return null;
  const a = formatExamDate(d.application_start_date);
  const b = formatExamDate(d.application_close_date);
  if (a && b) return `${a} – ${b}`;
  return a || b;
}

export type ExamApplicationWindowStatus = "upcoming" | "open" | "closed" | "unknown";

function normalizeDateIsoForCompare(raw: string | null | undefined): string | null {
  if (!hasDisplayValue(raw)) return null;
  const text = String(raw).trim();
  const isoPrefix = text.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoPrefix) return isoPrefix[1];
  const d = new Date(text);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function todayIsoDateLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Application window from exam_dates — drives Apply button on exam cards. */
export function getExamApplicationWindowStatus(
  exam: Pick<Exam, "examDates">
): ExamApplicationWindowStatus {
  const start = normalizeDateIsoForCompare(exam.examDates?.application_start_date);
  const end = normalizeDateIsoForCompare(exam.examDates?.application_close_date);
  const today = todayIsoDateLocal();

  if (!start && !end) return "unknown";
  if (start && today < start) return "upcoming";
  if (end && today > end) return "closed";
  return "open";
}

export function examApplicationButtonLabel(status: ExamApplicationWindowStatus): string {
  switch (status) {
    case "upcoming":
      return "Apply Soon";
    case "unknown":
      return "Apply Soon";
    case "closed":
      return "Application Closed";
    case "open":
    default:
      return "Apply";
  }
}

export function isExamApplicationButtonEnabled(status: ExamApplicationWindowStatus): boolean {
  return status === "open";
}

/** Exam card: application start month only (e.g. "Jan"). */
export function examCardApplicationStartMonth(exam: Exam): string | null {
  const iso = exam.examDates?.application_start_date;
  if (!hasDisplayValue(iso)) return null;
  try {
    const d = new Date(String(iso));
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString("en-IN", { month: "short" });
  } catch {
    return null;
  }
}

export function formatInrFee(raw: number | null | undefined): string | null {
  if (raw == null) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function examLevelBadge(examType: string | null | undefined): string | null {
  const raw = (examType || "").trim();
  if (!raw) return null;
  const t = raw.toLowerCase();
  if (t.includes("national")) return "National level";
  if (t.includes("state")) return "State level";
  if (t.includes("institute")) return "Institute level";
  return raw;
}

export function programLine(exam: Exam): string | null {
  const names = (exam.linkedPrograms ?? []).map((p) => p.name?.trim()).filter(Boolean);
  if (!names.length) return null;
  return names.slice(0, 3).join(" · ");
}

/** Dashboard exam card: exam_type as stored in DB. */
export function examCardTypeLabel(exam: Exam): string | null {
  const t = exam.exam_type?.trim();
  return t || null;
}

export function examCardDuration(exam: Exam): string | null {
  const label = formatExamPatternDurationHours(exam.examPattern?.duration_minutes ?? undefined);
  return label !== "—" ? label : null;
}

/** Eligibility streams resolved to names for card display. */
export function examCardStreamLine(exam: Exam): string | null {
  const labels = (exam.eligibilityCriteria?.stream_labels ?? []).filter(Boolean);
  if (!labels.length) return null;
  return labels.join(", ");
}

export function examCardDescription(exam: Exam): string | null {
  const d = exam.description?.trim();
  return d || null;
}

export function examCardConductingAuthority(exam: Exam): string | null {
  const auth = exam.conducting_authority?.trim();
  return auth || null;
}

export function examCardMode(exam: Exam): string | null {
  const mode = exam.examPattern?.mode?.trim();
  return mode || null;
}

/** DB/API scalar (string, number, etc.) for card labels — not always a string. */
function displayScalar(value: unknown): string | null {
  if (!hasDisplayValue(value)) return null;
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : null;
  if (typeof value === "string") {
    const t = value.trim();
    return t || null;
  }
  const t = String(value).trim();
  return t || null;
}

export function examCardAttemptLimit(exam: Exam): string | null {
  return displayScalar(exam.eligibilityCriteria?.attempt_limit);
}

export function examCardNegativeMarking(exam: Exam): string | null {
  return displayScalar(exam.examPattern?.negative_marking);
}

export type ExamLinkedCollegePreview = {
  id: number;
  name: string;
  abbreviation?: string | null;
};

/** Chip label for linked colleges on exam cards (abbreviation preferred). */
export function linkedCollegeChipLabel(college: {
  abbreviation?: string | null;
  name: string;
}): string {
  const abbr = college.abbreviation?.trim();
  if (abbr) return abbr;
  return college.name;
}

/** Chip label for linked exams on college/coaching cards (abbreviation preferred). */
export function linkedExamChipLabel(exam: {
  abbreviation?: string | null;
  code?: string | null;
  name: string;
}): string {
  const abbr = exam.abbreviation?.trim();
  if (abbr) return abbr;
  const code = exam.code?.trim();
  if (code) return code;
  return exam.name;
}

/** Up to 3 linked colleges for exam cards. */
export function examCardLinkedColleges(exam: Exam): ExamLinkedCollegePreview[] {
  const fromRows = (exam.linkedColleges ?? [])
    .map((c) => ({
      id: Number(c.id),
      name: String(c.name ?? "").trim(),
      abbreviation:
        c.abbreviation != null && String(c.abbreviation).trim()
          ? String(c.abbreviation).trim()
          : null,
    }))
    .filter((c) => Number.isInteger(c.id) && c.id > 0 && c.name);
  if (fromRows.length) return fromRows.slice(0, 3);

  return (exam.linkedCollegeNames ?? [])
    .map((n) => String(n).trim())
    .filter(Boolean)
    .slice(0, 3)
    .map((name, index) => ({ id: -(index + 1), name, abbreviation: null }));
}

/** Up to 3 linked college chip labels for exam cards. */
export function examCardLinkedCollegeNames(exam: Exam): string[] {
  return examCardLinkedColleges(exam).map((c) => linkedCollegeChipLabel(c));
}

/** Total linked colleges (preview list may show fewer). */
export function examCardLinkedCollegeTotalCount(exam: Exam): number {
  const total = exam.linkedCollegeCount;
  if (total != null && total > 0) return total;
  return exam.linkedColleges?.length ?? exam.linkedCollegeNames?.length ?? 0;
}

/** Remaining linked colleges after the 3-name preview (+N on cards). */
export function examCardLinkedCollegeOverflowCount(exam: Exam): number {
  const shown = examCardLinkedColleges(exam).length;
  return Math.max(0, examCardLinkedCollegeTotalCount(exam) - shown);
}

/** College-style card overview paragraph. */
export function examCardOverview(exam: Exam): string {
  const d = exam.description?.trim();
  if (d) return d.length > 220 ? `${d.slice(0, 217)}…` : d;
  const auth = exam.conducting_authority?.trim();
  if (auth) return auth;
  return "View dates, eligibility, pattern, and next steps for this exam.";
}

/** College-style card subtitle under the title. */
export function examCardSubtitleLine(exam: Exam): string {
  const code = exam.code?.trim();
  if (code) return code;
  const type = examCardTypeLabel(exam);
  if (type) return type;
  return "Exam";
}

/** Small chips (mode, duration) — programs excluded from cards; use examCardMetaChips row instead. */
export function examCardTagChips(exam: Exam): string[] {
  const chips: string[] = [];
  const mode = examCardMode(exam);
  if (mode) chips.push(mode);
  const duration = examCardDuration(exam);
  if (duration) chips.push(duration);
  const appStart = examCardApplicationStartMonth(exam);
  if (appStart) chips.push(appStart);
  return chips.slice(0, 4);
}

/** Location-style pills for stream / authority. */
export function examCardMetaPills(exam: Exam): string[] {
  const pills: string[] = [];
  const stream = examCardStreamLine(exam);
  if (stream) pills.push(stream);
  const auth = examCardConductingAuthority(exam);
  if (auth && !pills.includes(auth)) pills.push(auth);
  return pills.slice(0, 2);
}

export type ExamField = { label: string; value: string };

export type ExamDetailSection = {
  id: string;
  title: string;
  fields: ExamField[];
};

function field(label: string, value: unknown): ExamField | null {
  if (!hasDisplayValue(value)) return null;
  const text = typeof value === "number" ? String(value) : String(value).trim();
  return { label, value: text };
}

function pushField(arr: ExamField[], f: ExamField | null) {
  if (f) arr.push(f);
}

function pushSection(
  sections: ExamDetailSection[],
  id: string,
  title: string,
  fields: ExamField[]
) {
  const populated = fields.filter((f) => f.value.trim() && f.value !== "—");
  if (populated.length) sections.push({ id, title, fields: populated });
}

function avgApplicantsLastThreeYears(exam: Exam): number | null {
  if (hasDisplayValue(exam.avg_applicant_prev_three)) {
    return Number(exam.avg_applicant_prev_three);
  }
  const yearly = [exam.avg_applicant_2023, exam.avg_applicant_2024, exam.avg_applicant_2025].filter(
    (n) => n != null && Number.isFinite(Number(n))
  );
  if (!yearly.length) return null;
  const sum = yearly.reduce((acc, n) => acc + Number(n), 0);
  return Math.round(sum / yearly.length);
}

/** Sections built only from enriched exam API payload (no placeholders). */
export function buildExamDetailSections(exam: Exam): ExamDetailSection[] {
  const sections: ExamDetailSection[] = [];

  // 1) Exam Information
  const examInfo: ExamField[] = [];
  pushField(examInfo, field("Exam Name", exam.name));
  pushField(examInfo, field("Abbreviation", exam.abbreviation));
  if (hasDisplayValue(exam.description)) {
    pushField(examInfo, field("Description", exam.description));
  }
  pushField(examInfo, field("Category", exam.category));
  pushField(examInfo, field("Exam Frequency", exam.exam_frequency));
  pushSection(sections, "exam-information", "Exam Information", examInfo);

  // 2) Important Dates
  const dates: ExamField[] = [];
  const ed = exam.examDates;
  if (ed) {
    pushField(dates, field("Application Start Date", formatExamDate(ed.application_start_date)));
    pushField(dates, field("Application Start Month", formatExamMonth(ed.application_start_date)));
    pushField(dates, field("Application Close Date", formatExamDate(ed.application_close_date)));
    pushField(dates, field("Application End Month", formatExamMonth(ed.application_close_date)));
    pushField(
      dates,
      field("Hall Ticket Downloading Open Date", formatExamDate(ed.admit_card_date))
    );
    pushField(
      dates,
      field("Hall Ticket Downloading Open Month", formatExamMonth(ed.admit_card_date))
    );
    pushField(dates, field("Exam Date", formatExamDate(ed.exam_date)));
    pushField(dates, field("Exam Month", formatExamMonth(ed.exam_date)));
    pushField(dates, field("Result Date", formatExamDate(ed.result_date)));
    pushField(dates, field("Result Month", formatExamMonth(ed.result_date)));
  }
  pushSection(sections, "important-dates", "Important Dates", dates);

  // 3) Eligibility Criteria
  const eligibility: ExamField[] = [];
  if (hasDisplayValue(exam.eligibility)) {
    pushField(eligibility, field("Eligibility", exam.eligibility));
  }
  const el = exam.eligibilityCriteria;
  if (el) {
    pushField(eligibility, field("Domicile", el.domicile));
    const streams = (el.stream_labels ?? []).filter(Boolean).join(", ");
    const subjects = (el.subject_labels ?? []).filter(Boolean).join(", ");
    pushField(eligibility, field("Streams", streams || null));
    pushField(eligibility, field("Subjects", subjects || null));
    pushField(eligibility, field("Age Limit", el.age_limit));
    pushField(eligibility, field("Attempt Limit", el.attempt_limit));
  }
  pushSection(sections, "eligibility", "Eligibility Criteria", eligibility);

  // 4) Application Details
  const application: ExamField[] = [];
  pushField(application, field("Documents Required", exam.documents_required));
  pushField(
    application,
    field("Application Fees", formatInrFee(ed?.application_fees ?? null))
  );
  pushField(application, field("Mode", exam.examPattern?.mode));
  pushSection(sections, "application-details", "Application Details", application);

  // 5) Exam Pattern
  const pattern: ExamField[] = [];
  const ep = exam.examPattern;
  pushField(pattern, field("Exam Pattern", exam.exam_pattern));
  if (ep) {
    pushField(
      pattern,
      field(
        "Number of Questions",
        ep.number_of_questions != null ? ep.number_of_questions : null
      )
    );
    pushField(pattern, field("Total Marks", ep.total_marks != null ? ep.total_marks : null));
    pushField(pattern, field("Negative Marking / Marking", ep.negative_marking));
    pushField(pattern, field("Weightage of Subjects", ep.weightage_of_subjects));
    pushField(
      pattern,
      field(
        "Duration Minutes",
        ep.duration_minutes != null ? ep.duration_minutes : null
      )
    );
  }
  pushSection(sections, "exam-pattern", "Exam Pattern", pattern);

  // 6) Admissions & Counselling
  const admissions: ExamField[] = [];
  const programNames = (exam.linkedPrograms ?? []).map((p) => p.name?.trim()).filter(Boolean);
  pushField(
    admissions,
    field("Programs", programNames.length ? programNames.join(", ") : null)
  );
  pushField(admissions, field("Counselling", exam.counselling));
  pushSection(sections, "admissions-counselling", "Admissions & Counselling", admissions);

  // 7) Competition & Performance Metrics
  const metrics: ExamField[] = [];
  const avgApplicants = avgApplicantsLastThreeYears(exam);
  pushField(
    metrics,
    field(
      "No. of Average Applicants Appeared (last 3 Years)",
      avgApplicants != null ? avgApplicants : null
    )
  );
  pushField(metrics, field("Difficulty Level", examCardDifficultyLevel(exam)));
  pushField(metrics, field("Success Rate", exam.success_rate));
  pushSection(sections, "competition-metrics", "Competition & Performance Metrics", metrics);

  return sections;
}

/** Flat list of every populated field (for cards and quick views). */
export function buildExamAllDisplayFields(exam: Exam): ExamField[] {
  const fields: ExamField[] = [];
  for (const section of buildExamDetailSections(exam)) {
    fields.push(...section.fields);
  }
  return fields;
}

/** Compact chips for exam cards — only populated DB-backed values. */
export function buildExamCardChips(exam: Exam): string[] {
  const chips: string[] = [];
  const mode = exam.examPattern?.mode?.trim();
  if (mode) chips.push(mode);
  const duration = formatExamPatternDurationHours(exam.examPattern?.duration_minutes ?? undefined);
  if (duration !== "—") chips.push(duration);
  const appRange = formatApplicationDateRange(exam);
  if (appRange) chips.push(appRange);
  const fee = formatInrFee(exam.examDates?.application_fees ?? null);
  if (fee) chips.push(fee);
  return chips;
}

export function examCardSubtitle(exam: Exam): string | null {
  const code = exam.code?.trim();
  if (code) return code;
  const auth = exam.conducting_authority?.trim();
  if (auth) return auth;
  return null;
}

/** Dashboard exam detail route (`/dashboard/exams/[examId]`). */
export function examDetailHref(
  examId: number,
  from:
    | "dashboard-college-shortlist"
    | "dashboard-coaching-shortlist"
    | "dashboard-scholarship-shortlist"
    | "exam-card"
    | "exam-shortlist"
    | "exam-directory"
    | string = "exam-card"
): string {
  return `/dashboard/exams/${examId}?from=${encodeURIComponent(from)}`;
}
