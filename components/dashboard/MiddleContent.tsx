"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { BiCheck, BiChevronLeft, BiChevronRight } from "react-icons/bi";
import { Button } from "../shared";
import UpcomingDeadlinesCard from "./UpcomingDeadlinesCard";
import { useDashboardExamsMetaQuery } from "@/lib/dashboardExamShortlistQueries";
import {
  useDocumentVaultQuery,
  useDashboardCollegesQuery,
  useDashboardScholarshipsQuery,
  useDashboardInstitutesQuery,
  useProfileCompletionQuery,
} from "@/lib/dashboardSidebarQueries";
import { useStrengthPaymentStatusQuery, useGoalSelectionStatusQuery } from "@/lib/strengthQueries";
import { buildJourneyPhases, buildJourneyMilestones } from "@/lib/dashboardJourneyPhases";
import { calculateDocumentVaultCompletion } from "@/lib/documentVault";
import {
  getProgressMeterDotColor,
  getExamShortlistProgressPercent,
  getCollegeDiscoveryProgressPercent,
  getScholarshipTrackerProgressPercent,
  getCoachingShortlistProgressPercent,
  getApplicationReadyProgressPercent,
  getWeeklyMockTestsProgressPercent,
  getPerformanceInsightsDotColor,
  getRankPredictorDotColor,
  getRankPredictorProgressPercent,
  getCounsellingReadyDotColor,
  getAptitudeMappingDotColor,
  getAptitudeMappingProgressPercent,
  getGoalSelectionDotColor,
  getGoalSelectionProgressPercent,
  type ProgressMeterStep,
} from "@/lib/progressMeter";

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

function ProgressMeterDot({
  percent,
  isLoading = false,
  dotColor,
}: {
  percent: number;
  isLoading?: boolean;
  dotColor?: string;
}) {
  if (isLoading) {
    return (
      <span className="relative z-10 inline-flex h-5 w-5 animate-pulse items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700" />
    );
  }

  const color = dotColor ?? getProgressMeterDotColor(percent);
  const isComplete = percent >= 100;

  if (isComplete) {
    return (
      <span
        className="relative z-10 inline-flex h-5 w-5 items-center justify-center rounded-full text-white"
        style={{ backgroundColor: color }}
      >
        <BiCheck className="h-3 w-3" />
      </span>
    );
  }

  return (
    <span className="relative z-10 inline-flex h-5 w-5 items-center justify-center rounded-full">
      <span
        className="absolute inset-0 animate-progress-pulse-scale rounded-full opacity-50"
        style={{ backgroundColor: color }}
      />
      <span className="relative h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
    </span>
  );
}

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
  tooltipAlign?: "start" | "end" | "center";
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

