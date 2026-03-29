"use client";

import { useEffect, useState, useRef } from "react";
import { BiCheck, BiChevronLeft, BiChevronRight } from "react-icons/bi";
import { Button } from "../shared";
import UpcomingDeadlinesCard from "./UpcomingDeadlinesCard";
import type { Milestone, StudyPhase } from "./UpcomingDeadlinesCard";

type PlannerProgressStep = {
  id: string;
  title: string;
  description: string;
  status: "completed" | "current" | "upcoming";
};

const upcomingDeadlinePhases: StudyPhase[] = [
  {
    id: "phase-1",
    label: "Base Mapping",
    start: "2026-02-08",
    end: "2026-03-20",
    status: "done",
    progress: 100,
    deadlines: [
      { label: "Syllabus Audit", start: "2026-02-09", end: "2026-03-03" },
      { label: "Topic Heatmap", start: "2026-02-14", end: "2026-03-08" },
      { label: "Baseline Mock", start: "2026-03-10", end: "2026-03-17" },
    ],
  },
  {
    id: "phase-2",
    label: "Fundamentals Push",
    start: "2026-03-21",
    end: "2026-05-05",
    status: "done",
    progress: 100,
    deadlines: [
      { label: "Physics Core Set", start: "2026-03-22", end: "2026-04-14" },
      { label: "Math Practice Grid", start: "2026-03-30", end: "2026-04-23" },
      { label: "Chemistry Recap", start: "2026-03-21", end: "2026-05-04" },
    ],
  },
  {
    id: "phase-3",
    label: "Question Bank Drive",
    start: "2026-05-06",
    end: "2026-06-28",
    status: "active",
    progress: 76,
    deadlines: [
      { label: "PYQ Batch A", start: "2026-05-06", end: "2026-05-29" },
      { label: "Mixed Drill 1", start: "2026-05-14", end: "2026-06-28" },
      { label: "Checkpoint Gamma", start: "2026-06-12", end: "2026-06-20" },
    ],
  },
  {
    id: "phase-4",
    label: "Mock Sprint",
    start: "2026-06-29",
    end: "2026-08-18",
    status: "active",
    progress: 48,
    deadlines: [
      { label: "Mock Lite 2", start: "2026-06-29", end: "2026-07-24" },
      { label: "Mock Full 1", start: "2026-07-04", end: "2026-08-17" },
      { label: "Error Log Sprint", start: "2026-07-20", end: "2026-08-18" },
    ],
  },
  {
    id: "phase-5",
    label: "Application Pack",
    start: "2026-08-19",
    end: "2026-10-12",
    status: "upcoming",
    progress: 0,
    deadlines: [
      { label: "Document Vault", start: "2026-08-19", end: "2026-09-15" },
      { label: "Scholarship Form", start: "2026-08-25", end: "2026-10-08" },
      { label: "Round-1 Applications", start: "2026-09-01", end: "2026-10-12" },
    ],
  },
  {
    id: "phase-6",
    label: "Final Attempt",
    start: "2026-10-13",
    end: "2026-11-28",
    status: "upcoming",
    progress: 0,
    deadlines: [
      { label: "Final Formula Stack", start: "2026-10-13", end: "2026-11-03" },
      { label: "Revision Lock", start: "2026-10-20", end: "2026-11-28" },
      { label: "Exam Readiness", start: "2026-10-15", end: "2026-11-28" },
    ],
  },
];

const upcomingDeadlineMilestones: Milestone[] = [
  { id: "ms-1", label: "Onboarding Audit", date: "2026-02-12", status: "completed" },
  { id: "ms-2", label: "Syllabus Mapping", date: "2026-02-22", status: "completed" },
  { id: "ms-3", label: "Checkpoint Alpha", date: "2026-03-04", status: "completed" },
  { id: "ms-4", label: "Chapter Set A", date: "2026-03-16", status: "completed" },
  { id: "ms-5", label: "Speed Drill 1", date: "2026-03-26", status: "completed" },
  { id: "ms-6", label: "Mock Lite 1", date: "2026-04-03", status: "completed" },
  { id: "ms-7", label: "Checkpoint Beta", date: "2026-04-14", status: "pending" },
  { id: "ms-8", label: "Revision Sync", date: "2026-04-27", status: "pending" },
  { id: "ms-9", label: "Mock Lite 2", date: "2026-05-08", status: "pending" },
  { id: "ms-10", label: "PYQ Batch A", date: "2026-05-19", status: "pending" },
  { id: "ms-11", label: "Checkpoint Gamma", date: "2026-06-02", status: "pending" },
  { id: "ms-12", label: "Mock Full 1", date: "2026-06-15", status: "pending" },
  { id: "ms-13", label: "Application Draft", date: "2026-07-04", status: "pending" },
  { id: "ms-14", label: "Counselling Form", date: "2026-09-12", status: "overdue" },
  { id: "ms-15", label: "Final Revision Lock", date: "2026-10-20", status: "pending" },
  { id: "ms-16", label: "Final Exam", date: "2026-11-18", status: "pending", kind: "exam" },
];

