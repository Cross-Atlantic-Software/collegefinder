"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { BiCalendarAlt, BiInfoCircle, BiListUl, BiSearch, BiTargetLock } from "react-icons/bi";
import { examDetailHref } from "@/lib/examDisplay";

export type PhaseStatus = "done" | "active" | "upcoming" | "overdue";
export type MilestoneStatus = "completed" | "pending" | "overdue";
type ViewMode = "timeline" | "board";

export type StudyPhase = {
  id: string;
  label: string;
  /** Short phase tag, e.g. "Application Start". */
  subtitle?: string;
  start: string;
  end: string;
  status: PhaseStatus;
  progress: number;
  deadlines?: Array<{ label: string; start: string; end: string; examId?: number }>;
};

export type Milestone = {
  id: string;
  label: string;
  date: string;
  status: MilestoneStatus;
  kind?: "exam";
};

const FILTER_OPTIONS: PhaseStatus[] = ["done", "active", "upcoming", "overdue"];

const STATUS_LABEL: Record<PhaseStatus, string> = {
  done: "Done",
  active: "Active",
  upcoming: "Upcoming",
  overdue: "Overdue",
};

const phaseStatusClass: Record<PhaseStatus, string> = {
  done: "bg-[#FAD53C]/30 text-[#6b5300] border border-[#FAD53C]/50 dark:bg-[#FAD53C]/15 dark:text-[#FAD53C] dark:border-[#FAD53C]/30",
  active: "bg-[#FAD53C] text-[#5c3d00] border border-[#e6c000] shadow-[0_1px_6px_rgba(250,213,60,0.45)] relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[custom-shimmer_2.2s_ease-in-out_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/55 before:to-transparent",
  upcoming: "bg-[#FAD53C]/10 border border-dashed border-[#FAD53C]/60 text-[#8a6d00] dark:bg-[#FAD53C]/5 dark:border-[#FAD53C]/40 dark:text-[#FAD53C]/70",
  overdue: "bg-[#18100a] text-[#FAD53C] border border-[#FAD53C]/30",
};

const phaseStatusAccent: Record<PhaseStatus, string> = {
  done:     "bg-[#FAD53C]/60",
  active:   "bg-[#FAD53C]",
  upcoming: "bg-[#FAD53C]/30",
  overdue:  "bg-[#FAD53C]",
};

const milestoneStatusClass: Record<MilestoneStatus, string> = {
  completed: "bg-[#FAD53C] border-[#b8960c]",
  pending:   "bg-white border-slate-400 dark:bg-slate-700 dark:border-slate-500",
  overdue:   "bg-black border-[#FAD53C]",
};

const DAY_MS = 1000 * 60 * 60 * 24;
const TIMELINE_PAST_PADDING_MONTHS = 2;
const TIMELINE_FUTURE_PADDING_MONTHS = 6;
const MONTH_ZOOM_PADDING_DAYS = 5;
const MONTH_ZOOM_PX_PER_DAY = 32;
const BASE_PX_PER_DAY = 10;
const MIN_DEADLINE_BAR_PX = 140;
const MIN_MONTH_TRACK_PX = 360;

const parseDate = (value: string) => new Date(`${value}T00:00:00`);

const dayOffset = (start: Date, end: Date) =>
  Math.max(0, Math.floor((end.getTime() - start.getTime()) / DAY_MS));

const durationDays = (start: Date, end: Date) => dayOffset(start, end) + 1;

type FocusedMonth = { year: number; month: number };

type PhaseTimelineModel = {
  phases: Array<
    StudyPhase & {
      startDate: Date;
      endDate: Date;
      leftPct: number;
      widthPct: number;
      spanDays: number;
      computedDeadlines?: Array<
        NonNullable<StudyPhase["deadlines"]>[number] & {
          startDate: Date;
          endDate: Date;
          spanDays: number;
          leftPct: number;
          widthPct: number;
          examId?: number;
        }
      >;
    }
  >;
  milestones: Array<
    Milestone & {
      dateValue: Date;
      leftPct: number;
    }
  >;
  timelineStart: Date;
  timelineEnd: Date;
  totalTimelineDays: number;
  monthTicks: Array<{ id: string; label: string; leftPct: number }>;
};

