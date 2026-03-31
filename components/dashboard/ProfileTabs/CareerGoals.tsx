"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { FiX } from "react-icons/fi";
import { getCareerGoals, updateCareerGoals, getAllCareerGoalsPublic } from "@/api";
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
                
                // Fetch available career goal options from taxonomy
                const optionsResponse = await getAllCareerGoalsPublic();
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
        setSelectedInterests((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );
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
                    <p className="text-sm text-black/50 mt-0.5">Tell us what excites you! This helps us find the perfect matches.</p>
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

                {/* What excites you */}
                <div className="mt-4 space-y-3">
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                        {interestOptions.map((opt) => {
                            const active = selectedInterests.includes(opt.id);
                            return (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => toggleInterest(opt.id)}
                                    className={[
                                        "flex flex-col items-center justify-center rounded-md p-5 text-center transition duration-500",
                                        "border group",
                                        active
                                            ? "bg-[#FAD53C] text-black border-[#FAD53C]"
                                            : "bg-white border-black/10 hover:bg-[#eaf4ff]",
                                    ].join(" ")}
                                >
                                    {opt.logo ? (
                                        <Image
                                            src={opt.logo}
                                            alt={opt.label}
                                            width={60}
                                            height={60}
                                            className="mb-2 h-14 w-14 object-contain sm:h-16 sm:w-16"
                                            priority
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="mb-2 h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-white/20 flex items-center justify-center">
                                            <span className="text-lg font-bold text-black/50">{opt.label.charAt(0)}</span>
                                        </div>
                                    )}
                                    <span
                                        className={`text-md font-semibold transition duration-500 ${
                                            active ? "text-black" : "text-black/80 group-hover:text-black"
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
                    disabled={saving}
                >
                    {saving ? "Updating..." : "Update Interests"}
                </Button>
            </div>
        </form>
    );
}

