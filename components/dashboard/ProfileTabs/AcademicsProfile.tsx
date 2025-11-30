"use client";

import { FaChevronDown } from "react-icons/fa6";
import { SubjectInputList } from "../SubjectInputList";

const subjectData = [
    { name: "Physics", percent: 89, barColor: "bg-green-500" },
    { name: "Chemistry", percent: 85, barColor: "bg-amber-400" },
    { name: "Mathematics", percent: 88, barColor: "bg-green-500" },
];

export default function AcademicsProfile() {
    return (
        <div className="bg-[#fff2f8] p-6 rounded-md">
            <h2 className="mb-4 text-sm font-semibold text-pink-600">Academic Profile</h2>

            <div className="space-y-6 border border-[#ffd6f1] bg-white p-6 text-sm text-slate-700 shadow-sm rounded-2xl">
                <div className="space-y-5">
                    {/* Current Education */}
                    <section className="rounded-md bg-white p-5 border border-[#ffeef6]">
                        <h2 className="mb-4 text-lg font-semibold text-slate-800">Current Education</h2>

                        <div className="space-y-4 text-sm">
                        {/* Grade */}
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-600">
                                Grade
                            </label>
                            <div className="relative">
                                <select
                                    defaultValue="12th Grade"
                                    className="w-full rounded border border-[#ffd6f1] bg-[#fff2fb] px-3 py-3 text-sm text-slate-900 outline-none placeholder:text-pink/50 focus:outline-none focus:border-pink focus:bg-white focus:ring-2 focus:ring-pink/20 appearance-none"
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
                            <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-600">
                                Stream
                            </label>
                            <div className="relative">
                                <select
                                    defaultValue="Science (PCM)"
                                    className="w-full rounded border border-[#ffd6f1] bg-[#fff2fb] px-3 py-3 text-sm text-slate-900 outline-none placeholder:text-pink/50 focus:outline-none focus:border-pink focus:bg-white focus:ring-2 focus:ring-pink/20 appearance-none"
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
                            <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-600">
                                Board
                            </label>
                            <div className="relative">
                                <select
                                    defaultValue="CBSE"
                                    className="w-full rounded border border-[#ffd6f1] bg-[#fff2fb] px-3 py-3 text-sm text-slate-900 outline-none placeholder:text-pink/50 focus:outline-none focus:border-pink focus:bg-white focus:ring-2 focus:ring-pink/20 appearance-none"
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
                            <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-600">
                                School
                            </label>
                            <input
                                type="text"
                                className="w-full rounded border border-[#ffd6f1] bg-[#fff2fb] px-3 py-3 text-sm text-slate-900 outline-none placeholder:text-pink/50 focus:outline-none focus:border-pink focus:bg-white focus:ring-2 focus:ring-pink/20"
                                placeholder="School Name Here"
                            />
                        </div>
                        </div>
                    </section>


                    {/* Recent Performance */}
                    <section className="rounded-md bg-[#fff2fb] p-5 border border-[#ffe8f4]">
                        <h2 className="mb-4 text-lg font-semibold text-slate-700">Recent Performance</h2>

                        <div className="space-y-3 text-sm">
                            {/* Overall */}
                            <div className="rounded-md bg-white px-4 py-3 border border-[#ffeef8]">
                                <p className="mb-1 block text-sm font-medium text-slate-700">Overall Percentage</p>
                                <p className="mt-1 text-4xl font-semibold text-emerald-500">87.5%</p>
                            </div>

                            {/* 10th */}
                            <div className="rounded-md bg-white px-4 py-3 border border-[#ffeef8]">
                                <p className="mb-1 block text-sm font-medium text-slate-700">10th Marks</p>
                                <p className="mt-1 text-4xl font-semibold text-slate-700">90%</p>
                            </div>

                            {/* 12th */}
                            <div className="rounded-md bg-white px-4 py-3 border border-[#ffeef8]">
                                <p className="mb-1 block text-sm font-medium text-slate-700">12th Marks</p>
                                <p className="mt-1 text-4xl font-semibold text-slate-700">87.5%</p>
                            </div>
                        </div>
                    </section>

                    {/* Subject Breakdown */}
                    <section className="rounded-md bg-white p-5 border border-[#ffeef6]">
                        <h2 className="mb-4 text-lg font-semibold text-slate-700">Subject Breakdown</h2>

                        <div className="space-y-3 text-sm">
                            {subjectData.map((subj) => (
                                <div key={subj.name} className="rounded-md border border-[#ffdfe9] bg-white px-4 py-3">
                                    <p className="mb-1 block text-sm font-medium text-slate-700">{subj.name}</p>
                                    <p className="mt-1 text-2xl font-semibold text-emerald-500">{subj.percent}%</p>
                                    <div className="mt-2 h-2 rounded-full bg-white/10">
                                        <div className={`h-2 rounded-full ${subj.barColor}`} style={{ width: `${subj.percent}%` }} />
                                    </div>
                                </div>
                            ))}

                            {/* Add more subjects link */}
                            <button type="button" className="mt-1 text-xs font-medium text-pink hover:underline">+ Add more subjects</button>

                            <SubjectInputList />
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
