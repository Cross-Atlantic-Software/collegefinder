"use client";

import { useEffect, useState } from "react";
import { BiChevronLeft, BiChevronRight } from "react-icons/bi";
import { Button } from "../shared";
import UpcomingDeadlinesCard from "./UpcomingDeadlinesCard";
import type { Milestone, StudyPhase } from "./UpcomingDeadlinesCard";

const upcomingDeadlinePhases: StudyPhase[] = [
  {
    id: "phase-1",
    label: "Base Mapping",
    start: "2026-02-08",
    end: "2026-03-20",
    status: "done",
    progress: 100,
    deadlines: [
      { label: "Syllabus Audit", start: "2026-02-10", end: "2026-02-14" },
      { label: "Topic Heatmap", start: "2026-02-20", end: "2026-02-25" },
      { label: "Baseline Mock", start: "2026-03-12", end: "2026-03-15" },
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
      { label: "Physics Core Set", start: "2026-03-25", end: "2026-03-30" },
      { label: "Math Practice Grid", start: "2026-04-07", end: "2026-04-13" },
      { label: "Chemistry Recap", start: "2026-04-20", end: "2026-04-25" },
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
      { label: "PYQ Batch A", start: "2026-05-12", end: "2026-05-18" },
      { label: "Mixed Drill 1", start: "2026-05-24", end: "2026-05-29" },
      { label: "Checkpoint Gamma", start: "2026-06-10", end: "2026-06-14" },
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
      { label: "Mock Lite 2", start: "2026-07-04", end: "2026-07-06" },
      { label: "Mock Full 1", start: "2026-07-16", end: "2026-07-18" },
      { label: "Error Log Sprint", start: "2026-08-04", end: "2026-08-09" },
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
      { label: "Document Vault", start: "2026-08-25", end: "2026-08-31" },
      { label: "Scholarship Form", start: "2026-09-09", end: "2026-09-13" },
      { label: "Round-1 Applications", start: "2026-09-24", end: "2026-10-02" },
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
      { label: "Final Formula Stack", start: "2026-10-18", end: "2026-10-23" },
      { label: "Revision Lock", start: "2026-11-04", end: "2026-11-08" },
      { label: "Exam Readiness", start: "2026-11-20", end: "2026-11-24" },
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

const getYoutubeId = (url: string) => {
  const match = url.match(/[?&]v=([^&]+)/);
  return match?.[1] ?? "";
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

  const featuredVideo = quickStudyPicks[0];
  const featuredVideoId = getYoutubeId(featuredVideo.videoUrl);

  return (
    <div>
      <section className="grid gap-3 xl:grid-cols-[2.2fr,0.85fr]">
        <article>
          <UpcomingDeadlinesCard
            phases={upcomingDeadlinePhases}
            milestones={upcomingDeadlineMilestones}
          />
        </article>

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

            <div className="mt-3 overflow-hidden rounded-lg">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${activeRecommendationIndex * 100}%)` }}
              >
                {recommendations.map((item) => (
                  <div key={item.title} className="w-full shrink-0 bg-slate-50 dark:bg-slate-900 px-3 py-3">
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
                    <div className="mt-3">
                      <Button
                        variant="themeButtonOutline"
                        size="sm"
                        className="rounded-full px-3 py-1 text-[11px]"
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

            <article className="mt-3 rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 dark:border-slate-700 dark:bg-slate-800/40">
              <div className="overflow-hidden rounded-lg bg-black">
                {featuredVideoId ? (
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${featuredVideoId}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&playsinline=1&loop=1&playlist=${featuredVideoId}&start=5&end=15`}
                    title={`${featuredVideo.title} preview`}
                    className="aspect-video w-full"
                    loading="lazy"
                    allow="autoplay; encrypted-media; picture-in-picture"
                  />
                ) : (
                  <img src={featuredVideo.thumbnail} alt={featuredVideo.title} className="aspect-video w-full object-cover" loading="lazy" />
                )}
              </div>
              <div className="mt-2.5 flex items-center justify-between gap-2">
                <p className="line-clamp-2 text-xs font-semibold text-slate-900 dark:text-slate-100">{featuredVideo.title}</p>
                <Button
                  href={featuredVideo.videoUrl}
                  variant="themeButtonOutline"
                  size="sm"
                  className="rounded-full px-3 py-1 text-[11px]"
                >
                  Watch now
                </Button>
              </div>
            </article>

            <div className="relative mt-3 min-h-0 flex-1 overflow-hidden">
              <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-8 bg-gradient-to-b from-white via-white/75 to-transparent dark:from-slate-900 dark:via-slate-900/70" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-10 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-slate-900 dark:via-slate-900/70" />
              <div className="min-h-0 h-full overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:black_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-lg [&::-webkit-scrollbar-thumb]:bg-black/90 [&::-webkit-scrollbar-thumb]:border-[2px] [&::-webkit-scrollbar-thumb]:border-solid [&::-webkit-scrollbar-thumb]:border-white dark:[&::-webkit-scrollbar-thumb]:bg-[#FAD53C]/80 dark:[&::-webkit-scrollbar-thumb]:border-slate-900">
              {quickStudyPicks.map((item) => (
                <article key={item.title} className="py-2 first:pt-0 last:pb-0">
                  <a href={item.videoUrl} target="_blank" rel="noreferrer" className="flex items-start gap-3 rounded-md px-1 py-1 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
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
                  </a>
                </article>
              ))}
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
