'use client';

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, useRef, type ReactNode } from "react";
import { FiSearch } from "react-icons/fi";
import { FaCheckCircle, FaRegCheckCircle } from "react-icons/fa";
import { MdOutlineArrowOutward, MdSchool } from "react-icons/md";
import { getAllExams, type Exam } from "@/api/exams";
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
    shortlisted: boolean;
    detailHref: string;
    sourceLabel: string;
};

const TABS: { id: TabId; label: string; icon: ReactNode }[] = [
    { id: "recommended", label: "Recommended", icon: <FiSearch /> },
    { id: "shortlisted", label: "Shortlisted", icon: <FaCheckCircle /> },
    { id: "all", label: "All Exams", icon: <MdSchool /> },
];

const STATIC_ROWS: ExamRow[] = [
    {
        rowKey: "jee-main",
        examId: "jee-main",
        name: "JEE Main",
        subtitle: "Engineering entrance",
        description: "National-level engineering entrance for NITs, IIITs, and other participating institutes.",
        date: "Jan 2026",
        fee: "₹1,000",
        colleges: "1,500+",
        difficulty: "High",
        applicants: "12 Lakh",
        mode: "Online",
        eligibility: "12th PCM with 75%",
        shortlisted: true,
        detailHref: "/dashboard/exams/jee-main?from=dashboard-shortlist-shortlisted",
        sourceLabel: "Shortlisted Exam",
    },
    {
        rowKey: "neet",
        examId: "neet",
        name: "NEET",
        subtitle: "Medical entrance",
        description: "Required for MBBS, BDS, and allied medical admissions across India.",
        date: "May 2026",
        fee: "₹1,700",
        colleges: "600+",
        difficulty: "High",
        applicants: "20 Lakh",
        mode: "Offline",
        eligibility: "12th PCB with 50%",
        shortlisted: true,
        detailHref: "/dashboard/exams/neet?from=dashboard-shortlist-shortlisted",
        sourceLabel: "Shortlisted Exam",
    },
    {
        rowKey: "bitsat",
        examId: "bitsat",
        name: "BITSAT",
        subtitle: "Private institute entrance",
        description: "Admission route for BITS campuses with a fast, aptitude-heavy paper.",
        date: "May 2026",
        fee: "₹3,400",
        colleges: "3",
        difficulty: "Medium",
        applicants: "3 Lakh",
        mode: "Online",
        eligibility: "12th PCM with strong score",
        shortlisted: false,
        detailHref: "/dashboard/exams/bitsat?from=dashboard-shortlist-shortlisted",
        sourceLabel: "Shortlist Candidate",
    },
    {
        rowKey: "viteee",
        examId: "viteee",
        name: "VITEEE",
        subtitle: "Engineering entrance",
        description: "Computer-based engineering exam for VIT campuses with broad intake.",
        date: "Apr 2026",
        fee: "₹1,350",
        colleges: "4",
        difficulty: "Medium",
        applicants: "4 Lakh",
        mode: "Online",
        eligibility: "12th PCM or PCB",
        shortlisted: false,
        detailHref: "/dashboard/exams/viteee?from=dashboard-shortlist-shortlisted",
        sourceLabel: "Shortlist Candidate",
    },
];

