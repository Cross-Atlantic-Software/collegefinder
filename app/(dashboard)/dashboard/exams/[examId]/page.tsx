"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { FiBookmark, FiCalendar, FiCheckCircle, FiChevronDown, FiClock, FiTarget, FiTrendingUp } from "react-icons/fi";
import { MdOutlineInsights, MdSchool } from "react-icons/md";
import { ChevronRight } from "lucide-react";
import { getAllExams, type Exam } from "@/api/exams";
import { Button } from "@/components/shared";
import { Sidebar, TopBar } from "@/components/dashboard";

type SectionId =
  | "dashboard"
  | "profile"
  | "exam-shortlist"
  | "college-shortlist"
  | "applications"
  | "exam-prep"
  | "test-module"
  | "know-your-strengths"
  | "admission-help"
  | "referral";

const SOURCE_BREADCRUMBS: Record<string, Array<{ label: string; href?: string }>> = {
  "profile-recommended": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Profile", href: "/dashboard?section=profile" },
    { label: "Recommended Exams" },
  ],
  "dashboard-shortlist-recommended": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Exam Shortlist", href: "/dashboard?section=exam-shortlist" },
    { label: "Recommended" },
  ],
  "dashboard-shortlist-shortlisted": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Exam Shortlist", href: "/dashboard?section=exam-shortlist" },
    { label: "Shortlisted" },
  ],
  "dashboard-shortlist-all": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Exam Shortlist", href: "/dashboard?section=exam-shortlist" },
    { label: "All Exams" },
  ],
  "dashboard-applications": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Applications", href: "/dashboard?section=applications" },
  ],
  "widget-eligible": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Eligible Exams Widget" },
  ],
  "widget-deadlines": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Upcoming Deadlines Widget" },
  ],
  "exam-directory": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Exam Directory", href: "/dashboard/exams" },
  ],
};

type TimelineItem = {
  label: string;
  month: string;
  note: string;
  critical?: boolean;
};

type DetailModel = {
  examType: string;
  conductingAuthority: string;
  mode: string;
  duration: string;
  questionCount: string;
  markingScheme: string;
  attempts: string;
  scoreWindow: string;
  eligibility: string[];
  timeline: TimelineItem[];
  competitiveness: {
    applicants: string;
    seats: string;
    typicalCutoff: string;
    difficulty: string;
  };
  prep: string[];
  resources: string[];
  cutoffBenchmarks: string[];
  fitSignals: string[];
};

type RecommendedVideo = {
  title: string;
  duration: string;
  thumbnail: string;
  videoUrl: string;
};

const RECOMMENDED_VIDEOS: RecommendedVideo[] = [
  {
    title: "JEE Main Physics Revision Marathon",
    duration: "42 min",
    thumbnail: "https://i.ytimg.com/vi/8hly31xKli0/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=8hly31xKli0",
  },
  {
    title: "Coordinate Geometry One Shot",
    duration: "35 min",
    thumbnail: "https://i.ytimg.com/vi/rfscVS0vtbw/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=rfscVS0vtbw",
  },
  {
    title: "How to Attempt Mock Tests Better",
    duration: "16 min",
    thumbnail: "https://i.ytimg.com/vi/HGTJBPNC-Gw/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=HGTJBPNC-Gw",
  },
  {
    title: "Current Electricity Fast Revision",
    duration: "24 min",
    thumbnail: "https://i.ytimg.com/vi/3fumBcKC6RE/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=3fumBcKC6RE",
  },
];

