"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FiSearch } from "react-icons/fi";
import { FaCheckCircle } from "react-icons/fa";
import { MdSchool } from "react-icons/md";
import type { Exam } from "@/api/exams";
import { ExamApplicationModal } from "./ExamApplicationModal";
import { ExamShortlistCard } from "@/components/dashboard/ExamShortlistCard";
import {
  dashboardExamTabKey,
  fetchDashboardExamsTabData,
  useDashboardExamsTabQuery,
  useUpdateShortlistedExamMutation,
} from "@/lib/dashboardExamShortlistQueries";
import { usePrefetchExamDetail } from "@/lib/examDetailQueries";

type TabId = "recommended" | "shortlisted" | "all";
const PER_PAGE = 8;

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
  exam: Exam;
  examId: number;
  name: string;
  detailHref: string;
  tabSource: string;
};

function toRow(exam: Exam, from: string, tabSource: string): ExamRow {
  return {
    exam,
    examId: Number(exam.id),
    name: exam.name,
    detailHref: `/dashboard/exams/${exam.id}?from=${from}`,
    tabSource,
  };
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
                    Recommended and all exams match your stream; shortlist saves to your profile.
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

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {pagedRows.map((row) => (
                      <ExamShortlistCard
                        key={`${activeTab}-${row.examId}`}
                        exam={row.exam}
                        name={row.name}
                        detailHref={row.detailHref}
                        tabSource={row.tabSource}
                        isShortlisted={isShortlisted(row.examId)}
                        shortlistSaving={savingId === row.examId}
                        onShortlist={() => toggleShortlist(row.examId)}
                        onApply={() => {
                          setSelectedExam({ name: row.name, id: String(row.examId) });
                          setIsModalOpen(true);
                        }}
                        onPrefetchDetail={() => prefetchExamDetail(String(row.examId))}
                      />
                    ))}
                  </div>
                </div>

                {!showLoadingShell && total > 0 ? (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900">
                    <p className="text-slate-600 dark:text-slate-400">
                      Showing {(effectivePage - 1) * PER_PAGE + 1}-
                      {Math.min(effectivePage * PER_PAGE, total)} of {total}
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
