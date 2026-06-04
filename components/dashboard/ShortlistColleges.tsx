'use client';

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { FiSearch } from "react-icons/fi";
import { FaCheckCircle } from "react-icons/fa";
import { MdSchool } from "react-icons/md";
import type { DashboardCollege } from "@/api/auth/profile";
import {
  dashboardCollegeTabKey,
  fetchDashboardCollegesTabData,
  useDashboardCollegesTabQuery,
  useUpdateShortlistedCollegeMutation,
} from "@/lib/dashboardCollegeShortlistQueries";
import { useQueryClient } from "@tanstack/react-query";
import { CollegeShortlistCard } from "@/components/dashboard/CollegeShortlistCard";
import { collegeCardOverviewText } from "@/lib/collegeDisplay";
import { slugifyCollegeName } from "@/lib/collegeSlug";

type TabId = "recommended" | "shortlisted" | "all";

const PER_PAGE = 8;

type TabCollege = DashboardCollege & {
  detailHref: string;
  displayOverview: string;
};

const TABS: { id: TabId; label: string; icon: ReactNode }[] = [
  { id: "recommended", label: "Recommended", icon: <FiSearch /> },
  { id: "shortlisted", label: "Shortlisted", icon: <FaCheckCircle /> },
  { id: "all", label: "All Colleges", icon: <MdSchool /> },
];

function toTabCollege(c: DashboardCollege, from: string): TabCollege {
  return {
    ...c,
    detailHref: `/dashboard/colleges/${slugifyCollegeName(c.college_name)}?from=${from}`,
    displayOverview: collegeCardOverviewText(c),
  };
}

function parseCollegeTabParam(value: string | null): TabId | null {
  if (value === "recommended" || value === "shortlisted" || value === "all") {
    return value;
  }
  return null;
}

type ShortlistCollegesProps = {
  searchQuery?: string;
};

