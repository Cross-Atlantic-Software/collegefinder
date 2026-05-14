"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FiSearch } from "react-icons/fi";
import { MdOutlineArrowOutward, MdSchool } from "react-icons/md";
import { getDashboardExams, updateShortlistedExam, type Exam } from "@/api/exams";
import { ExamApplicationModal } from "./ExamApplicationModal";
import { matchesExamSearchTokens } from "@/lib/examSearch";
import { formatExamPatternDurationHours } from "@/lib/formatDuration";

type TabId = "recommended" | "shortlisted" | "all";
const PER_PAGE = 10;

export type ExamShortlistExamTypeFilter = "all" | "National" | "State" | "Institute";

type ShortlistExamsProps = {
  /** When set with onSearchQueryChange, search is controlled (e.g. from dashboard TopBar). */
  searchQuery?: string;
  onSearchQueryChange?: (q: string) => void;
  examTypeFilter?: ExamShortlistExamTypeFilter;
  onExamTypeFilterChange?: (t: ExamShortlistExamTypeFilter) => void;
};

type ExamRow = {
  examId: number;
  name: string;
  subtitle: string;
  description: string;
  detailHref: string;
  mode: string;
  duration: string;
  attempts: string;
  examType: string;
  conductingAuthority: string;
  /** Dashboard DB field `exam_popularity_rank`; "—" when unset. */
  popularityRank: string;
};

function toRow(exam: Exam, from: string): ExamRow {
  const attemptsRaw = exam.eligibilityCriteria?.attempt_limit;
  const attempts =
    attemptsRaw != null && String(attemptsRaw).trim() !== ""
      ? String(attemptsRaw).trim()
      : "—"; // free-form or numeric from admin — always show as text
  const mode =
    exam.examPattern?.mode != null && String(exam.examPattern.mode).trim() !== ""
      ? String(exam.examPattern.mode).trim()
      : "—";
  const rankRaw = exam.exam_popularity_rank;
  const popularityRank =
    rankRaw != null && !Number.isNaN(Number(rankRaw))
      ? String(Number(rankRaw))
      : "—";
  return {
    examId: Number(exam.id),
    name: exam.name,
    subtitle: exam.code || "",
    description: exam.description || "Exam details, key dates, and next-step guidance.",
    detailHref: `/dashboard/exams/${exam.id}?from=${from}`,
    mode,
    duration: formatExamPatternDurationHours(exam.examPattern?.duration_minutes ?? undefined),
    attempts,
    examType: exam.exam_type?.trim() || "",
    conductingAuthority: exam.conducting_authority?.trim() || "",
    popularityRank,
  };
}

