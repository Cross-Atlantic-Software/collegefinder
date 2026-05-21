import type { DashboardCollege, DashboardCollegeProgram } from "@/api/auth/profile";
import { hasDisplayValue } from "@/lib/examDisplay";
import { resolveCollegeLogoSrc } from "@/lib/collegeLogo";

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
  items: Array<{ label: string; value: string }>;
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

function buildProgramItems(p: DashboardCollegeProgram): Array<{ label: string; value: string }> {
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
  pushItem(items, "Type", c.college_type);
  pushItem(items, "Location", c.college_location);
  pushItem(items, "City", c.city);
  pushItem(items, "State", c.state);
  pushItem(items, "Parent university", c.parent_university);
  pushItem(items, "Website", c.website);
  const logo = resolveCollegeLogoSrc(c);
  if (logo) pushItem(items, "Logo", logo);
  if (c.linked_exam_count != null) {
    pushNumber(items, "Linked exams (count)", c.linked_exam_count);
  }
  const desc = c.collegeDetails?.college_description?.trim();
  if (desc) pushItem(items, "Description", desc);
  const updated = formatCollegeDate(c.updated_at);
  const created = formatCollegeDate(c.created_at);
  if (updated) pushItem(items, "Last updated", updated);
  if (created) pushItem(items, "Created", created);
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

  if (c.linkedExams?.length) {
    sections.push({
      id: "linked-exams",
      title: "Recommended exams",
      items: c.linkedExams.map((e, i) => {
        const name = e.name?.trim() || "Exam";
        const code = e.code?.trim();
        return {
          label: c.linkedExams!.length > 1 ? `Exam ${i + 1}` : "Exam",
          value: code ? `${name} (${code})` : name,
        };
      }),
    });
  }

  if (c.programs?.length) {
    for (const p of c.programs) {
      const items = buildProgramItems(p);
      sections.push({
        id: `program-${p.id}`,
        title: `Program · ${programDisplayName(p)}`,
        items: items.length ? items : [{ label: "Program", value: programDisplayName(p) }],
      });
    }
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
      title: "Documents required (college level)",
      items: c.documentsRequired.map((d, i) => ({
        label: d.document_name?.trim() || `Document ${i + 1}`,
        value: "Required",
      })),
    });
  }

  if (c.counsellingSteps?.length) {
    const sorted = [...c.counsellingSteps].sort(
      (a, b) => (a.step_number ?? 0) - (b.step_number ?? 0)
    );
    sections.push({
      id: "counselling",
      title: "Counselling process (college level)",
      items: sorted.map((s) => ({
        label: s.step_number != null ? `Step ${s.step_number}` : "Step",
        value: s.description?.trim() || "—",
      })),
    });
  }

  return sections;
}
