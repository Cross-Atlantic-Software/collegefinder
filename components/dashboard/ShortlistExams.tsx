'use client';

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useRef, type ReactNode } from "react";
import { FiSearch } from "react-icons/fi";
import { FaCheckCircle, FaRegCheckCircle } from "react-icons/fa";
import { MdOutlineArrowOutward, MdSchool } from "react-icons/md";
import {
    getAllExams,
    getExamPreferences,
    getRecommendedExams,
    updateExamPreferences,
    type Exam,
} from "@/api/exams";
import { ExamApplicationModal } from "./ExamApplicationModal";

type TabId = "recommended" | "shortlisted" | "all";

type ExamRow = {
    rowKey: string;
    examId: string;
    name: string;
    subtitle: string;
    description: string;
    date: string;
    fee: string;
    colleges: string;
    difficulty: string;
    applicants: string;
    mode: string;
    eligibility: string;
    examLogo: string | null | undefined;
    detailFrom: string;
};

const TABS: { id: TabId; label: string; icon: ReactNode }[] = [
    { id: "recommended", label: "Recommended", icon: <FiSearch /> },
    { id: "shortlisted", label: "Shortlisted", icon: <FaCheckCircle /> },
    { id: "all", label: "All Exams", icon: <MdSchool /> },
];

const EM_DASH = "\u2014";

function slugify(value: string) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}