function buildPhaseTimelineModel(
  phases: StudyPhase[],
  milestones: Milestone[],
  timelineStart: Date,
  timelineEnd: Date,
): PhaseTimelineModel {
  const raw = phases.map((phase) => ({
    ...phase,
    startDate: parseDate(phase.start),
    endDate: parseDate(phase.end),
  }));

  const totalTimelineDays = Math.max(1, durationDays(timelineStart, timelineEnd));

  const computedPhases = raw.map((phase) => {
    const phaseStart =
      phase.startDate.getTime() < timelineStart.getTime() ? timelineStart : phase.startDate;
    const phaseEnd =
      phase.endDate.getTime() < timelineStart.getTime() ? timelineStart : phase.endDate;
    const offset = dayOffset(timelineStart, phaseStart);
    const spanDays = durationDays(phaseStart, phaseEnd);

    const computedDeadlines = phase.deadlines?.map((deadline) => {
      const rawStart = parseDate(deadline.start);
      const rawEnd = parseDate(deadline.end);
      const deadlineStart =
        rawStart.getTime() < timelineStart.getTime() ? timelineStart : rawStart;
      const deadlineEnd = rawEnd.getTime() < timelineStart.getTime() ? timelineStart : rawEnd;
      const deadlineOffset = dayOffset(timelineStart, deadlineStart);
      const deadlineSpan = durationDays(deadlineStart, deadlineEnd);

      return {
        ...deadline,
        startDate: rawStart,
        endDate: rawEnd,
        spanDays: deadlineSpan,
        leftPct: (deadlineOffset / totalTimelineDays) * 100,
        widthPct: (deadlineSpan / totalTimelineDays) * 100,
      };
    });

    return {
      ...phase,
      leftPct: (offset / totalTimelineDays) * 100,
      widthPct: (spanDays / totalTimelineDays) * 100,
      spanDays,
      computedDeadlines,
    };
  });

  const mappedMilestones = milestones.map((item) => {
    const date = parseDate(item.date);
    const offset = dayOffset(timelineStart, date);

    return {
      ...item,
      dateValue: date,
      leftPct: (offset / totalTimelineDays) * 100,
    };
  });

  const monthTicks: PhaseTimelineModel["monthTicks"] = [];
  const cursor = new Date(timelineStart.getFullYear(), timelineStart.getMonth(), 1);
  if (cursor < timelineStart) {
    cursor.setMonth(cursor.getMonth() + 1);
  }

  while (cursor <= timelineEnd) {
    const isYearBoundary = cursor.getMonth() === 0;
    monthTicks.push({
      id: `${cursor.getFullYear()}-${cursor.getMonth()}`,
      label: isYearBoundary
        ? cursor.toLocaleDateString("en-IN", { month: "short", year: "2-digit" })
        : cursor.toLocaleDateString("en-IN", { month: "short" }),
      leftPct: (dayOffset(timelineStart, cursor) / totalTimelineDays) * 100,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return {
    phases: computedPhases,
    milestones: mappedMilestones,
    timelineStart,
    timelineEnd,
    totalTimelineDays,
    monthTicks,
  };
}

function parseMonthTickId(tickId: string): FocusedMonth | null {
  const [yearStr, monthStr] = tickId.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!Number.isFinite(year) || !Number.isFinite(month)) return null;
  return { year, month };
}

function buildMonthZoomRange(
  focusedMonth: FocusedMonth,
  bounds: { start: Date; end: Date },
): { timelineStart: Date; timelineEnd: Date } {
  const monthStart = new Date(focusedMonth.year, focusedMonth.month, 1);
  const monthEnd = new Date(focusedMonth.year, focusedMonth.month + 1, 0);

  const timelineStart = new Date(monthStart);
  timelineStart.setDate(timelineStart.getDate() - MONTH_ZOOM_PADDING_DAYS);
  timelineStart.setHours(0, 0, 0, 0);

  const timelineEnd = new Date(monthEnd);
  timelineEnd.setDate(timelineEnd.getDate() + MONTH_ZOOM_PADDING_DAYS);
  timelineEnd.setHours(0, 0, 0, 0);

  if (timelineStart.getTime() < bounds.start.getTime()) {
    timelineStart.setTime(bounds.start.getTime());
  }
  if (timelineEnd.getTime() > bounds.end.getTime()) {
    timelineEnd.setTime(bounds.end.getTime());
  }

  return { timelineStart, timelineEnd };
}

function buildYearRange(
  year: number,
  bounds: { start: Date; end: Date },
): { timelineStart: Date; timelineEnd: Date } {
  const timelineStart = new Date(year, 0, 1);
  const timelineEnd = new Date(year, 11, 31);
  timelineStart.setHours(0, 0, 0, 0);
  timelineEnd.setHours(0, 0, 0, 0);

  if (timelineStart.getTime() < bounds.start.getTime()) {
    timelineStart.setTime(bounds.start.getTime());
  }
  if (timelineEnd.getTime() > bounds.end.getTime()) {
    timelineEnd.setTime(bounds.end.getTime());
  }

  return { timelineStart, timelineEnd };
}

function collectAvailableYears(phases: StudyPhase[], milestones: Milestone[]) {
  const years = new Set<number>();

  const addYear = (value: string) => {
    const date = parseDate(value);
    if (!Number.isNaN(date.getTime())) {
      years.add(date.getFullYear());
    }
  };

  phases.forEach((phase) => {
    addYear(phase.start);
    addYear(phase.end);
    phase.deadlines?.forEach((deadline) => {
      addYear(deadline.start);
      addYear(deadline.end);
    });
  });
  milestones.forEach((milestone) => addYear(milestone.date));

  if (years.size === 0) {
    years.add(new Date().getFullYear());
  }

  return [...years].sort((a, b) => a - b);
}

const formatDate = (date: Date) =>
  date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

const clampPct = (value: number) => Math.min(100, Math.max(0, value));

const defaultPhaseId = (phases: StudyPhase[]) =>
  phases.find((phase) => phase.id === "phase-1")?.id ?? phases[0]?.id ?? null;

const deadlineTooltipClass =
  "rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xl dark:border-slate-700 dark:bg-slate-900 relative";

type UpcomingDeadlinesCardProps = {
  phases: StudyPhase[];
  milestones: Milestone[];
  title?: string;
};

export default function UpcomingDeadlinesCard({
  phases,
  milestones,
  title = "Execution Planner",
}: UpcomingDeadlinesCardProps) {
  const router = useRouter();
  const [activeFilters, setActiveFilters] = useState<Set<PhaseStatus>>(
    new Set(FILTER_OPTIONS),
  );
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>("phase-1");
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);
  const [animateIn, setAnimateIn] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [showMilestones, setShowMilestones] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");
  const [focusedMonth, setFocusedMonth] = useState<FocusedMonth | null>(null);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [isYearMenuOpen, setIsYearMenuOpen] = useState(false);
  const [hoveredDeadlineKey, setHoveredDeadlineKey] = useState<string | null>(null);
  const yearMenuRef = useRef<HTMLDivElement>(null);
  const hoverClearTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (selectedPhaseId && phases.some((phase) => phase.id === selectedPhaseId)) {
      return;
    }

    setSelectedPhaseId(defaultPhaseId(phases));
  }, [phases, selectedPhaseId]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setAnimateIn(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(
    () => () => {
      if (hoverClearTimerRef.current) {
        window.clearTimeout(hoverClearTimerRef.current);
      }
    },
    [],
  );

  const showDeadlineTooltip = (key: string) => {
    if (hoverClearTimerRef.current) {
      window.clearTimeout(hoverClearTimerRef.current);
      hoverClearTimerRef.current = null;
    }
    setHoveredDeadlineKey(key);
  };

  const hideDeadlineTooltip = (key: string) => {
    if (hoverClearTimerRef.current) {
      window.clearTimeout(hoverClearTimerRef.current);
    }
    hoverClearTimerRef.current = window.setTimeout(() => {
      setHoveredDeadlineKey((current) => (current === key ? null : current));
      hoverClearTimerRef.current = null;
    }, 120);
  };

  const phaseModels = useMemo(() => {
    const startCandidates = phases.map((phase) => parseDate(phase.start).getTime());
    const endCandidates = phases.map((phase) => parseDate(phase.end).getTime());
    const milestoneDates = milestones.map((item) => parseDate(item.date).getTime());

    const fallback = Date.now();
    const rawStartPoint = new Date(Math.min(...startCandidates, ...milestoneDates, fallback));
    const rawEndPoint = new Date(Math.max(...endCandidates, ...milestoneDates, fallback));

    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    const timelineStart = new Date(
      rawStartPoint.getFullYear(),
      rawStartPoint.getMonth() - TIMELINE_PAST_PADDING_MONTHS,
      1,
    );
    const timelineEndMax = new Date(
      Math.max(
        rawEndPoint.getTime(),
        new Date(todayDate).setMonth(todayDate.getMonth() + TIMELINE_FUTURE_PADDING_MONTHS),
      ),
    );
    const timelineEnd = new Date(timelineEndMax.getFullYear(), timelineEndMax.getMonth() + 1, 0);

    return buildPhaseTimelineModel(phases, milestones, timelineStart, timelineEnd);
  }, [milestones, phases]);

  const availableYears = useMemo(
    () => collectAvailableYears(phases, milestones),
    [milestones, phases],
  );

  useEffect(() => {
    if (availableYears.includes(selectedYear)) return;
    const currentYear = new Date().getFullYear();
    setSelectedYear(
      availableYears.includes(currentYear)
        ? currentYear
        : (availableYears[availableYears.length - 1] ?? currentYear),
    );
  }, [availableYears, selectedYear]);

  useEffect(() => {
    if (!isYearMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!yearMenuRef.current?.contains(event.target as Node)) {
        setIsYearMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isYearMenuOpen]);

  const yearTimeline = useMemo(() => {
    const { timelineStart, timelineEnd } = buildYearRange(selectedYear, {
      start: phaseModels.timelineStart,
      end: phaseModels.timelineEnd,
    });

    return buildPhaseTimelineModel(phases, milestones, timelineStart, timelineEnd);
  }, [milestones, phaseModels.timelineEnd, phaseModels.timelineStart, phases, selectedYear]);

  const activeTimeline = useMemo(() => {
    if (!focusedMonth) return yearTimeline;

    const { timelineStart, timelineEnd } = buildMonthZoomRange(focusedMonth, {
      start: yearTimeline.timelineStart,
      end: yearTimeline.timelineEnd,
    });

    return buildPhaseTimelineModel(phases, milestones, timelineStart, timelineEnd);
  }, [focusedMonth, milestones, phases, yearTimeline]);

  useEffect(() => {
    if (!scrollContainerRef.current || viewMode !== "timeline") return;

    const container = scrollContainerRef.current;
    const timer = setTimeout(() => {
      if (focusedMonth) {
        container.scrollLeft = 0;
        return;
      }

      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      const pastWindow = new Date(todayDate.getTime());
      pastWindow.setDate(pastWindow.getDate() - 45);
      const yearStart = new Date(selectedYear, 0, 1);
      const scrollAnchor =
        todayDate.getFullYear() === selectedYear &&
        todayDate.getTime() >= activeTimeline.timelineStart.getTime() &&
        todayDate.getTime() <= activeTimeline.timelineEnd.getTime()
          ? pastWindow
          : yearStart;
      const offsetDays = dayOffset(activeTimeline.timelineStart, scrollAnchor);
      const offsetPct = Math.max(0, offsetDays / activeTimeline.totalTimelineDays);

      if (container.scrollWidth > container.clientWidth) {
        container.scrollLeft = offsetPct * container.scrollWidth;
      } else {
        container.scrollLeft = 0;
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [activeTimeline, focusedMonth, selectedYear, viewMode]);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredPhases = useMemo(
    () =>
      activeTimeline.phases.filter(
        (phase) =>
          activeFilters.has(phase.status) &&
          (!normalizedQuery ||
            phase.label.toLowerCase().includes(normalizedQuery) ||
            phase.subtitle?.toLowerCase().includes(normalizedQuery)),
      ),
    [activeFilters, activeTimeline.phases, normalizedQuery],
  );

  const visibleMilestones = useMemo(() => {
    const queryMatches = (label: string) =>
      !normalizedQuery || label.toLowerCase().includes(normalizedQuery);

    return activeTimeline.milestones
      .filter((item) => queryMatches(item.label))
      .filter((item) => showMilestones || item.status !== "completed")
      .sort((a, b) => a.dateValue.getTime() - b.dateValue.getTime());
  }, [activeTimeline.milestones, normalizedQuery, showMilestones]);

  const phaseBuckets = useMemo(() => {
    const bucketMap: Record<PhaseStatus, typeof filteredPhases> = {
      done: [],
      active: [],
      upcoming: [],
      overdue: [],
    };

    filteredPhases.forEach((phase) => bucketMap[phase.status].push(phase));
    return bucketMap;
  }, [filteredPhases]);

  const positionedMilestones = useMemo(() => {
    const lanes: number[] = [];
    const minGapPct = 4;

    return visibleMilestones.map((milestone) => {
      let laneIndex = lanes.findIndex((lastLeftPct) => milestone.leftPct - lastLeftPct >= minGapPct);
      if (laneIndex === -1) {
        lanes.push(milestone.leftPct);
        laneIndex = lanes.length - 1;
      } else {
        lanes[laneIndex] = milestone.leftPct;
      }

      return { ...milestone, laneIndex };
    });
  }, [visibleMilestones]);

  const milestoneLaneCount = useMemo(
    () => Math.max(1, ...positionedMilestones.map((item) => item.laneIndex + 1)),
    [positionedMilestones],
  );

  const selectedMilestone =
    visibleMilestones.find((item) => item.id === selectedMilestoneId) ?? null;

  const nextExam = phaseModels.milestones.find((item) => item.kind === "exam")?.dateValue;
  const daysToExam = nextExam ? Math.max(0, dayOffset(new Date(), nextExam)) : null;

  const todayMarkerLeftPct = useMemo(() => {
    const offset = dayOffset(activeTimeline.timelineStart, new Date());
    return clampPct((offset / activeTimeline.totalTimelineDays) * 100);
  }, [activeTimeline.timelineStart, activeTimeline.totalTimelineDays]);

  const selectedDisplayPhase = activeTimeline.phases.find((phase) => phase.id === selectedPhaseId);
  const isMonthZoomed = focusedMonth !== null;

  const deadlineDensity = useMemo(() => {
    const deadlines = selectedDisplayPhase?.computedDeadlines ?? [];
    if (deadlines.length === 0) {
      return { busiestMonthCount: 0, maxSameDayCount: 0, totalCount: 0 };
    }

    const monthCounts = new Map<string, number>();
    const dayCounts = new Map<string, number>();

    for (const deadline of deadlines) {
      const monthKey = `${deadline.startDate.getFullYear()}-${deadline.startDate.getMonth()}`;
      monthCounts.set(monthKey, (monthCounts.get(monthKey) ?? 0) + 1);

      const dayKey = deadline.startDate.toISOString().slice(0, 10);
      dayCounts.set(dayKey, (dayCounts.get(dayKey) ?? 0) + 1);
    }

    return {
      busiestMonthCount: Math.max(0, ...monthCounts.values()),
      maxSameDayCount: Math.max(0, ...dayCounts.values()),
      totalCount: deadlines.length,
    };
  }, [selectedDisplayPhase]);

  const timelineMinWidthPx = useMemo(() => {
    const monthCount = Math.max(1, activeTimeline.monthTicks.length);
    const perDayScale =
      activeTimeline.totalTimelineDays * (isMonthZoomed ? MONTH_ZOOM_PX_PER_DAY : BASE_PX_PER_DAY);

    const densityFactor = Math.max(
      deadlineDensity.busiestMonthCount,
      deadlineDensity.maxSameDayCount,
      1,
    );
    const minPxPerMonth = Math.max(MIN_MONTH_TRACK_PX, densityFactor * MIN_DEADLINE_BAR_PX);
    const perMonthScale = monthCount * minPxPerMonth;

    const zoomedDeadlineScale = isMonthZoomed
      ? Math.max(deadlineDensity.totalCount, densityFactor) * MIN_DEADLINE_BAR_PX
      : 0;

    return Math.max(960, perDayScale, perMonthScale, zoomedDeadlineScale);
  }, [
    activeTimeline.monthTicks.length,
    activeTimeline.totalTimelineDays,
    deadlineDensity.busiestMonthCount,
    deadlineDensity.maxSameDayCount,
    deadlineDensity.totalCount,
    isMonthZoomed,
  ]);

  const minDeadlineWidthPct = useMemo(() => {
    const minBarPx = selectedDisplayPhase
      ? MIN_DEADLINE_BAR_PX
      : isMonthZoomed
        ? MIN_DEADLINE_BAR_PX
        : 120;

    return clampPct((minBarPx / timelineMinWidthPx) * 100);
  }, [isMonthZoomed, selectedDisplayPhase, timelineMinWidthPx]);

  const focusedMonthLabel = useMemo(() => {
    if (!focusedMonth) return null;
    return new Date(focusedMonth.year, focusedMonth.month, 1).toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });
  }, [focusedMonth]);

  const toggleMonthFocus = (tickId: string) => {
    const parsed = parseMonthTickId(tickId);
    if (!parsed) return;

    setFocusedMonth((current) =>
      current?.year === parsed.year && current.month === parsed.month ? null : parsed,
    );
  };

  const handleSelectYear = (year: number) => {
    setSelectedYear(year);
    setFocusedMonth(null);
    setIsYearMenuOpen(false);
  };

  const handleSelectPhase = (phaseId: string) => {
    setSelectedPhaseId(phaseId);
    setSelectedMilestoneId(null);

    const phase = activeTimeline.phases.find((item) => item.id === phaseId);
    if (!phase || !scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const targetLeftPct =
      phase.computedDeadlines && phase.computedDeadlines.length > 0
        ? phase.computedDeadlines[0].leftPct
        : phase.leftPct;
    const targetPx = (targetLeftPct / 100) * container.scrollWidth - container.clientWidth * 0.15;
    container.scrollTo({ left: Math.max(0, targetPx), behavior: "smooth" });
  };

  const handleViewDeadlineDetails = (
    examId: number | undefined,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();
    if (!examId) return;
    router.push(examDetailHref(examId, "execution-planner"));
  };

  const toggleFilter = (status: PhaseStatus) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes custom-shimmer {
          100% { transform: translateX(100%); }
        }
      `}} />
      <article className="flex xl:h-full xl:min-h-0 flex-col xl:overflow-hidden rounded-2xl bg-white p-3 dark:bg-slate-900">
      <div className="shrink-0 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-1.5">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
          <span className="group/info relative inline-flex">
            <BiInfoCircle
              className="h-4 w-4 cursor-help text-slate-400 outline-none transition-colors hover:text-slate-600 focus-visible:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
              tabIndex={0}
              aria-label="Timeline tip"
            />
            <span
              role="tooltip"
              className="pointer-events-none invisible absolute left-0 top-full z-50 mt-1.5 w-56 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[10px] leading-relaxed text-slate-600 opacity-0 shadow-lg transition-opacity duration-150 group-hover/info:visible group-hover/info:opacity-100 group-focus-within/info:visible group-focus-within/info:opacity-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              Tip: click a month label to expand crowded dates.
            </span>
          </span>
        </div>
        <div className="flex items-center">
          <div ref={yearMenuRef} className="relative">
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={isYearMenuOpen}
              onClick={() => setIsYearMenuOpen((open) => !open)}
              className="flex min-w-[64px] items-center justify-between gap-1 rounded-lg border border-slate-300 bg-white px-2 py-0.5 text-xs font-semibold text-slate-700 shadow-sm transition-all duration-200 ease-out hover:bg-slate-50 hover:shadow dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <span>{selectedYear}</span>
              <svg
                className={`h-3.5 w-3.5 text-slate-400 transition-transform dark:text-slate-500 ${
                  isYearMenuOpen ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isYearMenuOpen ? (
              <div
                role="listbox"
                aria-label="Select year"
                className="absolute right-0 top-full z-50 mt-1 max-h-60 w-max min-w-[112px] overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900"
              >
                {availableYears.map((year) => {
                  const isSelected = year === selectedYear;
                  return (
                    <button
                      key={year}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelectYear(year)}
                      className={`block w-full px-3 py-2 text-left text-sm font-medium transition-colors ${
                        isSelected
                          ? "bg-[#FAD53C]/25 text-slate-900 dark:bg-[#FAD53C]/10 dark:text-slate-100"
                          : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                      }`}
                    >
                      {year}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {viewMode === "timeline" ? (
        <div className="mt-0.5 flex xl:min-h-0 flex-1 flex-col xl:overflow-hidden rounded-xl border border-slate-200/80 bg-white px-3 dark:border-slate-700/60 dark:bg-slate-900">
          {/* Zoom banner — only when a month is expanded; sits ABOVE the grid so it doesn't shift alignment */}
          {focusedMonth ? (
            <div className="shrink-0 mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                Expanded view: <span className="text-slate-700 dark:text-slate-200">{focusedMonthLabel}</span>
              </p>
              <button
                type="button"
                onClick={() => setFocusedMonth(null)}
                className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Full timeline
              </button>
            </div>
          ) : null}

          <div className="grid xl:min-h-0 flex-1 overflow-hidden grid-cols-[136px_1fr] gap-0 sm:grid-cols-[160px_1fr]">
            {/* ── Phase list sidebar ── */}
            <div className="border-r border-slate-200 pr-2 dark:border-slate-700">
              {/* Header spacer — matches month header row exactly */}
              <div className="flex h-8 items-end pb-1">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">Phases</p>
              </div>
              {/* Phase rows — h-10 each, no extra gap */}
              <div>
                {filteredPhases.map((phase) => {
                  const isSelected = selectedPhaseId === phase.id;
                  return (
                  <div key={phase.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectPhase(phase.id)}
                      className={`group flex h-7 w-full items-center gap-2 rounded-lg px-2 text-left transition-all duration-150 ease-out ${
                        isSelected
                          ? "bg-[#FAD53C]/15 dark:bg-[#FAD53C]/10"
                          : "bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      }`}
                      title={`${phase.label}${phase.subtitle ? ` · ${phase.subtitle}` : ""} (${formatDate(phase.startDate)} - ${formatDate(phase.endDate)})`}
                    >
                      {/* Left status accent */}
                      <span className={`h-6 w-[3px] shrink-0 rounded-full transition-all duration-200 ${phaseStatusAccent[phase.status]} ${isSelected ? "opacity-100" : "opacity-40 group-hover:opacity-70"}`} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-semibold leading-tight text-slate-800 dark:text-slate-100">
                          {phase.label}
                        </p>
                      </div>
                      {phase.status === "overdue" && (
                        <span className="shrink-0 rounded-full bg-black px-1.5 py-[2px] text-[7px] font-bold uppercase tracking-wide text-[#FAD53C]">
                          Late
                        </span>
                      )}
                    </button>
                  </div>
                );})}
              </div>
            </div>

            {/* ── Timeline area ── */}
            <div className="min-w-0">
              <div
                ref={scrollContainerRef}
                className="overflow-x-auto pl-3 [scrollbar-width:thin] [scrollbar-color:#94a3b8_transparent] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-400/50"
              >
                <div style={{ minWidth: `${timelineMinWidthPx}px` }}>
                  {/* Month header row — same h-8 as sidebar header */}
                  <div className="relative h-8 border-b border-slate-200 dark:border-slate-700">
                    {activeTimeline.monthTicks.map((tick, idx) => {
                      const tickMonth = parseMonthTickId(tick.id);
                      const isFocused =
                        !!focusedMonth &&
                        !!tickMonth &&
                        focusedMonth.year === tickMonth.year &&
                        focusedMonth.month === tickMonth.month;

                      return (
                        <button
                          key={tick.id}
                          type="button"
                          onClick={() => toggleMonthFocus(tick.id)}
                          title={isFocused ? "Click to return to full timeline" : "Click to expand this month"}
                          className={`absolute bottom-1 rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wide transition-all duration-150 ${
                            isFocused
                              ? "bg-[#FAD53C] text-black shadow-sm"
                              : "text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                          } ${idx === 0 ? "left-0" : "-translate-x-1/2"}`}
                          style={idx === 0 ? undefined : { left: `${tick.leftPct}%` }}
                        >
                          {tick.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Timeline rows — same h-10, no gap, to match sidebar exactly */}
                  <div className="relative">
                    <div className="relative">
                      {filteredPhases.map((phase, index) => {
                        const displayWidth = Math.max(phase.widthPct, minDeadlineWidthPct);
                        const tooltipBelow = index <= 1;
                        const isSelected = selectedPhaseId === phase.id;
                        const isEvenRow = index % 2 === 0;

                        return (
                          <div
                            key={phase.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => handleSelectPhase(phase.id)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                handleSelectPhase(phase.id);
                              }
                            }}
                            className={`group relative h-7 cursor-pointer overflow-visible border-b border-slate-100 transition-colors duration-200 ease-out last:border-b-0 dark:border-slate-800 ${
                              isSelected
                                ? "bg-[#FAD53C]/10 dark:bg-[#FAD53C]/5"
                                : isEvenRow
                                  ? "bg-slate-50/50 hover:bg-[#FAD53C]/5 dark:bg-slate-800/20 dark:hover:bg-[#FAD53C]/5"
                                  : "hover:bg-[#FAD53C]/5 dark:hover:bg-[#FAD53C]/5"
                            }`}
                          >
                            {isSelected && phase.computedDeadlines && phase.computedDeadlines.length > 0 ? (
                              phase.computedDeadlines.map((deadline, deadlineIdx) => {
                                const deadlineWidth = Math.max(deadline.widthPct, minDeadlineWidthPct);
                                const overlapsAnother = phase.computedDeadlines!.some(
                                  (other, otherIdx) =>
                                    otherIdx !== deadlineIdx &&
                                    deadline.leftPct < other.leftPct + other.widthPct &&
                                    other.leftPct < deadline.leftPct + deadline.widthPct,
                                );
                                const overlappingBeforeCount = phase.computedDeadlines!.filter(
                                  (other, otherIdx) =>
                                    otherIdx < deadlineIdx &&
                                    deadline.leftPct < other.leftPct + other.widthPct &&
                                    other.leftPct < deadline.leftPct + deadline.widthPct,
                                ).length;
                                const overlapLane = overlapsAnother ? overlappingBeforeCount % 3 : 1;
                                const overlapClass = overlapsAnother
                                  ? "shadow-[0_2px_8px_rgba(15,23,42,0.16)] ring-1 ring-black/10 dark:shadow-[0_2px_8px_rgba(0,0,0,0.35)] dark:ring-white/10"
                                  : "";
                                const overlapOffsetPx = overlapsAnother ? (overlapLane - 1) * 5 : 0;
                                const deadlineHoverKey = `${phase.id}-${deadlineIdx}`;
                                const isDeadlineHovered = hoveredDeadlineKey === deadlineHoverKey;

                                return (
                                  <div
                                    key={deadlineIdx}
                                    className="absolute top-1/2 h-6 -translate-y-1/2"
                                    onMouseEnter={() => showDeadlineTooltip(deadlineHoverKey)}
                                    onMouseLeave={() => hideDeadlineTooltip(deadlineHoverKey)}
                                    style={{
                                      left: `${deadline.leftPct}%`,
                                      width: `${animateIn ? deadlineWidth : 0}%`,
                                      marginTop: `${overlapOffsetPx}px`,
                                      zIndex: overlapsAnother ? 240 + overlapLane * 10 + deadlineIdx : 30,
                                    }}
                                  >
                                    <div
                                      className={`absolute left-1/2 -translate-x-1/2 z-[9999] w-max min-w-[220px] transition-all duration-200 ${
                                        isDeadlineHovered
                                          ? "visible pointer-events-auto opacity-100"
                                          : "invisible pointer-events-none opacity-0"
                                      } ${
                                        tooltipBelow
                                          ? `top-full pt-2 ${isDeadlineHovered ? "translate-y-1" : ""}`
                                          : `bottom-full pb-2 ${isDeadlineHovered ? "-translate-y-1" : ""}`
                                      }`}
                                      onMouseEnter={() => showDeadlineTooltip(deadlineHoverKey)}
                                      onMouseLeave={() => hideDeadlineTooltip(deadlineHoverKey)}
                                    >
                                      <div className={deadlineTooltipClass}>
                                        <div
                                          className={`absolute left-1/2 h-3.5 w-3.5 -translate-x-1/2 rotate-45 rounded-sm bg-white dark:bg-slate-900 ${
                                            tooltipBelow
                                              ? "-top-1.5 border-t border-l border-slate-200/80 shadow-[-2px_-2px_2px_-1px_rgba(0,0,0,0.1)] dark:border-slate-700/80 dark:shadow-none"
                                              : "-bottom-1.5 border-b border-r border-slate-200/80 shadow-[2px_2px_2px_-1px_rgba(0,0,0,0.1)] dark:border-slate-700/80 dark:shadow-none"
                                          }`}
                                        />
                                        <h4 className="text-[13px] font-bold text-slate-900 dark:text-slate-100">
                                          {deadline.label}
                                        </h4>
                                        <div className="mt-2 flex items-center justify-between gap-4 text-[11px] text-slate-500 dark:text-slate-400">
                                          <span>
                                            {formatDate(deadline.startDate)} – {formatDate(deadline.endDate)}
                                          </span>
                                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                                            {deadline.spanDays} days
                                          </span>
                                        </div>
                                        <button
                                          type="button"
                                          disabled={!deadline.examId}
                                          onClick={(event) =>
                                            handleViewDeadlineDetails(deadline.examId, event)
                                          }
                                          className="mt-3 inline-flex w-full justify-center rounded-full border border-brand-ink bg-transparent px-3 py-1.5 text-[11px] font-semibold text-brand-ink transition-colors hover:bg-brand-ink hover:text-white disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400 disabled:hover:bg-transparent dark:border-action-500 dark:text-action-500 dark:hover:bg-action-500 dark:hover:text-white dark:disabled:border-slate-700 dark:disabled:text-slate-500"
                                        >
                                          View details
                                        </button>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      title={`${deadline.label} · ${formatDate(deadline.startDate)}`}
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        handleSelectPhase(phase.id);
                                      }}
                                      className={`flex h-full w-full flex-row items-center justify-center gap-1.5 overflow-hidden rounded-md border border-[#e6c000] bg-[#FAD53C] px-2 text-left text-[10px] font-semibold text-black shadow-sm transition-[box-shadow,transform] duration-[560ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:brightness-105 hover:shadow-md ${overlapClass}`}
                                    >
                                      <span className="w-full truncate px-1 text-left font-semibold text-black">{deadline.label}</span>
                                    </button>
                                  </div>
                                );
                              })
                            ) : isSelected ? (
                              <div
                                className="group/item absolute top-1/2 z-30 h-6 -translate-y-1/2"
                                style={{
                                  left: `${phase.leftPct}%`,
                                  width: `${animateIn ? displayWidth : 0}%`,
                                }}
                              >
                                <div
                                  className={`pointer-events-none invisible absolute left-1/2 -translate-x-1/2 z-[9999] w-max min-w-[220px] opacity-0 transition-all duration-200 group-hover/item:visible group-hover/item:pointer-events-auto group-hover/item:opacity-100 ${
                                    tooltipBelow
                                      ? "top-full pt-2 group-hover/item:translate-y-1"
                                      : "bottom-full pb-2 group-hover/item:-translate-y-1"
                                  }`}
                                >
                                  <div className="relative rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
                                    <div
                                      className={`absolute left-1/2 h-3.5 w-3.5 -translate-x-1/2 rotate-45 rounded-sm bg-white dark:bg-slate-900 ${
                                        tooltipBelow
                                          ? "-top-1.5 border-t border-l border-slate-200/80 shadow-[-2px_-2px_2px_-1px_rgba(0,0,0,0.1)] dark:border-slate-700/80 dark:shadow-none"
                                          : "-bottom-1.5 border-b border-r border-slate-200/80 shadow-[2px_2px_2px_-1px_rgba(0,0,0,0.1)] dark:border-slate-700/80 dark:shadow-none"
                                      }`}
                                    />
                                    <h4 className="text-[13px] font-bold text-slate-900 dark:text-slate-100">
                                      {phase.label}
                                    </h4>
                                    {phase.subtitle ? (
                                      <p className="mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                        {phase.subtitle}
                                      </p>
                                    ) : null}
                                    <div className="mt-2 flex items-center justify-between gap-4 text-[11px] text-slate-500 dark:text-slate-400">
                                      <span>
                                        {formatDate(phase.startDate)} – {formatDate(phase.endDate)}
                                      </span>
                                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                                        {phase.spanDays} days
                                      </span>
                                    </div>
                                    <div className="mt-3 flex items-center gap-2.5">
                                      <div className="h-1.5 w-full flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                        <div
                                          className="h-full rounded-full bg-[#FAD53C] transition-all duration-500"
                                          style={{
                                            width: `${Math.max(4, Math.min(phase.progress, 100))}%`,
                                          }}
                                        />
                                      </div>
                                      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                                        {phase.progress}%
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  title={`${phase.label}${phase.subtitle ? ` · ${phase.subtitle}` : ""} - ${formatDate(phase.startDate)} to ${formatDate(phase.endDate)} (${phase.spanDays} days)`}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleSelectPhase(phase.id);
                                  }}
                                  className="flex h-full w-full flex-row items-center justify-center gap-1.5 overflow-hidden rounded-md border border-[#e6c000] bg-[#FAD53C] px-2 text-left text-[10px] font-bold text-black shadow-sm transition-[box-shadow,transform] duration-[560ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:brightness-105 hover:shadow-md"
                                >
                                  <span className="w-full truncate px-2 text-left font-bold text-black">
                                    {phase.label}
                                    {phase.subtitle ? ` · ${phase.subtitle}` : ""}
                                  </span>
                                </button>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}

                      {filteredPhases.length === 0 && (
                        <div className="rounded-lg border border-dashed border-slate-300 px-3 py-3 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                          No phases match your current filters.
                        </div>
                      )}
                    </div>

                    <div className="pointer-events-none absolute inset-0 z-20">
                      {/* Past-time diagonal dashed stripes — thicker 2px lines */}
                      <div
                        className="pointer-events-none absolute bottom-0 left-0 top-0"
                        style={{
                          width: `${todayMarkerLeftPct}%`,
                          backgroundImage:
                            "repeating-linear-gradient(-45deg, transparent 0 7px, rgba(0,0,0,0.10) 7px 9px)",
                          backgroundColor: "rgba(248,250,252,0.30)",
                        }}
                      />

                      {/* Month grid lines */}
                      {activeTimeline.monthTicks.map((tick) => (
                        <span
                          key={`grid-${tick.id}`}
                          className="absolute bottom-0 top-0 w-px -translate-x-1/2 bg-slate-200/80 dark:bg-slate-700/60"
                          style={{ left: `${tick.leftPct}%` }}
                        />
                      ))}

                      {/* Today marker */}
                      <div
                        className="absolute bottom-0 top-0 -translate-x-1/2"
                        style={{ left: `${todayMarkerLeftPct}%` }}
                      >
                        <span className="absolute -top-[22px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-900 px-2 py-[3px] text-[9px] font-semibold tracking-wide text-[#FAD53C] shadow-md dark:bg-black">
                          Today
                        </span>
                        <span className="absolute bottom-0 top-0 w-[2px] rounded-full bg-slate-900/80 dark:bg-[#FAD53C]/90" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-3 xl:min-h-0 flex-1 xl:overflow-y-auto grid gap-3 md:grid-cols-2 xl:grid-cols-4 xl:pr-1 [scrollbar-width:thin] [scrollbar-color:black_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-lg [&::-webkit-scrollbar-thumb]:bg-black/90 [&::-webkit-scrollbar-thumb]:border-[2px] [&::-webkit-scrollbar-thumb]:border-solid [&::-webkit-scrollbar-thumb]:border-white dark:[&::-webkit-scrollbar-thumb]:bg-[#FAD53C]/80 dark:[&::-webkit-scrollbar-thumb]:border-slate-900">
          {(Object.keys(phaseBuckets) as PhaseStatus[]).map((status) => {
            const dotColor: Record<PhaseStatus,string> = {
              done:     "bg-[#FAD53C]/60",
              active:   "bg-[#FAD53C]",
              upcoming: "bg-[#FAD53C]/30",
              overdue:  "bg-[#FAD53C]",
            };
            return (
            <section key={status} className="flex flex-col rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
              {/* Column header */}
              <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-2 dark:border-slate-700">
                <span className={`h-2 w-2 rounded-full ${dotColor[status]}`} />
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  {STATUS_LABEL[status]}
                </p>
                <span className="ml-auto rounded-full bg-slate-200 px-1.5 py-px text-[10px] font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                  {phaseBuckets[status].length}
                </span>
              </div>
              <div className="flex flex-col gap-1.5 p-2">
                {phaseBuckets[status].map((phase) => (
                  <button
                    key={phase.id}
                    type="button"
                    onClick={() => handleSelectPhase(phase.id)}
                    className={`group w-full rounded-lg border bg-white px-3 py-2.5 text-left shadow-sm transition-all duration-150 hover:shadow-md dark:bg-slate-900 ${
                      selectedPhaseId === phase.id
                        ? "border-[#FAD53C] ring-1 ring-[#FAD53C]/50 dark:border-[#FAD53C]/70"
                        : "border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <p className="truncate text-[12px] font-semibold text-slate-800 dark:text-slate-100">{phase.label}</p>
                    {phase.subtitle && (
                      <p className="mt-0.5 truncate text-[10px] text-slate-400 dark:text-slate-500">{phase.subtitle}</p>
                    )}
                    <p className="mt-1 text-[10px] font-medium text-slate-400 dark:text-slate-500">
                      {formatDate(phase.startDate)} → {formatDate(phase.endDate)}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${dotColor[status]}`}
                          style={{ width: `${Math.max(4, Math.min(phase.progress, 100))}%` }}
                        />
                      </div>
                      <span className="shrink-0 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        {phase.progress}%
                      </span>
                    </div>
                  </button>
                ))}
                {phaseBuckets[status].length === 0 && (
                  <p className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-[11px] text-slate-400 dark:border-slate-700 dark:text-slate-500">
                    Nothing here
                  </p>
                )}
              </div>
            </section>
          );})}
        </div>
      )}

    </article>
    </>
  );
}
