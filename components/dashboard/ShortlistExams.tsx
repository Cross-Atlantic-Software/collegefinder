"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  FiBell,
  FiCalendar,
  FiChevronRight,
  FiClock,
  FiHelpCircle,
  FiInfo,
  FiMinusCircle,
  FiSearch,
  FiShare2,
  FiShield,
  FiStar,
  FiTarget,
} from "react-icons/fi";
import { FaCheckCircle, FaHeart, FaRegHeart } from "react-icons/fa";
import { MdComputer, MdCurrencyRupee, MdMenuBook, MdOutlineLightbulb, MdOutlineRepeat, MdSchool } from "react-icons/md";
import type { Exam } from "@/api/exams";
import { ExamApplicationModal } from "./ExamApplicationModal";
import { formatExamPatternDurationHours } from "@/lib/formatDuration";
import {
  dashboardExamTabKey,
  fetchDashboardExamsTabData,
  useDashboardExamsTabQuery,
  useUpdateShortlistedExamMutation,
} from "@/lib/dashboardExamShortlistQueries";
import { usePrefetchExamDetail } from "@/lib/examDetailQueries";

type TabId = "recommended" | "shortlisted" | "all";
const PER_PAGE = 10;

const TABS: { id: TabId; label: string; icon: ReactNode }[] = [
  { id: "recommended", label: "Recommended", icon: <FiSearch /> },
  { id: "shortlisted", label: "Shortlisted", icon: <FaCheckCircle /> },
  { id: "all", label: "All Exams", icon: <MdSchool /> },
];

type ShortlistExamsProps = {
  /** Controlled from dashboard TopBar search (server-side filter on tab API). */
  searchQuery?: string;
  onSearchQueryChange?: (q: string) => void;
};

type ExamRow = {
  examId: number;
  name: string;
  subtitle: string;
  detailHref: string;
  mode: string;
  duration: string;
  attempts: string;
  conductingAuthority: string;
  popularityRank: string;
  logoSrc: string | null;
  tabSource: string;
  levelBadge: string;
  /** Short copy for yellow insight strip. */
  calloutText: string;
  program: string;
  questions: string;
  totalMarks: string;
  negativeMarking: string;
  applicationDates: string;
  applicationFee: string;
  streamRequired: string;
};

function calloutFromDescription(description: string): string {
  const d = description.trim();
  if (!d) return "Open this exam for dates, eligibility, and how to apply.";
  return d.length > 180 ? `${d.slice(0, 177)}…` : d;
}

function examLevelBadge(examType: string | null | undefined): string {
  const raw = (examType || "").trim();
  if (!raw) return "ENTRANCE EXAM";
  const t = raw.toLowerCase();
  if (t.includes("national")) return "NATIONAL LEVEL EXAM";
  if (t.includes("state")) return "STATE LEVEL EXAM";
  if (t.includes("institute")) return "INSTITUTE LEVEL EXAM";
  return raw.toUpperCase().slice(0, 28);
}

function formatApplicationDateRange(exam: Exam): string {
  const d = exam.examDates;
  if (!d) return "—";
  const s = d.application_start_date;
  const e = d.application_close_date;
  if (!s && !e) return "—";
  try {
    const fmt = (iso: string) => {
      const x = new Date(iso);
      if (Number.isNaN(x.getTime())) return null;
      return x.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
    };
    const a = s ? fmt(s) : null;
    const b = e ? fmt(e) : null;
    if (a && b) return `${a} – ${b}`;
    return a || b || "—";
  } catch {
    return "—";
  }
}

function formatApplicationFee(exam: Exam): string {
  const raw = exam.examDates?.application_fees;
  if (raw == null) return "—";
  const n = Number(raw);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function programLine(exam: Exam): string {
  const names = (exam.linkedPrograms ?? []).map((p) => p.name?.trim()).filter(Boolean);
  if (!names.length) return "—";
  return names.slice(0, 2).join(" · ");
}

function streamRequiredLine(exam: Exam): string {
  const el = exam.eligibilityCriteria;
  const subs = el?.subject_labels?.filter(Boolean) ?? [];
  const streams = el?.stream_labels?.filter(Boolean) ?? [];
  if (subs.length) return subs.slice(0, 4).join(", ");
  if (streams.length) return streams.slice(0, 3).join(", ");
  return "—";
}

function patternNum(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(Number(n))) return "—";
  return String(n);
}

