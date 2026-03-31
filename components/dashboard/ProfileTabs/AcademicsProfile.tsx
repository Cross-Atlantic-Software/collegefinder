"use client";

import { useState, useEffect } from "react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { SubjectInputList } from "../SubjectInputList";
import { getAcademics, updateAcademics, getAllStreamsPublic, type StreamPublic } from "@/api";
import { getAllExams, getExamPreferences, updateExamPreferences, type PreviousExamAttempt } from "@/api/exams";
import { Button, Select, SelectOption, useToast } from "../../shared";
import { getAllStates, getDistrictsForState } from "@/lib/data/indianStatesDistricts";
import DocumentVault from "./DocumentVault";

const getBarColor = (percent: number) => {
    if (percent >= 85) return "bg-green-500";
    if (percent >= 70) return "bg-amber-400";
    return "bg-red-400";
};

// Stream options will be fetched from API

const boardOptions: SelectOption[] = [
    { value: "CBSE", label: "CBSE" },
    { value: "ICSE", label: "ICSE" },
    { value: "IB", label: "IB" },
    { value: "State Board", label: "State Board" },
    { value: "Other", label: "Other" }
];

const inputBase = "w-full rounded-xl border border-black/15 bg-[#f8fbff] px-4 py-3 text-sm text-black placeholder:text-black/40 transition focus:outline-none focus:border-[#FAD53C] focus:bg-white";

