"use client";

import Link from "next/link";
import { Button } from "../shared";

type Exam = {
    name: string;
    status?: string;
};

const exams: Exam[] = [
    { name: "JEE Main", status: "ELIGIBLE" },
    { name: "BITSAT", status: "ELIGIBLE" },
    { name: "VITEEE", status: "ELIGIBLE" },
];

export default function EligibleExams() {
    return (
        <section className="w-full max-w-sm rounded-md bg-pink/5 px-5 pb-6 pt-6 dark:bg-slate-900">
            {/* Heading */}
            <div className="mb-4">
                <h3 className="text-xl font-semibold leading-tight dark:text-white mb-2">
                    Eligible Exams
                </h3>
                <p className="text-sm text-slate-800 dark:text-slate-300">Based on your profile</p>
            </div>

            {/* Summary card */}
            <div className="mb-5 rounded bg-white px-5 py-8 text-center text-slate-900 dark:bg-slate-950">
                <p className="text-4xl font-semibold text-pink mb-1">~18</p>
                <p className="text-sm text-slate-800 dark:text-slate-300">
                    Matching exams found
                </p>
            </div>

            {/* Exams list */}
            <div className="space-y-3 mb-6">
                {exams.map((exam) => (
                    <Link
                        href="/exams/eligible"
                        key={exam.name}
                        className="flex items-center justify-between rounded-md bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-sm hover:bg-pink transition duration-500 hover:text-white group dark:bg-slate-950 dark:hover:bg-pink dark:text-white"
                    >
                        <span>{exam.name}</span>
                        {exam.status && (
                            <span className="rounded bg-pink/5 px-4 py-2 text-xs font-semibold tracking-wide text-slate-700 group-hover:bg-white transition duration-500 dark:bg-slate-800 dark:group-hover:bg-white dark:group-hover:text-slate-900 dark:text-slate-300">
                                {exam.status}
                            </span>
                        )}
                    </Link>
                ))}
            </div>

            {/* CTA */}
            <div className="mt-2">
                <Button
                    variant="DarkGradient"
                    size="md"
                    className="w-full justify-center rounded-full"
                    href="/exams/eligible"
                >
                    See Full List →
                </Button>
            </div>
        </section>
    );
}