const RECOMMENDED_UI_ROWS: ExamRow[] = [
    {
        rowKey: "rec-uceed",
        examId: "uceed",
        name: "UCEED",
        subtitle: "Design entrance",
        description: "UI-only recommended row for shortlist design view.",
        date: "Jan 2027",
        fee: "₹4,000",
        colleges: "20+",
        difficulty: "Medium",
        applicants: "30K",
        mode: "Online",
        eligibility: "12th pass",
        shortlisted: false,
        detailHref: "/dashboard/exams/uceed?from=dashboard-shortlist-recommended",
        sourceLabel: "UI Recommendation",
    },
    {
        rowKey: "rec-nift",
        examId: "nift",
        name: "NIFT Entrance",
        subtitle: "Fashion & design",
        description: "UI-only recommended row for shortlist design view.",
        date: "Feb 2027",
        fee: "₹3,000",
        colleges: "18",
        difficulty: "Medium",
        applicants: "45K",
        mode: "Online",
        eligibility: "12th pass",
        shortlisted: false,
        detailHref: "/dashboard/exams/nift-entrance?from=dashboard-shortlist-recommended",
        sourceLabel: "UI Recommendation",
    },
    {
        rowKey: "rec-nid-dat",
        examId: "nid-dat",
        name: "NID DAT",
        subtitle: "Design aptitude test",
        description: "UI-only recommended row for shortlist design view.",
        date: "Dec 2026",
        fee: "₹3,000",
        colleges: "10+",
        difficulty: "High",
        applicants: "20K",
        mode: "Hybrid",
        eligibility: "12th pass",
        shortlisted: false,
        detailHref: "/dashboard/exams/nid-dat?from=dashboard-shortlist-recommended",
        sourceLabel: "UI Recommendation",
    },
];

const EXAM_LOGOS: Record<string, string> = {
    "jee-main": "/cbse.png",
    "neet": "/cbse.png",
    "bitsat": "/cbse.png",
    "viteee": "/cbse.png",
    "uceed": "/cbse.png",
    "nift": "/cbse.png",
    "nid-dat": "/cbse.png",
    "rec-uceed": "/cbse.png",
    "rec-nift": "/cbse.png",
    "rec-nid-dat": "/cbse.png",
};

function slugify(value: string) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}

function createFallbackRow(exam: Exam, sourceLabel: string): ExamRow {
    const rowKey = slugify(exam.code || exam.name);
    const detailSlug = slugify(exam.name || exam.code || String(exam.id));

    return {
        rowKey,
        examId: String(exam.id),
        name: exam.name,
        subtitle: exam.code || "",
        description: exam.description || "Exam details, key dates, and next-step guidance.",
        date: "TBA",
        fee: "TBA",
        colleges: "TBA",
        difficulty: "Medium",
        applicants: "TBA",
        mode: "TBA",
        eligibility: "Check exam notice",
        shortlisted: false,
        detailHref: `/dashboard/exams/${detailSlug}?from=${sourceLabel}`,
        sourceLabel: "Directory Exam",
    };
}