export default function AcademicsProfile() {
    const { showSuccess, showError } = useToast();
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
        matric_state: "",
        matric_city: "",
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
        postmatric_state: "",
        postmatric_city: "",
        stream: "",
    });

    // Marks type, CGPA, and result status (separate for matric and postmatric)
    const [matricMarksType, setMatricMarksType] = useState<"Percentage" | "CGPA">("Percentage");
    const [matricCgpa, setMatricCgpa] = useState("");
    const [matricResultStatus, setMatricResultStatus] = useState<"passed" | "failed">("passed");
    const [postmatricMarksType, setPostmatricMarksType] = useState<"Percentage" | "CGPA">("Percentage");
    const [postmatricCgpa, setPostmatricCgpa] = useState("");
    const [postmatricResultStatus, setPostmatricResultStatus] = useState<"passed" | "failed">("passed");

    const [matricSubjects, setMatricSubjects] = useState<Array<{ name: string; percent: number; obtainedMarks?: number; totalMarks?: number }>>([]);
    const [subjects, setSubjects] = useState<Array<{ name: string; percent: number; obtainedMarks?: number; totalMarks?: number }>>([]);
    const [showMatricSubjectInput, setShowMatricSubjectInput] = useState(false);
    
    // Stream options from API
    const [streamOptions, setStreamOptions] = useState<SelectOption[]>([]);
    const [loadingStreams, setLoadingStreams] = useState(true);

    // Exam preferences
    const [examOptions, setExamOptions] = useState<SelectOption[]>([]);
    const [previousAttempts, setPreviousAttempts] = useState<PreviousExamAttempt[]>([]);

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
                if (response.success) {
                    if (response.data) {
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
                            matric_state: data.matric_state || "",
                            matric_city: data.matric_city || "",
                        });

                        // Set post-matric data
                        // Use stream_id if available (convert to string for Select component), otherwise fallback to stream name for backward compatibility
                        const streamValue = data.stream_id 
                            ? data.stream_id.toString() 
                            : (data.stream || "");
                        setPostmatricData({
                            postmatric_board: data.postmatric_board || "",
                            postmatric_school_name: data.postmatric_school_name || "",
                            postmatric_passing_year: data.postmatric_passing_year?.toString() || "",
                            postmatric_roll_number: data.postmatric_roll_number || "",
                            postmatric_total_marks: data.postmatric_total_marks?.toString() || "",
                            postmatric_obtained_marks: data.postmatric_obtained_marks?.toString() || "",
                            postmatric_percentage: data.postmatric_percentage?.toString() || "",
                            postmatric_state: data.postmatric_state || "",
                            postmatric_city: data.postmatric_city || "",
                            stream: streamValue,
                        });

                        // Set marks type, CGPA, and result status (separate for matric and postmatric)
                        setMatricMarksType(data.matric_marks_type === "CGPA" ? "CGPA" : "Percentage");
                        setMatricCgpa(data.matric_cgpa?.toString() || "");
                        setMatricResultStatus(data.matric_result_status === "failed" ? "failed" : "passed");
                        setPostmatricMarksType(data.postmatric_marks_type === "CGPA" ? "CGPA" : "Percentage");
                        setPostmatricCgpa(data.postmatric_cgpa?.toString() || "");
                        setPostmatricResultStatus(data.postmatric_result_status === "failed" ? "failed" : "passed");

                        setMatricSubjects(data.matric_subjects || []);
                        setSubjects(data.subjects || []);
                        // Keep inputs closed on load, even if data exists
                        setShowMatricSubjectInput(false);
                        setShowSubjectInput(false);
                        
                        // Set is_pursuing_12th from API or fallback to checking passing year
                        setIsPursuing12th(data.is_pursuing_12th !== undefined ? data.is_pursuing_12th : !data.postmatric_passing_year);
                    }
                    // If response.data is null, form fields remain empty (default state)
                }

                // Fetch stream options
                const streamsResponse = await getAllStreamsPublic();
                if (streamsResponse.success && streamsResponse.data) {
                    const options = streamsResponse.data.streams.map(stream => ({
                        value: stream.id.toString(),
                        label: stream.name
                    }));
                    setStreamOptions(options);
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
                    setPreviousAttempts(examPrefsResponse.data.previous_attempts || []);
                }
            } catch (err) {
                console.error("Error fetching academics:", err);
                setError("Failed to load academic data");
            } finally {
                setLoading(false);
                setLoadingStreams(false);
            }
        };

        fetchData();
    }, []);

    const addPreviousAttempt = () => {
        setPreviousAttempts([...previousAttempts, { exam_id: 0, year: new Date().getFullYear(), rank: null }]);
    };

    const updatePreviousAttempt = (index: number, field: keyof PreviousExamAttempt, value: string | number | null) => {
        const updated = [...previousAttempts];
        updated[index] = { ...updated[index], [field]: value };
        setPreviousAttempts(updated);
    };

    const removePreviousAttempt = (index: number) => {
        setPreviousAttempts(previousAttempts.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setValidationErrors({});
        setSuccess(false);

        try {
            const payload: Record<string, unknown> = {};
            
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
            if (matricData.matric_state?.trim()) payload.matric_state = matricData.matric_state.trim();
            if (matricData.matric_city?.trim()) payload.matric_city = matricData.matric_city.trim();

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
                if (postmatricData.postmatric_state?.trim()) payload.postmatric_state = postmatricData.postmatric_state.trim();
                if (postmatricData.postmatric_city?.trim()) payload.postmatric_city = postmatricData.postmatric_city.trim();
            }
            
            // Marks type, CGPA, and result status (separate for matric and postmatric)
            payload.matric_marks_type = matricMarksType;
            if (matricMarksType === "CGPA" && matricCgpa?.trim()) {
                const cgpaValue = parseFloat(matricCgpa);
                if (!isNaN(cgpaValue)) payload.matric_cgpa = cgpaValue;
            }
            payload.matric_result_status = matricResultStatus;
            
            if (!isPursuing12th) {
                payload.postmatric_marks_type = postmatricMarksType;
                if (postmatricMarksType === "CGPA" && postmatricCgpa?.trim()) {
                    const cgpaValue = parseFloat(postmatricCgpa);
                    if (!isNaN(cgpaValue)) payload.postmatric_cgpa = cgpaValue;
                }
                payload.postmatric_result_status = postmatricResultStatus;
            }
            
            // Stream (use stream_id if available, otherwise fallback to stream name for backward compatibility)
            if (postmatricData.stream?.trim()) {
                const streamId = parseInt(postmatricData.stream);
                if (!isNaN(streamId) && streamId > 0) {
                    payload.stream_id = streamId;
                } else {
                    // Fallback to stream name for backward compatibility
                    payload.stream = postmatricData.stream.trim();
                }
            }
            
            // Matric Subjects (for 10th)
            if (Array.isArray(matricSubjects)) {
                payload.matric_subjects = matricSubjects;
            }
            
            // Subjects (for post-matric)
            if (Array.isArray(subjects)) {
                payload.subjects = subjects;
            }
            
            // Include is_pursuing_12th
            payload.is_pursuing_12th = isPursuing12th;

            const response = await updateAcademics(payload);

            if (response.success && response.data) {
                // Also update exam preferences (previous attempts)
                await updateExamPreferences({
                    previous_attempts: previousAttempts.filter(attempt => attempt.exam_id > 0 && attempt.year > 0),
                });

                setSuccess(true);
                showSuccess("Academics updated successfully!");
                setTimeout(() => setSuccess(false), 3000);
                
                // Close subject inputs after save
                setShowMatricSubjectInput(false);
                setShowSubjectInput(false);
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
                    const errorMessage = response.message || "Failed to update academics";
                    setError(errorMessage);
                    showError(errorMessage);
                }
            }
        } catch (err) {
            console.error("Error updating academics:", err);
            const errorMessage = "An error occurred while updating academics. Please try again.";
            setError(errorMessage);
            showError(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    if (loading || loadingStreams) {
        return (
            <div className="space-y-4 py-4">
                <div className="shimmer-skeleton h-6 w-52 rounded-md" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                    <div className="shimmer-skeleton h-12 w-full rounded-xl" />
                    <div className="shimmer-skeleton h-12 w-full rounded-xl" />
                    <div className="shimmer-skeleton h-12 w-full rounded-xl" />
                    <div className="shimmer-skeleton h-12 w-full rounded-xl" />
                </div>
                <div className="shimmer-skeleton h-40 w-full rounded-xl" />
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8 text-sm text-black">
            <h2 className="text-lg font-bold text-black">Academic Profile</h2>

            <div className="space-y-8">
                {error && (
                    <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
                        Academics updated successfully!
                    </div>
                )}

                {/* Matric (10th) Section */}
                <section className="border-t border-black/8 pt-6">
                    <h3 className="mb-4 text-lg font-semibold text-black">10th Standard (Matric) Details</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                        {/* Matric Board */}
                        <div className="flex items-center gap-2 min-w-0">
                            <label className="shrink-0 text-xs font-semibold text-black/55 w-[90px] text-right">Board</label>
                            <div className="flex-1 min-w-0">
                            <Select
                                options={boardOptions}
                                value={matricData.matric_board}
                                onChange={(value) => setMatricData({ ...matricData, matric_board: value || "" })}
                                placeholder="Select Board"
                                error={validationErrors.matric_board}
                                isSearchable={false}
                                isClearable={false}
                            />
                            </div>
                        </div>

                        {/* Matric School Name */}
                        <div className="flex items-center gap-2 min-w-0">
                            <label className="shrink-0 text-xs font-semibold text-black/55 w-[90px] text-right">School Name</label>
                            <div className="flex-1 min-w-0">
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
                        </div>

                        {/* Matric Passing Year */}
                        <div className="flex items-center gap-2 min-w-0">
                            <label className="shrink-0 text-xs font-semibold text-black/55 w-[90px] text-right">Passing Year</label>
                            <div className="flex-1 min-w-0">
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
                        </div>

                        {/* Matric Roll Number */}
                        <div className="flex items-center gap-2 min-w-0">
                            <label className="shrink-0 text-xs font-semibold text-black/55 w-[90px] text-right">Roll Number</label>
                            <div className="flex-1 min-w-0">
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
                        </div>

                        {/* Matric State */}
                        <div className="flex items-center gap-2 min-w-0">
                            <label className="shrink-0 text-xs font-semibold text-black/55 w-[90px] text-right">State</label>
                            <div className="flex-1 min-w-0">
                            <Select
                                options={getAllStates().map((state) => ({
                                    value: state,
                                    label: state,
                                }))}
                                value={matricData.matric_state}
                                onChange={(value) => {
                                    setMatricData({
                                        ...matricData,
                                        matric_state: value || "",
                                        matric_city: "", // Reset city when state changes
                                    });
                                }}
                                placeholder="Select State"
                                error={validationErrors.matric_state}
                                isSearchable={true}
                                isClearable={true}
                            />
                            </div>
                        </div>

                        {/* Matric City */}
                        <div className="flex items-center gap-2 min-w-0">
                            <label className="shrink-0 text-xs font-semibold text-black/55 w-[90px] text-right">City</label>
                            <div className="flex-1 min-w-0">
                            <Select
                                options={
                                    matricData.matric_state
                                        ? getDistrictsForState(matricData.matric_state).map((city) => ({
                                              value: city,
                                              label: city,
                                          }))
                                        : []
                                }
                                value={matricData.matric_city}
                                onChange={(value) => setMatricData({ ...matricData, matric_city: value || "" })}
                                placeholder={matricData.matric_state ? "Select City" : "Select State first"}
                                error={validationErrors.matric_city}
                                disabled={!matricData.matric_state}
                                isSearchable={true}
                                isClearable={true}
                            />
                            </div>
                        </div>

                        {/* Matric Marks Type */}
                        <div className="flex items-center gap-2 min-w-0">
                            <label className="shrink-0 text-xs font-semibold text-black/55 w-[90px] text-right">Marks Type</label>
                            <div className="flex-1 min-w-0">
                            <Select
                                options={[
                                    { value: "Percentage", label: "Percentage" },
                                    { value: "CGPA", label: "CGPA" }
                                ]}
                                value={matricMarksType}
                                onChange={(value) => {
                                    const newType = (value as "Percentage" | "CGPA") || "Percentage";
                                    setMatricMarksType(newType);
                                    // Clear fields when switching types
                                    if (newType === "CGPA") {
                                        setMatricData({ ...matricData, matric_total_marks: "", matric_obtained_marks: "", matric_percentage: "" });
                                    } else {
                                        setMatricCgpa("");
                                    }
                                }}
                                placeholder="Select Type"
                                isSearchable={false}
                                isClearable={false}
                            />
                            </div>
                        </div>

                        {/* Show Total Marks and Obtained Marks only for Percentage */}
                        {matricMarksType === "Percentage" && (
                            <>
                                {/* Matric Total Marks */}
                                <div className="flex items-center gap-2 min-w-0">
                                    <label className="shrink-0 text-xs font-semibold text-black/55 w-[90px] text-right">Total Marks</label>
                                    <div className="flex-1 min-w-0">
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
                                </div>

                                {/* Matric Obtained Marks */}
                                <div className="flex items-center gap-2 min-w-0">
                                    <label className="shrink-0 text-xs font-semibold text-black/55 w-[90px] text-right">Obtained Marks</label>
                                    <div className="flex-1 min-w-0">
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

                                {/* Percentage Display */}
                                {matricData.matric_percentage && (
                                    <div className="col-span-full rounded-xl bg-[#eaf4ff] px-5 py-4 border border-[#dceeff]">
                                        <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-black/40">Percentage</label>
                                        <p className="text-4xl font-bold text-black">{matricData.matric_percentage}<span className="text-2xl">%</span></p>
                                        <div className="mt-3 h-2 rounded-full bg-white/60 overflow-hidden">
                                            <div 
                                                className={`h-2 rounded-full ${getBarColor(parseFloat(matricData.matric_percentage))}`} 
                                                style={{ width: `${Math.min(100, parseFloat(matricData.matric_percentage))}%` }} 
                                            />
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Show CGPA only for CGPA type */}
                        {matricMarksType === "CGPA" && (
                            <div className="flex items-center gap-2 min-w-0">
                                <label className="shrink-0 text-xs font-semibold text-black/55 w-[90px] text-right">CGPA</label>
                                <div className="flex-1 min-w-0">
                                <input
                                    type="number"
                                    min="0"
                                    max="10"
                                    step="0.01"
                                    value={matricCgpa}
                                    onChange={(e) => setMatricCgpa(e.target.value)}
                                    className={inputBase}
                                    placeholder="e.g. 8.5"
                                />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Matric Result Status */}
                    <div className="mt-4">
                        <div className="flex items-center gap-2 min-w-0">
                            <label className="shrink-0 text-xs font-semibold text-black/55 w-[90px] text-right">Result Status</label>
                            <div className="flex-1 min-w-0">
                            <Select
                                options={[
                                    { value: "passed", label: "Passed" },
                                    { value: "failed", label: "Failed" }
                                ]}
                                value={matricResultStatus}
                                onChange={(value) => setMatricResultStatus((value as "passed" | "failed") || "passed")}
                                placeholder="Select Status"
                                isSearchable={false}
                                isClearable={false}
                            />
                            </div>
                        </div>
                    </div>

                    {/* Matric Subject Breakdown */}
                    <div className="mt-6">
                        <h4 className="mb-3 text-sm font-semibold text-black/70 uppercase tracking-wider">Subject Breakdown</h4>
                        
                        {/* Display existing subjects */}
                        {matricSubjects.length > 0 && (
                            <div className="mb-4 space-y-3">
                                {matricSubjects.map((subj, index) => (
                                    <div key={index} className="rounded-xl bg-[#eaf4ff] border border-[#dceeff] px-4 py-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                                <p className="mb-1 block text-sm font-medium text-black/70">{subj.name}</p>
                                                <p className="mt-1 text-2xl font-bold text-black">{subj.percent}%</p>
                                                <div className="mt-2 h-1.5 rounded-full bg-white/60 overflow-hidden">
                                                    <div 
                                                        className={`h-1.5 rounded-full ${getBarColor(subj.percent)}`} 
                                                        style={{ width: `${subj.percent}%` }} 
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowMatricSubjectInput(true);
                                                        // Pre-select this subject for editing in the input list
                                                        // The SubjectInputList will handle the editing
                                                    }}
                                                    className="p-1.5 text-blue-400 hover:text-blue-300 transition-colors"
                                                    title="Edit subject"
                                                >
                                                    <FiEdit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const updated = matricSubjects.filter((_, i) => i !== index);
                                                        setMatricSubjects(updated);
                                                    }}
                                                    className="p-1.5 text-red-400 hover:text-red-300 transition-colors"
                                                    title="Delete subject"
                                                >
                                                    <FiTrash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Toggle subject input */}
                        {!showMatricSubjectInput && (
                            <button 
                                type="button" 
                                onClick={() => setShowMatricSubjectInput(true)}
                                className="flex items-center gap-2 text-xs font-medium text-black/60 hover:text-black hover:underline"
                            >
                                {matricSubjects && matricSubjects.length > 0 ? (
                                    <>
                                        <FiEdit2 className="h-3.5 w-3.5" />
                                        Edit Subject
                                    </>
                                ) : (
                                    "+ Add subjects"
                                )}
                            </button>
                        )}

                        {/* Subject Input List */}
                        {showMatricSubjectInput && (
                            <SubjectInputList 
                                subjects={matricSubjects}
                                onChange={(newSubjects) => setMatricSubjects(newSubjects)}
                            />
                        )}

                        {validationErrors.matric_subjects && (
                            <p className="mt-1 text-xs text-red-400">{validationErrors.matric_subjects}</p>
                        )}
                    </div>
                </section>

                {/* Post-Matric (12th) Section */}
                <section className="border-t border-black/8 pt-6">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-base font-bold text-black">12th Standard (Post-Matric) Details</h3>
                        <label className="flex items-center gap-2 text-sm text-black/60">
                            <input
                                type="checkbox"
                                checked={isPursuing12th}
                                onChange={(e) => setIsPursuing12th(e.target.checked)}
                                className="rounded border-black/20 bg-[#eaf4ff] text-black accent-[#FAD53C] focus:ring-[#FAD53C]"
                            />
                            <span>Currently pursuing 12th</span>
                        </label>
                    </div>

                    {!isPursuing12th && (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                                {/* Post-Matric Board */}
                                <div className="flex items-center gap-2 min-w-0">
                                    <label className="shrink-0 text-xs font-semibold text-black/55 w-[90px] text-right">Board</label>
                                    <div className="flex-1 min-w-0">
                                    <Select
                                        options={boardOptions}
                                        value={postmatricData.postmatric_board}
                                        onChange={(value) => setPostmatricData({ ...postmatricData, postmatric_board: value || "" })}
                                        placeholder="Select Board"
                                        error={validationErrors.postmatric_board}
                                        isSearchable={false}
                                        isClearable={false}
                                    />
                                    </div>
                                </div>

                                {/* Post-Matric School Name */}
                                <div className="flex items-center gap-2 min-w-0">
                                    <label className="shrink-0 text-xs font-semibold text-black/55 w-[90px] text-right">School Name</label>
                                    <div className="flex-1 min-w-0">
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
                                </div>

                                {/* Post-Matric Passing Year */}
                                <div className="flex items-center gap-2 min-w-0">
                                    <label className="shrink-0 text-xs font-semibold text-black/55 w-[90px] text-right">Passing Year</label>
                                    <div className="flex-1 min-w-0">
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
                                </div>

                                {/* Post-Matric Roll Number */}
                                <div className="flex items-center gap-2 min-w-0">
                                    <label className="shrink-0 text-xs font-semibold text-black/55 w-[90px] text-right">Roll Number</label>
                                    <div className="flex-1 min-w-0">
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
                                </div>

                                {/* Post-Matric State */}
                                <div className="flex items-center gap-2 min-w-0">
                                    <label className="shrink-0 text-xs font-semibold text-black/55 w-[90px] text-right">State</label>
                                    <div className="flex-1 min-w-0">
                                    <Select
                                        options={getAllStates().map((state) => ({
                                            value: state,
                                            label: state,
                                        }))}
                                        value={postmatricData.postmatric_state}
                                        onChange={(value) => {
                                            setPostmatricData({
                                                ...postmatricData,
                                                postmatric_state: value || "",
                                                postmatric_city: "", // Reset city when state changes
                                            });
                                        }}
                                        placeholder="Select State"
                                        error={validationErrors.postmatric_state}
                                        isSearchable={true}
                                        isClearable={true}
                                    />
                                    </div>
                                </div>

                                {/* Post-Matric City */}
                                <div className="flex items-center gap-2 min-w-0">
                                    <label className="shrink-0 text-xs font-semibold text-black/55 w-[90px] text-right">City</label>
                                    <div className="flex-1 min-w-0">
                                    <Select
                                        options={
                                            postmatricData.postmatric_state
                                                ? getDistrictsForState(postmatricData.postmatric_state).map((city) => ({
                                                      value: city,
                                                      label: city,
                                                  }))
                                                : []
                                        }
                                        value={postmatricData.postmatric_city}
                                        onChange={(value) => setPostmatricData({ ...postmatricData, postmatric_city: value || "" })}
                                        placeholder={postmatricData.postmatric_state ? "Select City" : "Select State first"}
                                        error={validationErrors.postmatric_city}
                                        disabled={!postmatricData.postmatric_state}
                                        isSearchable={true}
                                        isClearable={true}
                                    />
                                    </div>
                                </div>

                                {/* Post-Matric Marks Type */}
                                <div className="flex items-center gap-2 min-w-0">
                                    <label className="shrink-0 text-xs font-semibold text-black/55 w-[90px] text-right">Marks Type</label>
                                    <div className="flex-1 min-w-0">
                                    <Select
                                        options={[
                                            { value: "Percentage", label: "Percentage" },
                                            { value: "CGPA", label: "CGPA" }
                                        ]}
                                        value={postmatricMarksType}
                                        onChange={(value) => {
                                            const newType = (value as "Percentage" | "CGPA") || "Percentage";
                                            setPostmatricMarksType(newType);
                                            // Clear fields when switching types
                                            if (newType === "CGPA") {
                                                setPostmatricData({ ...postmatricData, postmatric_total_marks: "", postmatric_obtained_marks: "", postmatric_percentage: "" });
                                            } else {
                                                setPostmatricCgpa("");
                                            }
                                        }}
                                        placeholder="Select Type"
                                        isSearchable={false}
                                        isClearable={false}
                                    />
                                    </div>
                                </div>

                                {/* Show Total Marks and Obtained Marks only for Percentage */}
                                {postmatricMarksType === "Percentage" && (
                                    <>
                                        {/* Post-Matric Total Marks */}
                                        <div className="flex items-center gap-2 min-w-0">
                                            <label className="shrink-0 text-xs font-semibold text-black/55 w-[90px] text-right">Total Marks</label>
                                            <div className="flex-1 min-w-0">
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
                                        </div>

                                        {/* Post-Matric Obtained Marks */}
                                        <div className="flex items-center gap-2 min-w-0">
                                            <label className="shrink-0 text-xs font-semibold text-black/55 w-[90px] text-right">Obtained Marks</label>
                                            <div className="flex-1 min-w-0">
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

                                        {/* Percentage Display */}
                                        {postmatricData.postmatric_percentage && (
                                            <div className="col-span-full rounded-xl bg-[#eaf4ff] px-5 py-4 border border-[#dceeff]">
                                                <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-black/40">Percentage</label>
                                                <p className="text-4xl font-bold text-black">{postmatricData.postmatric_percentage}<span className="text-2xl">%</span></p>
                                                <div className="mt-3 h-2 rounded-full bg-white/60 overflow-hidden">
                                                    <div 
                                                        className={`h-2 rounded-full ${getBarColor(parseFloat(postmatricData.postmatric_percentage))}`} 
                                                        style={{ width: `${Math.min(100, parseFloat(postmatricData.postmatric_percentage))}%` }} 
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Show CGPA only for CGPA type */}
                                {postmatricMarksType === "CGPA" && (
                                    <div className="flex items-center gap-2 min-w-0">
                                        <label className="shrink-0 text-xs font-semibold text-black/55 w-[90px] text-right">CGPA</label>
                                        <div className="flex-1 min-w-0">
                                        <input
                                            type="number"
                                            min="0"
                                            max="10"
                                            step="0.01"
                                            value={postmatricCgpa}
                                            onChange={(e) => setPostmatricCgpa(e.target.value)}
                                            className={inputBase}
                                            placeholder="e.g. 8.5"
                                        />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Post-Matric Result Status */}
                            <div className="mt-4">
                                <div className="flex items-center gap-2 min-w-0">
                                    <label className="shrink-0 text-xs font-semibold text-black/55 w-[90px] text-right">Result Status</label>
                                    <div className="flex-1 min-w-0">
                                    <Select
                                        options={[
                                            { value: "passed", label: "Passed" },
                                            { value: "failed", label: "Failed" }
                                        ]}
                                        value={postmatricResultStatus}
                                        onChange={(value) => setPostmatricResultStatus((value as "passed" | "failed") || "passed")}
                                        placeholder="Select Status"
                                        isSearchable={false}
                                        isClearable={false}
                                    />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Stream (always visible) */}
                    <div className="mt-4 relative z-10">
                        <label className="mb-1 block text-sm font-medium text-black/70">Stream</label>
                        {loadingStreams ? (
                            <div className="shimmer-skeleton h-11 w-full rounded-xl" />
                        ) : streamOptions.length === 0 ? (
                            <div className="w-full rounded-md border border-yellow-500/50 bg-yellow-500/10 px-3 py-3 text-sm text-yellow-400">
                                No active streams found. Please add streams in the admin panel.
                            </div>
                        ) : (
                            <Select
                                options={streamOptions}
                                value={postmatricData.stream}
                                onChange={(value) => {
                                    setPostmatricData({ ...postmatricData, stream: value || "" });
                                }}
                                placeholder="Select Stream"
                                error={validationErrors.stream || validationErrors.stream_id}
                                isSearchable={true}
                                isClearable={true}
                            />
                        )}
                        {(validationErrors.stream || validationErrors.stream_id) && (
                            <p className="mt-1 text-xs text-red-400">{validationErrors.stream || validationErrors.stream_id}</p>
                        )}
                    </div>

                    {/* Subject Breakdown (only if not pursuing 12th) */}
                    {!isPursuing12th && (
                        <div className="mt-6">
                            <h4 className="mb-3 text-sm font-semibold text-black/70 uppercase tracking-wider">Subject Breakdown</h4>
                            
                            {/* Display existing subjects */}
                            {subjects.length > 0 && (
                                <div className="mb-4 space-y-3">
                                    {subjects.map((subj, index) => (
                                        <div key={index} className="rounded-xl bg-[#eaf4ff] border border-[#dceeff] px-4 py-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1">
                                                    <p className="mb-1 block text-sm font-medium text-black/70">{subj.name}</p>
                                                    <p className="mt-1 text-2xl font-bold text-black">{subj.percent}%</p>
                                                    <div className="mt-2 h-1.5 rounded-full bg-white/60 overflow-hidden">
                                                        <div 
                                                            className={`h-1.5 rounded-full ${getBarColor(subj.percent)}`} 
                                                            style={{ width: `${subj.percent}%` }} 
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setShowSubjectInput(true);
                                                            // Pre-select this subject for editing in the input list
                                                            // The SubjectInputList will handle the editing
                                                        }}
                                                        className="p-1.5 text-blue-400 hover:text-blue-300 transition-colors"
                                                        title="Edit subject"
                                                    >
                                                        <FiEdit2 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const updated = subjects.filter((_, i) => i !== index);
                                                            setSubjects(updated);
                                                        }}
                                                        className="p-1.5 text-red-400 hover:text-red-300 transition-colors"
                                                        title="Delete subject"
                                                    >
                                                        <FiTrash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
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
                                    className="flex items-center gap-2 text-xs font-medium text-black/60 hover:text-black hover:underline"
                                >
                                    {subjects && subjects.length > 0 ? (
                                        <>
                                            <FiEdit2 className="h-3.5 w-3.5" />
                                            Edit Subject
                                        </>
                                    ) : (
                                        "+ Add subjects"
                                    )}
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

            {/* Previous Exam Attempts Section */}
            <div className="space-y-5 border-t border-black/8 pt-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-bold text-black">Previous Exam Attempts</h2>
                        <p className="text-sm text-black/50">Add your previous exam attempts (if any).</p>
                    </div>
                    <Button
                        type="button"
                        variant="themeButton"
                        size="sm"
                        onClick={addPreviousAttempt}
                    >
                        + Add Attempt
                    </Button>
                </div>

                {previousAttempts.length > 0 && (
                    <div className="mt-4 space-y-4">
                        {previousAttempts.map((attempt, index) => (
                            <div key={index} className="rounded-2xl border border-[#dceeff] bg-[#eaf4ff] p-4 space-y-3">
                                <div className="grid gap-3 sm:grid-cols-3">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <label className="shrink-0 text-xs font-semibold text-black/55 w-[90px] text-right">Exam Name</label>
                                        <div className="flex-1 min-w-0">
                                        <Select
                                            options={examOptions}
                                            value={attempt.exam_id > 0 ? attempt.exam_id.toString() : null}
                                            onChange={(value) => updatePreviousAttempt(index, 'exam_id', value ? parseInt(value) : 0)}
                                            placeholder="Select exam"
                                            isSearchable={true}
                                            isClearable={false}
                                        />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 min-w-0">
                                        <label className="shrink-0 text-xs font-semibold text-black/55 w-[90px] text-right">Year</label>
                                        <div className="flex-1 min-w-0">
                                        <input
                                            type="number"
                                            value={attempt.year || ''}
                                            onChange={(e) => updatePreviousAttempt(index, 'year', parseInt(e.target.value) || new Date().getFullYear())}
                                            placeholder="2023"
                                            min="2000"
                                            max={new Date().getFullYear()}
                                            className={inputBase}
                                        />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 min-w-0">
                                        <label className="shrink-0 text-xs font-semibold text-black/55 w-[90px] text-right">Rank (Optional)</label>
                                        <div className="flex-1 min-w-0">
                                        <input
                                            type="number"
                                            value={attempt.rank || ''}
                                            onChange={(e) => updatePreviousAttempt(index, 'rank', e.target.value ? parseInt(e.target.value) : null)}
                                            placeholder="Enter rank"
                                            min="1"
                                            className={inputBase}
                                        />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => removePreviousAttempt(index)}
                                        className="text-xs text-red-400 hover:text-red-300 transition"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Document Vault Section */}
            <div className="space-y-5 border-t border-black/8 pt-6">
                <div>
                    <h2 className="text-base font-bold text-black">Document Vault</h2>
                    <p className="text-sm text-black/50">Upload and manage your documents securely.</p>
                </div>
                <DocumentVault />
            </div>

            {/* Actions */}
            <div className="pt-4 flex flex-col gap-4 sm:flex-row">
                <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="w-full flex-1 !rounded-full border border-black bg-black text-white hover:bg-neutral-900"
                    disabled={saving}
                >
                    {saving ? "Updating..." : "Update Academics"}
                </Button>
            </div>
        </form>
    );
}

