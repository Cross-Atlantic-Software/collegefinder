"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { BiCalendarAlt, BiListUl, BiSearch, BiTargetLock } from "react-icons/bi";

export type PhaseStatus = "done" | "active" | "upcoming" | "overdue";
export type MilestoneStatus = "completed" | "pending" | "overdue";
type ViewMode = "timeline" | "board";

export type StudyPhase = {
  id: string;
  label: string;
  start: string;
  end: string;
  status: PhaseStatus;
  progress: number;
  deadlines?: Array<{ label: string; start: string; end: string }>;
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
  done: "bg-[#D3E5F9] text-black dark:bg-[#1e2a3b] dark:text-slate-200 border border-blue-200/50 dark:border-blue-800",
  active: "bg-[#FAD53C] text-black shadow-[0_2px_10px_rgba(250,213,60,0.4)] relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[custom-shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/50 before:to-transparent",
  upcoming: "bg-white/40 border-[2px] border-dashed border-[#FAD53C]/90 text-black/60 dark:bg-slate-900/40 dark:border-[#FAD53C]/80 dark:text-white/60",
  overdue: "bg-[#0a0802] text-[#FAD53C]",
};

const milestoneStatusClass: Record<MilestoneStatus, string> = {
  completed: "bg-[#FAD53C] border-black/70",
  pending: "bg-[#FAD53C]/40 border-black/55",
  overdue: "bg-black border-[#FAD53C]",
};

const DAY_MS = 1000 * 60 * 60 * 24;

const parseDate = (value: string) => new Date(`${value}T00:00:00`);

const dayOffset = (start: Date, end: Date) =>
  Math.max(0, Math.floor((end.getTime() - start.getTime()) / DAY_MS));

const durationDays = (start: Date, end: Date) => dayOffset(start, end) + 1;

const formatDate = (date: Date) =>
  date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