export default function ShortlistColleges({
  searchQuery: controlledSearch = "",
}: ShortlistCollegesProps) {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const rawQuery = controlledSearch ?? "";
  const [debouncedSearch, setDebouncedSearch] = useState(rawQuery);
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    return parseCollegeTabParam(searchParams.get("collegeTab")) ?? "recommended";
  });
  const [pageByTab, setPageByTab] = useState<Record<TabId, number>>({
    recommended: 1,
    shortlisted: 1,
    all: 1,
  });

  useEffect(() => {
    const tab = parseCollegeTabParam(searchParams.get("collegeTab"));
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(rawQuery), 350);
    return () => window.clearTimeout(t);
  }, [rawQuery]);

  useEffect(() => {
    setPageByTab({ recommended: 1, shortlisted: 1, all: 1 });
  }, [debouncedSearch]);

  const tabRefs = useRef<Record<TabId, HTMLButtonElement | null>>({
    recommended: null,
    shortlisted: null,
    all: null,
  });
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  const currentPage = pageByTab[activeTab];

  const tabQuery = useDashboardCollegesTabQuery({
    tab: activeTab,
    page: currentPage,
    limit: PER_PAGE,
    search: debouncedSearch,
  });

  const { data: tabData, isLoading, isFetching, isError, error, refetch } = tabQuery;
  const updateShortlist = useUpdateShortlistedCollegeMutation();

  const shortlistedIds = (tabData?.shortlistedCollegeIds ?? []).map(Number);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- server-clamped page only
  }, [tabData?.pagination?.page, activeTab]);

  const prefetchTabFirstPage = (tab: TabId) => {
    void queryClient.prefetchQuery({
      queryKey: dashboardCollegeTabKey(tab, 1, PER_PAGE, debouncedSearch),
      queryFn: () => fetchDashboardCollegesTabData(tab, 1, PER_PAGE, debouncedSearch),
      staleTime: 60_000,
    });
  };

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

  const viewFrom =
    activeTab === "recommended"
      ? "dashboard-college-shortlist-recommended"
      : activeTab === "shortlisted"
        ? "dashboard-college-shortlist-shortlisted"
        : "dashboard-college-shortlist-all";

  const pagedRows: TabCollege[] = (tabData?.colleges ?? []).map((c) =>
    toTabCollege(c, viewFrom)
  );

  const streamEmpty = tabData?.streamId == null;
  const emptyHint =
    tabData?.message ||
    (streamEmpty ? "Select your stream in profile to view colleges." : null);

  const setPage = (next: number) => {
    setPageByTab((prev) => ({
      ...prev,
      [activeTab]: Math.max(1, Math.min(totalPages, next)),
    }));
  };

  useEffect(() => {
    setPageByTab((prev) => ({ ...prev, [activeTab]: 1 }));
  }, [activeTab]);

  const showLoadingShell = isLoading && !tabData;
  const effectivePage = Math.min(serverPage, Math.max(1, totalPages));
  const shortlistedCount = shortlistedIds.length;

  const isShortlisted = (collegeId: number) => shortlistedIds.includes(collegeId);

  const savingId = updateShortlist.isPending
    ? (updateShortlist.variables?.collegeId ?? null)
    : null;

  const toggleShortlist = (collegeId: number) => {
    if (updateShortlist.isPending) return;
    updateShortlist.mutate({
      collegeId,
      shortlisted: !isShortlisted(collegeId),
    });
  };

  return (
    <div className="w-full min-h-screen bg-[#f5f9ff] text-black dark:bg-slate-950 dark:text-slate-50">
      <section className="w-full bg-[#f5f9ff]">
        <header className="border-b border-slate-200 bg-white px-4 pt-2 pb-0 dark:border-slate-800 dark:bg-slate-900 md:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">College Shortlist</p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Recommended and all colleges match your exam shortlist; shortlist saves to your profile.
                  </p>
                </div>
                {shortlistedCount > 0 && (
                  <span className="shrink-0 rounded-full bg-[#FAD53C] px-2.5 py-0.5 text-xs font-bold text-black">
                    {shortlistedCount}
                  </span>
                )}
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
                  style={{
                    left: indicatorStyle.left,
                    width: indicatorStyle.width,
                  }}
                />
              </div>
            </div>
          </div>
        </header>

        <div className="bg-[#f8fbff] p-4 dark:bg-slate-950/40 md:p-6">
          <div key={activeTab} style={{ animation: "fade-in 220ms ease-out" }}>
            {isError ? (
              <div className="flex flex-col items-center justify-center rounded-xl bg-white px-4 py-16 text-center shadow-sm dark:bg-slate-900">
                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                  {error instanceof Error ? error.message : "Could not load colleges."}
                </p>
                <button
                  type="button"
                  onClick={() => void refetch()}
                  className="mt-3 rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 dark:border-slate-600 dark:text-slate-300"
                >
                  Retry
                </button>
              </div>
            ) : showLoadingShell ? (
              <div className="flex flex-col items-center justify-center rounded-xl bg-white px-4 py-16 text-center text-sm font-medium text-slate-500 shadow-sm dark:bg-slate-900 dark:text-slate-300">
                <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-100" />
                Loading colleges...
              </div>
            ) : total === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl bg-white px-4 py-16 text-center shadow-sm dark:bg-slate-900">
                <MdSchool className="mb-3 h-10 w-10 text-slate-200 dark:text-slate-700" />
                <p className="text-sm font-medium text-slate-500 dark:text-slate-300">
                  {emptyHint || "No colleges available in this section."}
                </p>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  Try another tab or update stream and interests in your profile.
                </p>
              </div>
            ) : (
              <>
              {isFetching && tabData ? (
                <div className="mb-2 text-right text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Updating…
                </div>
              ) : null}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
                {pagedRows.map((college) => (
                  <CollegeShortlistCard
                    key={`${activeTab}-${college.id}`}
                    college={college}
                    detailHref={college.detailHref}
                    displayOverview={college.displayOverview}
                    isShortlisted={isShortlisted(college.id)}
                    shortlistSaving={savingId === college.id}
                    onShortlist={() => toggleShortlist(college.id)}
                  />
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900">
                <p className="text-slate-600 dark:text-slate-400">
                  Showing {total === 0 ? 0 : (effectivePage - 1) * PER_PAGE + 1}-
                  {Math.min(effectivePage * PER_PAGE, total)} of {total}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage(effectivePage - 1)}
                    disabled={effectivePage <= 1}
                    className="rounded-md border border-slate-200 px-3 py-1.5 text-slate-700 transition disabled:opacity-40 dark:border-slate-600 dark:text-slate-300"
                  >
                    Prev
                  </button>
                  <span className="text-slate-700 dark:text-slate-300">
                    Page {effectivePage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage(effectivePage + 1)}
                    disabled={effectivePage >= totalPages}
                    className="rounded-md border border-slate-200 px-3 py-1.5 text-slate-700 transition disabled:opacity-40 dark:border-slate-600 dark:text-slate-300"
                  >
                    Next
                  </button>
                </div>
              </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
