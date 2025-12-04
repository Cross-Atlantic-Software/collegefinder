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
        <div className="space-y-6 rounded-md bg-white/10 p-6 text-sm text-slate-200 shadow-sm">
            <h2 className="text-base font-semibold text-pink sm:text-lg">Academic Profile</h2>

            <div className="space-y-6 rounded-md bg-white/5 p-6">
                <div className="space-y-5">
                    {/* Current Education */}
                    <section className="rounded-md bg-white/5 p-5 border border-white/10">
                        <h2 className="mb-4 text-lg font-semibold text-slate-50">Current Education</h2>

                        <div className="space-y-4 text-sm">
                        {/* Grade */}
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-300">
                                Grade
                            </label>
                            <div className="relative">
                                <select
                                    defaultValue="12th Grade"
                                    className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-400 focus:outline-none focus:border-pink focus:bg-white/10 appearance-none"
                                >
                                    <option>9th Grade</option>
                                    <option>10th Grade</option>
                                    <option>11th Grade</option>
                                    <option>12th Grade</option>
                                </select>
                                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                                    <FaChevronDown />
                                </span>
                            </div>
                        </div>

                        {/* Stream */}
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-300">
                                Stream
                            </label>
                            <div className="relative">
                                <select
                                    defaultValue="Science (PCM)"
                                    className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-400 focus:outline-none focus:border-pink focus:bg-white/10 appearance-none"
                                >
                                    <option>Science (PCM)</option>
                                    <option>Science (PCB)</option>
                                    <option>Commerce</option>
                                    <option>Humanities / Arts</option>
                                    <option>Other</option>
                                </select>
                                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                                    <FaChevronDown />
                                </span>
                            </div>
                        </div>

                        {/* Board */}
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-300">
                                Board
                            </label>
                            <div className="relative">
                                <select
                                    defaultValue="CBSE"
                                    className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-400 focus:outline-none focus:border-pink focus:bg-white/10 appearance-none"
                                >
                                    <option>CBSE</option>
                                    <option>ICSE</option>
                                    <option>IB</option>
                                    <option>State Board</option>
                                    <option>Other</option>
                                </select>
                                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                                    <FaChevronDown />
                                </span>
                            </div>
                        </div>

                        {/* School (kept as text input-style display) */}
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-300">
                                School
                            </label>
                            <input
                                type="text"
                                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-400 focus:outline-none focus:border-pink focus:bg-white/10"
                                placeholder="School Name Here"
                            />
                        </div>
                        </div>
                    </section>


                    {/* Recent Performance */}
                    <section className="rounded-md bg-white/5 p-5 border border-white/10">
                        <h2 className="mb-4 text-lg font-semibold text-slate-50">Recent Performance</h2>

                        <div className="space-y-3 text-sm">
                            {/* Overall */}
                            <div className="rounded-md bg-white/5 px-4 py-3 border border-white/10">
                                <p className="mb-1 block text-sm font-medium text-slate-300">Overall Percentage</p>
                                <p className="mt-1 text-4xl font-semibold text-emerald-400">87.5%</p>
                            </div>

                            {/* 10th */}
                            <div className="rounded-md bg-white/5 px-4 py-3 border border-white/10">
                                <p className="mb-1 block text-sm font-medium text-slate-300">10th Marks</p>
                                <p className="mt-1 text-4xl font-semibold text-slate-200">90%</p>
                            </div>

                            {/* 12th */}
                            <div className="rounded-md bg-white/5 px-4 py-3 border border-white/10">
                                <p className="mb-1 block text-sm font-medium text-slate-300">12th Marks</p>
                                <p className="mt-1 text-4xl font-semibold text-slate-200">87.5%</p>
                            </div>
                        </div>
                    </section>

                    {/* Subject Breakdown */}
                    <section className="rounded-md bg-white/5 p-5 border border-white/10">
                        <h2 className="mb-4 text-lg font-semibold text-slate-50">Subject Breakdown</h2>

                        <div className="space-y-3 text-sm">
                            {subjectData.map((subj) => (
                                <div key={subj.name} className="rounded-md border border-white/10 bg-white/5 px-4 py-3">
                                    <p className="mb-1 block text-sm font-medium text-slate-300">{subj.name}</p>
                                    <p className="mt-1 text-2xl font-semibold text-emerald-400">{subj.percent}%</p>
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
