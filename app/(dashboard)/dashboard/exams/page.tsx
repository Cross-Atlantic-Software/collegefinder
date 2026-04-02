"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FiArrowRight, FiSearch } from "react-icons/fi";
import { MdSchool } from "react-icons/md";
import { getAllExams, type Exam } from "@/api/exams";
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

const SOURCE_LABEL: Record<string, string> = {
  "profile-recommended": "Profile Recommended Exams",
  "dashboard-shortlist-recommended": "Dashboard Recommended Exams",
  "dashboard-shortlist-shortlisted": "Dashboard Shortlisted Exams",
  "dashboard-shortlist-all": "Dashboard All Exams",
  "dashboard-applications": "Applications",
  "widget-eligible": "Eligible Exams Widget",
  "widget-deadlines": "Upcoming Deadlines Widget",
  "exam-directory": "Exam Directory",
};

export default function ExamDirectoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [exams, setExams] = useState<Exam[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  const from = searchParams.get("from") || "";
  const sourceLabel = SOURCE_LABEL[from];

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      const res = await getAllExams();
      if (cancelled) return;
      setExams(res.success && res.data ? res.data.exams : []);
      setLoading(false);
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return exams;
    return exams.filter(
      (item) =>
        item.name.toLowerCase().includes(value) ||
        item.code.toLowerCase().includes(value) ||
        (item.description || "").toLowerCase().includes(value)
    );
  }, [exams, query]);

  const handleSectionChange = (section: SectionId) => {
    router.push(`/dashboard?section=${section}`);
  };

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

        <div className="flex-1 overflow-y-auto">
          <section className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="px-4 py-3 md:px-6">
              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Link href="/dashboard" className="font-semibold text-black/70 hover:text-black hover:underline dark:text-slate-200 dark:hover:text-white">Dashboard</Link>
                <span>/</span>
                {sourceLabel ? (
                  <>
                    <span>{sourceLabel}</span>
                    <span>/</span>
                  </>
                ) : null}
                <span className="font-semibold text-slate-700 dark:text-slate-200">Exam Directory</span>
              </div>

              <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">Exam Directory</p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Dashboard exploration view</p>

              <h1 className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-100">Exam Directory</h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Pick an exam to view decision-focused details, key dates, eligibility, and next steps.
              </p>

              <label className="mt-4 flex w-full max-w-2xl items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950">
                <FiSearch className="h-4 w-4 text-slate-500" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by exam name or code"
                  className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100"
                />
              </label>
            </div>
          </section>

          <div className="px-4 py-4 md:px-6">
            <div className="mx-auto w-full max-w-6xl space-y-5">

            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                Loading exams...
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                No exams found for this search.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filtered.map((exam) => (
                  <Link
                    key={exam.id}
                    href={`/dashboard/exams/${exam.id}?from=exam-directory`}
                    className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#FAD53C] dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FAD53C]/25 text-black dark:bg-[#FAD53C]/20 dark:text-[#FAD53C]">
                        <MdSchool className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{exam.name}</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{exam.code}</p>
                      </div>
                    </div>
                    <p className="mt-3 line-clamp-2 text-xs text-slate-600 dark:text-slate-400">
                      {exam.description || "Exam details, fit checks, and preparation guidance."}
                    </p>
                    <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-slate-900 dark:text-slate-100">
                      Open details <FiArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                    </p>
                  </Link>
                ))}
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
