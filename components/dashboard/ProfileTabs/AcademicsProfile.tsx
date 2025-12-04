"use client";

import { useState, useEffect } from "react";
import { FaChevronDown } from "react-icons/fa6";
import { SubjectInputList } from "../SubjectInputList";
import { getAcademics, updateAcademics } from "@/api";
import { Button } from "../../shared";

const getBarColor = (percent: number) => {
    if (percent >= 85) return "bg-green-500";
    if (percent >= 70) return "bg-amber-400";
    return "bg-red-400";
};

const streamOptions = [
    "PCM",
    "PCB",
    "Commerce",
    "Humanities/Arts",
    "Others"
];

const boardOptions = [
    "CBSE",
    "ICSE",
    "IB",
    "State Board",
    "Other"
];

const inputBase = "w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 placeholder:text-slate-400 transition focus:outline-none focus:border-pink focus:bg-white/10";

export default function AcademicsProfile() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [success, setSuccess] = useState(false);
    const [showSubjectInput, setShowSubjectInput] = useState(false);
    const [isPursuing12th, setIsPursuing12th] = useState(false);

    // Matric (10th) form data
    const [matricData, setMatricData] = useState({
        matric_board: "",
        matric_school_name: "",
        matric_passing_year: "",
        matric_roll_number: "",
        matric_total_marks: "",
        matric_obtained_marks: "",
        matric_percentage: "",
    });

    // Post-Matric (12th) form data
    const [postmatricData, setPostmatricData] = useState({
        postmatric_board: "",
        postmatric_school_name: "",
        postmatric_passing_year: "",
        postmatric_roll_number: "",
        postmatric_total_marks: "",
        postmatric_obtained_marks: "",
        postmatric_percentage: "",
        stream: "",
    });

    const [subjects, setSubjects] = useState<Array<{ name: string; percent: number }>>([]);

    // Calculate percentage when marks change
    useEffect(() => {
        if (matricData.matric_total_marks && matricData.matric_obtained_marks) {
            const total = parseFloat(matricData.matric_total_marks);
            const obtained = parseFloat(matricData.matric_obtained_marks);
            if (!isNaN(total) && !isNaN(obtained) && total > 0) {
                const percentage = ((obtained / total) * 100).toFixed(2);
                setMatricData(prev => ({ ...prev, matric_percentage: percentage }));
            }
        }
    }, [matricData.matric_total_marks, matricData.matric_obtained_marks]);

    useEffect(() => {
        if (postmatricData.postmatric_total_marks && postmatricData.postmatric_obtained_marks) {
            const total = parseFloat(postmatricData.postmatric_total_marks);
            const obtained = parseFloat(postmatricData.postmatric_obtained_marks);
            if (!isNaN(total) && !isNaN(obtained) && total > 0) {
                const percentage = ((obtained / total) * 100).toFixed(2);
                setPostmatricData(prev => ({ ...prev, postmatric_percentage: percentage }));
            }
        }
    }, [postmatricData.postmatric_total_marks, postmatricData.postmatric_obtained_marks]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await getAcademics();
                if (response.success && response.data) {
                    const data = response.data;
                    
                    // Set matric data
                    setMatricData({
                        matric_board: data.matric_board || "",
                        matric_school_name: data.matric_school_name || "",
                        matric_passing_year: data.matric_passing_year?.toString() || "",
                        matric_roll_number: data.matric_roll_number || "",
                        matric_total_marks: data.matric_total_marks?.toString() || "",
                        matric_obtained_marks: data.matric_obtained_marks?.toString() || "",
                        matric_percentage: data.matric_percentage?.toString() || "",
                    });

                    // Set post-matric data
                    setPostmatricData({
                        postmatric_board: data.postmatric_board || "",
                        postmatric_school_name: data.postmatric_school_name || "",
                        postmatric_passing_year: data.postmatric_passing_year?.toString() || "",
                        postmatric_roll_number: data.postmatric_roll_number || "",
                        postmatric_total_marks: data.postmatric_total_marks?.toString() || "",
                        postmatric_obtained_marks: data.postmatric_obtained_marks?.toString() || "",
                        postmatric_percentage: data.postmatric_percentage?.toString() || "",
                        stream: data.stream || "",
                    });

                    setSubjects(data.subjects || []);
                    setShowSubjectInput(data.subjects && data.subjects.length > 0);
                    
                    // Check if pursuing 12th (no passing year means still pursuing)
                    setIsPursuing12th(!data.postmatric_passing_year);
                }
            } catch (err) {
                console.error("Error fetching academics:", err);
                setError("Failed to load academic data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setValidationErrors({});
        setSuccess(false);

        try {
            const payload: any = {};
            
            // Matric fields
            if (matricData.matric_board?.trim()) payload.matric_board = matricData.matric_board.trim();
            if (matricData.matric_school_name?.trim()) payload.matric_school_name = matricData.matric_school_name.trim();
            if (matricData.matric_passing_year?.trim()) {
                const year = parseInt(matricData.matric_passing_year);
                if (!isNaN(year)) payload.matric_passing_year = year;
            }
            if (matricData.matric_roll_number?.trim()) payload.matric_roll_number = matricData.matric_roll_number.trim();
            if (matricData.matric_total_marks?.trim()) {
                const total = parseFloat(matricData.matric_total_marks);
                if (!isNaN(total)) payload.matric_total_marks = total;
            }
            if (matricData.matric_obtained_marks?.trim()) {
                const obtained = parseFloat(matricData.matric_obtained_marks);
                if (!isNaN(obtained)) payload.matric_obtained_marks = obtained;
            }
            if (matricData.matric_percentage?.trim()) {
                const percent = parseFloat(matricData.matric_percentage);
                if (!isNaN(percent)) payload.matric_percentage = percent;
            }

            // Post-Matric fields (only if not pursuing 12th)
            if (!isPursuing12th) {
                if (postmatricData.postmatric_board?.trim()) payload.postmatric_board = postmatricData.postmatric_board.trim();
                if (postmatricData.postmatric_school_name?.trim()) payload.postmatric_school_name = postmatricData.postmatric_school_name.trim();
                if (postmatricData.postmatric_passing_year?.trim()) {
                    const year = parseInt(postmatricData.postmatric_passing_year);
                    if (!isNaN(year)) payload.postmatric_passing_year = year;
                }
                if (postmatricData.postmatric_roll_number?.trim()) payload.postmatric_roll_number = postmatricData.postmatric_roll_number.trim();
                if (postmatricData.postmatric_total_marks?.trim()) {
                    const total = parseFloat(postmatricData.postmatric_total_marks);
                    if (!isNaN(total)) payload.postmatric_total_marks = total;
                }
                if (postmatricData.postmatric_obtained_marks?.trim()) {
                    const obtained = parseFloat(postmatricData.postmatric_obtained_marks);
                    if (!isNaN(obtained)) payload.postmatric_obtained_marks = obtained;
                }
                if (postmatricData.postmatric_percentage?.trim()) {
                    const percent = parseFloat(postmatricData.postmatric_percentage);
                    if (!isNaN(percent)) payload.postmatric_percentage = percent;
                }
            }
            
            // Stream (always include if provided)
            if (postmatricData.stream?.trim()) payload.stream = postmatricData.stream.trim();
            
            // Subjects (for post-matric)
            if (Array.isArray(subjects)) {
                payload.subjects = subjects;
            }

            const response = await updateAcademics(payload);

            if (response.success && response.data) {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            } else {
                if (response.errors && Array.isArray(response.errors)) {
                    const errors: Record<string, string> = {};
                    response.errors.forEach((err: { param?: string; msg?: string; message?: string }) => {
                        if (err.param) {
                            errors[err.param] = err.msg || err.message || "";
                        }
                    });
                    setValidationErrors(errors);
                } else {
                    setError(response.message || "Failed to update academics");
                }
            }
        } catch (err) {
            console.error("Error updating academics:", err);
            setError("An error occurred while updating academics. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 rounded-md bg-white/10 p-6 text-sm text-slate-200 shadow-sm">
                <div className="flex items-center justify-center py-12">
                    <div className="text-slate-300">Loading academic data...</div>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 rounded-md bg-white/10 p-6 text-sm text-slate-200 shadow-sm">
            <h2 className="text-base font-semibold text-pink sm:text-lg">Academic Profile</h2>

            <div className="space-y-6 rounded-md bg-white/5 p-6">
                {error && (
                    <div className="rounded-md bg-red-500/20 border border-red-500/50 px-4 py-3 text-sm text-red-200">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="rounded-md bg-emerald-500/20 border border-emerald-500/50 px-4 py-3 text-sm text-emerald-200">
                        Academics updated successfully!
                    </div>
                )}

                {/* Matric (10th) Section */}
                <section className="rounded-md bg-white/5 p-5 border border-white/10">
                    <h3 className="mb-4 text-lg font-semibold text-slate-50">10th Standard (Matric) Details</h3>
                    
                    <div className="grid gap-4 sm:grid-cols-2">
                        {/* Matric Board */}
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-300">Board</label>
                            <div className="relative">
                                <select
                                    value={matricData.matric_board}
                                    onChange={(e) => setMatricData({ ...matricData, matric_board: e.target.value })}
                                    className={`${inputBase} appearance-none ${validationErrors.matric_board ? 'border-red-500' : ''}`}
                                >
                                    <option value="">Select Board</option>
                                    {boardOptions.map(option => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                                <FaChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
                            </div>
                            {validationErrors.matric_board && (
                                <p className="mt-1 text-xs text-red-400">{validationErrors.matric_board}</p>
                            )}
                        </div>

                        {/* Matric School Name */}
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-300">School Name</label>
                            <input
                                type="text"
                                value={matricData.matric_school_name}
                                onChange={(e) => setMatricData({ ...matricData, matric_school_name: e.target.value })}
                                className={`${inputBase} ${validationErrors.matric_school_name ? 'border-red-500' : ''}`}
                                placeholder="Enter school name"
                            />
                            {validationErrors.matric_school_name && (
                                <p className="mt-1 text-xs text-red-400">{validationErrors.matric_school_name}</p>
                            )}
                        </div>

                        {/* Matric Passing Year */}
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-300">Passing Year</label>
                            <input
                                type="number"
                                min="1950"
                                max={new Date().getFullYear() + 1}
                                value={matricData.matric_passing_year}
                                onChange={(e) => setMatricData({ ...matricData, matric_passing_year: e.target.value })}
                                className={`${inputBase} ${validationErrors.matric_passing_year ? 'border-red-500' : ''}`}
                                placeholder="e.g. 2023"
                            />
                            {validationErrors.matric_passing_year && (
                                <p className="mt-1 text-xs text-red-400">{validationErrors.matric_passing_year}</p>
                            )}
                        </div>

                        {/* Matric Roll Number */}
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-300">Roll Number</label>
                            <input
                                type="text"
                                value={matricData.matric_roll_number}
                                onChange={(e) => setMatricData({ ...matricData, matric_roll_number: e.target.value })}
                                className={`${inputBase} ${validationErrors.matric_roll_number ? 'border-red-500' : ''}`}
                                placeholder="Enter roll number"
                            />
                            {validationErrors.matric_roll_number && (
                                <p className="mt-1 text-xs text-red-400">{validationErrors.matric_roll_number}</p>
                            )}
                        </div>

                        {/* Matric Total Marks */}
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-300">Total Marks</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={matricData.matric_total_marks}
                                onChange={(e) => setMatricData({ ...matricData, matric_total_marks: e.target.value })}
                                className={`${inputBase} ${validationErrors.matric_total_marks ? 'border-red-500' : ''}`}
                                placeholder="e.g. 500"
                            />
                            {validationErrors.matric_total_marks && (
                                <p className="mt-1 text-xs text-red-400">{validationErrors.matric_total_marks}</p>
                            )}
                        </div>

                        {/* Matric Obtained Marks */}
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-300">Obtained Marks</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={matricData.matric_obtained_marks}
                                onChange={(e) => setMatricData({ ...matricData, matric_obtained_marks: e.target.value })}
                                className={`${inputBase} ${validationErrors.matric_obtained_marks ? 'border-red-500' : ''}`}
                                placeholder="e.g. 450"
                            />
                            {validationErrors.matric_obtained_marks && (
                                <p className="mt-1 text-xs text-red-400">{validationErrors.matric_obtained_marks}</p>
                            )}
                        </div>
                    </div>

                    {/* Matric Percentage with Performance Bar */}
                    {matricData.matric_percentage && (
                        <div className="mt-4 rounded-md bg-white/5 px-4 py-3 border border-white/10">
                            <label className="mb-1 block text-sm font-medium text-slate-300">Percentage</label>
                            <p className="text-4xl font-semibold text-emerald-400">{matricData.matric_percentage}%</p>
                            <div className="mt-2 h-2 rounded-full bg-white/10">
                                <div 
                                    className={`h-2 rounded-full ${getBarColor(parseFloat(matricData.matric_percentage))}`} 
                                    style={{ width: `${Math.min(100, parseFloat(matricData.matric_percentage))}%` }} 
                                />
                            </div>
                        </div>
                    )}
                </section>

                {/* Post-Matric (12th) Section */}
                <section className="rounded-md bg-white/5 p-5 border border-white/10">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-50">12th Standard (Post-Matric) Details</h3>
                        <label className="flex items-center gap-2 text-sm text-slate-300">
                            <input
                                type="checkbox"
                                checked={isPursuing12th}
                                onChange={(e) => setIsPursuing12th(e.target.checked)}
                                className="rounded border-white/10 bg-white/5 text-pink focus:ring-pink"
                            />
                            <span>Currently pursuing 12th</span>
                        </label>
                    </div>

                    {!isPursuing12th && (
                        <>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {/* Post-Matric Board */}
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-300">Board</label>
                                    <div className="relative">
                                        <select
                                            value={postmatricData.postmatric_board}
                                            onChange={(e) => setPostmatricData({ ...postmatricData, postmatric_board: e.target.value })}
                                            className={`${inputBase} appearance-none ${validationErrors.postmatric_board ? 'border-red-500' : ''}`}
                                        >
                                            <option value="">Select Board</option>
                                            {boardOptions.map(option => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                        </select>
                                        <FaChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
                                    </div>
                                    {validationErrors.postmatric_board && (
                                        <p className="mt-1 text-xs text-red-400">{validationErrors.postmatric_board}</p>
                                    )}
                                </div>

                                {/* Post-Matric School Name */}
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-300">School Name</label>
                                    <input
                                        type="text"
                                        value={postmatricData.postmatric_school_name}
                                        onChange={(e) => setPostmatricData({ ...postmatricData, postmatric_school_name: e.target.value })}
                                        className={`${inputBase} ${validationErrors.postmatric_school_name ? 'border-red-500' : ''}`}
                                        placeholder="Enter school name"
                                    />
                                    {validationErrors.postmatric_school_name && (
                                        <p className="mt-1 text-xs text-red-400">{validationErrors.postmatric_school_name}</p>
                                    )}
                                </div>

                                {/* Post-Matric Passing Year */}
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-300">Passing Year</label>
                                    <input
                                        type="number"
                                        min="1950"
                                        max={new Date().getFullYear() + 1}
                                        value={postmatricData.postmatric_passing_year}
                                        onChange={(e) => setPostmatricData({ ...postmatricData, postmatric_passing_year: e.target.value })}
                                        className={`${inputBase} ${validationErrors.postmatric_passing_year ? 'border-red-500' : ''}`}
                                        placeholder="e.g. 2025"
                                    />
                                    {validationErrors.postmatric_passing_year && (
                                        <p className="mt-1 text-xs text-red-400">{validationErrors.postmatric_passing_year}</p>
                                    )}
                                </div>

                                {/* Post-Matric Roll Number */}
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-300">Roll Number</label>
                                    <input
                                        type="text"
                                        value={postmatricData.postmatric_roll_number}
                                        onChange={(e) => setPostmatricData({ ...postmatricData, postmatric_roll_number: e.target.value })}
                                        className={`${inputBase} ${validationErrors.postmatric_roll_number ? 'border-red-500' : ''}`}
                                        placeholder="Enter roll number"
                                    />
                                    {validationErrors.postmatric_roll_number && (
                                        <p className="mt-1 text-xs text-red-400">{validationErrors.postmatric_roll_number}</p>
                                    )}
                                </div>

                                {/* Post-Matric Total Marks */}
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-300">Total Marks</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={postmatricData.postmatric_total_marks}
                                        onChange={(e) => setPostmatricData({ ...postmatricData, postmatric_total_marks: e.target.value })}
                                        className={`${inputBase} ${validationErrors.postmatric_total_marks ? 'border-red-500' : ''}`}
                                        placeholder="e.g. 500"
                                    />
                                    {validationErrors.postmatric_total_marks && (
                                        <p className="mt-1 text-xs text-red-400">{validationErrors.postmatric_total_marks}</p>
                                    )}
                                </div>

                                {/* Post-Matric Obtained Marks */}
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-300">Obtained Marks</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={postmatricData.postmatric_obtained_marks}
                                        onChange={(e) => setPostmatricData({ ...postmatricData, postmatric_obtained_marks: e.target.value })}
                                        className={`${inputBase} ${validationErrors.postmatric_obtained_marks ? 'border-red-500' : ''}`}
                                        placeholder="e.g. 450"
                                    />
                                    {validationErrors.postmatric_obtained_marks && (
                                        <p className="mt-1 text-xs text-red-400">{validationErrors.postmatric_obtained_marks}</p>
                                    )}
                                </div>
                            </div>

                            {/* Post-Matric Percentage with Performance Bar */}
                            {postmatricData.postmatric_percentage && (
                                <div className="mt-4 rounded-md bg-white/5 px-4 py-3 border border-white/10">
                                    <label className="mb-1 block text-sm font-medium text-slate-300">Percentage</label>
                                    <p className="text-4xl font-semibold text-emerald-400">{postmatricData.postmatric_percentage}%</p>
                                    <div className="mt-2 h-2 rounded-full bg-white/10">
                                        <div 
                                            className={`h-2 rounded-full ${getBarColor(parseFloat(postmatricData.postmatric_percentage))}`} 
                                            style={{ width: `${Math.min(100, parseFloat(postmatricData.postmatric_percentage))}%` }} 
                                        />
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Stream (always visible) */}
                    <div className="mt-4">
                        <label className="mb-1 block text-sm font-medium text-slate-300">Stream</label>
                        <div className="relative">
                            <select
                                value={postmatricData.stream}
                                onChange={(e) => setPostmatricData({ ...postmatricData, stream: e.target.value })}
                                className={`${inputBase} appearance-none ${validationErrors.stream ? 'border-red-500' : ''}`}
                            >
                                <option value="">Select Stream</option>
                                {streamOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                            <FaChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
                        </div>
                        {validationErrors.stream && (
                            <p className="mt-1 text-xs text-red-400">{validationErrors.stream}</p>
                        )}
                    </div>

                    {/* Subject Breakdown (only if not pursuing 12th) */}
                    {!isPursuing12th && (
                        <div className="mt-6">
                            <h4 className="mb-3 text-base font-semibold text-slate-50">Subject Breakdown</h4>
                            
                            {/* Display existing subjects */}
                            {subjects.length > 0 && (
                                <div className="mb-4 space-y-3">
                                    {subjects.map((subj, index) => (
                                        <div key={index} className="rounded-md border border-white/10 bg-white/5 px-4 py-3">
                                            <p className="mb-1 block text-sm font-medium text-slate-300">{subj.name}</p>
                                            <p className="mt-1 text-2xl font-semibold text-emerald-400">{subj.percent}%</p>
                                            <div className="mt-2 h-2 rounded-full bg-white/10">
                                                <div 
                                                    className={`h-2 rounded-full ${getBarColor(subj.percent)}`} 
                                                    style={{ width: `${subj.percent}%` }} 
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Toggle subject input */}
                            {!showSubjectInput && (
                                <button 
                                    type="button" 
                                    onClick={() => setShowSubjectInput(true)}
                                    className="text-xs font-medium text-pink hover:underline"
                                >
                                    + Add subjects
                                </button>
                            )}

                            {/* Subject Input List */}
                            {showSubjectInput && (
                                <SubjectInputList 
                                    subjects={subjects}
                                    onChange={(newSubjects) => setSubjects(newSubjects)}
                                />
                            )}

                            {validationErrors.subjects && (
                                <p className="mt-1 text-xs text-red-400">{validationErrors.subjects}</p>
                            )}
                        </div>
                    )}
                </section>
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
                    {saving ? "Updating..." : "Update Academics"}
                </Button>
            </div>
        </form>
    );
}
