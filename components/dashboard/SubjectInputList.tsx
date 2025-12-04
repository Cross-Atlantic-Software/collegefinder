"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "../shared";

type SubjectRow = {
    id: number;
    name: string;
    percent: string;
};

type SubjectInputListProps = {
    subjects?: Array<{ name: string; percent: number }>;
    onChange?: (subjects: Array<{ name: string; percent: number }>) => void;
};

export function SubjectInputList({ subjects = [], onChange }: SubjectInputListProps) {
    const [rows, setRows] = useState<SubjectRow[]>([]);
    const isInternalUpdate = useRef(false);
    const prevSubjectsRef = useRef<string>("");

    // Initialize rows on mount
    useEffect(() => {
        if (subjects && subjects.length > 0) {
            setRows(
                subjects.map((subj, index) => ({
                    id: index + 1,
                    name: subj.name || "",
                    percent: subj.percent?.toString() || "",
                }))
            );
            prevSubjectsRef.current = JSON.stringify(subjects);
        } else if (rows.length === 0) {
            setRows([{ id: 1, name: "", percent: "" }]);
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
                        name: subj.name || "",
                        percent: subj.percent?.toString() || "",
                    }))
                );
            }
            prevSubjectsRef.current = subjectsKey;
        }
    }, [subjects]);

    const handleChange = (
        id: number,
        field: "name" | "percent",
        value: string,
    ) => {
        // Mark as internal update to prevent useEffect from resetting
        isInternalUpdate.current = true;
        
        const updatedRows = rows.map((row) =>
            row.id === id ? { ...row, [field]: value } : row,
        );
        setRows(updatedRows);
        
        // Convert to format expected by backend
        const formattedSubjects = updatedRows
            .filter((row) => row.name.trim() && row.percent.trim())
            .map((row) => ({
                name: row.name.trim(),
                percent: parseFloat(row.percent) || 0,
            }));
        
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
        const updatedRows = [...rows, { id: newId, name: "", percent: "" }];
        setRows(updatedRows);
        
        // Notify parent (empty row won't be included in formatted subjects)
        const formattedSubjects = updatedRows
            .filter((row) => row.name.trim() && row.percent.trim())
            .map((row) => ({
                name: row.name.trim(),
                percent: parseFloat(row.percent) || 0,
            }));
        
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
            .filter((row) => row.name.trim() && row.percent.trim())
            .map((row) => ({
                name: row.name.trim(),
                percent: parseFloat(row.percent) || 0,
            }));
        
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
                {rows.map((row) => (
                    <div
                        key={row.id}
                        className="grid gap-3 sm:grid-cols-[1fr_auto_auto] items-end"
                    >
                        <div>
                            <p className="mb-1 font-medium text-slate-300">
                                Subject Name
                            </p>
                            <input
                                type="text"
                                value={row.name}
                                onChange={(e) =>
                                    handleChange(row.id, "name", e.target.value)
                                }
                                placeholder="e.g. Physics"
                                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-400 focus:outline-none focus:border-pink focus:bg-white/10"
                            />
                        </div>

                        <div>
                            <p className="mb-1 font-medium text-slate-300">
                                Percentage%
                            </p>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={row.percent}
                                onChange={(e) =>
                                    handleChange(
                                        row.id,
                                        "percent",
                                        e.target.value,
                                    )
                                }
                                placeholder="88"
                                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-400 focus:outline-none focus:border-pink focus:bg-white/10"
                            />
                        </div>

                        {rows.length > 1 && (
                            <button
                                type="button"
                                onClick={() => removeRow(row.id)}
                                className="rounded-md border border-red-500/50 bg-red-500/20 px-4 py-3 text-sm text-red-200 hover:bg-red-500/30 transition"
                            >
                                Remove
                            </button>
                        )}
                    </div>
                ))}
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
