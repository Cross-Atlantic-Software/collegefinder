"use client";

import Link from "next/link";
import { LuCalendarDays } from "react-icons/lu";

type Deadline = {
    date: string;
    title: string;
    subtitle: string;
};

const deadlines: Deadline[] = [
    {
        date: "Nov 15, 2025",
        title: "JEE (Main)",
        subtitle: "Registration opens",
    },
    {
        date: "Nov 15, 2025",
        title: "JEE (Main)",
        subtitle: "Registration opens",
    },
    {
        date: "Nov 15, 2025",
        title: "JEE (Main)",
        subtitle: "Registration opens",
    },
];

export default function UpcomingDeadlines() {
    return (
        <section className="w-full max-w-sm rounded-md bg-pink/5 px-5 pb-6 pt-6 dark:bg-slate-900">
            {/* Heading */}
            <div className="mb-4">
                <h3 className="text-xl font-semibold leading-tight text-slate-900 dark:text-gray-50">
                    Upcoming Deadlines
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    Based on your profile
                </p>
            </div>

            {/* Cards */}
            <div className="space-y-4">
                {deadlines.map((item, index) => (
                    <Link
                        href="/exams/eligible"
                        key={`${item.title}-${index}`}
                        className="block rounded bg-white px-5 py-4 text-slate-900 shadow-sm transition dark:bg-slate-950 dark:text-slate-100"
                    >
                        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-pink">
                            <LuCalendarDays className="text-lg" />
                            <span>{item.date}</span>
                        </div>

                        <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                            {item.title}
                        </p>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                            {item.subtitle}
                        </p>
                    </Link>
                ))}
            </div>
        </section>
    );
}