const recommendations = [
  {
    title: "Update your JEE Main preference list",
    category: "Counselling",
    priority: "High",
    reason: "2 colleges moved up in your match score this week.",
  },
  {
    title: "Attempt Algebra speed drill",
    category: "Prep",
    priority: "Medium",
    reason: "Your math accuracy is strong but speed can improve.",
  },
  {
    title: "Add 2 backup private universities",
    category: "Applications",
    priority: "Medium",
    reason: "Improves admission safety across your shortlist.",
  },
  {
    title: "Upload income certificate for scholarship",
    category: "Scholarship",
    priority: "High",
    reason: "Required before round-1 deadline window closes.",
  },
];

const quickStudyPicks = [
  {
    title: "JEE Main Physics Revision Marathon",
    duration: "42 min",
    tag: "Physics",
    tags: ["Physics", "Revision", "JEE Main"],
    thumbnail: "https://i.ytimg.com/vi/8hly31xKli0/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=8hly31xKli0",
  },
  {
    title: "Coordinate Geometry One Shot",
    duration: "35 min",
    tag: "Math",
    tags: ["Math", "Coordinate Geometry", "One Shot"],
    thumbnail: "https://i.ytimg.com/vi/rfscVS0vtbw/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=rfscVS0vtbw",
  },
  {
    title: "Organic Chemistry Quick Concepts",
    duration: "28 min",
    tag: "Chemistry",
    tags: ["Organic Chemistry", "Concepts", "Quick Revision"],
    thumbnail: "https://i.ytimg.com/vi/kqtD5dpn9C8/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=kqtD5dpn9C8",
  },
  {
    title: "Probability PYQ Strategy",
    duration: "19 min",
    tag: "Math",
    tags: ["Math", "PYQ", "Strategy"],
    thumbnail: "https://i.ytimg.com/vi/_uQrJ0TkZlc/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=_uQrJ0TkZlc",
  },
  {
    title: "Current Electricity Fast Revision",
    duration: "24 min",
    tag: "Physics",
    tags: ["Physics", "Current Electricity", "Fast Revision"],
    thumbnail: "https://i.ytimg.com/vi/3fumBcKC6RE/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=3fumBcKC6RE",
  },
  {
    title: "How to Attempt Mock Tests Better",
    duration: "16 min",
    tag: "Exam Prep",
    tags: ["Exam Prep", "Mock Tests", "Tactics"],
    thumbnail: "https://i.ytimg.com/vi/HGTJBPNC-Gw/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=HGTJBPNC-Gw",
  },
  {
    title: "Electrostatics Rapid Practice Session",
    duration: "21 min",
    tag: "Physics",
    tags: ["Physics", "Electrostatics", "Practice"],
    thumbnail: "https://i.ytimg.com/vi/9bZkp7q19f0/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=9bZkp7q19f0",
  },
  {
    title: "Ionic Equilibrium Problem Solving",
    duration: "26 min",
    tag: "Chemistry",
    tags: ["Chemistry", "Ionic Equilibrium", "Problem Solving"],
    thumbnail: "https://i.ytimg.com/vi/jNQXAC9IVRw/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
  },
];

const ACTIVE_RECOMMENDATION_MS = 6800;

