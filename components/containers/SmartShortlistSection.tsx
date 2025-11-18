"use client";

import Image from "next/image";
import { FiSearch } from "react-icons/fi";
import { Button } from "../shared";
import Heading from "../shared/Typography";

const features = [
    {
        title: "Personalized Matching",
        description:
            "Analyzes your academic profile, interests, and preferences",
    },
    {
        title: "Real-Time Updates",
        description:
            "Constantly updated with latest exam dates and college criteria",
    },
    {
        title: "Smart Recommendations",
        description:
            "Suggests backup options and hidden gem colleges",
    },
];

export default function SmartShortlistSection() {
    return (
        <section className="relative overflow-hidden bg-lightGradient dark:bg-none py-16 dark:bg-[#050816]">
            <div className="appContainer">
                {/* Heading */}
                <Heading align="center" head="Smart Shortlist Exam" description="Explore how our university serves as a hub of excellence, bringing together top-tier education, cutting-edge research, and groundbreaking innovation to transform the world."/>

                {/* Search bar */}
                <div className="mt-8 flex justify-center">
                    <div className="flex w-full max-w-5xl items-center gap-3 rounded bg-white px-4 py-3 shadow dark:bg-slate-900">
                        <FiSearch className="text-pink text-lg shrink-0" />
                        <input
                            type="text"
                            placeholder="Search exams (e.g. JEE, NEET, CLAT)…"
                            className="w-full bg-transparent text-sm md:text-base text-slate-800 placeholder:text-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
                        />
                    </div>
                </div>

                {/* Main content */}
                <div className="mt-12 flex flex-col gap-10 lg:flex-row lg:items-center lg:gap-14">
                    {/* LEFT – Illustration */}
                    <div className="flex w-full justify-center lg:w-1/2">
                        <div className="relative">
                            {/* Main card image */}
                            <div className="relative">
                                <Image
                                    src="/shortlist-graphic.png" // update with your asset
                                    alt="Smart shortlist visualization"
                                    width={1282}
                                    height={854}
                                    className="object-contain"
                                />
                            </div>
                        </div>
                    </div>

                    {/* RIGHT – Copy + bullets */}
                    <div className="w-full lg:w-1/2">
                        <h3 className="text-2xl md:text-3xl font-semibold leading-snug text-slate-900 dark:text-white">
                            Our AI shortlists the right exams & colleges based on your marks,
                            interests, and region.
                        </h3>

                        <div className="mt-6 space-y-4">
                            {features.map((feature) => (
                                <div key={feature.title} className="flex gap-3">
                                    <div className="mt-2 h-3 w-3 shrink-0 rounded-full bg-gradient-to-r from-[#ff4fd8] to-[#7b5cff]" />
                                    <div>
                                        <div className="text-sm md:text-base font-semibold text-slate-900 dark:text-slate-100">
                                            {feature.title}
                                        </div>
                                        <div className="text-xs md:text-sm text-slate-600 dark:text-slate-300">
                                            {feature.description}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8">
                            <Button variant="DarkGradient" size="md">
                                Get Started
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
