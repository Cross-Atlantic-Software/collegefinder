import type { Exam } from "@/api/exams";
import { formatExamPatternDurationHours } from "@/lib/formatDuration";

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

export function formatApplicationDateRange(exam: Exam): string | null {
  const d = exam.examDates;
  if (!d) return null;
  const a = formatExamDate(d.application_start_date);
  const b = formatExamDate(d.application_close_date);
  if (a && b) return `${a} – ${b}`;
  return a || b;
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

/** Up to 3 linked college names for exam cards. */
export function examCardLinkedCollegeNames(exam: Exam): string[] {
  return (exam.linkedCollegeNames ?? []).map((n) => String(n).trim()).filter(Boolean).slice(0, 3);
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

/** Small chips (mode, duration, programs) — mirrors college linked-exam chips. */
export function examCardTagChips(exam: Exam): string[] {
  const chips: string[] = [];
  const mode = examCardMode(exam);
  if (mode) chips.push(mode);
  const duration = examCardDuration(exam);
  if (duration) chips.push(duration);
  const programs = programLine(exam);
  if (programs) chips.push(programs);
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

/** Sections built only from enriched exam API payload (no placeholders). */
export function buildExamDetailSections(exam: Exam): ExamDetailSection[] {
  const sections: ExamDetailSection[] = [];

  const overview: ExamField[] = [];
  const push = (arr: ExamField[], f: ExamField | null) => {
    if (f) arr.push(f);
  };

  push(overview, field("Exam code", exam.code));
  push(overview, field("Exam type", exam.exam_type));
  push(overview, field("Conducting authority", exam.conducting_authority));
  push(
    overview,
    field(
      "Number of papers",
      exam.number_of_papers != null && exam.number_of_papers > 0
        ? exam.number_of_papers
        : null
    )
  );
  push(overview, field("Website", exam.website));
  push(overview, field("Counselling", exam.counselling));
  push(overview, field("Documents required", exam.documents_required));
  if (hasDisplayValue(exam.description)) {
    push(overview, field("Description", exam.description));
  }
  if (overview.length) {
    sections.push({ id: "overview", title: "Overview", fields: overview });
  }

  const dates: ExamField[] = [];
  const ed = exam.examDates;
  if (ed) {
    push(dates, field("Application opens", formatExamDate(ed.application_start_date)));
    push(dates, field("Application closes", formatExamDate(ed.application_close_date)));
    push(dates, field("Exam date", formatExamDate(ed.exam_date)));
    push(dates, field("Result date", formatExamDate(ed.result_date)));
    push(dates, field("Application fee", formatInrFee(ed.application_fees)));
  }
  if (dates.length) {
    sections.push({ id: "dates", title: "Important dates", fields: dates });
  }

  const pattern: ExamField[] = [];
  const ep = exam.examPattern;
  if (ep) {
    push(pattern, field("Mode", ep.mode));
    push(
      pattern,
      field(
        "Duration",
        formatExamPatternDurationHours(ep.duration_minutes ?? undefined) !== "—"
          ? formatExamPatternDurationHours(ep.duration_minutes ?? undefined)
          : null
      )
    );
    push(
      pattern,
      field(
        "Number of questions",
        ep.number_of_questions != null ? ep.number_of_questions : null
      )
    );
    push(pattern, field("Total marks", ep.total_marks != null ? ep.total_marks : null));
    push(pattern, field("Negative marking", ep.negative_marking));
    push(pattern, field("Subject weightage", ep.weightage_of_subjects));
  }
  if (pattern.length) {
    sections.push({ id: "pattern", title: "Exam pattern", fields: pattern });
  }

  const eligibility: ExamField[] = [];
  const el = exam.eligibilityCriteria;
  if (el) {
    const streams = (el.stream_labels ?? []).filter(Boolean).join(", ");
    const subjects = (el.subject_labels ?? []).filter(Boolean).join(", ");
    push(eligibility, field("Streams", streams || null));
    push(eligibility, field("Subjects", subjects || null));
    push(eligibility, field("Age limit", el.age_limit));
    push(eligibility, field("Attempt limit", el.attempt_limit));
    push(eligibility, field("Domicile", el.domicile));
  }
  if (eligibility.length) {
    sections.push({ id: "eligibility", title: "Eligibility", fields: eligibility });
  }

  const cutoff: ExamField[] = [];
  const ec = exam.examCutoff;
  if (ec) {
    push(cutoff, field("Ranks / percentiles", ec.ranks_percentiles));
    push(cutoff, field("Cutoff (General)", ec.cutoff_general));
    push(cutoff, field("Cutoff (OBC)", ec.cutoff_obc));
    push(cutoff, field("Cutoff (SC)", ec.cutoff_sc));
    push(cutoff, field("Cutoff (ST)", ec.cutoff_st));
    push(cutoff, field("Target rank range", ec.target_rank_range));
  }
  if (cutoff.length) {
    sections.push({ id: "cutoff", title: "Cutoff & benchmarks", fields: cutoff });
  }

  const programs = (exam.linkedPrograms ?? [])
    .map((p) => p.name?.trim())
    .filter(Boolean);
  if (programs.length) {
    sections.push({
      id: "programs",
      title: "Linked programs",
      fields: [{ label: "Programs", value: programs.join(", ") }],
    });
  }

  const interests = (exam.linkedCareerGoals ?? [])
    .map((g) => g.label?.trim())
    .filter(Boolean);
  if (interests.length) {
    sections.push({
      id: "interests",
      title: "Linked interests",
      fields: [{ label: "Career goals", value: interests.join(", ") }],
    });
  }

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