const plannerProgressSteps: PlannerProgressStep[] = [
  {
    id: "progress-1",
    title: "Syllabus Mapping Locked",
    description: "Core chapters tagged by weightage and attempt priority.",
    status: "completed",
  },
  {
    id: "progress-2",
    title: "Fundamentals Drill Complete",
    description: "Concept clarity and speed drills wrapped for Physics, Math, Chemistry.",
    status: "completed",
  },
  {
    id: "progress-3",
    title: "Question Bank Drive",
    description: "Current phase: daily PYQ blocks with mistake-log revisions.",
    status: "current",
  },
  {
    id: "progress-4",
    title: "Mock Sprint Ramp-up",
    description: "Upcoming: full-length mocks and time-pressure adaptation.",
    status: "upcoming",
  },
  {
    id: "progress-5",
    title: "Application Pack Ready",
    description: "Final docs, counselling preferences, and backup shortlist alignment.",
    status: "upcoming",
  },
];

const getYoutubeId = (url: string) => {
  const match = url.match(/[?&]v=([^&]+)/);
  return match?.[1] ?? "";
};

type DonutSegment = {
  id: string;
  label: string;
  value: number;
  percent: number;
  color: string;
  pointers: [string, string, string];
};

type ConfidenceDonutProps = {
  totalLabel: string;
  totalValue: string;
  segments: DonutSegment[];
};

const topicConfidenceSegments: DonutSegment[] = [
  {
    id: "strong",
    label: "Strong Topics",
    value: 12,
    percent: 40,
    color: "#eab308",
    pointers: ["+23% in Organic Chemistry", "+11% in Vectors", "+8% in Matrices"],
  },
  {
    id: "stable",
    label: "Stable Topics",
    value: 9,
    percent: 30,
    color: "#facc15",
    pointers: ["+4% in Kinematics", "+6% in Thermodynamics", "-3% in Trigonometry speed"],
  },
  {
    id: "needs-work",
    label: "Needs Work",
    value: 5,
    percent: 18,
    color: "#fde047",
    pointers: ["-9% in Coordinate Geometry", "-7% in Current Electricity", "-5% in Algebra PYQ"],
  },
  {
    id: "low",
    label: "Low Confidence",
    value: 4,
    percent: 12,
    color: "#fef08a",
    pointers: ["-14% in Probability", "-10% in Ionic Equilibrium", "-6% in Inorganic recall"],
  },
];

const examConfidenceSegments: DonutSegment[] = [
  {
    id: "high",
    label: "High Confidence",
    value: 10,
    percent: 35,
    color: "#eab308",
    pointers: ["+12% in Physics Section A", "+8% in easy-medium Math", "+5% in mock completion rate"],
  },
  {
    id: "steady",
    label: "Steady Confidence",
    value: 8,
    percent: 28,
    color: "#facc15",
    pointers: ["+6% in Organic Chemistry", "+4% in Algebra sets", "-3% in final 30 min"],
  },
  {
    id: "volatile",
    label: "Volatile",
    value: 6,
    percent: 22,
    color: "#fde047",
    pointers: ["-8% in Numerical Physics", "-5% in integer Math", "Score variance +/-14 marks"],
  },
  {
    id: "low",
    label: "Low Confidence",
    value: 5,
    percent: 15,
    color: "#fef08a",
    pointers: ["-11% in Inorganic memory blocks", "-9% in Probability MCQs", "+2 skipped Q in pressure window"],
  },
];

