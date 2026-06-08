import type { DashboardCollege, DashboardCollegeProgram } from "@/api/auth/profile";
import { hasDisplayValue } from "@/lib/examDisplay";

export function collegeLocationLine(c: DashboardCollege): string | null {
  const loc = c.college_location?.trim();
  if (loc) return loc;
  const cityState = [c.city, c.state].filter(Boolean).join(", ");
  return cityState || null;
}

export function collegeOverviewText(c: DashboardCollege): string | null {
  const desc = c.collegeDetails?.college_description?.trim();
  if (desc) return desc.length > 220 ? `${desc.slice(0, 217)}…` : desc;
  return collegeLocationLine(c);
}

/** Card body blurb — description only (location shown separately on the card). */
/** Stats line for exam-detail linked college cards. */
export function collegeExamDetailStatsLine(c: DashboardCollege): string | null {
  const parts = [
    c.placement_rate?.trim(),
    c.average_package?.trim(),
    c.program_fee?.trim(),
    c.program_count != null && Number.isFinite(Number(c.program_count))
      ? `${c.program_count} programs`
      : null,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

export function collegeCardOverviewText(c: DashboardCollege): string {
  const desc = c.collegeDetails?.college_description?.trim();
  if (desc) return desc.length > 220 ? `${desc.slice(0, 217)}…` : desc;
  return "View programs, linked exams, and admission details.";
}

export function collegeCardSubtitle(c: DashboardCollege): string | null {
  if (c.linkedExams?.length) {
    return c.linkedExams
      .map((e) => e.code?.trim() || e.name)
      .slice(0, 3)
      .join(" · ");
  }
  return c.college_type?.trim() || null;
}

export function formatCollegeDate(iso: string | null | undefined): string | null {
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

export function formatInrAmount(raw: number | string | null | undefined): string | null {
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function programDisplayName(p: DashboardCollegeProgram): string {
  const name = p.program_name?.trim();
  const branch = p.branch_course?.trim();
  if (name && branch) return `${name} (${branch})`;
  return name || branch || `Program #${p.program_id}`;
}

export type CollegeDetailSection = {
  id: string;
  title: string;
  kind?: "default" | "programs-table" | "documents-list" | "counselling-timeline";
  items: Array<{ label: string; value: string }>;
  programs?: DashboardCollegeProgram[];
  documents?: Array<{ document_name?: string | null }>;
  counsellingSteps?: Array<{ step_number?: number | null; description?: string | null }>;
};

function pushItem(
  items: Array<{ label: string; value: string }>,
  label: string,
  value: unknown
) {
  if (!hasDisplayValue(value)) return;
  items.push({ label, value: String(value).trim() });
}

function pushNumber(
  items: Array<{ label: string; value: string }>,
  label: string,
  value: number | null | undefined
) {
  if (value == null || !Number.isFinite(Number(value))) return;
  items.push({ label, value: String(value) });
}

export function buildProgramItems(p: DashboardCollegeProgram): Array<{ label: string; value: string }> {
  const items: Array<{ label: string; value: string }> = [];
  pushItem(items, "Program", p.program_name);
  pushItem(items, "Branch / course", p.branch_course);
  pushNumber(items, "Intake capacity", p.intake_capacity != null ? Number(p.intake_capacity) : null);
  if (p.duration_years != null && Number.isFinite(Number(p.duration_years))) {
    const unit = p.duration_unit?.trim() || "years";
    pushItem(items, "Duration", `${p.duration_years} ${unit}`);
  }
  pushItem(items, "Description", p.program_description);
  pushItem(items, "Key dates (summary)", p.key_dates_summary);
  pushItem(items, "Fee per semester", formatInrAmount(p.fee_per_semester));
  pushItem(items, "Total fee", formatInrAmount(p.total_fee));
  pushItem(items, "Placement", p.placement);
  pushItem(items, "Scholarship", p.scholarship);
  pushItem(items, "Counselling process", p.counselling_process);
  pushItem(items, "Documents required", p.documents_required);
  if (p.recommendedExamNames?.length) {
    pushItem(items, "Recommended exams", p.recommendedExamNames.join(", "));
  }
  pushItem(items, "Contact email", p.contact_email);
  pushItem(items, "Contact number", p.contact_number);
  pushItem(items, "Brochure", p.brochure_url);
  if (p.branch_id != null) pushNumber(items, "Branch ID", Number(p.branch_id));

  for (const row of p.previousCutoffs ?? []) {
    const exam = row.exam_name || row.exam_code || "Exam";
    const parts = [
      row.year != null ? `Year ${row.year}` : null,
      row.branch,
      row.category,
      row.cutoff_rank != null ? `Closing rank ${row.cutoff_rank}` : null,
    ].filter(Boolean);
    pushItem(items, `Previous cutoff · ${exam}`, parts.join(" · "));
  }
  for (const row of p.expectedCutoffs ?? []) {
    const exam = row.exam_name || row.exam_code || "Exam";
    const parts = [
      row.year != null ? `Year ${row.year}` : null,
      row.branch,
      row.category,
      row.expected_rank != null ? `Expected rank ${row.expected_rank}` : null,
    ].filter(Boolean);
    pushItem(items, `Expected cutoff · ${exam}`, parts.join(" · "));
  }
  for (const row of p.seatMatrix ?? []) {
    const parts = [
      row.year != null ? `Year ${row.year}` : null,
      row.branch,
      row.category,
      row.seat_count != null ? `${row.seat_count} seats` : null,
    ].filter(Boolean);
    pushItem(items, "Seat matrix", parts.join(" · "));
  }

  return items;
}

export function buildCollegeOverviewItems(c: DashboardCollege): Array<{ label: string; value: string }> {
  const items: Array<{ label: string; value: string }> = [];
  pushItem(items, "College name", c.college_name);
  pushItem(items, "Abbreviation", c.abbreviation);
  pushItem(items, "Location", c.college_location);
  pushItem(items, "City", c.city);
  pushItem(items, "State", c.state);
  pushItem(items, "Parent university", c.parent_university);
  pushNumber(items, "NIRF ranking", c.nirf_ranking != null ? Number(c.nirf_ranking) : null);
  pushItem(items, "Admission timeline", c.admission_timeline);
  pushNumber(items, "Program count", c.program_count != null ? Number(c.program_count) : null);
  pushItem(items, "Placement rate", c.placement_rate);
  pushItem(items, "Program fee", c.program_fee);
  pushItem(items, "Average package", c.average_package);
  const desc = c.collegeDetails?.college_description?.trim();
  if (desc) pushItem(items, "Description", desc);
  const updated = formatCollegeDate(c.updated_at);
  if (updated) pushItem(items, "Last updated", updated);
  return items;
}

export function buildCollegeDetailSections(c: DashboardCollege): CollegeDetailSection[] {
  const sections: CollegeDetailSection[] = [];

  const overview = buildCollegeOverviewItems(c);
  sections.push({ id: "overview", title: "College information", items: overview });

  if (c.majorProgramNames?.length) {
    sections.push({
      id: "major-programs",
      title: "Major programs (from profile)",
      items: c.majorProgramNames.map((name, i) => ({
        label: `Program ${i + 1}`,
        value: name,
      })),
    });
  }

  if (c.programs?.length) {
    sections.push({
      id: "programs",
      title: "Programs",
      kind: "programs-table",
      items: [],
      programs: c.programs,
    });
  }

  if (c.keyDates?.length) {
    const items: Array<{ label: string; value: string }> = [];
    for (const kd of c.keyDates) {
      const label = kd.event_name?.trim() || "Event";
      const date = formatCollegeDate(kd.event_date ?? undefined);
      pushItem(items, label, date || "—");
    }
    sections.push({ id: "key-dates", title: "Key dates (college level)", items });
  }

  if (c.documentsRequired?.length) {
    sections.push({
      id: "documents",
      title: "Documents required",
      kind: "documents-list",
      items: [],
      documents: c.documentsRequired,
    });
  }

  if (c.counsellingSteps?.length) {
    const sorted = [...c.counsellingSteps].sort(
      (a, b) => (a.step_number ?? 0) - (b.step_number ?? 0)
    );
    sections.push({
      id: "counselling",
      title: "Counselling process",
      kind: "counselling-timeline",
      items: [],
      counsellingSteps: sorted,
    });
  }

  return sections;
}