function examLogoSrc(exam: Exam): string | null {
  const u = exam.exam_logo?.trim() || exam.logo_file_name?.trim();
  return u || null;
}

function toRow(exam: Exam, from: string, tabSource: string): ExamRow {
  const attemptsRaw = exam.eligibilityCriteria?.attempt_limit;
  const attempts =
    attemptsRaw != null && String(attemptsRaw).trim() !== ""
      ? String(attemptsRaw).trim()
      : "—";
  const mode =
    exam.examPattern?.mode != null && String(exam.examPattern.mode).trim() !== ""
      ? String(exam.examPattern.mode).trim()
      : "—";
  const rankRaw = exam.exam_popularity_rank;
  const popularityRank =
    rankRaw != null && !Number.isNaN(Number(rankRaw)) ? String(Number(rankRaw)) : "—";
  const desc = exam.description || "";
  const neg = exam.examPattern?.negative_marking;
  const negativeMarking =
    neg != null && String(neg).trim() !== "" ? String(neg).trim() : "—";
  return {
    examId: Number(exam.id),
    name: exam.name,
    subtitle: exam.code?.trim() || "—",
    detailHref: `/dashboard/exams/${exam.id}?from=${from}`,
    mode,
    duration: formatExamPatternDurationHours(exam.examPattern?.duration_minutes ?? undefined),
    attempts,
    conductingAuthority: exam.conducting_authority?.trim() || "—",
    popularityRank,
    logoSrc: examLogoSrc(exam),
    tabSource,
    levelBadge: examLevelBadge(exam.exam_type),
    calloutText: calloutFromDescription(desc),
    program: programLine(exam),
    questions:
      exam.examPattern?.number_of_questions != null
        ? `${patternNum(exam.examPattern.number_of_questions)} Questions`
        : "—",
    totalMarks:
      exam.examPattern?.total_marks != null
        ? `${patternNum(exam.examPattern.total_marks)} Marks`
        : "—",
    negativeMarking,
    applicationDates: formatApplicationDateRange(exam),
    applicationFee: formatApplicationFee(exam),
    streamRequired: streamRequiredLine(exam),
  };
}

