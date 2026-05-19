'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { FiSearch } from "react-icons/fi";
import { FaCheckCircle } from "react-icons/fa";
import { MdSchool } from "react-icons/md";
import {
  getDashboardColleges,
  updateShortlistedCollege,
  type DashboardCollege,
} from "@/api/auth/profile";
import { Button } from "@/components/shared";
import { resolveCollegeLogoSrc } from "@/lib/collegeLogo";

type TabId = "recommended" | "shortlisted" | "all";

const PER_PAGE = 10;

type TabCollege = DashboardCollege & {
  detailHref: string;
  displayOverview: string;
  displaySubtitle: string;
  logoSrc: string;
  tabSource: string;
};

const TABS: { id: TabId; label: string; icon: ReactNode }[] = [
  { id: "recommended", label: "Recommended", icon: <FiSearch /> },
  { id: "shortlisted", label: "Shortlisted", icon: <FaCheckCircle /> },
  { id: "all", label: "All Colleges", icon: <MdSchool /> },
];

const LOCAL_COLLEGE_IMAGES = [
  "/college/image.png",
  "/college/image copy.png",
  "/college/image copy 2.png",
];

function getLocalCollegeImage(seed: number): string {
  return LOCAL_COLLEGE_IMAGES[Math.abs(seed) % LOCAL_COLLEGE_IMAGES.length];
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function collegeLogo(c: DashboardCollege): string {
  return resolveCollegeLogoSrc(c) ?? getLocalCollegeImage(c.id);
}

function overviewText(c: DashboardCollege): string {
  const desc = c.collegeDetails?.college_description?.trim();
  if (desc) return desc.length > 220 ? `${desc.slice(0, 217)}…` : desc;
  const loc = [c.city, c.state].filter(Boolean).join(", ");
  if (loc) return loc;
  return c.college_location?.trim() || "Explore programs and admission details.";
}

function subtitleText(c: DashboardCollege): string {
  if (c.linkedExams?.length)
    return c.linkedExams
      .map((e) => e.name)
      .slice(0, 3)
      .join(" · ");
  return c.college_type || "College";
}

function toTabCollege(
  c: DashboardCollege,
  from: string,
  tabSource: string
): TabCollege {
  return {
    ...c,
    detailHref: `/dashboard/colleges/${slugify(c.college_name)}?from=${from}`,
    displayOverview: overviewText(c),
    displaySubtitle: subtitleText(c),
    logoSrc: collegeLogo(c),
    tabSource,
  };
}

function parseCollegeTabParam(value: string | null): TabId | null {
  if (value === "recommended" || value === "shortlisted" || value === "all") {
    return value;
  }
  return null;
}

export default function ShortlistColleges() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    return parseCollegeTabParam(searchParams.get("collegeTab")) ?? "recommended";
  });
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [emptyHint, setEmptyHint] = useState<string | null>(null);
  const [recommendedColleges, setRecommendedColleges] = useState<DashboardCollege[]>([]);
  const [allColleges, setAllColleges] = useState<DashboardCollege[]>([]);
  const [shortlistedColleges, setShortlistedColleges] = useState<DashboardCollege[]>([]);
  const [shortlistedIds, setShortlistedIds] = useState<number[]>([]);
  const [pageByTab, setPageByTab] = useState<Record<TabId, number>>({
    recommended: 1,
    shortlisted: 1,
    all: 1,
  });

  useEffect(() => {
    const tab = parseCollegeTabParam(searchParams.get("collegeTab"));
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  const tabRefs = useRef<Record<TabId, HTMLButtonElement | null>>({
    recommended: null,
    shortlisted: null,
    all: null,
  });
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      const res = await getDashboardColleges();
      if (cancelled) return;
      if (res.success && res.data) {
        setRecommendedColleges(res.data.recommendedColleges || []);
        setAllColleges(res.data.allColleges || []);
        setShortlistedColleges(res.data.shortlistedColleges || []);
        setShortlistedIds((res.data.shortlistedCollegeIds || []).map(Number));
        setEmptyHint(res.data.message || null);
      } else {
        setRecommendedColleges([]);
        setAllColleges([]);
        setShortlistedColleges([]);
        setShortlistedIds([]);
        setEmptyHint(res.message || "Could not load colleges.");
      }
      setLoading(false);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

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

  const tabSourceLabel =
    activeTab === "recommended"
      ? "Recommended"
      : activeTab === "shortlisted"
        ? "Shortlisted"
        : "All colleges";

  const visibleRows = useMemo((): TabCollege[] => {
    const base =
      activeTab === "recommended"
        ? recommendedColleges
        : activeTab === "shortlisted"
          ? shortlistedColleges
          : allColleges;
    return base.map((c) => toTabCollege(c, viewFrom, tabSourceLabel));
  }, [
    activeTab,
    recommendedColleges,
    shortlistedColleges,
    allColleges,
    viewFrom,
    tabSourceLabel,
  ]);

  const totalPages = Math.max(1, Math.ceil(visibleRows.length / PER_PAGE));
  const currentPage = Math.min(pageByTab[activeTab], totalPages);
  const pagedRows = visibleRows.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const setPage = (next: number) => {
    setPageByTab((prev) => ({
      ...prev,
      [activeTab]: Math.max(1, Math.min(totalPages, next)),
    }));
  };

  useEffect(() => {
    setPageByTab((prev) => ({ ...prev, [activeTab]: 1 }));
  }, [activeTab]);

  const shortlistedCount = shortlistedIds.length;

  const isShortlisted = (collegeId: number) => shortlistedIds.includes(collegeId);

  const toggleShortlist = async (collegeId: number) => {
    if (savingId != null) return;
    const nextShortlisted = !isShortlisted(collegeId);
    setSavingId(collegeId);
    const res = await updateShortlistedCollege(collegeId, nextShortlisted);
    if (res.success && res.data) {
      setShortlistedIds((res.data.shortlistedCollegeIds || []).map(Number));
      const res2 = await getDashboardColleges();
      if (res2.success && res2.data) {
        setShortlistedColleges(res2.data.shortlistedColleges || []);
      }
    }
    setSavingId(null);
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
            {loading ? (
              <div className="flex flex-col items-center justify-center rounded-xl bg-white px-4 py-16 text-center text-sm font-medium text-slate-500 shadow-sm dark:bg-slate-900 dark:text-slate-300">
                <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-100" />
                Loading colleges...
              </div>
            ) : visibleRows.length === 0 ? (
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
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
                {pagedRows.map((college) => (
                  <article
                    key={`${activeTab}-${college.id}`}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900"
                  >
                    <div className="relative aspect-[23/9] overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <img
                        src={college.logoSrc}
                        alt={college.college_name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                      <div className="absolute left-3 top-3 inline-flex rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
                        {college.college_type || "College"}
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col gap-2 p-3">
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
                              {college.college_name}
                            </h3>
                            <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">
                              {college.displaySubtitle}
                            </p>
                          </div>

                          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {college.tabSource}
                          </span>
                        </div>
                      </div>

                      <p className="line-clamp-3 text-[11px] leading-snug text-slate-600 dark:text-slate-400">
                        {college.displayOverview}
                      </p>

                      {college.linkedExams && college.linkedExams.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {college.linkedExams.slice(0, 4).map((ex) => (
                            <span
                              key={ex.id}
                              className="max-w-full truncate rounded-full bg-[#f0f4fa] px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                              title={ex.name}
                            >
                              {ex.code || ex.name}
                            </span>
                          ))}
                          {college.linkedExams.length > 4 ? (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 dark:bg-slate-800">
                              +{college.linkedExams.length - 4}
                            </span>
                          ) : null}
                        </div>
                      ) : null}

                      <div className="flex flex-wrap gap-1.5">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {college.college_location || [college.city, college.state].filter(Boolean).join(", ") || "—"}
                        </span>
                        {college.parent_university ? (
                          <span className="max-w-[140px] truncate rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300" title={college.parent_university}>
                            {college.parent_university}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                        <Button
                          variant="themeButtonOutline"
                          size="sm"
                          href={college.detailHref.replace(/from=[^&]*/, `from=${viewFrom}`)}
                          className="min-w-[72px] flex-1 justify-center !rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-95 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
                        >
                          View
                        </Button>
                        <button
                          type="button"
                          onClick={() => toggleShortlist(college.id)}
                          disabled={savingId === college.id}
                          className={`min-w-[88px] flex-1 justify-center rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                            isShortlisted(college.id)
                              ? "border border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                              : "border border-black bg-black text-[#FAD53C] hover:bg-black/90"
                          }`}
                        >
                          {savingId === college.id
                            ? "Saving..."
                            : isShortlisted(college.id)
                              ? "Shortlisted"
                              : "Shortlist"}
                        </button>
                        <Button
                          variant="themeButton"
                          size="sm"
                          href="/dashboard?section=applications"
                          className="min-w-[72px] flex-1 justify-center !rounded-full !border-black !bg-black !text-[#FAD53C] shadow-sm transition-all duration-200 hover:!bg-black/90 active:scale-95"
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900">
                <p className="text-slate-600 dark:text-slate-400">
                  Showing {(currentPage - 1) * PER_PAGE + 1}-
                  {Math.min(currentPage * PER_PAGE, visibleRows.length)} of {visibleRows.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="rounded-md border border-slate-200 px-3 py-1.5 text-slate-700 transition disabled:opacity-40 dark:border-slate-600 dark:text-slate-300"
                  >
                    Prev
                  </button>
                  <span className="text-slate-700 dark:text-slate-300">
                    Page {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
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
