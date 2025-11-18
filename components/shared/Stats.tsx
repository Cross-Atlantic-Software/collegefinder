"use client";

import React from "react";
import { LuIndianRupee } from "react-icons/lu";
import {
    PiGraduationCapFill,
    PiBooksFill,
    PiUsersThreeFill,
} from "react-icons/pi";

type StatItem = {
    icon: React.ReactNode;
    value: string;
    label: string;
};

const defaultStats: StatItem[] = [
    {
        icon: <LuIndianRupee />,
        value: "100%",
        label: "Get Financial Aid",
    },
    {
        icon: <PiGraduationCapFill />,
        value: "97%",
        label: "Employed Graduates",
    },
    {
        icon: <PiBooksFill />,
        value: "100+",
        label: "Areas of Study",
    },
    {
        icon: <PiUsersThreeFill />,
        value: "10:1",
        label: "Students to Faculty",
    },
];

interface StatsProps {
    items?: StatItem[];
    className?: string;
}

export default function Stats({ items = defaultStats, className = "" }: StatsProps) {
    const wrapperClasses = `
        w-full rounded bg-pink text-white
        px-6 py-8 md:px-10 md:py-10
        ${className}
    `;

    return (
        <section className={wrapperClasses.trim()}>
            <div className="flex flex-col gap-6 md:flex-row md:items-stretch md:justify-between">
                <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
                    {items.map((stat) => (
                        <div
                            key={stat.label}
                            className="flex flex-col items-center justify-center text-center gap-2"
                        >
                            <div className="mb-1 text-white text-5xl">{stat.icon}</div>
                            <div className="text-3xl font-bold md:text-4xl">
                                {stat.value}
                            </div>
                            <div className="text-sm md:text-base font-medium text-white/90">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