const PRESETS: Record<string, Partial<DetailModel>> = {
  "jee-main": {
    examType: "National level",
    conductingAuthority: "National Testing Agency (NTA)",
    mode: "Computer Based Test",
    duration: "3 hours",
    questionCount: "90 questions (75 to attempt)",
    markingScheme: "+4 correct, -1 incorrect",
    attempts: "2 sessions per year",
    scoreWindow: "Percentile + NTA score",
    competitiveness: {
      applicants: "11 to 13 lakh",
      seats: "~1.6 lakh across top institutes",
      typicalCutoff: "90+ percentile for strong options",
      difficulty: "High",
    },
    prep: [
      "Prioritize physics and math weak zones in a 6-week sprint plan.",
      "Run one full-length mock every 4 days and review errors same day.",
      "Keep last 30 days for formula recall and speed optimization.",
    ],
  },
  neet: {
    examType: "National level",
    conductingAuthority: "National Testing Agency (NTA)",
    mode: "Pen and paper",
    duration: "3 hours 20 minutes",
    questionCount: "200 questions (180 to attempt)",
    markingScheme: "+4 correct, -1 incorrect",
    attempts: "Once per year",
    scoreWindow: "Raw score + percentile",
    competitiveness: {
      applicants: "20+ lakh",
      seats: "~1.1 lakh MBBS seats",
      typicalCutoff: "620+ for highly competitive colleges",
      difficulty: "Very High",
    },
    prep: [
      "Use NCERT-first revision loops for Biology every week.",
      "Track negative marks by chapter and remove repeated error patterns.",
      "Run timed mixed-section drills to improve endurance.",
    ],
  },
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function getExamStream(examName: string): string {
  const name = examName.toLowerCase();

  if (name.includes("jee") || name.includes("engineering") || name.includes("bitsat") || name.includes("viteee")) {
    return "Engineering";
  }

  if (name.includes("neet") || name.includes("medical") || name.includes("aiims")) {
    return "Medical";
  }

  if (name.includes("clat") || name.includes("law")) {
    return "Law";
  }

  if (name.includes("cat") || name.includes("management") || name.includes("xat")) {
    return "Management";
  }

  return "General";
}

function getModel(exam: Exam | null, examId: string): DetailModel {
  const key = exam ? slugify(exam.name) : slugify(examId);
  const now = new Date();
  const year = now.getFullYear();

  const base: DetailModel = {
    examType: "National / State / Institute (varies)",
    conductingAuthority: "Official exam body",
    mode: "Online / Offline (varies by cycle)",
    duration: "2 to 3 hours",
    questionCount: "Varies by format",
    markingScheme: "Varies by paper",
    attempts: "1 to 2 attempts per year",
    scoreWindow: "Rank + percentile based",
    eligibility: [
      "Class 12 pass/appearing candidate from a recognized board",
      "Subject requirements vary by exam stream",
      "Identity and category documents should be ready before registration",
    ],
    timeline: [
      { label: "Registration Window", month: `Oct ${year}`, note: "Primary application form and fee submission.", critical: true },
      { label: "Correction Window", month: `Nov ${year}`, note: "Final chance to update key details." },
      { label: "Admit Card", month: `Jan ${year + 1}`, note: "Download and verify center details.", critical: true },
      { label: "Exam Day", month: `Feb ${year + 1}`, note: "Main exam attempt window.", critical: true },
      { label: "Results", month: `Mar ${year + 1}`, note: "Scorecard, rank, and eligibility outcomes." },
    ],
    competitiveness: {
      applicants: "5 to 15 lakh",
      seats: "Limited high-demand seats",
      typicalCutoff: "Varies by category and institute",
      difficulty: "Medium to High",
    },
    prep: [
      "Define a weekly plan with fixed mock-test and revision slots.",
      "Track weak topics in a mistake log and revisit every weekend.",
      "Prioritize high-yield chapters in the final month.",
    ],
    resources: [
      "Recommended self-study videos and chapter playlists",
      "Mock tests mapped to this exam pattern",
      "Revision planners and last-month sprint sheets",
    ],
    cutoffBenchmarks: [
      "Previous year percentile/rank trends",
      "Category-wise cutoff range reference",
      "Target rank band for top colleges",
    ],
    fitSignals: [
      "Strong baseline in core subjects for this stream",
      "Ability to sustain timed practice sessions",
      "Willingness to follow a structured preparation cycle",
    ],
  };

  const preset = PRESETS[key] || {};

  return {
    ...base,
    ...preset,
    competitiveness: {
      ...base.competitiveness,
      ...preset.competitiveness,
    },
  };
}

export default function ExamDetailPage() {
  const router = useRouter();
  const params = useParams<{ examId: string }>();
  const searchParams = useSearchParams();
  const examId = decodeURIComponent(params.examId || "");
  const from = searchParams.get("from") || "";

  const [allExams, setAllExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      const res = await getAllExams();
      if (cancelled) return;
      setAllExams(res.success && res.data ? res.data.exams : []);
      setLoading(false);
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, []);

  const exam = useMemo(() => {
    const normalized = slugify(examId);
    return (
      allExams.find((item) => String(item.id) === examId) ||
      allExams.find((item) => slugify(item.name) === normalized) ||
      allExams.find((item) => slugify(item.code) === normalized) ||
      null
    );
  }, [allExams, examId]);

  const model = useMemo(() => getModel(exam, examId), [exam, examId]);
  const examName = exam?.name || examId.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  const examStream = getExamStream(examName);
  const breadcrumbTrail = SOURCE_BREADCRUMBS[from] || [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Exam Directory", href: "/dashboard/exams" },
  ];

  const handleSectionChange = (section: SectionId) => {
    router.push(`/dashboard?section=${section}`);
  };

  useEffect(() => {
    if (!examId) return;

    const raw = localStorage.getItem(`exam-detail-state:${examId}`);
    if (!raw) {
      setSaved(false);
      setTracking(false);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as { saved?: boolean; tracking?: boolean };
      setSaved(Boolean(parsed.saved));
      setTracking(Boolean(parsed.tracking));
    } catch {
      setSaved(false);
      setTracking(false);
    }
  }, [examId]);

  useEffect(() => {
    if (!examId) return;
    localStorage.setItem(`exam-detail-state:${examId}`, JSON.stringify({ saved, tracking }));
  }, [examId, saved, tracking]);

  if (loading) {
    return (
      <div className="h-screen flex bg-[#F6F8FA] dark:bg-slate-950 text-slate-900 dark:text-slate-50">
        <Sidebar
          sidebarOpen={sidebarOpen}
          onToggle={() => setSidebarOpen((v) => !v)}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
          activeSection="exam-shortlist"
          onSectionChange={handleSectionChange}
        />
        <div className="flex h-screen flex-1 flex-col bg-[#F6F8FA] dark:bg-slate-950">
          <TopBar
            onToggleSidebar={() => setSidebarOpen((v) => !v)}
            onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
            isSidebarCollapsed={sidebarCollapsed}
          />
          <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6">
            <div className="mx-auto max-w-6xl rounded-2xl bg-white p-8 text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">
              Loading exam details...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-[#F6F8FA] dark:bg-slate-950 text-slate-900 dark:text-slate-50">
      <Sidebar
        sidebarOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        activeSection="exam-shortlist"
        onSectionChange={handleSectionChange}
      />

      <div className="flex h-screen flex-1 flex-col bg-[#F6F8FA] dark:bg-slate-950">
        <TopBar
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
          isSidebarCollapsed={sidebarCollapsed}
        />

        <div className="flex-1 overflow-y-auto bg-[#F6F8FA] dark:bg-slate-950">
          <section className="bg-white dark:bg-slate-900">
            <div className="px-4 py-3 md:px-6">
              <div className="flex items-center gap-3">
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full ring-1 ring-slate-200 dark:ring-slate-700">
                  <Image
                    src="/cbse.png"
                    alt="Exam logo"
                    fill
                    className="object-cover"
                    sizes="44px"
                    priority
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 md:text-[2rem]">{examName}</h1>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{examStream}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="border-y border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="px-4 py-2 md:px-6">
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                {breadcrumbTrail.map((crumb, index) => (
                  <div key={`${crumb.label}-${index}`} className="inline-flex items-center gap-1.5">
                    {index > 0 && <ChevronRight className="h-3 w-3" />}
                    {crumb.href ? (
                      <Link href={crumb.href} className="font-medium text-black/70 hover:text-black hover:underline dark:text-slate-200 dark:hover:text-white">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span>{crumb.label}</span>
                    )}
                  </div>
                ))}
                <ChevronRight className="h-3 w-3" />
                <span className="font-semibold text-slate-700 dark:text-slate-200">{examName}</span>
              </div>
            </div>
          </section>

          <div className="px-4 py-4 md:px-6">
            <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-5 xl:grid-cols-[1fr_320px]">
              <section className="space-y-5">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <div className="rounded-xl bg-white p-3 dark:bg-slate-900">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Mode</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{model.mode}</p>
                  </div>
                  <div className="rounded-xl bg-white p-3 dark:bg-slate-900">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Duration</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{model.duration}</p>
                  </div>
                  <div className="rounded-xl bg-white p-3 dark:bg-slate-900">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Attempts</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{model.attempts}</p>
                  </div>
                  <div className="rounded-xl bg-white p-3 dark:bg-slate-900">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Score Type</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{model.scoreWindow}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <article className="rounded-2xl bg-white p-5 dark:bg-slate-900">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Exam Pattern</h2>
                    <div className="mt-3 space-y-2 text-sm">
                      <p className="rounded-lg bg-[#F6F8FA] px-3 py-2 text-slate-700 dark:bg-slate-950 dark:text-slate-300">Mode: {model.mode}</p>
                      <p className="rounded-lg bg-[#F6F8FA] px-3 py-2 text-slate-700 dark:bg-slate-950 dark:text-slate-300">Questions: {model.questionCount}</p>
                      <p className="rounded-lg bg-[#F6F8FA] px-3 py-2 text-slate-700 dark:bg-slate-950 dark:text-slate-300">Marking: {model.markingScheme}</p>
                      <p className="rounded-lg bg-[#F6F8FA] px-3 py-2 text-slate-700 dark:bg-slate-950 dark:text-slate-300">Duration: {model.duration}</p>
                    </div>
                  </article>

                  <article className="rounded-2xl bg-white p-5 dark:bg-slate-900">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Cutoff & Benchmarking</h2>
                    <div className="mt-3 space-y-2 text-sm">
                      {model.cutoffBenchmarks.map((item) => (
                        <p key={item} className="rounded-lg bg-[#F6F8FA] px-3 py-2 text-slate-700 dark:bg-slate-950 dark:text-slate-300">{item}</p>
                      ))}
                    </div>
                  </article>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <article className="rounded-2xl bg-white p-5 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <FiCheckCircle className="h-4 w-4 text-emerald-600" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Am I eligible?</h2>
              </div>
              <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                {model.eligibility.map((rule) => (
                  <li key={rule} className="rounded-lg bg-[#F6F8FA] px-3 py-2 dark:bg-slate-950">
                    {rule}
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-2xl bg-white p-5 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <MdOutlineInsights className="h-4 w-4 text-[#b88900]" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">How competitive is this exam?</h2>
              </div>
              <div className="mt-3 space-y-2 text-sm">
                <div className="rounded-lg bg-[#F6F8FA] px-3 py-2 dark:bg-slate-950">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Applicants</p>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{model.competitiveness.applicants}</p>
                </div>
                <div className="rounded-lg bg-[#F6F8FA] px-3 py-2 dark:bg-slate-950">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Seats</p>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{model.competitiveness.seats}</p>
                </div>
                <div className="rounded-lg bg-[#F6F8FA] px-3 py-2 dark:bg-slate-950">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Typical Cutoff</p>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{model.competitiveness.typicalCutoff}</p>
                </div>
              </div>
            </article>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <article className="rounded-2xl bg-white p-5 dark:bg-slate-900">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Exam Type & Conducting Authority</h2>
              <div className="mt-3 space-y-2 text-sm">
                <p className="rounded-lg bg-[#F6F8FA] px-3 py-2 text-slate-700 dark:bg-slate-950 dark:text-slate-300">Exam Type: {model.examType}</p>
                <p className="rounded-lg bg-[#F6F8FA] px-3 py-2 text-slate-700 dark:bg-slate-950 dark:text-slate-300">Conducting Authority: {model.conductingAuthority}</p>
              </div>
            </article>

            <article className="rounded-2xl bg-white p-5 dark:bg-slate-900">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Preparation Resources</h2>
              <div className="mt-3 space-y-2 text-sm">
                {model.resources.map((item) => (
                  <p key={item} className="rounded-lg bg-[#F6F8FA] px-3 py-2 text-slate-700 dark:bg-slate-950 dark:text-slate-300">{item}</p>
                ))}
              </div>
            </article>
          </div>

          <details open className="group rounded-2xl bg-white p-5 dark:bg-slate-900">
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-slate-900 dark:text-slate-100">
              <span className="inline-flex items-center gap-2">
                <FiCalendar className="h-4 w-4 text-[#b88900]" />
                When are the key dates?
              </span>
              <FiChevronDown className="h-4 w-4 transition group-open:rotate-180" />
            </summary>
            <div className="mt-4 space-y-3">
              {model.timeline.map((item) => (
                <div key={item.label} className="rounded-xl bg-[#F6F8FA] p-3 dark:bg-slate-950">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.label}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${item.critical ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" : "bg-[#F6F8FA] text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>
                      {item.month}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{item.note}</p>
                </div>
              ))}
            </div>
          </details>

          <details className="group rounded-2xl bg-white p-5 dark:bg-slate-900">
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-slate-900 dark:text-slate-100">
              <span className="inline-flex items-center gap-2">
                <FiTarget className="h-4 w-4 text-[#b88900]" />
                How do I prepare effectively?
              </span>
              <FiChevronDown className="h-4 w-4 transition group-open:rotate-180" />
            </summary>
            <div className="mt-4 space-y-2">
              {model.prep.map((step) => (
                <p key={step} className="rounded-lg bg-[#F6F8FA] px-3 py-2 text-sm text-slate-700 dark:bg-slate-950 dark:text-slate-300">
                  {step}
                </p>
              ))}
            </div>
          </details>
              </section>

              <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
                <div className="rounded-2xl bg-white p-4 dark:bg-slate-900">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Next best actions</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Take action where intent is highest.</p>
                  <div className="mt-3 space-y-2">
                    <Button variant={saved ? "secondary" : "themeButton"} size="sm" className="w-full justify-center rounded-full" onClick={() => setSaved((v) => !v)}>
                      <FiBookmark className="h-4 w-4" /> {saved ? "Saved" : "Save Exam"}
                    </Button>
                    <Button variant={tracking ? "secondary" : "themeButton"} size="sm" className="w-full justify-center rounded-full" onClick={() => setTracking((v) => !v)}>
                      <FiClock className="h-4 w-4" /> {tracking ? "Tracking Active" : "Track Deadlines"}
                    </Button>
                    <Button variant="themeButton" size="sm" className="w-full justify-center rounded-full" href="/dashboard?section=applications">
                      <MdSchool className="h-4 w-4" /> Start Application
                    </Button>
                    <Button variant="themeButtonOutline" size="sm" className="w-full justify-center rounded-full" href="/dashboard?section=exam-prep">
                      <FiTrendingUp className="h-4 w-4" /> Plan Preparation
                    </Button>
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-4 dark:bg-slate-900">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Fit signals</p>
                  <div className="mt-2 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                    {model.fitSignals.map((item) => (
                      <p key={item} className="rounded-lg bg-[#F6F8FA] px-3 py-2 dark:bg-slate-950">{item}</p>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-4 dark:bg-slate-900">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Recommended videos</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Quick picks inspired by dashboard study cards.</p>
                    </div>
                  </div>

                  <div className="mt-3 overflow-hidden rounded-xl bg-[#F6F8FA] p-2 dark:bg-slate-950">
                    <a href={RECOMMENDED_VIDEOS[0].videoUrl} target="_blank" rel="noreferrer" className="block">
                      <div className="relative overflow-hidden rounded-lg bg-black">
                        <img
                          src={RECOMMENDED_VIDEOS[0].thumbnail}
                          alt={RECOMMENDED_VIDEOS[0].title}
                          className="h-36 w-full object-cover"
                          loading="lazy"
                        />
                        <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
                          {RECOMMENDED_VIDEOS[0].duration}
                        </span>
                      </div>
                    </a>
                  </div>

                  <div className="mt-3 space-y-2">
                    {RECOMMENDED_VIDEOS.slice(1).map((video) => (
                      <a
                        key={video.title}
                        href={video.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-start gap-3 rounded-lg bg-[#F6F8FA] p-2 transition-colors hover:bg-[#e9edf3] dark:bg-slate-950 dark:hover:bg-slate-900"
                      >
                        <img src={video.thumbnail} alt={video.title} className="h-14 w-20 rounded object-cover" loading="lazy" />
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-xs font-semibold text-slate-900 dark:text-slate-100">{video.title}</p>
                          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{video.duration}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
