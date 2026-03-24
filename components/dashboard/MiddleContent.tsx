"use client";

import { useEffect, useState } from "react";
import { BiChevronLeft, BiChevronRight } from "react-icons/bi";
import { Button } from "../shared";

const studentProfile = {
  fullName: "Dinesh Sharma",
  airRank: "#2,340",
  stream: "Engineering",
  targetIntake: "2026",
  interests: ["Artificial Intelligence", "Robotics", "Data Science"],
  strengths: ["Mathematics", "Physics", "Problem Solving", "Aptitude", "Reasoning"],
  profileStrength: 85,
};

const deadlinePhases = [
  { phase: "Phase 1", window: "Jul 20 - Aug 14", daysLeft: 13, status: "On track" },
  { phase: "Phase 2", window: "Aug 15 - Sep 07", daysLeft: 27, status: "Action needed" },
  { phase: "Phase 3", window: "Sep 08 - Sep 30", daysLeft: 36, status: "Planned" },
  { phase: "Phase 4", window: "Oct 01 - Nov 07", daysLeft: 63, status: "Planned" },
];

const progressSubjects = [
  { label: "Mathematics", confidence: 78, trend: "+5% this month" },
  { label: "Physics", confidence: 66, trend: "+2% this month" },
  { label: "Chemistry", confidence: 72, trend: "+4% this month" },
];

const journeyStages = [
  "Prospect",
  "First Time Buyer",
  "Repeat Customer",
  "Loyal Customer",
  "Promoter",
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
    thumbnail: "https://i.ytimg.com/vi/8hly31xKli0/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=8hly31xKli0",
  },
  {
    title: "Coordinate Geometry One Shot",
    duration: "35 min",
    tag: "Math",
    thumbnail: "https://i.ytimg.com/vi/rfscVS0vtbw/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=rfscVS0vtbw",
  },
  {
    title: "Organic Chemistry Quick Concepts",
    duration: "28 min",
    tag: "Chemistry",
    thumbnail: "https://i.ytimg.com/vi/kqtD5dpn9C8/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=kqtD5dpn9C8",
  },
  {
    title: "Probability PYQ Strategy",
    duration: "19 min",
    tag: "Math",
    thumbnail: "https://i.ytimg.com/vi/_uQrJ0TkZlc/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=_uQrJ0TkZlc",
  },
  {
    title: "Current Electricity Fast Revision",
    duration: "24 min",
    tag: "Physics",
    thumbnail: "https://i.ytimg.com/vi/3fumBcKC6RE/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=3fumBcKC6RE",
  },
  {
    title: "How to Attempt Mock Tests Better",
    duration: "16 min",
    tag: "Exam Prep",
    thumbnail: "https://i.ytimg.com/vi/HGTJBPNC-Gw/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=HGTJBPNC-Gw",
  },
  {
    title: "Electrostatics Rapid Practice Session",
    duration: "21 min",
    tag: "Physics",
    thumbnail: "https://i.ytimg.com/vi/9bZkp7q19f0/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=9bZkp7q19f0",
  },
  {
    title: "Ionic Equilibrium Problem Solving",
    duration: "26 min",
    tag: "Chemistry",
    thumbnail: "https://i.ytimg.com/vi/jNQXAC9IVRw/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
  },
];