function formatMonthYear(iso: string | null | undefined): string {
    if (!iso) return EM_DASH;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return EM_DASH;
    return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

function formatFeeInr(n: number | null | undefined): string {
    if (n == null || Number.isNaN(Number(n))) return EM_DASH;
    return `\u20b9${Number(n).toLocaleString("en-IN")}`;
}

function buildRowFromExam(exam: Exam, detailFrom: string): ExamRow {
    const meta = exam.shortlist_meta || {};
    const collegeCount = exam.participating_colleges_count ?? 0;
    let colleges = EM_DASH;
    if (collegeCount > 0) {
        colleges = collegeCount >= 500 ? `${collegeCount}+` : String(collegeCount);
    } else if (meta.colleges_label) {
        colleges = meta.colleges_label;
    }

    const mode = exam.pattern_mode || meta.mode || EM_DASH;

    return {
        rowKey: exam.code,
        examId: String(exam.id),
        name: exam.name,
        subtitle: meta.subtitle || exam.exam_type || exam.code,
        description: exam.description?.trim() || `${exam.name} \u2014 see official notice for the latest pattern and dates.`,
        date: formatMonthYear(exam.dates_exam_date),
        fee: formatFeeInr(meta.fee_inr),
        colleges,
        difficulty: meta.difficulty || EM_DASH,
        applicants: meta.applicants_label || EM_DASH,
        mode,
        eligibility: meta.eligibility_label || EM_DASH,
        examLogo: exam.exam_logo,
        detailFrom,
    };
}

export default function ShortlistExams() {
    const [activeTab, setActiveTab] = useState<TabId>("recommended");
    const [selectedExam, setSelectedExam] = useState<{ name: string; id?: string } | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [allExams, setAllExams] = useState<Exam[]>([]);
    const [recommendedIds, setRecommendedIds] = useState<Set<string>>(new Set());
    const [shortlistedCodes, setShortlistedCodes] = useState<Set<string>>(new Set());
    const [recMessage, setRecMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const tabRefs = useRef<Record<TabId, HTMLButtonElement | null>>({
        recommended: null,
        shortlisted: null,
        all: null,
    });
    const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

    const loadData = useCallback(async () => {
        setLoading(true);
        const allRes = await getAllExams();
        const exams = allRes.success && allRes.data ? allRes.data.exams : [];
        setAllExams(exams);

        const hasToken =
            typeof window !== "undefined" && Boolean(localStorage.getItem("auth_token"));

        if (hasToken) {
            const prefRes = await getExamPreferences();
            if (prefRes.success && prefRes.data?.target_exams?.length) {
                setShortlistedCodes(new Set(prefRes.data.target_exams));
            } else {
                setShortlistedCodes(new Set());
            }

            const recRes = await getRecommendedExams();
            if (recRes.success && recRes.data) {
                setRecommendedIds(new Set(recRes.data.examIds || []));
                setRecMessage(recRes.data.message ?? null);
            } else {
                setRecommendedIds(new Set());
                setRecMessage(null);
            }
        } else {
            setShortlistedCodes(new Set());
            setRecommendedIds(new Set());
            setRecMessage(null);
        }

        setLoading(false);
    }, []);

    useEffect(() => {
        void loadData();
    }, [loadData]);

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

    const examById = useMemo(() => {
        const m = new Map<string, Exam>();
        allExams.forEach((e) => m.set(String(e.id), e));
        return m;
    }, [allExams]);

    const allRows = useMemo(
        () => allExams.map((e) => buildRowFromExam(e, "dashboard-shortlist-all")),
        [allExams],
    );

    const recommendedRows = useMemo(() => {
        const ordered: ExamRow[] = [];
        recommendedIds.forEach((id) => {
            const exam = examById.get(id);
            if (exam) ordered.push(buildRowFromExam(exam, "dashboard-shortlist-recommended"));
        });
        return ordered;
    }, [examById, recommendedIds]);

    const shortlistedRows = useMemo(() => {
        return allRows.filter((row) => shortlistedCodes.has(row.rowKey));
    }, [allRows, shortlistedCodes]);

    const visibleRows =
        activeTab === "recommended"
            ? recommendedRows
            : activeTab === "shortlisted"
              ? shortlistedRows
              : allRows;

    const toggleShortlist = async (row: ExamRow) => {
        const next = new Set(shortlistedCodes);
        if (next.has(row.rowKey)) {
            next.delete(row.rowKey);
        } else {
            next.add(row.rowKey);
        }
        setShortlistedCodes(next);
        const res = await updateExamPreferences({ target_exams: Array.from(next) });
        if (!res.success) {
            await loadData();
        }
    };

    const openApplication = (row: ExamRow) => {
        setSelectedExam({ name: row.name, id: row.examId });
        setIsModalOpen(true);
    };

    const shortlistedCount = shortlistedRows.length;

    const emptyRecommended =
        activeTab === "recommended" && !loading && recommendedRows.length === 0;

    return (
        <div className="w-full min-h-screen bg-[#f5f9ff] text-black">
            <section className="w-full bg-[#f5f9ff]">
                <header className="border-b border-slate-200 bg-white px-4 pt-2 pb-0 md:px-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-3">
                                <div>
                                    <p className="text-lg font-semibold text-slate-900">Exam Shortlist</p>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        Manage recommendations, shortlist picks, and the full exam list. Data comes from the server.
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
                                                    ? "border-b-slate-900 text-slate-900"
                                                    : "text-black/30 hover:text-black/60",
                                            ].join(" ")}
                                        >
                                            <span className="text-[15px]">{tab.icon}</span>
                                            <span>{tab.label}</span>
                                        </button>
                                    );
                                })}

                                <span
                                    aria-hidden="true"
                                    className="pointer-events-none absolute bottom-0 h-0.5 bg-slate-900 transition-all duration-300 ease-in-out"
                                    style={{
                                        left: indicatorStyle.left,
                                        width: indicatorStyle.width,
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </header>

                <div className="bg-[#f8fbff] p-4 md:p-6">
                    <div className="overflow-hidden rounded-xl bg-white shadow-sm transition-all duration-200">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center px-4 py-16 text-center text-sm font-medium text-slate-500 md:px-6">
                                <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
                                Loading exams...
                            </div>
                        ) : emptyRecommended ? (
                            <div className="flex flex-col items-center justify-center px-4 py-16 text-center md:px-6">
                                <MdSchool className="mb-3 h-10 w-10 text-slate-200" />
                                <p className="text-sm font-medium text-slate-500">No recommended exams yet.</p>
                                <p className="mt-1 max-w-md text-xs text-slate-400">
                                    {recMessage ||
                                        "Add career interests in your profile and link exams to those interests in the admin tools, or open \u201cAll Exams\u201d to browse the full list."}
                                </p>
                            </div>
                        ) : visibleRows.length === 0 ? (
                            <div className="flex flex-col items-center justify-center px-4 py-16 text-center md:px-6">
                                <MdSchool className="mb-3 h-10 w-10 text-slate-200" />
                                <p className="text-sm font-medium text-slate-500">No exams available in this section.</p>
                                <p className="mt-1 text-xs text-slate-400">Try switching tabs or shortlist exams from \u201cAll Exams\u201d.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-[1280px] w-full border-collapse text-left">
                                    <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                        <tr>
                                            <th className="px-6 py-4">Name</th>
                                            <th className="px-6 py-4">Date</th>
                                            <th className="px-6 py-4">Fee</th>
                                            <th className="px-6 py-4">Colleges</th>
                                            <th className="px-6 py-4">Difficulty</th>
                                            <th className="px-6 py-4">Applicants</th>
                                            <th className="px-6 py-4">Mode</th>
                                            <th className="px-6 py-4">Eligible</th>
                                            <th className="px-6 py-4 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {visibleRows.map((row) => {
                                            const isShortlisted = shortlistedCodes.has(row.rowKey);
                                            const logoSrc = row.examLogo?.trim() || "";
                                            const detailSlug = slugify(row.name);
                                            const detailHref = `/dashboard/exams/${detailSlug}?from=${row.detailFrom}`;

                                            return (
                                                <tr
                                                    key={`${row.rowKey}-${row.detailFrom}`}
                                                    className={`group align-middle transition-all duration-200 ${isShortlisted ? "bg-[#FAD53C]/5" : "bg-white"} hover:bg-slate-50`}
                                                >
                                                    <td className="px-6 py-3.5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors duration-200 group-hover:bg-[#FAD53C]/20 group-hover:text-black">
                                                                {logoSrc ? (
                                                                    <Image
                                                                        src={logoSrc}
                                                                        alt={`${row.name} logo`}
                                                                        width={22}
                                                                        height={22}
                                                                        className="h-[22px] w-[22px] object-contain"
                                                                        unoptimized
                                                                    />
                                                                ) : (
                                                                    <MdSchool className="h-4.5 w-4.5" />
                                                                )}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="truncate text-[14px] font-semibold text-slate-900 transition-colors duration-200 group-hover:text-black">
                                                                    {row.name}
                                                                </p>
                                                                <p className="truncate text-[11px] font-medium text-slate-400">{row.subtitle}</p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-6 py-3.5 align-middle text-[13px] font-medium text-slate-700 whitespace-nowrap">
                                                        {row.date}
                                                    </td>
                                                    <td className="px-6 py-3.5 align-middle text-[13px] font-medium text-slate-700 whitespace-nowrap">
                                                        {row.fee}
                                                    </td>
                                                    <td className="px-6 py-3.5 align-middle text-[13px] font-medium text-slate-700 whitespace-nowrap">
                                                        {row.colleges}
                                                    </td>
                                                    <td className="px-6 py-3.5 align-middle whitespace-nowrap">
                                                        <span
                                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                                row.difficulty === "High"
                                                                    ? "bg-red-50 text-red-700 border border-red-100"
                                                                    : row.difficulty === "Medium"
                                                                      ? "bg-orange-50 text-orange-700 border border-orange-100"
                                                                      : row.difficulty === "Low"
                                                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                                                        : "bg-slate-50 text-slate-600 border border-slate-100"
                                                            }`}
                                                        >
                                                            {row.difficulty}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3.5 align-middle text-[13px] font-medium text-slate-700 whitespace-nowrap">
                                                        {row.applicants}
                                                    </td>
                                                    <td className="px-6 py-3.5 align-middle text-[13px] font-medium text-slate-700 whitespace-nowrap">
                                                        {row.mode}
                                                    </td>
                                                    <td className="px-6 py-3.5 align-middle text-[13px] font-medium text-slate-700">
                                                        <div className="max-w-[140px] truncate">{row.eligibility}</div>
                                                    </td>
                                                    <td className="px-6 py-3.5 align-middle text-right whitespace-nowrap">
                                                        <div className="ml-auto inline-flex flex-nowrap items-center justify-end gap-2 whitespace-nowrap">
                                                            <button
                                                                type="button"
                                                                onClick={() => void toggleShortlist(row)}
                                                                className={[
                                                                    "inline-flex min-w-[110px] items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-all duration-200 active:scale-95",
                                                                    isShortlisted
                                                                        ? "bg-[#FAD53C] text-black ring-1 ring-black/5 hover:brightness-95"
                                                                        : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800",
                                                                ].join(" ")}
                                                            >
                                                                {isShortlisted ? (
                                                                    <FaCheckCircle className="h-3.5 w-3.5" />
                                                                ) : (
                                                                    <FaRegCheckCircle className="h-3.5 w-3.5 text-slate-400" />
                                                                )}
                                                                {isShortlisted ? "Shortlisted" : "Shortlist"}
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => openApplication(row)}
                                                                className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-black px-3.5 py-1.5 text-[13px] font-semibold text-[#FAD53C] shadow-sm transition-all duration-200 hover:bg-black/90 active:scale-95"
                                                            >
                                                                Apply Now
                                                            </button>

                                                            <Link
                                                                href={detailHref}
                                                                aria-label={`View details for ${row.name}`}
                                                                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 active:scale-95"
                                                            >
                                                                <MdOutlineArrowOutward className="h-4 w-4" />
                                                            </Link>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
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
                    onSubmit={async () => {
                        // TODO: Implement API call to save exam application with subject breakdown.
                    }}
                />
            )}
        </div>
    );
}
