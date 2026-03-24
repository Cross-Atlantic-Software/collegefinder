'use client';

import { useState, useEffect, useMemo } from "react";
import ExamBox from "./ExamBox";
import { ExamApplicationModal } from "./ExamApplicationModal";
import { getRecommendedExams, getAllExams, type Exam } from "@/api/exams";

export default function ShortlistExams() {
    const [activeTab, setActiveTab] = useState("recommended");
    const [selectedExam, setSelectedExam] = useState<{ name: string; id?: string } | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [recommendedIds, setRecommendedIds] = useState<string[]>([]);
    const [allExams, setAllExams] = useState<Exam[]>([]);
    const [loadingRecommended, setLoadingRecommended] = useState(false);
    const [recommendedMessage, setRecommendedMessage] = useState<string | null>(null);

    const recommendedExams = useMemo(() => {
        if (recommendedIds.length === 0) return [];
        return allExams.filter((e) => recommendedIds.includes(String(e.id)));
    }, [recommendedIds, allExams]);

    useEffect(() => {
        if (activeTab !== "recommended") return;
        let cancelled = false;
        void Promise.resolve().then(() => {
            if (!cancelled) {
                setLoadingRecommended(true);
                setRecommendedMessage(null);
            }
        });
        Promise.all([getRecommendedExams(), getAllExams()])
            .then(([recRes, allRes]) => {
                if (cancelled) return;
                if (recRes.success && recRes.data) {
                    setRecommendedIds(recRes.data.examIds ?? []);
                    if (recRes.data.message) setRecommendedMessage(recRes.data.message);
                } else {
                    setRecommendedIds([]);
                }
                if (allRes.success && allRes.data) {
                    setAllExams(allRes.data.exams ?? []);
                }
            })
            .catch(() => {
                if (!cancelled) setRecommendedIds([]);
            })
            .finally(() => {
                if (!cancelled) setLoadingRecommended(false);
            });
        return () => { cancelled = true; };
    }, [activeTab]);

    return (
        <>
            {/* TABS */}
            <div className="flex w-full border-b border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-600 dark:text-slate-400 overflow-x-auto mb-6 gap-4">
                <button
                    onClick={() => setActiveTab("recommended")}
                    className={`px-4 py-3 text-center transition-all duration-250 border-b-2 whitespace-nowrap ${
                        activeTab === "recommended"
                            ? "text-action-700 dark:text-action-500 border-b-action-600 dark:border-b-action-500"
                            : "border-b-transparent hover:text-slate-900 dark:hover:text-slate-300"
                    }`}
                >
                    Recommended Exams
                </button>

                <button
                    onClick={() => setActiveTab("shortlisted")}
                    className={`px-4 py-3 text-center transition-all duration-250 border-b-2 whitespace-nowrap ${
                        activeTab === "shortlisted"
                            ? "text-action-700 dark:text-action-500 border-b-action-600 dark:border-b-action-500"
                            : "border-b-transparent hover:text-slate-900 dark:hover:text-slate-300"
                    }`}
                >
                    Shortlisted Exams
                </button>

                <button
                    onClick={() => setActiveTab("all")}
                    className={`px-4 py-3 text-center transition-all duration-250 border-b-2 whitespace-nowrap ${
                        activeTab === "all"
                            ? "text-action-700 dark:text-action-500 border-b-action-600 dark:border-b-action-500"
                            : "border-b-transparent hover:text-slate-900 dark:hover:text-slate-300"
                    }`}
                >
                    All Available Exams
                </button>
            </div>

            {/* CONTENT */}
            <div className="grid gap-4 grid-cols-1 xl:grid-cols-2 animate-fade-in">
                {activeTab === "recommended" && (
                    <>
                        {loadingRecommended && (
                            <div className="col-span-full py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                                Loading recommended exams…
                            </div>
                        )}
                        {!loadingRecommended && recommendedExams.length === 0 && (
                            <div className="col-span-full py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                                {recommendedMessage || "No recommended exams. Complete your profile (stream & interests) to get personalized recommendations."}
                            </div>
                        )}
                        {!loadingRecommended &&
                            recommendedExams.map((exam) => (
                                <ExamBox
                                    key={exam.id}
                                    title={exam.name}
                                    subtitle={exam.code}
                                    description={exam.description || ""}
                                    isRecommended
                                    dateLabel="–"
                                    feeLabel="–"
                                    collegesCount="–"
                                    difficulty="–"
                                    applicants="–"
                                    mode="–"
                                    eligibility="–"
                                    onApply={() => {
                                        setSelectedExam({ name: exam.name, id: String(exam.id) });
                                        setIsModalOpen(true);
                                    }}
                                />
                            ))}
                    </>
                )}

                {activeTab === "shortlisted" && (
                    <>
                        <ExamBox
                            title="JEE Main"
                            subtitle="Joint Entrance Examination Main"
                            description="National level exam for admission to NITs, IIITs."
                            isHot
                            dateLabel="Jan 2026"
                            feeLabel="₹1,000"
                            collegesCount={1500}
                            difficulty="High"
                            applicants="12 Lakh"
                            mode="Online"
                            eligibility="12th PCM with 75%"
                            shortlisted
                            onApply={() => {
                                setSelectedExam({ name: "JEE Main", id: "jee-main" });
                                setIsModalOpen(true);
                            }}
                        />
                    </>
                )}

                {activeTab === "all" && (
                    <>
                        <ExamBox
                            title="JEE Main"
                            subtitle="Joint Entrance Examination Main"
                            description="National level exam for admission to NITs."
                            isHot
                            matchPercent={98}
                            dateLabel="Jan 2026"
                            feeLabel="₹1,000"
                            collegesCount={1500}
                            difficulty="High"
                            applicants="12 Lakh"
                            mode="Online"
                            eligibility="12th PCM with 75%"
                            onApply={() => {
                                setSelectedExam({ name: "JEE Main", id: "jee-main" });
                                setIsModalOpen(true);
                            }}
                        />

                        <ExamBox
                            title="NEET"
                            subtitle="Medical Entrance"
                            description="Required for MBBS, BDS and other medical courses."
                            dateLabel="May 2026"
                            feeLabel="₹1,700"
                            collegesCount={600}
                            difficulty="High"
                            applicants="20 Lakh"
                            mode="Offline"
                            eligibility="12th PCB with 50%"
                            onApply={() => {
                                setSelectedExam({ name: "NEET", id: "neet" });
                                setIsModalOpen(true);
                            }}
                        />
                    </>
                )}
            </div>

            {/* Exam Application Modal */}
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
                        // TODO: Implement API call to save exam application with subject breakdown
                        // This will be implemented when backend is ready
                    }}
                />
            )}
        </>
    );
}
