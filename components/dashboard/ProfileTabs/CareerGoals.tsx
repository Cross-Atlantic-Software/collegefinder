"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { getCareerGoals, updateCareerGoals, getAllCareerGoalsPublic } from "@/api";
import { Button } from "../../shared";

interface CareerGoalOption {
    id: string;
    label: string;
    logo: string; // Changed from image to logo
}


export default function CareerGoalsTab() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [success, setSuccess] = useState(false);

    const [interestOptions, setInterestOptions] = useState<CareerGoalOption[]>([]);
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

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
                        logo: cg.logo // Changed from image to logo
                    }));
                    setInterestOptions(options);
                }

                // Fetch user's selected interests
                const userResponse = await getCareerGoals();
                if (userResponse.success && userResponse.data) {
                    setSelectedInterests(userResponse.data.interests || []);
                }
            } catch (err) {
                console.error("Error fetching career goals:", err);
                setError("Failed to load career goals data");
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


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setValidationErrors({});
        setSuccess(false);

        try {
            // Convert selected IDs to strings (they should already be strings, but ensure consistency)
            const interests = selectedInterests.map(id => id.toString());
            const response = await updateCareerGoals({
                interests: interests,
            });

            if (response.success) {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            } else {
                // Handle validation errors from backend
                if (response.errors && Array.isArray(response.errors)) {
                    const errors: Record<string, string> = {};
                    response.errors.forEach((err: { param?: string; msg?: string; message?: string }) => {
                        if (err.param) {
                            errors[err.param] = err.msg || err.message || '';
                        }
                    });
                    setValidationErrors(errors);
                } else {
                    setError(response.message || "Failed to update career goals");
                }
            }
        } catch (err) {
            console.error("Error updating career goals:", err);
            setError("An error occurred while updating career goals");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 rounded-md bg-white/10 p-6 text-sm text-slate-200 shadow-sm">
                <div className="flex items-center justify-center py-12">
                    <div className="text-slate-300">Loading career goals data...</div>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 rounded-md bg-white/10 p-6 text-sm text-slate-200 shadow-sm">
            <div className="space-y-5 rounded-md bg-white/5 p-6">
                <h2 className="text-base font-semibold text-pink sm:text-lg">Career Goals</h2>
                <p className="text-sm text-slate-300">Tell us what excites you! This helps us find the perfect matches.</p>

                {error && (
                    <div className="rounded-md bg-red-500/20 border border-red-500/50 px-4 py-3 text-sm text-red-200">
                        {error}
                    </div>
                )}

                {Object.keys(validationErrors).length > 0 && (
                    <div className="rounded-md bg-red-500/20 border border-red-500/50 px-4 py-3 text-sm text-red-200">
                        <ul className="list-disc list-inside space-y-1">
                            {Object.values(validationErrors).map((err, idx) => (
                                <li key={idx}>{err}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {success && (
                    <div className="rounded-md bg-emerald-500/20 border border-emerald-500/50 px-4 py-3 text-sm text-emerald-200">
                        Career goals updated successfully!
                    </div>
                )}

                {/* What excites you */}
                <div className="mt-4 space-y-3">
                    <h3 className="text-sm font-semibold sm:text-lg text-slate-300">What excites you?</h3>
                    <div className="grid gap-4 sm:grid-cols-3">
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
                                            ? "bg-pink text-white border-pink"
                                            : "bg-white/5 border-white/10 hover:bg-white/10",
                                    ].join(" ")}
                                >
                                    <Image
                                        src={opt.logo}
                                        alt={opt.label}
                                        width={60}
                                        height={60}
                                        className="mb-2 h-14 w-14 object-contain sm:h-16 sm:w-16"
                                        priority
                                        unoptimized
                                    />
                                    <span
                                        className={`text-md font-semibold transition duration-500 ${
                                            active ? "text-white" : "text-slate-200 group-hover:text-white"
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

            {/* Actions */}
            <div className="flex flex-col gap-4 sm:flex-row">
                <Button
                    type="submit"
                    variant="DarkGradient"
                    size="md"
                    className="w-full flex-1 rounded-full"
                    disabled={saving}
                >
                    {saving ? "Updating..." : "Update Career Goals"}
                </Button>
            </div>
        </form>
    );
}