const ConfidenceDonut = ({ totalLabel, totalValue, segments, tooltipAlign = "center" }: ConfidenceDonutProps) => {
  const [hoveredSegmentId, setHoveredSegmentId] = useState<string | null>(null);

  // --- Responsive radius via ResizeObserver ---
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [dim, setDim] = useState(160); // px — safe default before first measure

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.floor(entry.contentRect.width);
      if (w > 0) setDim(w);
    });
    ro.observe(el);
    // Seed immediately from current layout
    const w = Math.floor(el.getBoundingClientRect().width);
    if (w > 0) setDim(w);
    return () => ro.disconnect();
  }, []);

  // All SVG values scale linearly from the measured pixel width.
  // Proportions are preserved from the original 220 px design:
  //   radius     = 76 / 220  ≈ 34.5 %
  //   strokeWidth = 26 / 220  ≈ 11.8 %
  const size        = dim;
  const center      = dim / 2;
  const radius      = dim * 0.345;
  const strokeWidth = Math.max(dim * 0.118, 6); // min 6 px so it never disappears
  const circumference   = 2 * Math.PI * radius;
  const tangentGapLength = strokeWidth;

  // Build per-segment dash params (same math, now all in dim-space)
  let offsetAngle = 0;
  const segmentDefs = segments.map((seg) => {
    const angleDeg   = (seg.percent / 100) * 360;
    const arcLength  = (angleDeg / 360) * circumference;
    const visibleArc = Math.max(arcLength - tangentGapLength, 2);
    const dashArray  = `${visibleArc} ${circumference - visibleArc}`;
    const startLength = (offsetAngle / 360) * circumference + tangentGapLength / 2;
    const dashOffset  = circumference - startLength;
    const midAngle    = offsetAngle + angleDeg / 2;
    offsetAngle += angleDeg;
    return { ...seg, dashArray, dashOffset, midAngle };
  });

  const hoveredSegment = segmentDefs.find((seg) => seg.id === hoveredSegmentId) ?? null;
  const tooltipTheta   = hoveredSegment ? ((hoveredSegment.midAngle - 90) * Math.PI) / 180 : 0;
  const tooltipY       = hoveredSegment ? Math.sin(tooltipTheta) : 0;
  const tooltipYOffset = Math.max(-34, Math.min(34, tooltipY * 30));

  // Centre label font scales with the donut.
  // Inner clear diameter ≈ dim × (radius_ratio − strokeWidth_ratio/2) × 2 ≈ dim × 0.46
  // Keep both fonts comfortably inside that space.
  const innerClearPx = dim * (0.345 - 0.118 / 2) * 2; // usable inner diameter in px
  const labelFontPx  = Math.max(Math.round(dim * 0.052), 8);   // ~8px at 160px
  const valueFontPx  = Math.max(Math.round(dim * 0.105), 11);  // ~17px at 160px

  return (
    <div
      className={`relative flex h-full flex-col items-center overflow-visible rounded-xl bg-white/80 p-2.5 dark:bg-slate-900/45 ${
        hoveredSegment ? "z-[70]" : "z-10"
      }`}
    >
      {/* Fluid square measured by ResizeObserver — grows to fill column, capped at 208 px */}
      <div
        ref={wrapperRef}
        className="relative mt-1 w-full max-w-[208px] overflow-visible"
        style={{ aspectRatio: "1 / 1" }}
        onMouseLeave={() => setHoveredSegmentId(null)}
      >
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="h-full w-full"
          style={{ transform: "rotate(-90deg)" }}
          aria-hidden="true"
        >
          {/* Background track */}
          <circle cx={center} cy={center} r={radius} fill="none" stroke="#ffffff" strokeWidth={strokeWidth} />
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

        {/* Centre label — clipped to inner-circle width, fluid font sizes */}
        <div className="pointer-events-none absolute inset-0 grid place-items-center overflow-hidden">
          <div
            className="flex flex-col items-center justify-center overflow-hidden text-center"
            style={{
              width:     `${innerClearPx * 0.78}px`, // 78% of inner clear diameter
              maxHeight: `${innerClearPx * 0.65}px`, // prevent vertical overflow
              gap:       `${Math.max(dim * 0.018, 2)}px`,
            }}
          >
            <p
              className="w-full truncate font-medium leading-tight text-slate-500 dark:text-slate-400"
              style={{ fontSize: `${labelFontPx}px` }}
            >
              {totalLabel}
            </p>
            <p
              className="w-full truncate font-bold leading-none text-slate-900 dark:text-slate-100"
              style={{ fontSize: `${valueFontPx}px` }}
            >
              {totalValue}
            </p>
          </div>
        </div>

        {/* Hover tooltip */}
        <div
          className={`absolute top-1/2 z-[80] rounded-lg border border-slate-200 bg-white/95 p-3 text-left shadow-lg transition-all duration-300 ease-out dark:border-slate-700 dark:bg-slate-900/95 ${
            hoveredSegment ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          }`}
          style={{
            width: "min(220px, calc(100% - 8px))",
            ...(tooltipAlign === "start"
              ? { left: "4px", transform: `translateY(calc(-50% + ${tooltipYOffset.toFixed(1)}px))` }
              : tooltipAlign === "end"
                ? { right: "4px", transform: `translateY(calc(-50% + ${tooltipYOffset.toFixed(1)}px))` }
                : { left: "50%", transform: `translate(-50%, calc(-50% + ${tooltipYOffset.toFixed(1)}px))` }),
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
  const { data: examMeta, isLoading: examMetaLoading, isError: examMetaError } =
    useDashboardExamsMetaQuery();
  const { data: strengthPayment, isLoading: strengthPaymentLoading } =
    useStrengthPaymentStatusQuery();
  const { data: goalSelection, isLoading: goalSelectionLoading } =
    useGoalSelectionStatusQuery();
  const { data: profileCompletion, isLoading: profileCompletionLoading } =
    useProfileCompletionQuery();
  const { data: documentVault, isLoading: documentVaultLoading } = useDocumentVaultQuery();
  const { data: collegesMeta, isLoading: collegesMetaLoading } = useDashboardCollegesQuery();
  const { data: scholarshipsMeta, isLoading: scholarshipsMetaLoading } =
    useDashboardScholarshipsQuery();
  const { data: institutesMeta, isLoading: institutesMetaLoading } =
    useDashboardInstitutesQuery();
  const journeyPhaseDates = useMemo(
    () => ({
      phase1ApplicationStarts: examMeta?.phase1ApplicationStarts,
      phase2ApplicationCloses: examMeta?.phase2ApplicationCloses,
      phase3AdmitCardDates: examMeta?.phase3AdmitCardDates,
      phase4MockTestReminders: examMeta?.phase4MockTestReminders,
      phase4MockTestSummary: examMeta?.phase4MockTestSummary,
      phase5ExamDates: examMeta?.phase5ExamDates,
      phase6ResultDates: examMeta?.phase6ResultDates,
      phase7CounsellingDates: examMeta?.phase7CounsellingDates,
    }),
    [
      examMeta?.phase1ApplicationStarts,
      examMeta?.phase2ApplicationCloses,
      examMeta?.phase3AdmitCardDates,
      examMeta?.phase4MockTestReminders,
      examMeta?.phase4MockTestSummary,
      examMeta?.phase5ExamDates,
      examMeta?.phase6ResultDates,
      examMeta?.phase7CounsellingDates,
    ],
  );
  const journeyPhases = useMemo(
    () => buildJourneyPhases(journeyPhaseDates),
    [journeyPhaseDates],
  );
  const journeyMilestones = useMemo(
    () => buildJourneyMilestones(journeyPhaseDates),
    [journeyPhaseDates],
  );
  const profileCompletionPercent = profileCompletion?.percentage ?? 0;
  const documentVaultStats = useMemo(
    () => calculateDocumentVaultCompletion(documentVault ?? undefined),
    [documentVault],
  );
  const shortlistedExamsCount = examMeta?.shortlistedExamIds?.length ?? 0;
  const examShortlistPercent = useMemo(
    () => getExamShortlistProgressPercent(shortlistedExamsCount),
    [shortlistedExamsCount],
  );
  const shortlistedCollegesCount = collegesMeta?.shortlistedCollegeIds?.length ?? 0;
  const collegeDiscoveryPercent = useMemo(
    () => getCollegeDiscoveryProgressPercent(shortlistedCollegesCount),
    [shortlistedCollegesCount],
  );
  const shortlistedScholarshipsCount = scholarshipsMeta?.shortlistedScholarshipIds?.length ?? 0;
  const scholarshipTrackerPercent = useMemo(
    () => getScholarshipTrackerProgressPercent(shortlistedScholarshipsCount),
    [shortlistedScholarshipsCount],
  );
  const shortlistedCoachingCount = institutesMeta?.shortlistedInstituteIds?.length ?? 0;
  const coachingShortlistPercent = useMemo(
    () => getCoachingShortlistProgressPercent(shortlistedCoachingCount),
    [shortlistedCoachingCount],
  );
  const applicationReadyStats = useMemo(
    () =>
      getApplicationReadyProgressPercent(
        examMeta?.shortlistedExamIds ?? [],
        examMeta?.automationFilledExamIds ?? [],
      ),
    [examMeta?.automationFilledExamIds, examMeta?.shortlistedExamIds],
  );
  const weeklyCompletedMockCount = examMeta?.weeklyCompletedMockCount ?? 0;
  const weeklyMockTestsPercent = useMemo(
    () => getWeeklyMockTestsProgressPercent(weeklyCompletedMockCount),
    [weeklyCompletedMockCount],
  );
  const performanceInsights = examMeta?.performanceInsights;
  const performanceInsightsPercent = performanceInsights?.percent ?? 0;
  const rankPredictor = examMeta?.rankPredictor;
  const rankPredictorIsImproving = rankPredictor?.isImproving ?? true;
  const rankPredictorPercent = getRankPredictorProgressPercent(rankPredictorIsImproving);
  const counsellingReady = examMeta?.counsellingReady;
  const counsellingReadyPercent = counsellingReady?.percent ?? 0;
  const aptitudeMappingIsPaid = strengthPayment?.payment_status === "paid";
  const aptitudeMappingPercent = getAptitudeMappingProgressPercent(aptitudeMappingIsPaid);
  const goalSelectionHasStrengths = goalSelection?.hasStrengths ?? false;
  const goalSelectionPercent = getGoalSelectionProgressPercent(goalSelectionHasStrengths);
  const progressMeterSteps = useMemo<ProgressMeterStep[]>(
    () => [
      {
        id: "profile-completed",
        title: "Profile Completed",
        description: profileCompletionLoading
          ? "Loading profile progress…"
          : `${profileCompletionPercent}% complete`,
        percent: profileCompletionPercent,
        isLoading: profileCompletionLoading,
      },
      {
        id: "document-vault",
        title: "Document Vault",
        description: documentVaultLoading
          ? "Loading document vault…"
          : `${documentVaultStats.percentage}% complete · ${documentVaultStats.completedFields}/${documentVaultStats.totalFields} uploaded`,
        percent: documentVaultStats.percentage,
        isLoading: documentVaultLoading,
      },
      {
        id: "exam-shortlisted",
        title: "Exam Shortlisted",
        description: examMetaLoading
          ? "Loading exam shortlist…"
          : `${shortlistedExamsCount} shortlisted · ${examShortlistPercent}% complete`,
        percent: examShortlistPercent,
        isLoading: examMetaLoading,
      },
      {
        id: "college-discovery",
        title: "College Discovery",
        description: collegesMetaLoading
          ? "Loading college shortlist…"
          : `${shortlistedCollegesCount} shortlisted · ${collegeDiscoveryPercent}% complete`,
        percent: collegeDiscoveryPercent,
        isLoading: collegesMetaLoading,
      },
      {
        id: "scholarship-tracker",
        title: "Scholarship Tracker",
        description: scholarshipsMetaLoading
          ? "Loading scholarship shortlist…"
          : `${shortlistedScholarshipsCount} shortlisted · ${scholarshipTrackerPercent}% complete`,
        percent: scholarshipTrackerPercent,
        isLoading: scholarshipsMetaLoading,
      },
      {
        id: "coaching-shortlisted",
        title: "Coaching Shortlisted",
        description: institutesMetaLoading
          ? "Loading coaching shortlist…"
          : `${shortlistedCoachingCount} shortlisted · ${coachingShortlistPercent}% complete`,
        percent: coachingShortlistPercent,
        isLoading: institutesMetaLoading,
      },
      {
        id: "application-ready",
        title: "Application Ready",
        description: examMetaLoading
          ? "Loading application progress…"
          : applicationReadyStats.totalCount === 0
            ? "Shortlist exams to track application readiness"
            : `${applicationReadyStats.filledCount}/${applicationReadyStats.totalCount} forms filled · ${applicationReadyStats.percent}% complete`,
        percent: applicationReadyStats.percent,
        isLoading: examMetaLoading,
      },
      {
        id: "mock-tests",
        title: "Mock Tests",
        description: examMetaLoading
          ? "Loading mock test progress…"
          : `${weeklyCompletedMockCount} completed this week · ${weeklyMockTestsPercent}% complete`,
        percent: weeklyMockTestsPercent,
        isLoading: examMetaLoading,
      },
      {
        id: "performance-insights",
        title: "Performance Insights Tracked",
        description: examMetaLoading
          ? "Loading performance insights…"
          : !performanceInsights?.hasDueWeeks
            ? "Warm-up tracking starts closer to your exam dates"
            : `${performanceInsights.satisfiedWeeks}/${performanceInsights.dueWeeks} weekly checks passed · ${performanceInsightsPercent}% complete`,
        percent: performanceInsightsPercent,
        isLoading: examMetaLoading,
        dotColor: getPerformanceInsightsDotColor(performanceInsightsPercent),
      },
      {
        id: "rank-predictor",
        title: "Rank Predictor",
        description: examMetaLoading
          ? "Loading rank trend…"
          : (rankPredictor?.attemptCount ?? 0) === 0
            ? "No ranked attempts yet · take a mock to start tracking"
            : (rankPredictor?.attemptCount ?? 0) === 1
              ? `First ranked attempt · AIR #${rankPredictor?.currentRank ?? "—"}`
              : rankPredictorIsImproving
                ? `Rank improved · AIR #${rankPredictor?.previousRank ?? "—"} → #${rankPredictor?.currentRank ?? "—"}`
                : `Rank declined · AIR #${rankPredictor?.previousRank ?? "—"} → #${rankPredictor?.currentRank ?? "—"}`,
        percent: rankPredictorPercent,
        isLoading: examMetaLoading,
        dotColor: getRankPredictorDotColor(rankPredictorIsImproving),
      },
      {
        id: "counselling-ready",
        title: "Counselling Ready",
        description: examMetaLoading
          ? "Loading counselling readiness…"
          : (counsellingReady?.totalCount ?? 0) === 0 && !counsellingReady?.hasCounsellingDates
            ? "Complete applications with counselling dates to track readiness"
            : !counsellingReady?.hasCounsellingDates
              ? "No counselling dates set for completed applications yet"
              : counsellingReady?.isReady
                ? `${counsellingReady.activeCount}/${counsellingReady.totalCount} counselling windows active · 100% ready`
                : `${counsellingReady?.activeCount ?? 0}/${counsellingReady?.totalCount ?? 0} counselling windows active · ${counsellingReadyPercent}% ready`,
        percent: counsellingReadyPercent,
        isLoading: examMetaLoading,
        dotColor: getCounsellingReadyDotColor(counsellingReadyPercent),
      },
      {
        id: "aptitude-mapping",
        title: "Aptitude Mapping Done",
        description: strengthPaymentLoading
          ? "Loading aptitude mapping status…"
          : aptitudeMappingIsPaid
            ? "Aptitude mapping payment complete · 100%"
            : "Complete aptitude mapping payment · 0%",
        percent: aptitudeMappingPercent,
        isLoading: strengthPaymentLoading,
        dotColor: getAptitudeMappingDotColor(aptitudeMappingIsPaid),
      },
      {
        id: "goal-selection",
        title: "Goal Selection",
        description: goalSelectionLoading
          ? "Loading goal selection status…"
          : goalSelectionHasStrengths
            ? "Strengths mapped · 100% complete"
            : "Awaiting strength mapping · 0% complete",
        percent: goalSelectionPercent,
        isLoading: goalSelectionLoading,
        dotColor: getGoalSelectionDotColor(goalSelectionHasStrengths),
      },
    ],
    [
      applicationReadyStats.filledCount,
      applicationReadyStats.percent,
      applicationReadyStats.totalCount,
      aptitudeMappingIsPaid,
      aptitudeMappingPercent,
      coachingShortlistPercent,
      collegeDiscoveryPercent,
      collegesMetaLoading,
      counsellingReady?.activeCount,
      counsellingReady?.hasCounsellingDates,
      counsellingReady?.isReady,
      counsellingReady?.totalCount,
      counsellingReadyPercent,
      documentVaultLoading,
      documentVaultStats.completedFields,
      documentVaultStats.percentage,
      documentVaultStats.totalFields,
      examMetaLoading,
      examShortlistPercent,
      goalSelectionHasStrengths,
      goalSelectionLoading,
      goalSelectionPercent,
      institutesMetaLoading,
      performanceInsights?.dueWeeks,
      performanceInsights?.hasDueWeeks,
      performanceInsights?.satisfiedWeeks,
      performanceInsightsPercent,
      profileCompletionLoading,
      profileCompletionPercent,
      rankPredictor?.attemptCount,
      rankPredictor?.currentRank,
      rankPredictor?.previousRank,
      rankPredictorIsImproving,
      rankPredictorPercent,
      scholarshipTrackerPercent,
      scholarshipsMetaLoading,
      shortlistedCoachingCount,
      shortlistedCollegesCount,
      shortlistedExamsCount,
      shortlistedScholarshipsCount,
      strengthPaymentLoading,
      weeklyCompletedMockCount,
      weeklyMockTestsPercent,
    ],
  );

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
          0% { transform: scale(0.94); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 0.28; }
          100% { transform: scale(0.94); opacity: 0.5; }
        }
        .animate-progress-pulse-scale {
          animation: progressPulseScale 1.8s ease-in-out infinite;
        }
      `}} />
      <section className="relative grid gap-3 xl:grid-cols-[2.15fr,1fr]">
        <div className="relative z-30 flex max-h-[calc(100vh-180px)] min-h-0 flex-col gap-3 overflow-visible">
          <article>
            {examMetaLoading ? (
              <div className="rounded-2xl bg-white p-6 text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                Loading your journey planner…
              </div>
            ) : examMetaError ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
                Could not load journey dates. Check your profile stream and try refreshing the page.
              </div>
            ) : (
              <UpcomingDeadlinesCard
                phases={journeyPhases}
                milestones={journeyMilestones}
              />
            )}
          </article>

          <div className="grid min-h-0 flex-1 auto-rows-fr gap-3 sm:grid-cols-2">
            <article className="relative z-20 flex h-full flex-col overflow-hidden rounded-2xl bg-white p-3 dark:bg-slate-900">
              {/* Card header — always visible */}
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Progress Meter</h3>
              <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                Track profile and milestone progress across your admission journey.
              </p>

              {/* Scrollable step list with fade-out hint */}
              <div className="relative mt-2.5 min-h-0 flex-1">
                <style dangerouslySetInnerHTML={{ __html: `
                  .progress-meter-scroll::-webkit-scrollbar { width: 3px; }
                  .progress-meter-scroll::-webkit-scrollbar-track { background: transparent; }
                  .progress-meter-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }
                  .dark .progress-meter-scroll::-webkit-scrollbar-thumb { background: #475569; }
                  .progress-meter-scroll { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
                ` }} />
                <div
                  className="progress-meter-scroll h-full overflow-y-auto rounded-xl bg-slate-50/70 p-2 dark:bg-slate-800/40"
                >
                  <div className="space-y-0.5">
                    {progressMeterSteps.map((step, idx) => {
                      const isLast = idx === progressMeterSteps.length - 1;
                      const connectorColor = step.isLoading
                        ? "#cbd5e1"
                        : (step.dotColor ?? getProgressMeterDotColor(step.percent));

                      return (
                        <div key={step.id} className="relative flex gap-2 pb-1.5 last:pb-0">
                          <div className="relative flex w-5 shrink-0 justify-center">
                            {!isLast && (
                              <span
                                className="absolute left-1/2 top-5 h-[calc(100%+1px)] w-[1.5px] -translate-x-1/2"
                                style={{ backgroundColor: connectorColor }}
                                aria-hidden="true"
                              />
                            )}

                            <ProgressMeterDot
                              percent={step.percent}
                              isLoading={step.isLoading}
                              dotColor={step.dotColor}
                            />
                          </div>

                          <div className="min-w-0 pt-[1px]">
                            <p className="text-[13px] font-semibold leading-tight text-slate-900 dark:text-slate-100">
                              {step.title}
                            </p>
                            <p className="mt-0.5 line-clamp-1 text-[10px] text-slate-500 dark:text-slate-400">
                              {step.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* Bottom fade-out scroll hint */}
                <div
                  className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 rounded-b-xl"
                  style={{
                    background: "linear-gradient(to bottom, transparent, var(--progress-fade, #f8fafc))",
                  }}
                  aria-hidden="true"
                />
              </div>

              {/* Footer note — always visible */}
              {!profileCompletionLoading &&
                !documentVaultLoading &&
                !examMetaLoading &&
                !collegesMetaLoading &&
                !scholarshipsMetaLoading &&
                !institutesMetaLoading && (
                <p className="mt-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                  Progress updates as you complete your profile, upload documents, build shortlists, fill applications, and take mock tests.
                </p>
              )}
            </article>

            <article className="relative flex h-full flex-col overflow-hidden rounded-2xl bg-white p-3 dark:bg-slate-900">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Confidence Meter</h3>
              <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                See how your topic confidence is improving based on mock and revision performance.
              </p>
              {/* Two-column on wide panels, single-column when cramped.
                  min-w-0 + overflow-hidden prevent any donut from escaping. */}
              <div className="mt-2.5 grid min-w-0 flex-1 grid-cols-1 gap-2.5 overflow-hidden [container-type:inline-size] sm:grid-cols-2">
                <ConfidenceDonut
                  totalLabel="Total Topics"
                  totalValue="30"
                  segments={topicConfidenceSegments}
                  tooltipAlign="start"
                />
                <ConfidenceDonut
                  totalLabel="Recent Attempts"
                  totalValue="29"
                  segments={examConfidenceSegments}
                  tooltipAlign="end"
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
