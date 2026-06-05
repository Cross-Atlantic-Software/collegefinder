import type { Milestone, PhaseStatus, StudyPhase } from "@/components/dashboard/UpcomingDeadlinesCard";

export type Phase1ApplicationStart = {
  examId: number;
  examName: string;
  applicationStartDate: string;
};

export type Phase2ApplicationClose = {
  examId: number;
  examName: string;
  applicationCloseDate: string;
};

export type Phase3AdmitCardDate = {
  examId: number;
  examName: string;
  admitCardDate: string;
};

export type Phase4MockTestReminder = {
  examId: number;
  examName: string;
  examDate: string;
  mockTestDate: string;
};

export type Phase4MockTestSummary = {
  completedInWindow: number;
  totalInWindow: number;
};

export type Phase5ExamDate = {
  examId: number;
  examName: string;
  examDate: string;
};

export type Phase6ResultDate = {
  examId: number;
  examName: string;
  resultDate: string;
};

export type Phase7CounsellingDate = {
  examId: number;
  examName: string;
  counsellingDate: string;
};

export type JourneyPhaseDatesInput = {
  phase1ApplicationStarts?: Phase1ApplicationStart[];
  phase2ApplicationCloses?: Phase2ApplicationClose[];
  phase3AdmitCardDates?: Phase3AdmitCardDate[];
  phase4MockTestReminders?: Phase4MockTestReminder[];
  phase4MockTestSummary?: Phase4MockTestSummary;
  phase5ExamDates?: Phase5ExamDate[];
  phase6ResultDates?: Phase6ResultDate[];
  phase7CounsellingDates?: Phase7CounsellingDate[];
};

const todayIsoDate = () => new Date().toISOString().slice(0, 10);

const FALLBACK_PHASE_4: StudyPhase = {
  id: "phase-4",
  label: "Warm-Up Round",
  subtitle: "Mock Test",
  start: "2026-05-01",
  end: "2026-06-15",
  status: "upcoming",
  progress: 0,
  deadlines: [{ label: "Mock Test", start: "2026-05-01", end: "2026-06-15" }],
};

const FALLBACK_PHASE_7: StudyPhase = {
  id: "phase-7",
  label: "Choose Your Future",
  subtitle: "Counselling",
  start: "2026-09-01",
  end: "2026-11-30",
  status: "upcoming",
  progress: 0,
  deadlines: [{ label: "Counselling", start: "2026-09-01", end: "2026-11-30" }],
};

const FALLBACK_PHASE_1: StudyPhase = {
  id: "phase-1",
  label: "Your Journey Begins",
  subtitle: "Application Start",
  start: "2026-01-15",
  end: "2026-02-28",
  status: "upcoming",
  progress: 0,
  deadlines: [{ label: "Application Start", start: "2026-01-15", end: "2026-02-28" }],
};

const FALLBACK_PHASE_2: StudyPhase = {
  id: "phase-2",
  label: "Last Call to Apply",
  subtitle: "Application End",
  start: "2026-03-01",
  end: "2026-03-31",
  status: "upcoming",
  progress: 0,
  deadlines: [{ label: "Application End", start: "2026-03-01", end: "2026-03-31" }],
};

const FALLBACK_PHASE_3: StudyPhase = {
  id: "phase-3",
  label: "Grab Your Hall Ticket",
  subtitle: "Admit Card",
  start: "2026-04-01",
  end: "2026-04-30",
  status: "upcoming",
  progress: 0,
  deadlines: [{ label: "Admit Card", start: "2026-04-01", end: "2026-04-30" }],
};

const FALLBACK_PHASE_5: StudyPhase = {
  id: "phase-5",
  label: "The Big Day",
  subtitle: "Exam",
  start: "2026-06-16",
  end: "2026-07-20",
  status: "upcoming",
  progress: 0,
  deadlines: [{ label: "Exam", start: "2026-06-16", end: "2026-07-20" }],
};

const FALLBACK_PHASE_6: StudyPhase = {
  id: "phase-6",
  label: "Moment of Truth",
  subtitle: "Result",
  start: "2026-07-21",
  end: "2026-08-31",
  status: "upcoming",
  progress: 0,
  deadlines: [{ label: "Result", start: "2026-07-21", end: "2026-08-31" }],
};

function phaseStatusForDateRange(start: string, end: string): PhaseStatus {
  const today = todayIsoDate();
  if (end < today) return "done";
  if (start <= today && today <= end) return "active";
  return "upcoming";
}