export default function ShortlistExams() {
    const [activeTab, setActiveTab] = useState<TabId>("recommended");
    const [selectedExam, setSelectedExam] = useState<{ name: string; id?: string } | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [allExams, setAllExams] = useState<Exam[]>([]);
    const [loadingAll, setLoadingAll] = useState(true);
    const tabRefs = useRef<Record<TabId, HTMLButtonElement | null>>({
        recommended: null,
        shortlisted: null,
        all: null,
    });
    const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
    const [shortlistedIds, setShortlistedIds] = useState<string[]>(STATIC_ROWS.filter((row) => row.shortlisted).map((row) => row.rowKey));

    useEffect(() => {
        let cancelled = false;

        const run = async () => {
            setLoadingAll(true);
            const allRes = await getAllExams();
            if (cancelled) return;
            setAllExams(allRes.success && allRes.data ? allRes.data.exams : []);
            setLoadingAll(false);
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

    const apiRows = useMemo(() => {
        return allExams.map((exam) => createFallbackRow(exam, "dashboard-shortlist-all"));
    }, [allExams]);

    const allRows = useMemo(() => {
        const rows = [...STATIC_ROWS];
        apiRows.forEach((row) => {
            if (!rows.some((item) => item.rowKey === row.rowKey)) {
                rows.push(row);
            }
        });
        return rows;
    }, [apiRows]);

    const recommendedRows = RECOMMENDED_UI_ROWS;

    const shortlistedRows = useMemo(() => {
        return allRows.filter((row) => shortlistedIds.includes(row.rowKey));
    }, [allRows, shortlistedIds]);

    const visibleRows = activeTab === "recommended" ? recommendedRows : activeTab === "shortlisted" ? shortlistedRows : allRows;
    const isLoading = activeTab === "recommended" ? false : loadingAll;

    const toggleShortlist = (row: ExamRow) => {
        setShortlistedIds((current) =>
            current.includes(row.rowKey)
                ? current.filter((item) => item !== row.rowKey)
                : [...current, row.rowKey],
        );
    };

    const openApplication = (row: ExamRow) => {
        setSelectedExam({ name: row.name, id: row.examId });
        setIsModalOpen(true);
    };

    const shortlistedCount = shortlistedRows.length;

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
                                        Manage recommendations, shortlist picks, and the full exam list.
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
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center px-4 py-16 text-center text-sm font-medium text-slate-500 md:px-6">
                                    <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
                                    Loading exams...
                                </div>
                            ) : visibleRows.length === 0 ? (
                                <div className="flex flex-col items-center justify-center px-4 py-16 text-center md:px-6">
                                    <MdSchool className="mb-3 h-10 w-10 text-slate-200" />
                                    <p className="text-sm font-medium text-slate-500">No exams available in this section.</p>
                                    <p className="mt-1 text-xs text-slate-400">Try switching tabs or check back after updating your profile.</p>
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
                                                const isShortlisted = shortlistedIds.includes(row.rowKey);
                                                const logoSrc = EXAM_LOGOS[row.rowKey] ?? EXAM_LOGOS[row.examId];

                                                return (
                                                    <tr key={row.rowKey} className={`group align-middle transition-all duration-200 ${isShortlisted ? "bg-[#FAD53C]/5" : "bg-white"} hover:bg-slate-50`}>
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
                                                                    <p className="truncate text-[14px] font-semibold text-slate-900 transition-colors duration-200 group-hover:text-black">{row.name}</p>
                                                                    <p className="truncate text-[11px] font-medium text-slate-400">{row.subtitle}</p>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        <td className="px-6 py-3.5 align-middle text-[13px] font-medium text-slate-700 whitespace-nowrap">{row.date}</td>
                                                        <td className="px-6 py-3.5 align-middle text-[13px] font-medium text-slate-700 whitespace-nowrap">{row.fee}</td>
                                                        <td className="px-6 py-3.5 align-middle text-[13px] font-medium text-slate-700 whitespace-nowrap">{row.colleges}</td>
                                                        <td className="px-6 py-3.5 align-middle whitespace-nowrap">
                                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                                row.difficulty === "High" ? "bg-red-50 text-red-700 border border-red-100" :
                                                                row.difficulty === "Medium" ? "bg-orange-50 text-orange-700 border border-orange-100" :
                                                                "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                                            }`}>
                                                                {row.difficulty}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-3.5 align-middle text-[13px] font-medium text-slate-700 whitespace-nowrap">{row.applicants}</td>
                                                        <td className="px-6 py-3.5 align-middle text-[13px] font-medium text-slate-700 whitespace-nowrap">{row.mode}</td>
                                                        <td className="px-6 py-3.5 align-middle text-[13px] font-medium text-slate-700">
                                                            <div className="max-w-[140px] truncate">{row.eligibility}</div>
                                                        </td>
                                                        <td className="px-6 py-3.5 align-middle text-right whitespace-nowrap">
                                                            <div className="ml-auto inline-flex flex-nowrap items-center justify-end gap-2 whitespace-nowrap">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleShortlist(row)}
                                                                    className={[
                                                                        "inline-flex min-w-[110px] items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-all duration-200 active:scale-95",
                                                                        isShortlisted
                                                                            ? "bg-[#FAD53C] text-black ring-1 ring-black/5 hover:brightness-95"
                                                                            : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800",
                                                                    ].join(" ")}
                                                                >
                                                                    {isShortlisted
                                                                        ? <FaCheckCircle className="h-3.5 w-3.5" />
                                                                        : <FaRegCheckCircle className="h-3.5 w-3.5 text-slate-400" />
                                                                    }
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
                                                                    href={row.detailHref}
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