export default function ShortlistExams({
  searchQuery: controlledSearch,
  onSearchQueryChange,
  examTypeFilter: controlledTypeFilter,
  onExamTypeFilterChange,
}: ShortlistExamsProps = {}) {
  const [selectedExam, setSelectedExam] = useState<{ name: string; id?: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("recommended");
  const [internalQuery, setInternalQuery] = useState("");
  const searchControlled = controlledSearch !== undefined && onSearchQueryChange !== undefined;
  const query = searchControlled ? controlledSearch! : internalQuery;
  const setQuery = searchControlled ? onSearchQueryChange! : setInternalQuery;

  const [internalTypeFilter, setInternalTypeFilter] = useState<ExamShortlistExamTypeFilter>("all");
  const typeFilterControlled =
    controlledTypeFilter !== undefined && onExamTypeFilterChange !== undefined;
  const examTypeFilter = typeFilterControlled ? controlledTypeFilter! : internalTypeFilter;
  const setExamTypeFilter = typeFilterControlled ? onExamTypeFilterChange! : setInternalTypeFilter;
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [allExams, setAllExams] = useState<Exam[]>([]);
  const [recommendedIds, setRecommendedIds] = useState<number[]>([]);
  const [shortlistedIds, setShortlistedIds] = useState<number[]>([]);
  const [emptyHint, setEmptyHint] = useState<string | null>(null);
  const [pageByTab, setPageByTab] = useState<Record<TabId, number>>({
    recommended: 1,
    shortlisted: 1,
    all: 1,
  });

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      const res = await getDashboardExams();
      if (cancelled) return;
      if (res.success && res.data) {
        setAllExams(res.data.allExams || []);
        setRecommendedIds((res.data.recommendedExamIds || []).map(Number));
        setShortlistedIds((res.data.shortlistedExamIds || []).map(Number));
        setEmptyHint(res.data.message || null);
      } else {
        setAllExams([]);
        setRecommendedIds([]);
        setShortlistedIds([]);
        setEmptyHint(res.message || "Could not load exams.");
      }
      setLoading(false);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const examMap = useMemo(
    () => new Map(allExams.map((e) => [Number(e.id), e])),
    [allExams]
  );

  const rowsByTab = useMemo(() => {
    const recommended = recommendedIds
      .map((id) => examMap.get(id))
      .filter(Boolean)
      .map((exam) => toRow(exam as Exam, "dashboard-shortlist-recommended"));
    const shortlisted = shortlistedIds
      .map((id) => examMap.get(id))
      .filter(Boolean)
      .map((exam) => toRow(exam as Exam, "dashboard-shortlist-shortlisted"));
    const all = allExams.map((exam) => toRow(exam, "dashboard-shortlist-all"));
    return { recommended, shortlisted, all };
  }, [recommendedIds, shortlistedIds, allExams, examMap]);

  const filteredRows = useMemo(() => {
    const base = rowsByTab[activeTab];
    const byType =
      examTypeFilter === "all"
        ? base
        : base.filter(
            (r) => r.examType.trim().toLowerCase() === examTypeFilter.toLowerCase()
          );
    return byType.filter((r) =>
      matchesExamSearchTokens(
        [
          r.name,
          r.subtitle,
          r.description,
          r.mode,
          r.duration,
          r.attempts,
          r.examType,
          r.conductingAuthority,
          ...(activeTab === "all" ? [r.popularityRank] : []),
        ],
        query
      )
    );
  }, [rowsByTab, activeTab, query, examTypeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PER_PAGE));
  const currentPage = Math.min(pageByTab[activeTab], totalPages);
  const pagedRows = filteredRows.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const setPage = (next: number) => {
    setPageByTab((prev) => ({ ...prev, [activeTab]: Math.max(1, Math.min(totalPages, next)) }));
  };

  useEffect(() => {
    setPageByTab((prev) => ({ ...prev, [activeTab]: 1 }));
  }, [activeTab, query]);

  const isShortlisted = (examId: number) => shortlistedIds.includes(examId);

  const toggleShortlist = async (examId: number) => {
    if (savingId != null) return;
    const nextShortlisted = !isShortlisted(examId);
    setSavingId(examId);
    const res = await updateShortlistedExam(examId, nextShortlisted);
    if (res.success && res.data) {
      setShortlistedIds((res.data.shortlistedExamIds || []).map(Number));
    }
    setSavingId(null);
  };

  return (
    <div className="w-full min-h-screen min-w-0 overflow-x-hidden bg-[#f5f9ff] text-black">
      <section className="w-full min-w-0 bg-[#f5f9ff]">
        <header className="border-b border-slate-200 bg-white px-4 pt-2 pb-4 md:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FAD53C]/25 text-slate-900">
              <FiSearch className="h-4 w-4" />
            </span>
            <div>
              <p className="text-lg font-semibold text-slate-900">Exam Shortlist</p>
              <p className="mt-0.5 text-xs text-slate-500">
                Recommended, shortlisted, and all exams for your selected stream.
              </p>
            </div>
          </div>
        </header>

        <div className="min-w-0 space-y-4 bg-[#f8fbff] p-4 md:p-6">
          <div className="flex flex-wrap items-center gap-2">
            {([
              ["recommended", "Recommended Exams"],
              ["shortlisted", "Shortlisted Exams"],
              ["all", "All Exams"],
            ] as Array<[TabId, string]>).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeTab === id
                    ? "bg-black text-[#FAD53C]"
                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div id="exam-shortlist-filters" className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Type:</span>
            {(
              [
                ["all", "All"],
                ["National", "National"],
                ["State", "State"],
                ["Institute", "Institute"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setExamTypeFilter(id)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  examTypeFilter === id
                    ? "bg-[#341050] text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <label className="flex w-full max-w-xl items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
            <FiSearch className="h-4 w-4 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                activeTab === "all"
                  ? "Search by name, code, mode, duration, attempts, type, authority, popularity rank…"
                  : "Search by name, code, mode, duration, attempts, type, authority…"
              }
              className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />
          </label>

          <div className="min-w-0 max-w-full overflow-hidden rounded-xl bg-white shadow-sm transition-all duration-200">
            {loading ? (
              <div className="flex flex-col items-center justify-center px-4 py-16 text-center text-sm font-medium text-slate-500 md:px-6">
                <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
                Loading exams...
              </div>
            ) : pagedRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-16 text-center md:px-6">
                <MdSchool className="mb-3 h-10 w-10 text-slate-200" />
                <p className="text-sm font-medium text-slate-500">
                  {rowsByTab[activeTab].length === 0
                    ? emptyHint || "No exams found for this tab."
                    : query.trim() || examTypeFilter !== "all"
                      ? "No exams match your search or filters. Try different keywords or set type to All."
                      : emptyHint || "No exams found for this tab."}
                </p>
              </div>
            ) : (
              <div className="w-full min-w-0 px-1 pb-1 pt-0 sm:px-2">
                <div className="text-center">
                  <div className="inline-block max-w-full overflow-x-auto overscroll-x-contain text-left align-top [scrollbar-gutter:stable]">
                    <table className="w-max min-w-[940px] border-collapse text-left">
                  <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Description</th>
                      <th className="px-6 py-4">Mode</th>
                      <th className="px-6 py-4">Duration (Hrs)</th>
                      {activeTab === "all" ? (
                        <th
                          className="px-6 py-4 text-right tabular-nums"
                          title="From exam popularity rank in the database (lower = more popular). Matches All Exams sort order."
                        >
                          Popularity rank
                        </th>
                      ) : null}
                      <th className="px-6 py-4">Attempts</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {pagedRows.map((row) => (
                      <tr key={`${activeTab}-${row.examId}`} className="group align-middle transition-all duration-200 bg-white hover:bg-slate-50">
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors duration-200 group-hover:bg-[#FAD53C]/20 group-hover:text-black">
                              <MdSchool className="h-4.5 w-4.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-[14px] font-semibold text-slate-900">{row.name}</p>
                              <p className="truncate text-[11px] font-medium text-slate-400">{row.subtitle}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-[13px] text-slate-700">
                          <div className="line-clamp-2 max-w-xl">{row.description}</div>
                        </td>
                        <td className="px-6 py-3.5 text-[13px] text-slate-700">
                          <div className="max-w-[140px] truncate" title={row.mode}>
                            {row.mode}
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-[13px] text-slate-700 whitespace-nowrap">{row.duration}</td>
                        {activeTab === "all" ? (
                          <td className="px-6 py-3.5 text-right text-[13px] text-slate-700 tabular-nums whitespace-nowrap">
                            {row.popularityRank}
                          </td>
                        ) : null}
                        <td className="px-6 py-3.5 text-[13px] text-slate-700">
                          <div className="max-w-[120px] truncate" title={row.attempts}>
                            {row.attempts}
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-right whitespace-nowrap">
                          <div className="ml-auto inline-flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => toggleShortlist(row.examId)}
                              disabled={savingId === row.examId}
                              className={`inline-flex items-center justify-center rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition ${
                                isShortlisted(row.examId)
                                  ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                  : "bg-black text-[#FAD53C] hover:bg-black/90"
                              }`}
                            >
                              {savingId === row.examId
                                ? "Saving..."
                                : isShortlisted(row.examId)
                                  ? "Shortlisted"
                                  : "Shortlist"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedExam({ name: row.name, id: String(row.examId) });
                                setIsModalOpen(true);
                              }}
                              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-black px-3.5 py-1.5 text-[13px] font-semibold text-[#FAD53C]"
                            >
                              Apply Now
                            </button>
                            <Link
                              href={row.detailHref}
                              aria-label={`View details for ${row.name}`}
                              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
                            >
                              <MdOutlineArrowOutward className="h-4 w-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          {!loading && filteredRows.length > 0 ? (
            <div className="flex items-center justify-between rounded-xl bg-white border border-slate-200 px-4 py-3 text-sm">
              <p className="text-slate-600">
                Showing {(currentPage - 1) * PER_PAGE + 1}-
                {Math.min(currentPage * PER_PAGE, filteredRows.length)} of {filteredRows.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="rounded-md border border-slate-200 px-3 py-1.5 disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="text-slate-700">
                  Page {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="rounded-md border border-slate-200 px-3 py-1.5 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {selectedExam && (
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
      )}
    </div>
  );
}
