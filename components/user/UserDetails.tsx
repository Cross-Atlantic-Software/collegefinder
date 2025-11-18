"use client";

import Image from "next/image";
import {
    PiGraduationCapFill,
    PiTargetBold,
    PiLightningFill,
} from "react-icons/pi";
import { FaChartBar } from "react-icons/fa";
import { Button } from "../shared";

export default function UserDetails() {
    return (
        <section className="relative mx-4 overflow-hidden rounded-t-md bg-darkGradient dark:bg-none dark:bg-slate-900/80 py-10 text-white">
            <div className="appContainer">
                <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                    {/* LEFT: Avatar + greeting */}
                    <div className="flex-1">
                        <div className="flex items-center gap-4">
                            <div className="relative h-24 w-24 overflow-hidden rounded-lg border border-pink border-2">
                                <Image
                                    src="/avatar-placeholder.jpg" // update with real user image
                                    alt="User avatar"
                                    fill
                                    className="object-cover"
                                />
                            </div>

                            <div className="space-y-1">
                                <p className="text-sm text-slate-50 dark:text-slate-300">
                                    Good Afternoon,
                                </p>
                                <h2 className="text-2xl font-semibold">
                                    Dinesh!
                                </h2>
                                <p className="text-sm text-slate-50 dark:text-slate-300">
                                    Let&apos;s make your college dream happen
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Profile strength card */}
                    <div className="w-full max-w-md">
                        <div className="rounded-lg border border-white/10 bg-lightGradient dark:bg-none dark:bg-slate-900 px-6 py-5 text-slate-50 shadow-xl backdrop-blur-xl">
                            <div className="mb-1 flex items-center justify-between text-sm font-semibold">
                                <span className="text-pink">
                                    Profile Strength
                                </span>
                                <span className="text-pink">75%</span>
                            </div>

                            {/* Progress bar */}
                            <div className="mt-2 h-3 w-full rounded-full bg-white/10">
                                <div className="h-3 w-3/4 rounded-full bg-gradient-to-r from-pink-500 to-rose-500" />
                            </div>

                            <p className="mt-3 text-sm text-slate-800 dark:text-slate-300">
                                Almost there! Complete your profile
                            </p>

                            <div className="mt-5">
                                <Button
                                    variant="DarkGradient"
                                    size="md"
                                    className="w-full justify-center"
                                >
                                    See Full List →
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stat cards */}
                <div className="mt-10">
                    <div className="grid gap-5 md:grid-cols-4 xl:grid-cols-4">
                        {/* Stream card */}
                        <div className="flex items-center gap-4 rounded-lg border border-white/10 bg-lightGradient dark:bg-none dark:bg-slate-900 px-6 py-5 text-white shadow-lg backdrop-blur-sm">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-darkGradient text-2xl">
                                <PiGraduationCapFill />
                            </div>
                            <div>
                                <p className="text-xl font-semibold text-pink">
                                    PCM
                                </p>
                                <p className="text-sm text-slate-800 dark:text-slate-300">
                                    Stream
                                </p>
                            </div>
                        </div>

                        {/* Overall card */}
                        <div className="flex items-center gap-4 rounded-lg border border-white/10 bg-lightGradient dark:bg-none dark:bg-slate-900 px-6 py-5 text-white shadow-lg backdrop-blur-sm">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-darkGradient text-2xl">
                                <FaChartBar />
                            </div>
                            <div>
                                <p className="text-xl font-semibold text-pink">
                                    87.5%
                                </p>
                                <p className="text-sm text-slate-800 dark:text-slate-300">
                                    Overall
                                </p>
                            </div>
                        </div>

                        {/* Colleges card */}
                        <div className="flex items-center gap-4 rounded-lg border border-white/10 bg-lightGradient dark:bg-none dark:bg-slate-900 px-6 py-5 text-white shadow-lg backdrop-blur-sm">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-darkGradient text-2xl">
                                <PiTargetBold />
                            </div>
                            <div>
                                <p className="text-xl font-semibold text-pink">
                                    3
                                </p>
                                <p className="text-sm text-slate-800 dark:text-slate-300">
                                    Colleges
                                </p>
                            </div>
                        </div>

                        {/* Events card */}
                        <div className="flex items-center gap-4 rounded-lg border border-white/10 bg-lightGradient dark:bg-none dark:bg-slate-900 px-6 py-5 text-white shadow-lg backdrop-blur-sm">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-darkGradient text-2xl">
                                <PiLightningFill />
                            </div>
                            <div>
                                <p className="text-xl font-semibold text-pink">
                                    2
                                </p>
                                <p className="text-sm text-slate-800 dark:text-slate-300">
                                    Events
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
