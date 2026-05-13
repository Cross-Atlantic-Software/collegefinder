'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { FiSearch } from 'react-icons/fi';
import { FaCheckCircle } from 'react-icons/fa';
import { MdSchool } from 'react-icons/md';
import {
  getDashboardInstitutes,
  updateShortlistedInstitute,
  type DashboardInstitute,
} from '@/api/auth/profile';

type TabId = 'all' | 'shortlisted' | 'recommended';

/** All, Shortlist, and Recommended tabs each paginate at this size. */
const COACHINGS_PER_PAGE = 10;

type Row = DashboardInstitute & {
  displaySubtitle: string;
  displayOverview: string;
  logoSrc: string;
  tabSource: string;
};

const TABS: { id: TabId; label: string; icon: ReactNode }[] = [
  { id: 'all', label: 'All', icon: <MdSchool /> },
  { id: 'shortlisted', label: 'Shortlist', icon: <FaCheckCircle /> },
  { id: 'recommended', label: 'Recommended', icon: <FiSearch /> },
];

const PLACEHOLDER = '/college/image.png';

function toRow(inst: DashboardInstitute, tabSource: string): Row {
  const loc = [inst.city, inst.state].filter(Boolean).join(', ') || inst.institute_location?.trim() || '';
  return {
    ...inst,
    displaySubtitle: inst.type?.trim() || loc || 'Coaching institute',
    displayOverview:
      inst.institute_location?.trim()?.slice(0, 220) ||
      inst.institute_cityname?.trim() ||
      loc ||
      'Explore courses and contact details.',
    logoSrc: inst.logo?.trim() || PLACEHOLDER,
    tabSource,
  };
}

