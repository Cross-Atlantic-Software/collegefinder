"use client";

import React, { useState } from "react";
import { Button } from "../shared";
import { BsStars } from "react-icons/bs";

type TabKey = "deadlines" | "webinars" | "insights" | "tbd";

const tabs: { id: TabKey; label: string }[] = [
    { id: "deadlines", label: "Upcoming Deadlines" },
    { id: "webinars", label: "Webinars" },
    { id: "insights", label: "Career Insights" },
    { id: "tbd", label: "TBD" },
];

type ExamCard = {
    college: string;
    course: string;
    examDate: string;
    examFee: string;
    examType: string;
    collegesCount: string;
};

const upcomingDeadlines: ExamCard[] = [
    {
        college: "IIT Madras",
        course: "B.Sc. (Bachelor of Science)",
        examDate: "15th Nov, 2025",
        examFee: "₹ 700/-",
        examType: "Offline",
        collegesCount: "1234",
    },
    {
        college: "IIT Madras",
        course: "B.Sc. (Bachelor of Science)",
        examDate: "15th Nov, 2025",
        examFee: "₹ 700/-",
        examType: "Offline",
        collegesCount: "1234",
    },
    {
        college: "IIT Madras",
        course: "B.Sc. (Bachelor of Science)",
        examDate: "15th Nov, 2025",
        examFee: "₹ 700/-",
        examType: "Offline",
        collegesCount: "1234",
    },
    {
        college: "IIT Madras",
        course: "B.Sc. (Bachelor of Science)",
        examDate: "15th Nov, 2025",
        examFee: "₹ 700/-",
        examType: "Offline",
        collegesCount: "1234",
    },
];

export default function InfoSection() {
    const [activeTab, setActiveTab] = useState<TabKey>("deadlines");

    const renderContent = () => {
        if (activeTab === "deadlines") {
            return (
                <div className="grid gap-4 md:grid-cols-2">
                    {upcomingDeadlines.map((exam, index) => (
                        <div
                            key={`${exam.college}-${index}`}
                            className="rounded border border-gray-200 bg-[#FAFAFA] p-4 md:p-5 dark:border-slate-800 dark:bg-slate-900"
                        >
                            <div className="mb-3 flex flex-wrap items-baseline gap-1 text-sm md:text-base">
                                <span className="font-semibold text-pink">
                                    {exam.college}
                                </span>
                                <span className="text-gray-700 dark:text-slate-200">
                                    {exam.course}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-y-2 text-xs md:text-sm">
                                <span className="font-medium text-gray-700 dark:text-slate-300">
                                    Exam Date:
                                </span>
                                <span className="text-gray-800 dark:text-slate-100">
                                    {exam.examDate}
                                </span>

                                <span className="font-medium text-gray-700 dark:text-slate-300">
                                    Exam Fee:
                                </span>
                                <span className="text-gray-800 dark:text-slate-100">
                                    {exam.examFee}
                                </span>

                                <span className="font-medium text-gray-700 dark:text-slate-300">
                                    Exam Type:
                                </span>
                                <span className="text-gray-800 dark:text-slate-100">
                                    {exam.examType}
                                </span>

                                <span className="font-medium text-gray-700 dark:text-slate-300">
                                    No of Colleges:
                                </span>
                                <span className="text-gray-800 dark:text-slate-100">
                                    {exam.collegesCount}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        const boxClasses = `
            flex h-full items-center justify-center rounded border border-dashed
            border-gray-200 bg-[#FAFAFA] p-6 text-center text-sm text-gray-600
            dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300
        `;

        if (activeTab === "webinars") {
            return (
                <div className={boxClasses.trim()}>
                    Upcoming webinars will appear here soon.
                </div>
            );
        }

        if (activeTab === "insights") {
            return (
                <div className={boxClasses.trim()}>
                    Career insights and guidance will be listed here.
                </div>
            );
        }

        return (
            <div className={boxClasses.trim()}>
                Content coming soon.
            </div>
        );
    };

    return (
        <section className="pb-16">
            <div className="appContainer">
                <div className="flex flex-col lg:grid lg:grid-cols-[35%_65%] lg:items-center">
                    {/* LEFT SIDE */}
                    <div>
                        {/* Badge */}
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-gray-50 px-4 py-2 text-sm font-medium text-gray-900 shadow dark:bg-slate-900 dark:text-slate-100">
                            <BsStars className="text-orange-600 text-lg" />
                            <span>Powered by AI</span>
                        </div>

                        <h3 className="mb-5 text-5xl font-semibold leading-[1.2] text-slate-800 dark:text-slate-50">
                            You Will Get All Admission Information At Once
                        </h3>
                        <p className="text-lg text-slate-700 dark:text-slate-300">
                            Explore how our university serves as a hub of excellence, bringing together top-tier education, cutting-edge research, and groundbreaking innovation to transform the world.
                        </p>

                        <div className="mt-8 flex flex-wrap gap-4">
                            <Button variant="themeButton" size="md">
                                Get a demo
                            </Button>
                            <Button variant="themeButtonOutline" size="md">
                                Get started free
                            </Button>
                        </div>
                    </div>

                    {/* RIGHT SIDE – TABS + CONTENT */}
                    <div className="mt-6 border border-gray-200 bg-white md:mt-0 md:ms-10 dark:border-slate-800 dark:bg-slate-950">
                        {/* Tabs */}
                        <div className="grid grid-cols-4 border-b border-gray-200 text-xs md:text-sm dark:border-slate-800">
                            {tabs.map((tab) => {
                                const isActive = activeTab === tab.id;
                                const base =
                                    "flex items-center justify-center px-2 py-3 text-center font-medium transition-colors duration-200";

                                const activeClasses =
                                    "border-b-2 border-pink bg-white text-pink dark:bg-slate-900";
                                const inactiveClasses =
                                    "bg-gray-50 text-gray-500 hover:bg-white hover:text-gray-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100";

                                const classes = `
                                    ${base}
                                    ${isActive ? activeClasses : inactiveClasses}
                                `;

                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        className={classes.trim()}
                                        onClick={() => setActiveTab(tab.id)}
                                    >
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Tab content */}
                        <div className="p-4 md:p-6 lg:p-8">{renderContent()}</div>
                    </div>
                </div>
            </div>
        </section>
    );
}