function DetailCell({
  icon: Icon,
  label,
  value,
  iconBg,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: ReactNode;
  iconBg: string;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center rounded-lg border border-slate-100 bg-white px-1 py-1.5 text-center shadow-[0_1px_0_rgba(15,23,42,0.04)] dark:border-slate-700/80 dark:bg-slate-800/50">
      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${iconBg}`} aria-hidden>
        <Icon className="h-3 w-3 text-white" />
      </div>
      <p className="mt-1 text-[6px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">
        {label}
      </p>
      <div className="mt-0.5 line-clamp-2 w-full text-[9px] font-semibold leading-snug text-slate-900 dark:text-slate-100">
        {value}
      </div>
    </div>
  );
}

function tabToFrom(tab: TabId): string {
  if (tab === "recommended") return "dashboard-shortlist-recommended";
  if (tab === "shortlisted") return "dashboard-shortlist-shortlisted";
  return "dashboard-shortlist-all";
}

function tabSourceLabel(tab: TabId): string {
  if (tab === "recommended") return "Recommended";
  if (tab === "shortlisted") return "Shortlisted";
  return "All exams";
}

export default function ShortlistExams({
  searchQuery: controlledSearch = "",
}: ShortlistExamsProps = {}) {
  const queryClient = useQueryClient();
  const [selectedExam, setSelectedExam] = useState<{ name: string; id?: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("recommended");
  const rawQuery = controlledSearch ?? "";
  const [debouncedSearch, setDebouncedSearch] = useState(rawQuery);

  const tabRefs = useRef<Record<TabId, HTMLButtonElement | null>>({
    recommended: null,
    shortlisted: null,
    all: null,
  });
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(rawQuery), 350);
    return () => window.clearTimeout(t);
  }, [rawQuery]);

  const [pageByTab, setPageByTab] = useState<Record<TabId, number>>({
    recommended: 1,
    shortlisted: 1,
    all: 1,
  });

  useEffect(() => {
    setPageByTab({ recommended: 1, shortlisted: 1, all: 1 });
  }, [debouncedSearch]);

  useEffect(() => {
    const updateIndicator = () => {
      const activeEl = tabRefs.current[activeTab];
      if (!activeEl) return;
      setIndicatorStyle({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
      });
    };
    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [activeTab]);

  const currentPage = pageByTab[activeTab];

  const tabQuery = useDashboardExamsTabQuery({
    tab: activeTab,
    page: currentPage,
    limit: PER_PAGE,
    search: debouncedSearch,
  });

  const { data: tabData, isLoading, isFetching, isError, error, refetch } = tabQuery;

  const updateShortlist = useUpdateShortlistedExamMutation();
  const prefetchExamDetail = usePrefetchExamDetail();

  const shortlistedIds = tabData?.shortlistedExamIds ?? [];
  const total = tabData?.pagination?.total ?? 0;
  const totalPages = tabData?.pagination?.totalPages ?? 1;
  const serverPage = tabData?.pagination?.page ?? currentPage;

  useEffect(() => {
    if (tabData?.pagination == null) return;
    const sp = tabData.pagination.page;
    setPageByTab((prev) => {
      if (prev[activeTab] === sp) return prev;
      return { ...prev, [activeTab]: sp };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- narrow deps: server-clamped page only
  }, [tabData?.pagination?.page, activeTab]);

  const savingId = updateShortlist.isPending
    ? (updateShortlist.variables?.examId ?? null)
    : null;

  const prefetchTabFirstPage = (tab: TabId) => {
    void queryClient.prefetchQuery({
      queryKey: dashboardExamTabKey(tab, 1, PER_PAGE, debouncedSearch),
      queryFn: () => fetchDashboardExamsTabData(tab, 1, PER_PAGE, debouncedSearch),
      staleTime: 60_000,
    });
  };

  const rowFrom = tabToFrom(activeTab);
  const sourceLabel = tabSourceLabel(activeTab);
  const pagedRows: ExamRow[] = (tabData?.exams ?? []).map((exam) =>
    toRow(exam, rowFrom, sourceLabel)
  );

  const streamEmpty = tabData?.streamId == null;
  const emptyHint =
    tabData?.message ||
    (streamEmpty ? "Select your stream in profile to view exams." : null);

  const setPage = (next: number) => {
    setPageByTab((prev) => ({
      ...prev,
      [activeTab]: Math.max(1, Math.min(totalPages, next)),
    }));
  };

  const isShortlisted = (examId: number) => shortlistedIds.includes(examId);

  const toggleShortlist = (examId: number) => {
    if (updateShortlist.isPending) return;
    const nextShortlisted = !isShortlisted(examId);
    updateShortlist.mutate({ examId, shortlisted: nextShortlisted });
  };

  const shareExamLink = (title: string, path: string) => {
    void (async () => {
      const url =
        typeof window !== "undefined" ? `${window.location.origin}${path}` : path;
      try {
        if (typeof navigator !== "undefined" && navigator.share) {
          await navigator.share({ title, text: title, url });
          return;
        }
        if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(url);
        }
      } catch {
        /* user cancelled share or clipboard unavailable */
      }
    })();
  };

  const showLoadingShell = isLoading && !tabData;
  const effectivePage = Math.min(serverPage, Math.max(1, totalPages));
  const shortlistedCount = shortlistedIds.length;

  return (
    <div className="w-full min-h-screen min-w-0 overflow-x-hidden bg-[#f5f9ff] text-black dark:bg-slate-950 dark:text-slate-50">
      <section className="w-full min-w-0 bg-[#f5f9ff]">
        <header className="border-b border-slate-200 bg-white px-4 pt-2 pb-0 dark:border-slate-800 dark:bg-slate-900 md:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">Exams</p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Summary on cards; open an exam for full details, dates, and eligibility.
                  </p>
                </div>
                {shortlistedCount > 0 ? (
                  <span className="shrink-0 rounded-full bg-[#FAD53C] px-2.5 py-0.5 text-xs font-bold text-black">
                    {shortlistedCount}
                  </span>
                ) : null}
              </div>

              <div className="relative -mb-px mt-3 flex gap-1 overflow-x-auto scrollbar-hide">
                {TABS.map((tab) => {
                  const isActive = tab.id === activeTab;
                  return (
                    <button
                      key={tab.id}
                      ref={(el) => {
                        tabRefs.current[tab.id] = el;
                      }}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      onMouseEnter={() => prefetchTabFirstPage(tab.id)}
                      className={[
                        "flex min-w-max items-center gap-2 border-b-2 border-transparent px-4 py-2.5 text-sm font-medium transition-colors duration-300 ease-in-out",
                        isActive
                          ? "border-b-slate-900 text-slate-900 dark:border-b-slate-100 dark:text-slate-100"
                          : "text-black/30 hover:text-black/60 dark:text-white/40 dark:hover:text-white/75",
                      ].join(" ")}
                    >
                      <span className="text-[15px]">{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-0 h-0.5 bg-slate-900 transition-all duration-300 ease-in-out dark:bg-slate-100"
                  style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
                />
              </div>
            </div>
          </div>
        </header>

        <div className="bg-[#f8fbff] p-4 dark:bg-slate-950/40 md:p-6">
          {isError ? (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              <p className="font-medium">Could not load exams</p>
              <p className="mt-1 text-red-600 dark:text-red-400">
                {error instanceof Error ? error.message : "Unknown error"}
              </p>
              <button
                type="button"
                onClick={() => void refetch()}
                className="mt-3 rounded-lg bg-red-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-800"
              >
                Retry
              </button>
            </div>
          ) : null}

          <div key={`${activeTab}-${debouncedSearch}`} style={{ animation: "fade-in 220ms ease-out" }}>
            {showLoadingShell ? (
              <div className="flex flex-col items-center justify-center rounded-xl bg-white px-4 py-16 text-center text-sm font-medium text-slate-500 shadow-sm dark:bg-slate-900 dark:text-slate-300">
                <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-100" />
                Loading exams...
              </div>
            ) : pagedRows.length === 0 ? (
              <div className="relative flex flex-col items-center justify-center rounded-xl bg-white px-4 py-16 text-center shadow-sm dark:bg-slate-900">
                {isFetching && tabData ? (
                  <div className="absolute right-3 top-3 z-10 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800">
                    Updating…
                  </div>
                ) : null}
                <MdSchool className="mb-3 h-10 w-10 text-slate-200 dark:text-slate-700" />
                <p className="text-sm font-medium text-slate-500 dark:text-slate-300">
                  {emptyHint ||
                    (debouncedSearch.trim()
                      ? "No exams match your search for this tab."
                      : "No exams found for this tab.")}
                </p>
              </div>
            ) : (
              <>
                <div className="relative">
                  {isFetching && tabData ? (
                    <div className="absolute right-3 top-3 z-10 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 shadow-sm dark:bg-slate-900/90 dark:text-slate-400">
                      Updating…
                    </div>
                  ) : null}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {pagedRows.map((row) => (
                    <article
                      key={`${activeTab}-${row.examId}`}
                      className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700/80 dark:bg-slate-900 dark:shadow-none"
                    >
                      {/* Hero */}
                      <div className="bg-white p-2.5 dark:bg-slate-900">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-start justify-between gap-1">
                            <span className="inline-flex max-w-[85%] items-center gap-1 rounded-full bg-brand-ink px-1.5 py-0.5 text-[7px] font-bold uppercase leading-tight tracking-wide text-white shadow-sm">
                              <FiShield className="h-2.5 w-2.5 shrink-0 opacity-90" aria-hidden />
                              <span className="truncate">{row.levelBadge}</span>
                            </span>
                            <div className="flex shrink-0 gap-1">
                              <button
                                type="button"
                                onClick={() => shareExamLink(row.name, row.detailHref)}
                                className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                                aria-label={`Share ${row.name}`}
                              >
                                <FiShare2 className="h-3 w-3" />
                              </button>
                              <Link
                                href={row.detailHref}
                                className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                                aria-label={`About ${row.name}`}
                              >
                                <FiInfo className="h-3 w-3" />
                              </Link>
                            </div>
                          </div>
                          <div className="pt-1.5">
                            <p className="text-[8px] font-semibold uppercase tracking-wider text-action-700 dark:text-action-400">
                              {row.subtitle !== "—" ? row.subtitle : "Entrance exam"}
                            </p>
                            <h3 className="mt-0.5 line-clamp-2 text-sm font-extrabold leading-tight tracking-tight text-brand-ink dark:text-slate-50">
                              {row.name}
                            </h3>
                            {row.conductingAuthority !== "—" ? (
                              <p className="mt-0.5 line-clamp-2 text-[9px] leading-snug text-brand-ink/75 dark:text-slate-300">
                                Conducted by{" "}
                                <span className="font-semibold text-brand-ink dark:text-white">
                                  {row.conductingAuthority}
                                </span>
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      {/* Insight */}
                      <div className="mx-2 mt-2 flex gap-1.5 rounded-lg border border-highlight-200/90 bg-highlight-100/70 px-2 py-1.5 dark:border-highlight-300/20 dark:bg-highlight-300/10">
                        <MdOutlineLightbulb
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-ink dark:text-highlight-300"
                          aria-hidden
                        />
                        <p className="line-clamp-2 min-w-0 flex-1 text-[9px] leading-snug text-brand-ink/90 dark:text-slate-200">
                          {row.calloutText}
                        </p>
                        <span className="shrink-0 self-start rounded-full border border-black/10 bg-white px-1.5 py-px text-[7px] font-semibold uppercase leading-tight tracking-wide text-brand-ink dark:border-white/15 dark:bg-slate-800 dark:text-highlight-300">
                          {row.tabSource}
                        </span>
                      </div>

                      {/* Detail grid — 3 per row; 4 on wider viewports */}
                      <div className="grid grid-cols-3 gap-1.5 p-2 min-[1280px]:grid-cols-4">
                        <DetailCell icon={MdSchool} label="Program" value={row.program} iconBg="bg-gradient-to-br from-violet-500 to-violet-600" />
                        <DetailCell icon={MdComputer} label="Exam mode" value={row.mode} iconBg="bg-gradient-to-br from-sky-500 to-blue-600" />
                        <DetailCell icon={FiClock} label="Duration" value={row.duration} iconBg="bg-gradient-to-br from-amber-500 to-orange-500" />
                        <DetailCell icon={FiHelpCircle} label="Questions" value={row.questions} iconBg="bg-gradient-to-br from-emerald-500 to-teal-600" />
                        <DetailCell icon={FiTarget} label="Total marks" value={row.totalMarks} iconBg="bg-gradient-to-br from-rose-500 to-red-600" />
                        <DetailCell icon={FiMinusCircle} label="Negative marking" value={row.negativeMarking} iconBg="bg-gradient-to-br from-indigo-500 to-indigo-700" />
                        <DetailCell icon={FiCalendar} label="Application dates" value={row.applicationDates} iconBg="bg-gradient-to-br from-action-500 to-action-700" />
                        <DetailCell icon={MdCurrencyRupee} label="Application fee" value={row.applicationFee} iconBg="bg-gradient-to-br from-pink-500 to-rose-600" />
                        <DetailCell icon={MdMenuBook} label="Stream required" value={row.streamRequired} iconBg="bg-gradient-to-br from-lime-600 to-green-700" />
                        <DetailCell icon={MdOutlineRepeat} label="Attempt limit" value={row.attempts} iconBg="bg-gradient-to-br from-cyan-500 to-blue-600" />
                        {activeTab === "all" && row.popularityRank !== "—" ? (
                          <DetailCell icon={FiStar} label="Popularity rank" value={`#${row.popularityRank}`} iconBg="bg-gradient-to-br from-amber-500 to-amber-700" />
                        ) : null}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1.5 px-2 pb-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedExam({ name: row.name, id: String(row.examId) });
                            setIsModalOpen(true);
                          }}
                          className="inline-flex w-full items-center justify-center gap-1 rounded-lg bg-black px-2 py-2 text-[11px] font-bold text-[#FAD53C] shadow-sm transition hover:bg-black/90"
                        >
                          Apply Now
                          <FiChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleShortlist(row.examId)}
                          disabled={savingId === row.examId}
                          className={`inline-flex w-full items-center justify-center gap-1 rounded-lg border-2 px-2 py-2 text-[11px] font-bold transition ${
                            isShortlisted(row.examId)
                              ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"
                              : "border-black bg-white text-slate-900 hover:bg-slate-50 dark:border-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                          }`}
                        >
                          {savingId === row.examId ? (
                            "Saving…"
                          ) : isShortlisted(row.examId) ? (
                            <>
                              <FaHeart className="h-3.5 w-3.5 shrink-0 text-rose-500" aria-hidden />
                              Shortlisted
                            </>
                          ) : (
                            <>
                              <FaRegHeart className="h-3.5 w-3.5 shrink-0" aria-hidden />
                              Shortlist
                            </>
                          )}
                        </button>
                      </div>

                      <div className="px-2 pb-1.5">
                        <Link
                          href={row.detailHref}
                          onMouseEnter={() => prefetchExamDetail(String(row.examId))}
                          onFocus={() => prefetchExamDetail(String(row.examId))}
                          className="block text-center text-[9px] font-semibold text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline dark:text-slate-400 dark:hover:text-slate-200"
                        >
                          Full details
                        </Link>
                      </div>

                      {/* Footer strip */}
                      <div className="mt-auto flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 border-t border-slate-100 bg-slate-50/80 px-2 py-1.5 text-[8px] font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                        <span className="inline-flex items-center gap-0.5">
                          <FiShield className="h-3 w-3 text-brand-ink dark:text-highlight-300" aria-hidden />
                          Trusted
                        </span>
                        <span className="h-2 w-px bg-slate-200 dark:bg-slate-600" aria-hidden />
                        <span className="inline-flex items-center gap-0.5">
                          <FiStar className="h-3 w-3 text-[#FAD53C]" aria-hidden />
                          Picks
                        </span>
                        <span className="h-2 w-px bg-slate-200 dark:bg-slate-600" aria-hidden />
                        <span className="inline-flex items-center gap-0.5">
                          <FiBell className="h-3 w-3 text-action-600 dark:text-action-400" aria-hidden />
                          Updates
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
                </div>

                {!showLoadingShell && total > 0 ? (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900">
                    <p className="text-slate-600 dark:text-slate-400">
                      Showing {(effectivePage - 1) * PER_PAGE + 1}-{Math.min(effectivePage * PER_PAGE, total)} of{" "}
                      {total}
                      <span className="text-slate-400 dark:text-slate-500"> · {PER_PAGE} per page</span>
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPage(currentPage - 1)}
                        disabled={currentPage <= 1 || isFetching}
                        className="rounded-md border border-slate-200 px-3 py-1.5 text-slate-700 transition disabled:opacity-40 dark:border-slate-600 dark:text-slate-300"
                      >
                        Prev
                      </button>
                      <span className="text-slate-700 dark:text-slate-300">
                        Page {effectivePage} / {totalPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPage(currentPage + 1)}
                        disabled={currentPage >= totalPages || isFetching}
                        className="rounded-md border border-slate-200 px-3 py-1.5 text-slate-700 transition disabled:opacity-40 dark:border-slate-600 dark:text-slate-300"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </section>

      {selectedExam ? (
        <ExamApplicationModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedExam(null);
          }}
          examName={selectedExam.name}
          examId={selectedExam.id}
          onSubmit={async () => {}}
        />
      ) : null}
    </div>
  );
}