export default function ShortlistInstitutes() {
  const [activeTab, setActiveTab] = useState<TabId>('recommended');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [emptyHint, setEmptyHint] = useState<string | null>(null);
  const [recommended, setRecommended] = useState<DashboardInstitute[]>([]);
  const [all, setAll] = useState<DashboardInstitute[]>([]);
  const [shortlistedRows, setShortlistedRows] = useState<DashboardInstitute[]>([]);
  const [shortlistedIds, setShortlistedIds] = useState<number[]>([]);
  const [pageByTab, setPageByTab] = useState<Record<TabId, number>>({
    recommended: 1,
    shortlisted: 1,
    all: 1,
  });

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
      const res = await getDashboardInstitutes();
      if (cancelled) return;
      if (res.success && res.data) {
        setRecommended(res.data.recommendedInstitutes || []);
        setAll(res.data.allInstitutes || []);
        setShortlistedRows(res.data.shortlistedInstitutes || []);
        setShortlistedIds((res.data.shortlistedInstituteIds || []).map(Number));
        setEmptyHint(res.data.message || null);
      } else {
        setRecommended([]);
        setAll([]);
        setShortlistedRows([]);
        setShortlistedIds([]);
        setEmptyHint(res.message || 'Could not load institutes.');
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
      setIndicatorStyle({ left: activeEl.offsetLeft, width: activeEl.offsetWidth });
    };
    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [activeTab]);

  const tabSourceLabel =
    activeTab === 'recommended' ? 'Recommended' : activeTab === 'shortlisted' ? 'Shortlisted' : 'All';

  const visibleRows = useMemo((): Row[] => {
    const base =
      activeTab === 'recommended' ? recommended : activeTab === 'shortlisted' ? shortlistedRows : all;
    return base.map((i) => toRow(i, tabSourceLabel));
  }, [activeTab, recommended, shortlistedRows, all, tabSourceLabel]);

  const totalPages = Math.max(1, Math.ceil(visibleRows.length / COACHINGS_PER_PAGE));
  const currentPage = Math.min(pageByTab[activeTab], totalPages);
  const pagedRows = visibleRows.slice(
    (currentPage - 1) * COACHINGS_PER_PAGE,
    currentPage * COACHINGS_PER_PAGE
  );

  const setPage = (next: number) => {
    setPageByTab((prev) => ({
      ...prev,
      [activeTab]: Math.max(1, Math.min(totalPages, next)),
    }));
  };

  useEffect(() => {
    setPageByTab((prev) => ({ ...prev, [activeTab]: 1 }));
  }, [activeTab]);

  const isShortlisted = (id: number) => shortlistedIds.includes(id);

  const toggleShortlist = async (instituteId: number) => {
    if (savingId != null) return;
    const nextShortlisted = !isShortlisted(instituteId);
    setSavingId(instituteId);
    const res = await updateShortlistedInstitute(instituteId, nextShortlisted);
    if (res.success && res.data) {
      setShortlistedIds((res.data.shortlistedInstituteIds || []).map(Number));
      const res2 = await getDashboardInstitutes();
      if (res2.success && res2.data) {
        setShortlistedRows(res2.data.shortlistedInstitutes || []);
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
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">Coaching Institutes</p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    All, your shortlist, and recommended coachings based on your stream and exam interests.
                  </p>
                </div>
                {shortlistedIds.length > 0 && (
                  <span className="shrink-0 rounded-full bg-[#FAD53C] px-2.5 py-0.5 text-xs font-bold text-black">
                    {shortlistedIds.length}
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
                        'flex min-w-max items-center gap-2 border-b-2 border-transparent px-4 py-2.5 text-sm font-medium transition-colors duration-300 ease-in-out',
                        isActive
                          ? 'border-b-slate-900 text-slate-900 dark:border-b-slate-100 dark:text-slate-100'
                          : 'text-black/30 hover:text-black/60 dark:text-white/40 dark:hover:text-white/75',
                      ].join(' ')}
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
          <div key={activeTab} style={{ animation: 'fade-in 220ms ease-out' }}>
            {loading ? (
              <div className="flex flex-col items-center justify-center rounded-xl bg-white px-4 py-16 text-center text-sm font-medium text-slate-500 shadow-sm dark:bg-slate-900 dark:text-slate-300">
                <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-100" />
                Loading institutes...
              </div>
            ) : visibleRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl bg-white px-4 py-16 text-center shadow-sm dark:bg-slate-900">
                <MdSchool className="mb-3 h-10 w-10 text-slate-200 dark:text-slate-700" />
                <p className="text-sm font-medium text-slate-500 dark:text-slate-300">
                  {emptyHint || 'No coaching institutes in this section.'}
                </p>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  Try another tab or update stream and interests in your profile.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
                  {pagedRows.map((inst) => (
                    <article
                      key={`${activeTab}-${inst.id}`}
                      className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900"
                    >
                      <div className="relative aspect-[23/9] overflow-hidden bg-slate-100 dark:bg-slate-800">
                        <img
                          src={inst.logoSrc}
                          alt={inst.institute_name}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                        <div className="absolute left-3 top-3 inline-flex rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
                          {inst.type || 'Coaching'}
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col gap-2 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
                              {inst.institute_name}
                            </h3>
                            <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">
                              {inst.displaySubtitle}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {inst.tabSource}
                          </span>
                        </div>
                        <p className="line-clamp-3 text-[11px] leading-snug text-slate-600 dark:text-slate-400">
                          {inst.displayOverview}
                        </p>
                        {inst.linkedExams && inst.linkedExams.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {inst.linkedExams.slice(0, 4).map((ex) => (
                              <span
                                key={ex.id}
                                className="max-w-full truncate rounded-full bg-[#f0f4fa] px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                title={ex.name}
                              >
                                {ex.code || ex.name}
                              </span>
                            ))}
                            {inst.linkedExams.length > 4 ? (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 dark:bg-slate-800">
                                +{inst.linkedExams.length - 4}
                              </span>
                            ) : null}
                          </div>
                        ) : null}
                        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                          {inst.website?.trim() ? (
                            <a
                              href={inst.website.trim()}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="min-w-[72px] flex-1 justify-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-center text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                            >
                              Website
                            </a>
                          ) : (
                            <span className="min-w-[72px] flex-1 rounded-full border border-dashed border-slate-200 px-3 py-1.5 text-center text-[11px] text-slate-400 dark:border-slate-700">
                              No link
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => toggleShortlist(inst.id)}
                            disabled={savingId === inst.id}
                            className={`min-w-[88px] flex-1 justify-center rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                              isShortlisted(inst.id)
                                ? 'border border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                                : 'border border-black bg-black text-[#FAD53C] hover:bg-black/90'
                            }`}
                          >
                            {savingId === inst.id ? 'Saving...' : isShortlisted(inst.id) ? 'Shortlisted' : 'Shortlist'}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900">
                  <p className="text-slate-600 dark:text-slate-400">
                    Showing {(currentPage - 1) * COACHINGS_PER_PAGE + 1}-
                    {Math.min(currentPage * COACHINGS_PER_PAGE, visibleRows.length)} of {visibleRows.length}
                    <span className="text-slate-400 dark:text-slate-500"> · {COACHINGS_PER_PAGE} per page</span>
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