export default function MiddleContent() {
  const [activeRecommendationIndex, setActiveRecommendationIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveRecommendationIndex((prev) => (prev + 1) % recommendations.length);
    }, 3200);

    return () => clearInterval(timer);
  }, []);

  const goToPreviousRecommendation = () => {
    setActiveRecommendationIndex((prev) =>
      prev === 0 ? recommendations.length - 1 : prev - 1,
    );
  };

  const goToNextRecommendation = () => {
    setActiveRecommendationIndex((prev) => (prev + 1) % recommendations.length);
  };

  return (
    <div className="space-y-3">
      <section className="rounded-2xl bg-white dark:bg-slate-900 p-3 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
        <div className="grid gap-2 lg:grid-cols-[170px,1fr]">
          <div className="rounded-xl bg-action-50 dark:bg-slate-800 px-4 py-3 ring-1 ring-action-100 dark:ring-slate-700">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">AIR</p>
            <p className="mt-0.5 text-2xl font-semibold text-slate-900 dark:text-slate-100">{studentProfile.airRank}</p>
          </div>

          <div className="space-y-2">
            <div className="grid gap-2 sm:grid-cols-4">
              <div className="rounded-xl bg-highlight-100 dark:bg-slate-800 px-4 py-3 ring-1 ring-highlight-200 dark:ring-slate-700">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Stream</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">{studentProfile.stream}</p>
              </div>
              {studentProfile.interests.map((item, index) => (
                <div key={item} className="rounded-xl bg-[#fdf8ff] dark:bg-slate-800 px-4 py-3 ring-1 ring-[#f2e6ff] dark:ring-slate-700">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Interest {index + 1}</p>
                  <p className="mt-0.5 truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{item}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-2 sm:grid-cols-5">
              {studentProfile.strengths.map((item, idx) => (
                <div key={item} className="rounded-xl bg-[#fffaf0] dark:bg-slate-800 px-4 py-3 ring-1 ring-[#f7ead1] dark:ring-slate-700">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Strength {idx + 1}</p>
                  <p className="mt-0.5 truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 xl:grid-cols-[1.8fr,1fr]">
        <article className="rounded-2xl bg-white dark:bg-slate-900 p-3 ring-1 ring-slate-200 dark:ring-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Upcoming Deadlines</h2>
          <div className="mt-3 rounded-xl bg-white dark:bg-slate-900 p-3 ring-1 ring-slate-200 dark:ring-slate-700">
            <div className="h-16 rounded-lg bg-white/80 dark:bg-slate-800" />
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {deadlinePhases.map((item) => (
                <div key={item.phase} className="rounded-md bg-white dark:bg-slate-900 px-2.5 py-2 ring-1 ring-slate-200 dark:ring-slate-700">
                  <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">{item.phase}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{item.window}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-brand-ink dark:text-slate-200">{item.daysLeft}d</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">{item.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 rounded-xl bg-white dark:bg-slate-900 p-3 ring-1 ring-slate-200 dark:ring-slate-700">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Progress & Confidence</h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {progressSubjects.slice(0, 2).map((subject) => (
                <div key={subject.label} className="rounded-lg bg-white dark:bg-slate-900 p-2.5 ring-1 ring-slate-200 dark:ring-slate-700">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{subject.label}</p>
                  <div className="mt-2 h-14 w-14 rounded-full border-[7px] border-action-100 dark:border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-800 dark:text-slate-100">
                    {subject.confidence}%
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">{subject.trend}</p>
                </div>
              ))}

              <div className="rounded-lg bg-white dark:bg-slate-900 p-2.5 ring-1 ring-slate-200 dark:ring-slate-700 sm:col-span-2">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Journey Stage</p>
                <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
                  {journeyStages.map((step, idx) => (
                    <div key={step} className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${idx <= 2 ? "bg-action-500" : "bg-slate-300 dark:bg-slate-600"}`} />
                      <span className="text-[11px] text-slate-700 dark:text-slate-300">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </article>

        <div className="flex max-h-[calc(100vh-180px)] flex-col gap-3 overflow-hidden">
          <article className="rounded-2xl bg-white dark:bg-slate-900 p-3 ring-1 ring-slate-200 dark:ring-slate-800">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Recommendations</h2>
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

            <div className="mt-3 overflow-hidden rounded-lg ring-1 ring-slate-200 dark:ring-slate-700">
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
                  </div>
                ))}
              </div>

              <div className="bg-white px-3 py-2 dark:bg-slate-900">
                <div className="flex items-center justify-center gap-1.5">
                  {recommendations.map((item, idx) => (
                    <button
                      key={item.title}
                      onClick={() => setActiveRecommendationIndex(idx)}
                      aria-label={`Show recommendation ${idx + 1}`}
                      className={`h-1.5 rounded-full transition-all ${idx === activeRecommendationIndex ? "w-5 bg-action-500" : "w-1.5 bg-slate-300 dark:bg-slate-600"}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </article>

          <article className="flex min-h-0 flex-1 flex-col rounded-2xl bg-white dark:bg-slate-900 p-3 ring-1 ring-slate-200 dark:ring-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Quick Self-Study Picks</h3>
              <div className="flex items-center gap-1.5">
                <Button variant="ghost" size="sm">Playlist</Button>
                <button className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700">
                  <BiChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-3 min-h-0 flex-1 divide-y divide-slate-200 overflow-y-auto pr-1 dark:divide-slate-700">
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
                    </div>
                  </a>
                </article>
              ))}
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