function progressForDates(dates: string[]): number {
  if (dates.length === 0) return 0;
  const today = todayIsoDate();
  const passed = dates.filter((d) => d < today).length;
  return Math.round((passed / dates.length) * 100);
}

function buildDateStudyPhase(
  id: string,
  label: string,
  subtitle: string,
  items: Array<{ examName: string; date: string; label?: string; examId?: number }>,
  fallback: StudyPhase
): StudyPhase {
  if (items.length === 0) return fallback;

  const sorted = [...items].sort((a, b) => a.date.localeCompare(b.date));
  const dates = sorted.map((i) => i.date);
  const start = dates[0];
  const end = dates[dates.length - 1];

  return {
    id,
    label,
    subtitle,
    start,
    end,
    status: phaseStatusForDateRange(start, end),
    progress: progressForDates(dates),
    deadlines: sorted.map((item) => ({
      label: item.label ?? `${item.examName} · ${subtitle}`,
      start: item.date,
      end: item.date,
      examId: item.examId,
    })),
  };
}

export function buildPhase1StudyPhase(items: Phase1ApplicationStart[] | undefined): StudyPhase {
  return buildDateStudyPhase(
    "phase-1",
    "Your Journey Begins",
    "Application Start",
    (items ?? []).map((i) => ({
      examName: i.examName,
      date: i.applicationStartDate,
      examId: i.examId,
    })),
    FALLBACK_PHASE_1
  );
}

export function buildPhase2StudyPhase(items: Phase2ApplicationClose[] | undefined): StudyPhase {
  return buildDateStudyPhase(
    "phase-2",
    "Last Call to Apply",
    "Application End",
    (items ?? []).map((i) => ({
      examName: i.examName,
      date: i.applicationCloseDate,
      examId: i.examId,
    })),
    FALLBACK_PHASE_2
  );
}

export function buildPhase3StudyPhase(items: Phase3AdmitCardDate[] | undefined): StudyPhase {
  return buildDateStudyPhase(
    "phase-3",
    "Grab Your Hall Ticket",
    "Admit Card",
    (items ?? []).map((i) => ({
      examName: i.examName,
      date: i.admitCardDate,
      examId: i.examId,
    })),
    FALLBACK_PHASE_3
  );
}

export function buildPhase4StudyPhase(
  reminders: Phase4MockTestReminder[] | undefined,
  summary: Phase4MockTestSummary | undefined
): StudyPhase {
  const items = reminders ?? [];
  const totalInWindow = summary?.totalInWindow ?? 0;
  const completedInWindow = summary?.completedInWindow ?? 0;

  if (items.length === 0) {
    if (totalInWindow > 0) {
      return {
        ...FALLBACK_PHASE_4,
        status: completedInWindow >= totalInWindow ? "done" : FALLBACK_PHASE_4.status,
        progress: Math.round((completedInWindow / totalInWindow) * 100),
      };
    }
    return FALLBACK_PHASE_4;
  }

  const dates = items.map((i) => i.mockTestDate);
  const start = dates[0];
  const end = dates[dates.length - 1];
  const progress =
    totalInWindow > 0
      ? Math.round((completedInWindow / totalInWindow) * 100)
      : progressForDates(dates);

  return {
    id: "phase-4",
    label: "Warm-Up Round",
    subtitle: "Mock Test",
    start,
    end,
    status: phaseStatusForDateRange(start, end),
    progress,
    deadlines: items.map((item) => ({
      label: `${item.examName} · Mock test`,
      start: item.mockTestDate,
      end: item.mockTestDate,
      examId: item.examId,
    })),
  };
}

export function buildPhase5StudyPhase(items: Phase5ExamDate[] | undefined): StudyPhase {
  return buildDateStudyPhase(
    "phase-5",
    "The Big Day",
    "Exam",
    (items ?? []).map((i) => ({
      examName: i.examName,
      date: i.examDate,
      examId: i.examId,
    })),
    FALLBACK_PHASE_5
  );
}

export function buildPhase6StudyPhase(items: Phase6ResultDate[] | undefined): StudyPhase {
  return buildDateStudyPhase(
    "phase-6",
    "Moment of Truth",
    "Result",
    (items ?? []).map((i) => ({
      examName: i.examName,
      date: i.resultDate,
      examId: i.examId,
    })),
    FALLBACK_PHASE_6
  );
}

export function buildPhase7StudyPhase(items: Phase7CounsellingDate[] | undefined): StudyPhase {
  return buildDateStudyPhase(
    "phase-7",
    "Choose Your Future",
    "Counselling",
    (items ?? []).map((i) => ({
      examName: i.examName,
      date: i.counsellingDate,
      examId: i.examId,
    })),
    FALLBACK_PHASE_7
  );
}

