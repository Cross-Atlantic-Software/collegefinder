"use client";

import { FaChevronDown } from "react-icons/fa6";
import { SubjectInputList } from "./SubjectInputList";

const subjectData = [
    { name: "Physics", percent: 89, barColor: "bg-green-500" },
    { name: "Chemistry", percent: 85, barColor: "bg-amber-400" },
    { name: "Mathematics", percent: 88, barColor: "bg-green-500" },
];

export default function AcademicsProfile() {
    return (
        <div className="rounded border border-white/10 bg-pink/5 px-4 py-6 text-sm text-slate-100 sm:px-6 sm:py-7">
            {/* Section title */}
            <h2 className="mb-4 text-base font-semibold text-pink sm:text-lg">
                Academic Profile
            </h2>
            <div className="space-y-6">
                {/* Current Education */}
                <section className="rounded-md bg-white p-5 dark:bg-slate-900">
                    <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                        Current Education
                    </h2>

                    <div className="space-y-4 text-sm">
                        {/* Grade */}
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                Grade
                            </label>
                            <div className="relative">
                                <select
                                    defaultValue="12th Grade"
                                    className="w-full rounded border border-pink/10 bg-pink/5 px-3 py-3 text-sm text-slate-800 outline-none placeholder:text-pink/50 focus:outline-none focus:border-pink transition duration-500 dark:text-white appearance-none"
                                >
                                    <option>9th Grade</option>
                                    <option>10th Grade</option>
                                    <option>11th Grade</option>
                                    <option>12th Grade</option>
                                </select>
                                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500 dark:text-slate-400">
                                    <FaChevronDown />
                                </span>
                            </div>
                        </div>

                        {/* Stream */}
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                Stream
                            </label>
                            <div className="relative">
                                <select
                                    defaultValue="Science (PCM)"
                                    className="w-full rounded border border-pink/10 bg-pink/5 px-3 py-3 text-sm text-slate-800 outline-none placeholder:text-pink/50 focus:outline-none focus:border-pink transition duration-500 dark:text-white appearance-none"
                                >
                                    <option>Science (PCM)</option>
                                    <option>Science (PCB)</option>
                                    <option>Commerce</option>
                                    <option>Humanities / Arts</option>
                                    <option>Other</option>
                                </select>
                                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500 dark:text-slate-400">
                                    <FaChevronDown />
                                </span>
                            </div>
                        </div>

                        {/* Board */}
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                Board
                            </label>
                            <div className="relative">
                                <select
                                    defaultValue="CBSE"
                                    className="w-full rounded border border-pink/10 bg-pink/5 px-3 py-3 text-sm text-slate-800 outline-none placeholder:text-pink/50 focus:outline-none focus:border-pink transition duration-500 dark:text-white appearance-none"
                                >
                                    <option>CBSE</option>
                                    <option>ICSE</option>
                                    <option>IB</option>
                                    <option>State Board</option>
                                    <option>Other</option>
                                </select>
                                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500 dark:text-slate-400">
                                    <FaChevronDown />
                                </span>
                            </div>
                        </div>

                        {/* School (kept as text input-style display) */}
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                School
                            </label>
                            <input
                                type="text"
                                className="w-full rounded border border-pink/10 bg-pink/5 px-3 py-3 text-sm text-slate-800 outline-none placeholder:text-pink/50 focus:outline-none focus:border-pink transition duration-500 dark:text-white"
                                placeholder="School Name Here"
                            />
                        </div>
                    </div>
                </section>


                {/* Recent Performance */}
                <section className="rounded-md bg-white p-5 dark:bg-slate-900">
                    <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                        Recent Performance
                    </h2>

                    <div className="space-y-3 text-sm">
                        {/* Overall */}
                        <div className="rounded-md bg-pink/5 px-4 py-3">
                            <p className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                Overall Percentage
                            </p>
                            <p className="mt-1 text-4xl font-semibold text-emerald-500">
                                87.5%
                            </p>
                        </div>

                        {/* 10th */}
                        <div className="rounded-md bg-pink/5 px-4 py-3">
                            <p className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                10th Marks
                            </p>
                            <p className="mt-1 text-4xl font-semibold text-slate-900 dark:text-slate-100">
                                90%
                            </p>
                        </div>

                        {/* 12th */}
                        <div className="rounded-md bg-pink/5 px-4 py-3">
                            <p className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                12th Marks
                            </p>
                            <p className="mt-1 text-4xl font-semibold text-slate-900 dark:text-slate-100">
                                87.5%
                            </p>
                        </div>
                    </div>
                </section>

                {/* Subject Breakdown */}
                <section className="rounded-md bg-white p-5 dark:bg-slate-900">
                    <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                        Subject Breakdown
                    </h2>

                    <div className="space-y-3 text-sm">
                        {subjectData.map((subj) => (
                            <div
                                key={subj.name}
                                className="rounded-md border border-pink/30 bg-pink/5 px-4 py-3 dark:border-pink-500/40 dark:bg-slate-900"
                            >
                                <p className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                    {subj.name}
                                </p>
                                <p className="mt-1 text-2xl font-semibold text-emerald-500">
                                    {subj.percent}%
                                </p>
                                <div className="mt-2 h-2 rounded-full bg-pink/10 dark:bg-slate-800">
                                    <div
                                        className={`h-2 rounded-full ${subj.barColor}`}
                                        style={{ width: `${subj.percent}%` }}
                                    />
                                </div>
                            </div>
                        ))}

                        {/* Add more subjects link */}
                        <button
                            type="button"
                            className="mt-1 text-xs font-medium text-pink hover:underline"
                        >
                            + Add more subjects
                        </button>

                        <SubjectInputList />
                    </div>
                </section>
            </div>
        </div>
    );
}
