"use client";

import { useState } from "react";
import { Button } from "../shared";

type SubjectRow = {
    id: number;
    name: string;
    percent: string;
};

export function SubjectInputList() {
    const [rows, setRows] = useState<SubjectRow[]>([
        { id: 1, name: "", percent: "" },
    ]);

    const handleChange = (
        id: number,
        field: "name" | "percent",
        value: string,
    ) => {
        setRows((prev) =>
            prev.map((row) =>
                row.id === id ? { ...row, [field]: value } : row,
            ),
        );
    };

    const addRow = () => {
        setRows((prev) => [
            ...prev,
            { id: prev.length + 1, name: "", percent: "" },
        ]);
    };

    return (
        <div className="mt-3 space-y-3 rounded-md border border-pink/30 bg-pink/5 p-4 text-xs dark:border-pink-500/40 dark:bg-slate-900">
            {/* Dynamic rows */}
            <div className="space-y-3">
                {rows.map((row) => (
                    <div
                        key={row.id}
                        className="grid gap-3 sm:grid-cols-2 text-xs sm:text-sm"
                    >
                        <div>
                            <p className="mb-1 font-medium text-slate-600 dark:text-slate-300">
                                Subject Name
                            </p>
                            <input
                                type="text"
                                value={row.name}
                                onChange={(e) =>
                                    handleChange(row.id, "name", e.target.value)
                                }
                                placeholder="e.g. Physics"
                                className="w-full rounded border border-pink/10 bg-pink/5 px-3 py-3 text-sm text-slate-800 outline-none placeholder:text-pink/50 focus:outline-none focus:border-pink transition duration-500 dark:text-white"
                            />
                        </div>

                        <div>
                            <p className="mb-1 font-medium text-slate-600 dark:text-slate-300">
                                Exam Percentage%
                            </p>
                            <input
                                type="number"
                                value={row.percent}
                                onChange={(e) =>
                                    handleChange(
                                        row.id,
                                        "percent",
                                        e.target.value,
                                    )
                                }
                                placeholder="e.g. 88"
                                className="w-full rounded border border-pink/10 bg-pink/5 px-3 py-3 text-sm text-slate-800 outline-none placeholder:text-pink/50 focus:outline-none focus:border-pink transition duration-500 dark:text-white"
                            />
                        </div>
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