export function buildJourneyPhases(dates?: JourneyPhaseDatesInput | Phase1ApplicationStart[]): StudyPhase[] {
  const input: JourneyPhaseDatesInput = Array.isArray(dates)
    ? { phase1ApplicationStarts: dates }
    : (dates ?? {});

  return [
    buildPhase1StudyPhase(input.phase1ApplicationStarts),
    buildPhase2StudyPhase(input.phase2ApplicationCloses),
    buildPhase3StudyPhase(input.phase3AdmitCardDates),
    buildPhase4StudyPhase(input.phase4MockTestReminders, input.phase4MockTestSummary),
    buildPhase5StudyPhase(input.phase5ExamDates),
    buildPhase6StudyPhase(input.phase6ResultDates),
    buildPhase7StudyPhase(input.phase7CounsellingDates),
  ];
}

export function buildPhase1Milestones(items: Phase1ApplicationStart[] | undefined): Milestone[] {
  if (!items?.length) return [];
  const today = todayIsoDate();
  return items.map((item) => ({
    id: `app-start-${item.examId}`,
    label: `${item.examName} · Application opens`,
    date: item.applicationStartDate,
    status: item.applicationStartDate < today ? "completed" : "pending",
  }));
}

export function buildPhase2Milestones(items: Phase2ApplicationClose[] | undefined): Milestone[] {
  if (!items?.length) return [];
  const today = todayIsoDate();
  return items.map((item) => ({
    id: `app-close-${item.examId}`,
    label: `${item.examName} · Application closes`,
    date: item.applicationCloseDate,
    status: item.applicationCloseDate < today ? "completed" : "pending",
  }));
}

export function buildPhase3Milestones(items: Phase3AdmitCardDate[] | undefined): Milestone[] {
  if (!items?.length) return [];
  const today = todayIsoDate();
  return items.map((item) => ({
    id: `admit-card-${item.examId}`,
    label: `${item.examName} · Admit card`,
    date: item.admitCardDate,
    status: item.admitCardDate < today ? "completed" : "pending",
  }));
}

export function buildPhase4Milestones(items: Phase4MockTestReminder[] | undefined): Milestone[] {
  if (!items?.length) return [];
  const today = todayIsoDate();
  return items.map((item) => ({
    id: `mock-${item.examId}-${item.mockTestDate}`,
    label: `${item.examName} · Mock test`,
    date: item.mockTestDate,
    status: item.mockTestDate < today ? "completed" : "pending",
  }));
}

export function buildPhase5Milestones(items: Phase5ExamDate[] | undefined): Milestone[] {
  if (!items?.length) return [];
  const today = todayIsoDate();
  return items.map((item) => ({
    id: `exam-day-${item.examId}`,
    label: `${item.examName} · Exam day`,
    date: item.examDate,
    status: item.examDate < today ? "completed" : "pending",
  }));
}

export function buildPhase6Milestones(items: Phase6ResultDate[] | undefined): Milestone[] {
  if (!items?.length) return [];
  const today = todayIsoDate();
  return items.map((item) => ({
    id: `result-${item.examId}`,
    label: `${item.examName} · Result`,
    date: item.resultDate,
    status: item.resultDate < today ? "completed" : "pending",
  }));
}

export function buildPhase7Milestones(items: Phase7CounsellingDate[] | undefined): Milestone[] {
  if (!items?.length) return [];
  const today = todayIsoDate();
  return items.map((item) => ({
    id: `counselling-${item.examId}`,
    label: `${item.examName} · Counselling`,
    date: item.counsellingDate,
    status: item.counsellingDate < today ? "completed" : "pending",
  }));
}

export function buildJourneyMilestones(dates?: JourneyPhaseDatesInput): Milestone[] {
  const phase1 = buildPhase1Milestones(dates?.phase1ApplicationStarts);
  const phase2 = buildPhase2Milestones(dates?.phase2ApplicationCloses);
  const phase3 = buildPhase3Milestones(dates?.phase3AdmitCardDates);
  const phase4 = buildPhase4Milestones(dates?.phase4MockTestReminders);
  const phase5 = buildPhase5Milestones(dates?.phase5ExamDates);
  const phase6 = buildPhase6Milestones(dates?.phase6ResultDates);
  const phase7 = buildPhase7Milestones(dates?.phase7CounsellingDates);
  const dynamic = [...phase1, ...phase2, ...phase3, ...phase4, ...phase5, ...phase6, ...phase7];
  return dynamic.length > 0 ? dynamic : [];
}
