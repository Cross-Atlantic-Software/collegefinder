"use client";

import { useState, useEffect, useRef } from "react";
import { Button, Select } from "../shared";
import { getAllSubjectsPublic, type SubjectPublic } from "@/api";

type SubjectRow = {
    id: number;
    subject_id: number | null;
    name: string;
    obtainedMarks: string;
    totalMarks: string;
};

type SubjectInputListProps = {
    subjects?: Array<{ subject_id?: number; name: string; percent: number; obtainedMarks?: number; totalMarks?: number }>;
    onChange?: (subjects: Array<{ subject_id?: number; name: string; percent: number; obtainedMarks?: number; totalMarks?: number }>) => void;
};

export function SubjectInputList({ subjects = [], onChange }: SubjectInputListProps) {
    const [rows, setRows] = useState<SubjectRow[]>([]);
    const [availableSubjects, setAvailableSubjects] = useState<SubjectPublic[]>([]);
    const [loadingSubjects, setLoadingSubjects] = useState(true);
    const isInternalUpdate = useRef(false);
    const prevSubjectsRef = useRef<string>("");

    // Fetch available subjects from database
    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                setLoadingSubjects(true);
                const response = await getAllSubjectsPublic();
                console.log('Subjects API response:', response);
                if (response.success && response.data) {
                    console.log('Subjects data:', response.data.subjects);
                    setAvailableSubjects(response.data.subjects || []);
                } else {
                    console.error('Subjects API error:', response.message);
                }
            } catch (error) {
                console.error('Error fetching subjects:', error);
            } finally {
                setLoadingSubjects(false);
            }
        };
        fetchSubjects();
    }, []);

    // Initialize rows on mount
    useEffect(() => {
        if (subjects && subjects.length > 0) {
            // Load marks if available, otherwise leave empty
            setRows(
                subjects.map((subj, index) => ({
                    id: index + 1,
                    subject_id: subj.subject_id || null,
                    name: subj.name || "",
                    obtainedMarks: subj.obtainedMarks?.toString() || "",
                    totalMarks: subj.totalMarks?.toString() || "",
                }))
            );
            prevSubjectsRef.current = JSON.stringify(subjects);
        } else if (rows.length === 0) {
            setRows([{ id: 1, subject_id: null, name: "", obtainedMarks: "", totalMarks: "" }]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run on mount

    // Sync with external changes (like after save)
    useEffect(() => {
        if (isInternalUpdate.current) {
            return;
        }
        
        const subjectsKey = JSON.stringify(subjects);
        if (subjectsKey !== prevSubjectsRef.current) {
            if (subjects && subjects.length > 0) {
                setRows(
                    subjects.map((subj, index) => ({
                        id: index + 1,
                        subject_id: subj.subject_id || null,
                        name: subj.name || "",
                        obtainedMarks: subj.obtainedMarks?.toString() || "",
                        totalMarks: subj.totalMarks?.toString() || "",
                    }))
                );
            }
            prevSubjectsRef.current = subjectsKey;
        }
    }, [subjects]);

    const calculatePercentage = (obtained: string, total: string): number => {
        const obtainedNum = parseFloat(obtained);
        const totalNum = parseFloat(total);
        if (isNaN(obtainedNum) || isNaN(totalNum) || totalNum === 0) {
            return 0;
        }
        return (obtainedNum / totalNum) * 100;
    };

    const handleChange = (
        id: number,
        field: "subject_id" | "name" | "obtainedMarks" | "totalMarks",
        value: string | number | null,
    ) => {
        // Mark as internal update to prevent useEffect from resetting
        isInternalUpdate.current = true;
        
        const updatedRows = rows.map((row) => {
            if (row.id === id) {
                const updated = { ...row, [field]: value };
                // If subject_id is selected, update the name from available subjects
                if (field === "subject_id" && value) {
                    const selectedSubject = availableSubjects.find(s => s.id === Number(value));
                    if (selectedSubject) {
                        updated.name = selectedSubject.name;
                    }
                }
                // Auto-calculate percentage if marks are provided (calculated on the fly when rendering)
                return updated;
            }
            return row;
        });
        setRows(updatedRows);
        
        // Convert to format expected by backend (calculate percentage from marks)
        const formattedSubjects = updatedRows
            .filter((row) => {
                const hasSubject = row.subject_id !== null;
                const hasMarks = row.obtainedMarks.trim() && row.totalMarks.trim();
                if (!hasSubject || !hasMarks) return false;
                
                // Validate: total marks must be >= obtained marks
                const obtainedNum = parseFloat(row.obtainedMarks);
                const totalNum = parseFloat(row.totalMarks);
                return !isNaN(obtainedNum) && !isNaN(totalNum) && totalNum > 0 && totalNum >= obtainedNum;
            })
            .map((row) => {
                const obtainedMarksNum = parseFloat(row.obtainedMarks);
                const totalMarksNum = parseFloat(row.totalMarks);
                const percent = calculatePercentage(row.obtainedMarks, row.totalMarks);
                return {
                    subject_id: row.subject_id || undefined,
                    name: row.name.trim(),
                    percent: parseFloat(percent.toFixed(2)),
                    obtainedMarks: obtainedMarksNum,
                    totalMarks: totalMarksNum,
                };
            });
        
        onChange?.(formattedSubjects);
        
        // Reset flag after state update completes
        setTimeout(() => {
            isInternalUpdate.current = false;
        }, 0);
    };

    const addRow = () => {
        // Mark as internal update to prevent useEffect from resetting
        isInternalUpdate.current = true;
        
        const newId = rows.length > 0 ? Math.max(...rows.map(r => r.id)) + 1 : 1;
        const updatedRows = [...rows, { id: newId, subject_id: null, name: "", obtainedMarks: "", totalMarks: "" }];
        setRows(updatedRows);
        
        // Notify parent (empty row won't be included in formatted subjects)
        const formattedSubjects = updatedRows
            .filter((row) => {
                const hasSubject = row.subject_id !== null;
                const hasMarks = row.obtainedMarks.trim() && row.totalMarks.trim();
                if (!hasSubject || !hasMarks) return false;
                
                // Validate: total marks must be >= obtained marks
                const obtainedNum = parseFloat(row.obtainedMarks);
                const totalNum = parseFloat(row.totalMarks);
                return !isNaN(obtainedNum) && !isNaN(totalNum) && totalNum > 0 && totalNum >= obtainedNum;
            })
            .map((row) => {
                const obtainedMarksNum = parseFloat(row.obtainedMarks);
                const totalMarksNum = parseFloat(row.totalMarks);
                const percent = calculatePercentage(row.obtainedMarks, row.totalMarks);
                return {
                    subject_id: row.subject_id || undefined,
                    name: row.name.trim(),
                    percent: parseFloat(percent.toFixed(2)),
                    obtainedMarks: obtainedMarksNum,
                    totalMarks: totalMarksNum,
                };
            });
        
        onChange?.(formattedSubjects);
        
        // Reset flag after state update completes
        setTimeout(() => {
            isInternalUpdate.current = false;
        }, 0);
    };

    const removeRow = (id: number) => {
        // Mark as internal update to prevent useEffect from resetting
        isInternalUpdate.current = true;
        
        const updatedRows = rows.filter((row) => row.id !== id);
        setRows(updatedRows);
        
        // Notify parent of changes
        const formattedSubjects = updatedRows
            .filter((row) => {
                const hasSubject = row.subject_id !== null;
                const hasMarks = row.obtainedMarks.trim() && row.totalMarks.trim();
                if (!hasSubject || !hasMarks) return false;
                
                // Validate: total marks must be >= obtained marks
                const obtainedNum = parseFloat(row.obtainedMarks);
                const totalNum = parseFloat(row.totalMarks);
                return !isNaN(obtainedNum) && !isNaN(totalNum) && totalNum > 0 && totalNum >= obtainedNum;
            })
            .map((row) => {
                const obtainedMarksNum = parseFloat(row.obtainedMarks);
                const totalMarksNum = parseFloat(row.totalMarks);
                const percent = calculatePercentage(row.obtainedMarks, row.totalMarks);
                return {
                    subject_id: row.subject_id || undefined,
                    name: row.name.trim(),
                    percent: parseFloat(percent.toFixed(2)),
                    obtainedMarks: obtainedMarksNum,
                    totalMarks: totalMarksNum,
                };
            });
        
        onChange?.(formattedSubjects);
        
        // Reset flag after state update completes
        setTimeout(() => {
            isInternalUpdate.current = false;
        }, 0);
    };

    return (
        <div className="mt-3 space-y-3 rounded-md border border-white/10 bg-white/5 p-4 text-sm">
            {/* Dynamic rows */}
            <div className="space-y-3">
                {rows.map((row) => {
                    const obtainedNum = parseFloat(row.obtainedMarks) || 0;
                    const totalNum = parseFloat(row.totalMarks) || 0;
                    const hasValidMarks = row.obtainedMarks.trim() && row.totalMarks.trim() && totalNum > 0;
                    const isValid = hasValidMarks && totalNum >= obtainedNum;
                    const calculatedPercent = isValid ? calculatePercentage(row.obtainedMarks, row.totalMarks) : 0;
                    const hasError = hasValidMarks && totalNum < obtainedNum;
                    
                    return (
                        <div
                            key={row.id}
                            className="space-y-3"
                        >
                            {/* Subject Name - Full Width Row */}
                            <div>
                                <p className="mb-1 font-medium text-slate-300">
                                    Subject Name
                                </p>
                                {loadingSubjects ? (
                                    <div className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-400">
                                        Loading subjects...
                                    </div>
                                ) : availableSubjects.length === 0 ? (
                                    <div className="w-full rounded-md border border-yellow-500/50 bg-yellow-500/10 px-3 py-3 text-sm text-yellow-400">
                                        No active subjects found. Please add subjects in the admin panel.
                                    </div>
                                ) : (
                                    <Select
                                        options={availableSubjects.map(subj => ({
                                            value: String(subj.id),
                                            label: subj.name
                                        }))}
                                        value={row.subject_id ? String(row.subject_id) : ""}
                                        onChange={(value) => {
                                            console.log('Subject selected:', value);
                                            handleChange(row.id, "subject_id", value ? Number(value) : null);
                                        }}
                                        placeholder="Select subject"
                                        isSearchable={true}
                                        isClearable={true}
                                    />
                                )}
                            </div>

                            {/* Marks and Percentage - Second Row */}
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[120px_120px_1fr_auto] items-end">
                                <div>
                                    <p className="mb-1 font-medium text-slate-300">
                                        Marks Obtained
                                    </p>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={row.obtainedMarks}
                                        onChange={(e) =>
                                            handleChange(
                                                row.id,
                                                "obtainedMarks",
                                                e.target.value,
                                            )
                                        }
                                        placeholder="88"
                                        className={`w-full rounded-md border bg-white/5 px-3 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-400 focus:outline-none focus:bg-white/10 ${
                                            hasError 
                                                ? "border-red-500 focus:border-red-500" 
                                                : "border-white/10 focus:border-pink"
                                        }`}
                                    />
                                    {hasError && (
                                        <p className="mt-1 text-xs text-red-400">
                                            Obtained marks cannot exceed total marks
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <p className="mb-1 font-medium text-slate-300">
                                        Total Marks
                                    </p>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={row.totalMarks}
                                        onChange={(e) =>
                                            handleChange(
                                                row.id,
                                                "totalMarks",
                                                e.target.value,
                                            )
                                        }
                                        placeholder="100"
                                        className={`w-full rounded-md border bg-white/5 px-3 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-400 focus:outline-none focus:bg-white/10 ${
                                            hasError 
                                                ? "border-red-500 focus:border-red-500" 
                                                : "border-white/10 focus:border-pink"
                                        }`}
                                    />
                                    {hasError && (
                                        <p className="mt-1 text-xs text-red-400">
                                            Total marks must be greater than or equal to obtained marks
                                        </p>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="mb-1 font-medium text-slate-300">
                                        Percentage%
                                    </p>
                                    <div className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-200 min-h-[48px] flex items-center">
                                        {isValid ? (
                                            <span className="font-semibold text-emerald-400">
                                                {calculatedPercent.toFixed(2)}%
                                            </span>
                                        ) : hasError ? (
                                            <span className="text-red-400 text-xs">Invalid</span>
                                        ) : (
                                            <span className="text-slate-400">--</span>
                                        )}
                                    </div>
                                </div>

                                {rows.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeRow(row.id)}
                                        className="rounded-md border border-red-500/50 bg-red-500/20 px-4 py-3 text-sm text-red-200 hover:bg-red-500/30 transition whitespace-nowrap h-[48px]"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Add button */}
            <div className="flex justify-end pt-2">
                <Button
                    variant="themeButton"
                    size="sm"
                    className="px-5"
                    type="button"
                    onClick={addRow}
                >
                    + Add More Subjects
                </Button>
            </div>
        </div>
    );
}
