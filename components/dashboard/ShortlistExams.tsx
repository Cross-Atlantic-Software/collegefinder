'use client';

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FiSearch } from "react-icons/fi";
import { MdOutlineArrowOutward, MdSchool } from "react-icons/md";
import { getAllExams, getRecommendedExams, type Exam } from "@/api/exams";
import { ExamApplicationModal } from "./ExamApplicationModal";

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
    detailHref: string;
};

function createRowFromExam(exam: Exam): ExamRow {
    const rowKey = `exam-${exam.id}`;
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
        detailHref: `/dashboard/exams/${exam.id}?from=dashboard-shortlist-recommended`,
    };
}

export default function ShortlistExams() {
    const [selectedExam, setSelectedExam] = useState<{ name: string; id?: string } | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [allExams, setAllExams] = useState<Exam[]>([]);
    const [recommendedIds, setRecommendedIds] = useState<string[]>([]);
    const [emptyHint, setEmptyHint] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const run = async () => {
            setLoading(true);
            setEmptyHint(null);
            const [allRes, recRes] = await Promise.all([getAllExams(), getRecommendedExams()]);
            if (cancelled) return;

            const exams = allRes.success && allRes.data ? allRes.data.exams : [];
            setAllExams(exams);

            if (recRes.success && recRes.data) {
                setRecommendedIds(recRes.data.examIds || []);
                setEmptyHint(recRes.data.message ?? null);
            } else {
                setRecommendedIds([]);
                setEmptyHint(recRes.message || "Could not load recommendations.");
            }

            setLoading(false);
        };

        void run();

        return () => {
            cancelled = true;
        };
    }, []);

    const visibleRows = useMemo(() => {
        if (!recommendedIds.length || !allExams.length) return [];
        const byId = new Map(allExams.map((e) => [String(e.id), e]));
        const rows: ExamRow[] = [];
        for (const id of recommendedIds) {
            const exam = byId.get(id);
            if (exam) rows.push(createRowFromExam(exam));
        }
        return rows;
    }, [recommendedIds, allExams]);

    const openApplication = (row: ExamRow) => {
        setSelectedExam({ name: row.name, id: row.examId });
        setIsModalOpen(true);
    };

    return (
        <div className="w-full min-h-screen bg-[#f5f9ff] text-black">
            <section className="w-full bg-[#f5f9ff]">
                <header className="border-b border-slate-200 bg-white px-4 pt-2 pb-4 md:px-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-3">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FAD53C]/25 text-slate-900">
                                    <FiSearch className="h-4 w-4" />
                                </span>
                                <div>
                                    <p className="text-lg font-semibold text-slate-900">Exam Shortlist</p>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        Recommended exams from your profile stream and interests (admin mapping). Open a row for full details.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="bg-[#f8fbff] p-4 md:p-6">
                    <div className="overflow-hidden rounded-xl bg-white shadow-sm transition-all duration-200">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center px-4 py-16 text-center text-sm font-medium text-slate-500 md:px-6">
                                    <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
                                    Loading recommended exams...
                                </div>
                            ) : visibleRows.length === 0 ? (
                                <div className="flex flex-col items-center justify-center px-4 py-16 text-center md:px-6">
                                    <MdSchool className="mb-3 h-10 w-10 text-slate-200" />
                                    <p className="text-sm font-medium text-slate-500">
                                        {emptyHint || "No recommended exams yet."}
                                    </p>
                                    <p className="mt-1 max-w-md text-xs text-slate-400">
                                        Set your stream and interests under Profile, then ask your team to upload the recommended-exams mapping for those pairs.
                                    </p>
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
                                                return (
                                                    <tr key={row.rowKey} className="group align-middle transition-all duration-200 bg-white hover:bg-slate-50">
                                                        <td className="px-6 py-3.5">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors duration-200 group-hover:bg-[#FAD53C]/20 group-hover:text-black">
                                                                    <MdSchool className="h-4.5 w-4.5" />
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
