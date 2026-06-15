"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { FiX } from "react-icons/fi";
import { getCareerGoals, updateCareerGoals, getAllCareerGoalsPublic, getAcademics } from "@/api";
import { getAllExams, getExamPreferences, updateExamPreferences } from "@/api/exams";
import { Button, Select, SelectOption, useToast } from "../../shared";

interface CareerGoalOption {
    id: string;
    label: string;
    logo?: string | null;
}

const inputBase = "w-full rounded-xl border border-black/15 bg-[#f8fbff] px-4 py-3 text-sm text-black placeholder:text-black/40 transition focus:outline-none focus:border-[#FAD53C] focus:bg-white";

export default function CareerGoalsTab() {
    const { showSuccess, showError } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [success, setSuccess] = useState(false);

    const [interestOptions, setInterestOptions] = useState<CareerGoalOption[]>([]);
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

    // Exam preferences
    const [examOptions, setExamOptions] = useState<SelectOption[]>([]);
    const [targetExams, setTargetExams] = useState<string[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                
                const acRes = await getAcademics();
                const streamId =
                    acRes.success && acRes.data?.stream_id != null && acRes.data.stream_id > 0
                        ? acRes.data.stream_id
                        : undefined;
                const optionsResponse = await getAllCareerGoalsPublic(streamId);
                if (optionsResponse.success && optionsResponse.data) {
                    const options = optionsResponse.data.careerGoals.map(cg => ({
                        id: cg.id.toString(),
                        label: cg.label,
                        logo: cg.logo
                    }));
                    setInterestOptions(options);
                }

                // Fetch user's selected interests
                const userResponse = await getCareerGoals();
                if (userResponse.success && userResponse.data) {
                    setSelectedInterests(userResponse.data.interests || []);
                }

                // Fetch exam options
                const examsResponse = await getAllExams();
                if (examsResponse.success && examsResponse.data) {
                    const options = examsResponse.data.exams.map(exam => ({
                        value: exam.id.toString(),
                        label: exam.name
                    }));
                    setExamOptions(options);
                }

                // Fetch user's exam preferences
                const examPrefsResponse = await getExamPreferences();
                if (examPrefsResponse.success && examPrefsResponse.data) {
                    setTargetExams(examPrefsResponse.data.target_exams || []);
                }
            } catch (err) {
                console.error("Error fetching data:", err);
                setError("Failed to load data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const toggleInterest = (id: string) => {
        setSelectedInterests((prev) => {
            if (prev.includes(id)) return prev.filter((x) => x !== id);
            if (prev.length >= 3) {
                showError("Select exactly 3 interests. Remove one to pick another.");
                return prev;
            }
            return [...prev, id];
        });
    };

    const handleTargetExamChange = (value: string | null) => {
        if (value && !targetExams.includes(value)) {
            setTargetExams([...targetExams, value]);
        }
    };

    const removeTargetExam = (examId: string) => {
        setTargetExams(targetExams.filter(id => id !== examId));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setValidationErrors({});
        setSuccess(false);

        try {
            if (selectedInterests.length !== 3) {
                const msg = "Please select exactly 3 interests.";
                setValidationErrors({ interests: msg });
                showError(msg);
                setSaving(false);
                return;
            }
            setValidationErrors({});

            // Update career goals
            const interests = selectedInterests.map(id => id.toString());
            const careerGoalsResponse = await updateCareerGoals({
                interests: interests,
            });

            if (!careerGoalsResponse.success) {
                throw new Error(careerGoalsResponse.message || "Failed to update career goals");
            }

            // Update exam preferences (only target exams)
            const examPrefsResponse = await updateExamPreferences({
                target_exams: targetExams,
            });

            if (!examPrefsResponse.success) {
                throw new Error(examPrefsResponse.message || "Failed to update exam preferences");
            }

            setSuccess(true);
            showSuccess("Interests updated successfully!");
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            console.error("Error updating data:", err);
            const errorMessage = err.message || "An error occurred while updating";
            setError(errorMessage);
            showError(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-4 py-4">
                <div className="shimmer-skeleton h-6 w-40 rounded-md" />
                <div className="flex flex-col gap-4">
                    <div className="shimmer-skeleton h-32 w-full rounded-xl" />
                    <div className="shimmer-skeleton h-32 w-full rounded-xl" />
                    <div className="shimmer-skeleton h-32 w-full rounded-xl" />
                </div>
                <div className="shimmer-skeleton h-12 w-full rounded-xl" />
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8 text-sm text-black">
            {/* Interests Section */}
            <div className="space-y-5">
                <div>
                    <h2 className="text-lg font-bold text-black">Interests</h2>
                    <p className="text-sm text-black/50 mt-0.5">
                        Tell us what excites you! Choose exactly three interests — this helps us find the best matches.
                    </p>
                </div>

                {error && (
                    <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                        {error}
                    </div>
                )}

                {Object.keys(validationErrors).length > 0 && (
                    <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                        <ul className="list-disc list-inside space-y-1">
                            {Object.values(validationErrors).map((err, idx) => (
                                <li key={idx}>{err}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {success && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
                        Interests updated successfully!
                    </div>
                )}

                {interestOptions.length > 0 && (
                    <p className="text-xs font-semibold text-black/45">
                        {selectedInterests.length}/3 selected
                    </p>
                )}

                <div className="mt-4">
                    <div className="flex flex-wrap gap-3">
                        {interestOptions.map((opt) => {
                            const active = selectedInterests.includes(opt.id);
                            return (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => toggleInterest(opt.id)}
                                    className={[
                                        "flex items-center gap-3 rounded-full border px-4 py-2 transition duration-300 group",
                                        active
                                            ? "bg-[#FAD53C] text-black border-[#FAD53C] shadow-sm"
                                            : "bg-white border-black/10 hover:border-black/20 hover:bg-slate-50",
                                    ].join(" ")}
                                >
                                    {opt.logo ? (
                                        <Image
                                            src={opt.logo}
                                            alt={opt.label}
                                            width={24}
                                            height={24}
                                            className="h-6 w-6 object-contain shrink-0"
                                            priority
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="h-6 w-6 shrink-0 rounded-full bg-slate-100 flex items-center justify-center">
                                            <span className="text-xs font-bold text-black/50">{opt.label.charAt(0)}</span>
                                        </div>
                                    )}
                                    <span
                                        className={`text-sm font-semibold transition duration-300 ${
                                            active ? "text-black" : "text-slate-700 group-hover:text-black"
                                        }`}
                                    >
                                        {opt.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Target Exams Section */}
            <div className="space-y-5 border-t border-black/8 pt-6">
                <div>
                    <h2 className="text-base font-bold text-black">Target Exams</h2>
                    <p className="text-sm text-black/50 mt-0.5">Select the exams you are planning to appear for.</p>
                </div>

                <div className="mt-4 space-y-3">
                    <Select
                        options={examOptions.filter(opt => !targetExams.includes(opt.value))}
                        value={null}
                        onChange={handleTargetExamChange}
                        placeholder="Select an exam to add"
                        isSearchable={true}
                        isClearable={false}
                    />

                    {targetExams.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {targetExams.map((examId) => {
                                const exam = examOptions.find(opt => opt.value === examId);
                                return exam ? (
                                    <div
                                        key={examId}
                                        className="flex items-center gap-2 rounded-xl bg-[#eaf4ff] border border-black/10 px-3 py-2 text-sm"
                                    >
                                        <span className="text-black/80">{exam.label}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeTargetExam(examId)}
                                            className="text-black/70 hover:text-black transition"
                                        >
                                            <FiX className="h-4 w-4" />
                                        </button>
                                    </div>
                                ) : null;
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col gap-4 sm:flex-row">
                <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="w-full flex-1 !rounded-full border border-black bg-black text-white hover:bg-neutral-900"
                    disabled={saving || selectedInterests.length !== 3}
                >
                    {saving ? "Updating..." : "Update Interests"}
                </Button>
            </div>
        </form>
    );
}