const clampPct = (value: number) => Math.min(100, Math.max(0, value));

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
  const [activeFilters, setActiveFilters] = useState<Set<PhaseStatus>>(
    new Set(FILTER_OPTIONS),
  );
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);
  const [animateIn, setAnimateIn] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [showMilestones, setShowMilestones] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");

  useEffect(() => {
    if (selectedPhaseId && phases.some((phase) => phase.id === selectedPhaseId)) {
      return;
    }

    const preferred =
      phases.find((phase) => phase.status === "active") ?? phases[0] ?? null;
    setSelectedPhaseId(preferred?.id ?? null);
  }, [phases, selectedPhaseId]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setAnimateIn(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const phaseModels = useMemo(() => {
    const raw = phases.map((phase) => ({
      ...phase,
      startDate: parseDate(phase.start),
      endDate: parseDate(phase.end),
    }));

    const milestoneDates = milestones.map((item) => parseDate(item.date));
    const startCandidates = raw.map((item) => item.startDate.getTime());
    const endCandidates = raw.map((item) => item.endDate.getTime());
    const milestoneStartCandidates = milestoneDates.map((date) => date.getTime());
    const milestoneEndCandidates = milestoneDates.map((date) => date.getTime());

    const fallback = Date.now();
    const rawStartPoint = new Date(
      Math.min(...startCandidates, ...milestoneStartCandidates, fallback),
    );
    const rawEndPoint = new Date(
      Math.max(...endCandidates, ...milestoneEndCandidates, fallback),
    );

    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    // Full historical array coverage safely generated
    const timelineStart = new Date(rawStartPoint.getFullYear(), rawStartPoint.getMonth() - 1, 1);
    
    // End bounds encompass all data points generously safely expanding beyond max range realistically ensuring padding buffers properly
    const timelineEndMax = new Date(Math.max(
      rawEndPoint.getTime(),
      new Date(todayDate).setMonth(todayDate.getMonth() + 2)
    ));
    const timelineEnd = new Date(timelineEndMax.getFullYear(), timelineEndMax.getMonth() + 1, 0);

    const totalTimelineDays = Math.max(1, durationDays(timelineStart, timelineEnd));

    const computedPhases = raw.map((phase) => {
      const pStart = phase.startDate.getTime() < timelineStart.getTime() ? timelineStart : phase.startDate;
      const pEnd = phase.endDate.getTime() < timelineStart.getTime() ? timelineStart : phase.endDate;
      const offset = dayOffset(timelineStart, pStart);
      const spanDays = durationDays(pStart, pEnd);

      const computedDeadlines = phase.deadlines?.map((d) => {
        const rawDStart = parseDate(d.start);
        const rawDEnd = parseDate(d.end);
        const dStart = rawDStart.getTime() < timelineStart.getTime() ? timelineStart : rawDStart;
        const dEnd = rawDEnd.getTime() < timelineStart.getTime() ? timelineStart : rawDEnd;
        
        const dOffset = dayOffset(timelineStart, dStart);
        const dSpan = durationDays(dStart, dEnd);
        return {
          ...d,
          startDate: rawDStart,
          endDate: rawDEnd,
          spanDays: dSpan,
          leftPct: (dOffset / totalTimelineDays) * 100,
          widthPct: (dSpan / totalTimelineDays) * 100,
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

    const monthTicks: Array<{ id: string; label: string; leftPct: number }> = [];
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
  }, [milestones, phases]);

  useEffect(() => {
    if (!scrollContainerRef.current || !phaseModels) return;

    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    const pastWindow = new Date(todayDate.getTime());
    pastWindow.setDate(pastWindow.getDate() - 45); // View loads showing past 45 days initially

    // Day calculations naturally relative to the dynamically unrolled historical bound mapping
    const offsetDays = dayOffset(phaseModels.timelineStart, pastWindow);
    const offsetPct = Math.max(0, offsetDays / phaseModels.totalTimelineDays);

    const container = scrollContainerRef.current;
    
    // Safely enforce layout evaluation debounce wrapping ensuring dynamic arrays render appropriately correctly sizing scroll bounds locally safely initially
    const timer = setTimeout(() => {
      if (container && container.scrollWidth > container.clientWidth) {
        container.scrollLeft = offsetPct * container.scrollWidth;
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [phaseModels, viewMode]);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredPhases = useMemo(
    () =>
      phaseModels.phases.filter(
        (phase) =>
          activeFilters.has(phase.status) &&
          (!normalizedQuery || phase.label.toLowerCase().includes(normalizedQuery)),
      ),
    [activeFilters, normalizedQuery, phaseModels.phases],
  );

  const visibleMilestones = useMemo(() => {
    const queryMatches = (label: string) =>
      !normalizedQuery || label.toLowerCase().includes(normalizedQuery);

    return phaseModels.milestones
      .filter((item) => queryMatches(item.label))
      .filter((item) => showMilestones || item.status !== "completed")
      .sort((a, b) => a.dateValue.getTime() - b.dateValue.getTime());
  }, [normalizedQuery, phaseModels.milestones, showMilestones]);

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

  const selectedPhase = filteredPhases.find((phase) => phase.id === selectedPhaseId) ?? null;
  const selectedMilestone =
    visibleMilestones.find((item) => item.id === selectedMilestoneId) ?? null;

  const nextExam = phaseModels.milestones.find((item) => item.kind === "exam")?.dateValue;
  const daysToExam = nextExam ? Math.max(0, dayOffset(new Date(), nextExam)) : null;

  const todayMarkerLeftPct = useMemo(() => {
    const offset = dayOffset(phaseModels.timelineStart, new Date());
    return clampPct((offset / phaseModels.totalTimelineDays) * 100);
  }, [phaseModels.timelineStart, phaseModels.totalTimelineDays]);

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
      <article className="rounded-2xl bg-white p-3 dark:bg-slate-900">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
          <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">Track your mapped phases and milestone progress timeline over the months.</p>
        </div>
        <div className="flex items-center">
          <button
            type="button"
            className="flex items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 ease-out hover:bg-slate-50 hover:shadow dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <span>2026</span>
            <svg className="h-4 w-4 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {viewMode === "timeline" ? (
        <div className="mt-2 rounded-xl bg-slate-50/50 p-3 dark:bg-slate-800/20">
          <div className="grid grid-cols-[120px_1fr] gap-3 sm:grid-cols-[148px_1fr]">
            <div>
              <div className="mb-2 h-8" /> {/* Spacer aligns with right-side month ticks */}
              {filteredPhases.map((phase, index) => (
                <div key={phase.id} className="relative mb-2 last:mb-0">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPhaseId(phase.id);
                      setSelectedMilestoneId(null);
                    }}
                    className="flex h-9 w-full flex-col justify-center rounded-md px-2 text-left transition-colors duration-200 ease-out bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/50"
                    title={`${phase.label} (${formatDate(phase.startDate)} - ${formatDate(phase.endDate)})`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-slate-900 dark:text-slate-100">
                        Phase {index + 1}
                      </p>
                      {phase.status === "overdue" && (
                        <span className="inline-block rounded-full bg-black px-1 py-[1px] text-[7px] font-bold uppercase tracking-wide text-[#FAD53C]">
                          Missed
                        </span>
                      )}
                    </div>
                    <p className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {phase.label}
                    </p>
                  </button>
                  {index < filteredPhases.length - 1 && (
                    <div className="absolute -bottom-1 left-2 right-2 h-px bg-slate-200 dark:bg-slate-700/50" />
                  )}
                </div>
              ))}
            </div>

            <div className="min-w-0">
              <div 
                ref={scrollContainerRef}
                className="overflow-x-auto pb-2 [scrollbar-width:thin] [scrollbar-color:black_transparent] [&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-lg [&::-webkit-scrollbar-thumb]:bg-black [&::-webkit-scrollbar-thumb]:border-[3px] [&::-webkit-scrollbar-thumb]:border-solid [&::-webkit-scrollbar-thumb]:border-white dark:[&::-webkit-scrollbar-thumb]:border-slate-900"
              >
                <div style={{ minWidth: `${Math.max(760, phaseModels.monthTicks.length * 130)}px` }}>
                  <div className="relative mb-2 h-8">
                    {phaseModels.monthTicks.map((tick, idx) => (
                      <span
                        key={tick.id}
                        className={`absolute top-0 text-[10px] font-semibold text-black/75 dark:text-[#FAD53C]/95 ${
                          idx === 0 ? "left-0" : "-translate-x-1/2"
                        }`}
                        style={idx === 0 ? undefined : { left: `${tick.leftPct}%` }}
                      >
                        {tick.label}
                      </span>
                    ))}
                  </div>

                  <div className="relative">
                    {/* Grid lines and Past-area Overlay moved below phases mapped rendering to give them higher stacking context */}

                    <div className="relative space-y-2">
                      {filteredPhases.map((phase, index) => {
                        const displayWidth = Math.max(phase.widthPct, 0.8);
                        const tooltipBelow = index <= 1;

                        return (
                          <div key={phase.id} className="group relative h-9 overflow-visible rounded-lg border border-black/15 bg-white/85 transition-colors duration-300 ease-out dark:border-slate-700/60 dark:bg-slate-900/45">
                            {phase.computedDeadlines && phase.computedDeadlines.length > 0 ? (
                              phase.computedDeadlines?.map((d, dIdx) => {
                                const dDisplayWidth = Math.max(d.widthPct, 0.8);

                                return (
                                  <div 
                                    key={dIdx} 
                                    className="group/item absolute top-1/2 h-6 -translate-y-1/2"
                                    style={{ left: `${d.leftPct}%`, width: `${animateIn ? dDisplayWidth : 0}%` }}
                                  >
                                    <div 
                                      className={`pointer-events-none invisible absolute left-1/2 -translate-x-1/2 z-[9999] w-max min-w-[220px] opacity-0 transition-all duration-200 group-hover/item:visible group-hover/item:pointer-events-auto group-hover/item:opacity-100 ${
                                        tooltipBelow 
                                          ? "top-full pt-2 group-hover/item:translate-y-1" 
                                          : "bottom-full pb-2 group-hover/item:-translate-y-1"
                                      }`}
                                    >
                                      <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xl dark:border-slate-700 dark:bg-slate-900 relative">
                                        <div 
                                          className={`absolute left-1/2 h-3.5 w-3.5 -translate-x-1/2 rotate-45 rounded-sm bg-white dark:bg-slate-900 ${
                                            tooltipBelow 
                                              ? "-top-1.5 border-t border-l border-slate-200/80 shadow-[-2px_-2px_2px_-1px_rgba(0,0,0,0.1)] dark:border-slate-700/80 dark:shadow-none" 
                                              : "-bottom-1.5 border-b border-r border-slate-200/80 shadow-[2px_2px_2px_-1px_rgba(0,0,0,0.1)] dark:border-slate-700/80 dark:shadow-none"
                                          }`} 
                                        />
                                        <h4 className="text-[13px] font-bold text-slate-900 dark:text-slate-100">{d.label}</h4>
                                        <div className="mt-2 flex items-center justify-between gap-4 text-[11px] text-slate-500 dark:text-slate-400">
                                          <span>{formatDate(d.startDate)} – {formatDate(d.endDate)}</span>
                                          <span className="font-semibold text-slate-700 dark:text-slate-300">{d.spanDays} days</span>
                                        </div>
                                        <button
                                          type="button"
                                          className="mt-3 w-full justify-center inline-flex rounded-full border border-brand-ink bg-transparent px-3 py-1.5 text-[11px] font-semibold text-brand-ink transition-colors hover:bg-brand-ink hover:text-white dark:border-action-500 dark:text-action-500 dark:hover:bg-action-500 dark:hover:text-white"
                                        >
                                          View details
                                        </button>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      title={`${d.label} - ${formatDate(d.startDate)} to ${formatDate(d.endDate)} (${d.spanDays} days)`}
                                      onClick={() => {
                                        setSelectedPhaseId(phase.id);
                                        setSelectedMilestoneId(null);
                                      }}
                                      className={`flex h-full w-full flex-row items-center justify-center gap-1.5 overflow-hidden rounded-md px-2 text-left text-[10px] font-semibold transition-[box-shadow,transform] duration-[560ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:shadow-md ${phaseStatusClass[phase.status]}`}
                                    >
                                      <span className="truncate w-full px-2 text-left">
                                        {d.label}
                                      </span>
                                    </button>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="group/item absolute top-1/2 z-[200] h-6 -translate-y-1/2" style={{ left: `${phase.leftPct}%`, width: `${animateIn ? displayWidth : 0}%` }}>
                                {/* Hover detail tooltip */}
                                <div 
                                  className={`pointer-events-none invisible absolute left-1/2 -translate-x-1/2 z-[9999] w-max min-w-[220px] opacity-0 transition-all duration-200 group-hover/item:visible group-hover/item:pointer-events-auto group-hover/item:opacity-100 ${
                                    tooltipBelow 
                                      ? "top-full pt-2 group-hover/item:translate-y-1" 
                                      : "bottom-full pb-2 group-hover/item:-translate-y-1"
                                  }`}
                                >
                                  <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xl dark:border-slate-700 dark:bg-slate-900 relative">
                                    <div 
                                      className={`absolute left-1/2 h-3.5 w-3.5 -translate-x-1/2 rotate-45 rounded-sm bg-white dark:bg-slate-900 ${
                                        tooltipBelow 
                                          ? "-top-1.5 border-t border-l border-slate-200/80 shadow-[-2px_-2px_2px_-1px_rgba(0,0,0,0.1)] dark:border-slate-700/80 dark:shadow-none" 
                                          : "-bottom-1.5 border-b border-r border-slate-200/80 shadow-[2px_2px_2px_-1px_rgba(0,0,0,0.1)] dark:border-slate-700/80 dark:shadow-none"
                                      }`} 
                                    />
                                    <h4 className="text-[13px] font-bold text-slate-900 dark:text-slate-100">{phase.label}</h4>
                                    <div className="mt-2 flex items-center justify-between gap-4 text-[11px] text-slate-500 dark:text-slate-400">
                                      <span>{formatDate(phase.startDate)} – {formatDate(phase.endDate)}</span>
                                      <span className="font-semibold text-slate-700 dark:text-slate-300">{phase.spanDays} days</span>
                                    </div>
                                    <div className="mt-3 flex items-center gap-2.5">
                                      <div className="h-1.5 w-full flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                        <div 
                                          className="h-full rounded-full transition-all duration-500 bg-[#FAD53C]" 
                                          style={{ width: `${Math.max(4, Math.min(phase.progress, 100))}%` }} 
                                        />
                                      </div>
                                      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">{phase.progress}%</span>
                                    </div>
                                    <button
                                      type="button"
                                      className="mt-3 w-full justify-center inline-flex rounded-full border border-brand-ink bg-transparent px-3 py-1.5 text-[11px] font-semibold text-brand-ink transition-colors hover:bg-brand-ink hover:text-white dark:border-action-500 dark:text-action-500 dark:hover:bg-action-500 dark:hover:text-white"
                                    >
                                      View details
                                    </button>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  title={`${phase.label} - ${formatDate(phase.startDate)} to ${formatDate(phase.endDate)} (${phase.spanDays} days)`}
                                  onClick={() => {
                                    setSelectedPhaseId(phase.id);
                                    setSelectedMilestoneId(null);
                                  }}
                                  className={`flex h-full w-full flex-row items-center justify-center gap-1.5 overflow-hidden rounded-md px-2 text-left text-[10px] font-semibold transition-[box-shadow,transform] duration-[560ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:shadow-md ${phaseStatusClass[phase.status]}`}
                                >
                                  <span className="truncate w-full px-2 text-left">
                                    {phase.label}
                                  </span>
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {filteredPhases.length === 0 && (
                        <div className="rounded-lg border border-dashed border-slate-300 px-3 py-3 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                          No phases match your current filters.
                        </div>
                      )}
                    </div>

                    {/* Grid lines and Past Area Overlay inserted after phases to appear on top with higher z-index */}
                    <div className="pointer-events-none absolute inset-0 z-20">
                      {/* Past-area overlay made lighter and moved here to overlay the track backgrounds */}
                      <div
                        className="pointer-events-none absolute bottom-0 left-0 top-0"
                        style={{
                          width: `${todayMarkerLeftPct}%`,
                          backgroundImage:
                            "repeating-linear-gradient(-45deg, transparent 0 10px, rgba(0,0,0,0.12) 10px 20px)",
                        }}
                      />

                      {phaseModels.monthTicks.map((tick) => (
                        <span
                          key={`grid-${tick.id}`}
                          className="absolute bottom-0 top-0 w-px -translate-x-1/2 bg-black/10 dark:bg-[#FAD53C]/15"
                          style={{ left: `${tick.leftPct}%` }}
                        />
                      ))}

                      <div
                        className="absolute bottom-0 top-0 -translate-x-1/2"
                        style={{ left: `${todayMarkerLeftPct}%` }}
                      >
                        <span className="absolute -top-5 left-1/2 -translate-x-1/2 rounded-full bg-black px-2 py-0.5 text-[9px] font-semibold text-[#FAD53C] shadow-[0_0_0_2px_rgba(250,213,60,0.35)]">
                          Today
                        </span>
                        <span className="absolute bottom-0 top-0 w-0 border-l-2 border-dashed border-black/70 dark:border-[#FAD53C]/80" />
                      </div>
                    </div>


                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {(Object.keys(phaseBuckets) as PhaseStatus[]).map((status) => (
            <section key={status} className="rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 dark:border-slate-700 dark:bg-slate-800/40">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                {STATUS_LABEL[status]}
              </p>
              <div className="mt-2 space-y-2">
                {phaseBuckets[status].map((phase) => (
                  <button
                    key={phase.id}
                    type="button"
                    onClick={() => {
                      setSelectedPhaseId(phase.id);
                      setSelectedMilestoneId(null);
                    }}
                    className="block w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-left dark:border-slate-700 dark:bg-slate-900"
                  >
                    <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">{phase.label}</p>
                    <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                      {formatDate(phase.startDate)} - {formatDate(phase.endDate)}
                    </p>
                    <div className="mt-2 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700">
                      <div
                        className="h-full rounded-full bg-action-500"
                        style={{ width: `${Math.max(4, Math.min(phase.progress, 100))}%` }}
                      />
                    </div>
                  </button>
                ))}
                {phaseBuckets[status].length === 0 && (
                  <p className="rounded-md border border-dashed border-slate-300 px-2 py-2 text-[11px] text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    No items
                  </p>
                )}
              </div>
            </section>
          ))}
        </div>
      )}


    </article>
    </>
  );
}
