"use client";

import Image from "next/image";
import { PiMapPinSimpleAreaLight } from "react-icons/pi";
import { Button } from "../shared";

export default function Hero() {
    return (
        <section className="relative overflow-hidden bg-lightGradient py-10 dark:bg-none dark:bg-[#050816]">
            <div className="appContainer">
                <div className="mx-auto flex flex-col items-center gap-10 lg:flex-row lg:items-center lg:justify-between lg:gap-16 lg:px-0">
                    {/* LEFT COLUMN */}
                    <div className="flex w-full max-w-xl flex-col gap-6 lg:max-w-xl">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 self-start rounded-full bg-white px-4 py-2 text-sm font-medium text-pink shadow-sm shadow-pink/20 dark:bg-slate-900 dark:text-pink">
                            <PiMapPinSimpleAreaLight className="text-xl text-pink" />
                            <span>Top Exams in Delhi</span>
                        </div>

                        {/* Heading */}
                        <h1 className="text-3xl font-bold leading-tight text-slate-900 md:text-5xl lg:text-6xl dark:text-white">
                            Your college{" "}
                            <br className="hidden sm:block" />
                            journey,{" "}
                            <span className="bg-gradient-to-r from-[#ff0080] to-[#7A00FF] bg-clip-text text-transparent">
                                simplified
                            </span>
                        </h1>

                        {/* Subtext */}
                        <p className="text-sm leading-relaxed text-slate-700 md:text-base dark:text-slate-300">
                            From career guidance to college admission – we&apos;ve got you covered
                            every step of the way. No stress, just success!
                        </p>

                        {/* Buttons */}
                        <div className="flex flex-wrap items-center gap-3">
                            <Button variant="themeButton" size="md" href="/get-started">
                                Start Your Journey
                            </Button>
                            <Button variant="themeButtonOutline" size="md">
                                Explore Programs
                            </Button>
                        </div>

                        {/* Social proof chips */}
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                            <div className="flex items-center">
                                {["A", "B", "C", "D"].map((letter, index) => (
                                    <div
                                        key={letter}
                                        className={`flex h-8 w-8 md:h-12 md:w-12 items-center justify-center rounded-full bg-pink text-sm md:text-lg font-semibold text-white border border-white ${index !== 0 ? "-ml-3 md:-ml-4" : ""}`}
                                    >
                                        {letter}
                                    </div>
                                ))}
                            </div>
                            <p className="text-sm text-slate-700 md:text-lg dark:text-slate-200">
                                <span className="font-semibold">10,000+ students</span> already on
                                their path
                            </p>
                        </div>
                    </div>

                    {/* RIGHT COLUMN – Illustration */}
                    <div className="flex w-full max-w-xl justify-center lg:max-w-none lg:flex-1">
                        <div className="relative h-auto w-full max-w-xl">
                            <Image
                                src="/hero.png"
                                alt="College journey illustration"
                                width={1100}
                                height={1100}
                                priority
                                className="h-auto w-full object-contain"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
