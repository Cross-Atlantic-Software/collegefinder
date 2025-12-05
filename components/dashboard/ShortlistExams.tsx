'use client'
import { useState } from "react";
import { BiSearch } from "react-icons/bi";
import { Button } from "../shared";
import ExamBox from "./ExamBox";
import { ExamApplicationModal } from "./ExamApplicationModal";
import { IoFunnel } from "react-icons/io5";

export default function ShortlistExams() {
    const [activeTab, setActiveTab] = useState("recommended");
    const [selectedExam, setSelectedExam] = useState<{ name: string; id?: string } | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <section className="flex items-center gap-2 rounded-md bg-white/10 p-1 pl-4 text-xs text-slate-300 mb-5">
                <BiSearch className="text-xl"/>
                <input
                    placeholder="Search exams, tutorials, colleges..."
                    className="w-full bg-transparent text-[13px] outline-none placeholder:text-slate-500"
                />
                <Button variant="themeButton" size="sm" className="flex rounded-md gap-2"> <IoFunnel /> Filters</Button>
            </section>

            {/* TABS */}
            <div className="flex w-full rounded-md bg-white/10 text-sm font-medium text-slate-300 overflow-hidden mb-5">
                <button
                    onClick={() => setActiveTab("recommended")}
                    className={`flex-1 py-3 text-center transition ${
                        activeTab === "recommended"
                            ? "bg-pink-600 text-white"
                            : "hover:bg-white/5"
                    }`}
                >
                    Recommended Exams
                </button>

                <button
                    onClick={() => setActiveTab("shortlisted")}
                    className={`flex-1 py-3 text-center transition ${
                        activeTab === "shortlisted"
                            ? "bg-pink-600 text-white"
                            : "hover:bg-white/5"
                    }`}
                >
                    Shortlisted Exams
                </button>

                <button
                    onClick={() => setActiveTab("all")}
                    className={`flex-1 py-3 text-center transition ${
                        activeTab === "all"
                            ? "bg-pink-600 text-white"
                            : "hover:bg-white/5"
                    }`}
                >
                    All Available Exams
                </button>
            </div>

            {/* CONTENT */}
            <div className="grid gap-3 grid-cols-1 xl:grid-cols-2">
                {activeTab === "recommended" && (
                    <>
                        <ExamBox
                            title="JEE Main"
                            subtitle="Joint Entrance Examination Main"
                            description="National level exam for admission to NITs, IIITs and other top engineering colleges."
                            isHot
                            matchPercent={98}
                            isRecommended
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
                    onSubmit={async (data) => {
                        // TODO: Implement API call to save exam application with subject breakdown
                        // This will be implemented when backend is ready
                    }}
                />
            )}
        </>
    );
}