const ConfidenceDonut = ({ totalLabel, totalValue, segments }: ConfidenceDonutProps) => {
  const [hoveredSegmentId, setHoveredSegmentId] = useState<string | null>(null);
  const size = 220;
  const center = size / 2;
  const radius = 76;
  const strokeWidth = 26;
  const circumference = 2 * Math.PI * radius;
  const tangentGapLength = strokeWidth;

  // Build per-segment dash params
  let offsetAngle = 0; // degrees from top, accumulates
  const segmentDefs = segments.map((seg) => {
    const angleDeg = (seg.percent / 100) * 360;
    const arcLength = (angleDeg / 360) * circumference;
    const visibleArc = Math.max(arcLength - tangentGapLength, 2);
    const dashArray = `${visibleArc} ${circumference - visibleArc}`;
    const startLength = (offsetAngle / 360) * circumference + tangentGapLength / 2;
    const dashOffset = circumference - startLength;
    const midAngle = offsetAngle + angleDeg / 2;
    offsetAngle += angleDeg;
    return { ...seg, dashArray, dashOffset, midAngle };
  });

  const hoveredSegment = segmentDefs.find((seg) => seg.id === hoveredSegmentId) ?? null;
  const tooltipTheta = hoveredSegment ? ((hoveredSegment.midAngle - 90) * Math.PI) / 180 : 0;
  const tooltipX = hoveredSegment ? Math.cos(tooltipTheta) : 0;
  const tooltipY = hoveredSegment ? Math.sin(tooltipTheta) : 0;
  const isTooltipRight = tooltipX >= 0;

  return (
    <div className="relative h-full overflow-visible rounded-xl bg-white/80 p-2.5 dark:bg-slate-900/45">
      <div className="relative mx-auto mt-1 h-52 w-52 overflow-visible" onMouseLeave={() => setHoveredSegmentId(null)}>
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="h-full w-full"
          style={{ transform: "rotate(-90deg)" }}
          aria-hidden="true"
        >
          {/* Background track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#ffffff"
            strokeWidth={strokeWidth}
            className=""
          />
          {/* Coloured segments */}
          {segmentDefs.map((seg) => (
            <circle
              key={seg.id}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={hoveredSegmentId === seg.id ? "#000000" : seg.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={seg.dashArray}
              strokeDashoffset={seg.dashOffset}
              onMouseEnter={() => setHoveredSegmentId(seg.id)}
              onFocus={() => setHoveredSegmentId(seg.id)}
              tabIndex={0}
              role="button"
              aria-label={`${seg.label}: ${seg.value} items, ${seg.percent}%`}
              className="cursor-pointer transition-all duration-300 ease-out"
              style={{
                opacity: hoveredSegmentId && hoveredSegmentId !== seg.id ? 0.32 : 1,
                transformOrigin: `${center}px ${center}px`,
                transform: hoveredSegmentId === seg.id ? "scale(1.08)" : "scale(1)",
              }}
            />
          ))}
        </svg>

        {/* Centre label — counter-rotated so text is upright */}
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="text-center">
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{totalLabel}</p>
            <p className="mt-1 text-2xl font-bold leading-none text-slate-900 dark:text-slate-100">{totalValue}</p>
          </div>
        </div>

        <div
          className={`absolute top-1/2 z-20 w-[240px] rounded-lg border border-slate-200 bg-white/95 p-3 text-left shadow-lg transition-all duration-300 ease-out dark:border-slate-700 dark:bg-slate-900/95 ${
            hoveredSegment
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0"
          }`}
          style={{
            [isTooltipRight ? "left" : "right"]: "calc(100% + 4px)",
            transform: `translateY(calc(-50% + ${(tooltipY * 58).toFixed(1)}px))`,
          }}
        >
          {hoveredSegment && (
            <>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{hoveredSegment.label}</p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                {hoveredSegment.percent}% ({hoveredSegment.value} of {totalValue}) in this confidence bucket.
              </p>
              <ul className="mt-1.5 space-y-1 text-[11px] text-slate-700 dark:text-slate-200">
                {hoveredSegment.pointers.map((point) => (
                  <li key={`${hoveredSegment.id}-${point}`}>• {point}</li>
                ))}
              </ul>
              <button
                type="button"
                className="mt-2 inline-flex items-center rounded-full border border-black bg-transparent px-3 py-1 text-[11px] font-semibold text-black transition-colors duration-200 ease-out hover:bg-black hover:text-white dark:border-slate-200 dark:text-slate-100 dark:hover:bg-slate-100 dark:hover:text-slate-900"
              >
                Know more
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default function MiddleContent() {
  const [activeRecommendationIndex, setActiveRecommendationIndex] = useState(0);
  const [activeRecommendationProgress, setActiveRecommendationProgress] = useState(0);

  useEffect(() => {
    const tickMs = 100;
    const incrementPerTick = (tickMs / ACTIVE_RECOMMENDATION_MS) * 100;

    const timer = setInterval(() => {
      setActiveRecommendationProgress((prev) => {
        const next = prev + incrementPerTick;
        if (next >= 100) {
          setActiveRecommendationIndex((current) => (current + 1) % recommendations.length);
          return 0;
        }
        return next;
      });
    }, tickMs);

    return () => clearInterval(timer);
  }, []);

  const goToPreviousRecommendation = () => {
    setActiveRecommendationProgress(0);
    setActiveRecommendationIndex((prev) =>
      prev === 0 ? recommendations.length - 1 : prev - 1,
    );
  };

  const goToNextRecommendation = () => {
    setActiveRecommendationProgress(0);
    setActiveRecommendationIndex((prev) => (prev + 1) % recommendations.length);
  };

  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [prevVideoIndex, setPrevVideoIndex] = useState<number | null>(null);
  const [preloadVideoIndex, setPreloadVideoIndex] = useState<number | null>(null);
  const [videoProgressMs, setVideoProgressMs] = useState(0);

  const activeVideoRef = useRef(activeVideoIndex);
  useEffect(() => {
    activeVideoRef.current = activeVideoIndex;
  }, [activeVideoIndex]);

  useEffect(() => {
    const tickMs = 100;
    const timer = setInterval(() => {
      setVideoProgressMs((prev) => {
        const next = prev + tickMs;
        if (next === 1000) {
          setPrevVideoIndex(null);
        }
        if (next === 9000) {
          setPreloadVideoIndex((activeVideoRef.current + 1) % quickStudyPicks.length);
        }
        if (next >= 10000) {
          setPrevVideoIndex(activeVideoRef.current);
          setActiveVideoIndex((activeVideoRef.current + 1) % quickStudyPicks.length);
          setPreloadVideoIndex(null);
          return 0;
        }
        return next;
      });
    }, tickMs);
    return () => clearInterval(timer);
  }, []);

  const handleVideoSelect = (idx: number) => {
    if (idx === activeVideoIndex) return;
    setPrevVideoIndex(activeVideoIndex);
    setActiveVideoIndex(idx);
    setPreloadVideoIndex(null);
    setVideoProgressMs(0);
  };

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideUpVideo {
          0% { transform: translateY(40px) scale(0.95); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        .animate-video-slide {
          animation: slideUpVideo 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes progressPulseScale {
          0% { transform: scale(0.94); box-shadow: 0 0 0 0 rgba(250, 213, 60, 0.45); }
          50% { transform: scale(1.08); box-shadow: 0 0 0 6px rgba(250, 213, 60, 0.18); }
          100% { transform: scale(0.94); box-shadow: 0 0 0 0 rgba(250, 213, 60, 0.45); }
        }
        .animate-progress-pulse-scale {
          animation: progressPulseScale 1.8s ease-in-out infinite;
        }
      `}} />
      <section className="grid gap-3 xl:grid-cols-[2.15fr,1fr]">
        <div className="flex max-h-[calc(100vh-180px)] min-h-0 flex-col gap-3 overflow-hidden">
          <article>
            <UpcomingDeadlinesCard
              phases={upcomingDeadlinePhases}
              milestones={upcomingDeadlineMilestones}
            />
          </article>

          <div className="grid min-h-0 flex-1 auto-rows-fr gap-3 sm:grid-cols-2">
            <article className="relative flex h-full flex-col overflow-visible rounded-2xl bg-white p-3 dark:bg-slate-900">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Progress Meter</h3>
              <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                Track how consistently you are finishing planned tasks this week.
              </p>
              <div className="mt-2.5 flex-1 rounded-xl bg-slate-50/70 p-2 dark:bg-slate-800/40">
                

                <div className="space-y-0.5">
                  {plannerProgressSteps.map((step, idx) => {
                    const isCompleted = step.status === "completed";
                    const isCurrent = step.status === "current";
                    const isLast = idx === plannerProgressSteps.length - 1;

                    return (
                      <div key={step.id} className="relative flex gap-2 pb-1.5 last:pb-0">
                        <div className="relative flex w-5 shrink-0 justify-center">
                          {!isLast && (
                            <span
                              className={`absolute left-1/2 top-5 h-[calc(100%+1px)] w-[1.5px] -translate-x-1/2 ${
                                isCompleted || isCurrent ? "bg-[#FAD53C]" : "bg-slate-300 dark:bg-slate-600"
                              }`}
                              aria-hidden="true"
                            />
                          )}

                          {isCompleted && (
                            <span className="relative z-10 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#FAD53C] text-slate-900">
                              <BiCheck className="h-3 w-3" />
                            </span>
                          )}

                          {isCurrent && (
                            <span className="relative z-10 inline-flex h-5 w-5 items-center justify-center rounded-full">
                              <span className="absolute inset-0 rounded-full bg-[#FAD53C] animate-progress-pulse-scale" />
                              <span className="relative h-3 w-3 rounded-full bg-black" />
                            </span>
                            
                          )}

                          {!isCompleted && !isCurrent && (
                            <span className="relative z-10 inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800">
                              <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-500" />
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 pt-[1px]">
                          <p
                            className={`text-[13px] font-semibold leading-tight ${
                              isCurrent ? "text-slate-900 dark:text-slate-100" : "text-slate-800 dark:text-slate-200"
                            }`}
                          >
                            {step.title}
                          </p>
                          <p className="mt-0.5 line-clamp-1 text-[10px] text-slate-500 dark:text-slate-400">{step.description}</p>
                        </div>
                      </div>
                    );
                  })}

                  <p className="pt-0.5 text-[10px] text-slate-500 dark:text-slate-400">18 of 22 planned tasks completed this week.</p>
                </div>
              </div>
            </article>

            <article className="flex h-full flex-col rounded-2xl bg-white p-3 dark:bg-slate-900">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Confidence Meter</h3>
              <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                See how your topic confidence is improving based on mock and revision performance.
              </p>
              <div className="mt-2.5 grid flex-1 auto-rows-fr gap-2.5 overflow-visible sm:grid-cols-2">
                <ConfidenceDonut
                  totalLabel="Total Topics"
                  totalValue="30"
                  segments={topicConfidenceSegments}
                />
                <ConfidenceDonut
                  totalLabel="Recent Attempts"
                  totalValue="29"
                  segments={examConfidenceSegments}
                />
              </div>
            </article>
          </div>
        </div>

        <div className="flex max-h-[calc(100vh-180px)] flex-col gap-3 overflow-hidden">
          <article className="rounded-2xl bg-white dark:bg-slate-900 p-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Recommendations</h2>
                <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                  Personalized actions to keep your preparation momentum high.
                </p>
              </div>
              <div className="hidden md:flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <button
                  onClick={goToPreviousRecommendation}
                  aria-label="Previous recommendation"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700"
                >
                  <BiChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={goToNextRecommendation}
                  aria-label="Next recommendation"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700"
                >
                  <BiChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-2 overflow-hidden rounded-lg">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${activeRecommendationIndex * 100}%)` }}
              >
                {recommendations.map((item) => (
                  <div key={item.title} className="w-full shrink-0 bg-slate-50 dark:bg-slate-900 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[13px] font-semibold text-slate-900 dark:text-slate-100">
                        {item.title}
                      </p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${item.priority === "High" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"}`}>
                        {item.priority}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-300">{item.category}</p>
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{item.reason}</p>
                    <div className="mt-1.5">
                      <Button
                        variant="themeButton"
                        size="sm"
                        className="!rounded-full px-3 py-1 text-[11px]"
                      >
                        Take Action
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white px-3 py-2 dark:bg-slate-900">
                <div className="flex items-center justify-center gap-1.5">
                  {recommendations.map((item, idx) => (
                    <button
                      key={item.title}
                      onClick={() => {
                        setActiveRecommendationIndex(idx);
                        setActiveRecommendationProgress(0);
                      }}
                      aria-label={`Show recommendation ${idx + 1}`}
                      className={`relative h-1.5 overflow-hidden rounded-full transition-all ${
                        idx === activeRecommendationIndex
                          ? "w-10 bg-[#FAD53C]/35"
                          : "w-2 bg-[#FAD53C]/45 dark:bg-[#FAD53C]/25"
                      }`}
                    >
                      {idx === activeRecommendationIndex && (
                        <span
                          className="absolute inset-y-0 left-0 rounded-full bg-[#FAD53C] transition-[width] duration-100 ease-linear"
                          style={{ width: `${activeRecommendationProgress}%` }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </article>

          <article className="flex min-h-0 flex-1 flex-col rounded-2xl bg-white dark:bg-slate-900 p-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Quick Self-Study Picks</h3>
                <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                  Short tactical videos curated to improve your next mock score.
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700">
                  <BiChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <article className="mt-3 rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 dark:border-slate-700 dark:bg-slate-800/40 relative">
              <div className="relative overflow-hidden rounded-lg bg-black aspect-[21/9] w-full">
                {quickStudyPicks.map((video, idx) => {
                  const isPreload = idx === preloadVideoIndex;
                  const isActive = idx === activeVideoIndex;
                  const isPrev = idx === prevVideoIndex;
                  if (!isActive && !isPreload && !isPrev) return null;
                  
                  const vId = getYoutubeId(video.videoUrl);
                  
                  let containerClass = "absolute inset-0 w-full h-full ";
                  if (isActive) containerClass += "z-20 animate-video-slide";
                  else if (isPrev) containerClass += "z-10 opacity-100";
                  else if (isPreload) containerClass += "z-0 opacity-0 pointer-events-none";

                  return (
                    <div key={vId || video.title} className={containerClass}>
                      {vId ? (
                        <iframe
                          src={`https://www.youtube-nocookie.com/embed/${vId}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&playsinline=1&loop=1&playlist=${vId}&start=5&end=15`}
                          title={`${video.title} preview`}
                          className="absolute top-1/2 left-0 w-full aspect-video -translate-y-1/2 pointer-events-none"
                          loading="lazy"
                          allow="autoplay; encrypted-media; picture-in-picture"
                        />
                      ) : (
                        <img src={video.thumbnail} alt={video.title} className="absolute top-1/2 left-0 w-full aspect-video -translate-y-1/2 object-cover pointer-events-none" loading="lazy" />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-2.5 relative min-h-[36px]">
                {quickStudyPicks.map((video, idx) => {
                  const isActive = idx === activeVideoIndex;
                  const isPrev = idx === prevVideoIndex;
                  if (!isActive && !isPrev) return null;
                  
                  return (
                    <div 
                      key={"details-" + video.title} 
                      className={`absolute inset-0 flex items-center justify-between gap-2 w-full bg-slate-50 dark:bg-slate-800 ${isActive ? "z-20 animate-video-slide" : "z-10 opacity-100"}`}
                    >
                      <p className="line-clamp-2 text-xs font-semibold text-slate-900 dark:text-slate-100">{video.title}</p>
                      <Button
                        href={video.videoUrl}
                        variant="themeButtonOutline"
                        size="sm"
                        className="!rounded-full px-3 py-1 text-[11px] shrink-0"
                      >
                        Watch now
                      </Button>
                    </div>
                  );
                })}
              </div>
            </article>

            <div className="relative mt-3 min-h-[250px] flex-1 overflow-hidden shrink-0">
              <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-8 bg-gradient-to-b from-white via-white/75 to-transparent dark:from-slate-900 dark:via-slate-900/70" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-10 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-slate-900 dark:via-slate-900/70" />
              <div className="min-h-0 h-full overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:black_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-lg [&::-webkit-scrollbar-thumb]:bg-black/90 [&::-webkit-scrollbar-thumb]:border-[2px] [&::-webkit-scrollbar-thumb]:border-solid [&::-webkit-scrollbar-thumb]:border-white dark:[&::-webkit-scrollbar-thumb]:bg-[#FAD53C]/80 dark:[&::-webkit-scrollbar-thumb]:border-slate-900">
              {quickStudyPicks.map((item, idx) => {
                if (idx === activeVideoIndex) return null;
                return (
                  <article key={item.title} className="py-2 first:pt-0 last:pb-0">
                    <button onClick={() => handleVideoSelect(idx)} className="w-full text-left flex items-start gap-3 rounded-md px-1 py-1 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="relative h-16 w-28 flex-shrink-0 overflow-hidden rounded-md bg-action-50 dark:bg-slate-700">
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                        <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
                          {item.duration}
                        </span>
                      </div>
                      <div className="min-w-0 pt-0.5">
                        <h3 className="text-[13px] font-semibold leading-snug text-slate-900 dark:text-slate-100 line-clamp-2">{item.title}</h3>
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{item.tag} · YouTube</p>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {item.tags.map((tag) => (
                            <span
                              key={`${item.title}-${tag}`}
                              className="rounded-full border border-slate-300/90 px-2 py-0.5 text-[9px] font-medium text-slate-500 dark:border-slate-600 dark:text-slate-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </button>
                  </article>
                );
              })}
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
