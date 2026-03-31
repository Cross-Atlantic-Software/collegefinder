"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { FiCheckCircle } from "react-icons/fi";
import { RoughNotation } from "react-rough-notation";

type AudienceKey = "students" | "parents";

const audienceContent: Record<
    AudienceKey,
    {
        points: string[];
        image: string;
        imageAlt: string;
    }
> = {
    students: {
        points: [
            "Control over every deadline & application",
            "1,000+ exams discovered — not just the big names",
            "One-click form filling saves hours per cycle",
            "Psycho-analytical profiling reveals your best-fit path",
            "Exam-specific personalized prep track",
        ],
        image: "/landing-page/how_it_works.png",
        imageAlt: "Students using UniTracko",
    },
    parents: {
        points: [
            "Single dashboard for your child’s entire journey",
            "No missed forms, no surprise fees, no last-minute panic",
            "Clear cost and scholarship visibility",
            "Progress tracking with structured updates",
            "Confidence in every decision point",
        ],
        image: "/landing-page/parent.png",
        imageAlt: "Parents confidence view",
    },
};

export default function AudienceSection() {
    const [activeAudience, setActiveAudience] = useState<AudienceKey>("students");
    const [displayAudience, setDisplayAudience] = useState<AudienceKey>("students");
    const [isSwitching, setIsSwitching] = useState(false);
    const [headingVisible, setHeadingVisible] = useState(false);
    const sectionRef = useRef<HTMLElement>(null);
    const switchTimeoutRef = useRef<number | null>(null);
    const contentPanelId = useId();
    const active = audienceContent[displayAudience];

    const handleAudienceChange = (nextAudience: AudienceKey) => {
        if (nextAudience === activeAudience) {
            return;
        }

        setActiveAudience(nextAudience);

        const prefersReducedMotion =
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        if (prefersReducedMotion) {
            setDisplayAudience(nextAudience);
            setIsSwitching(false);
            return;
        }

        setIsSwitching(true);
        if (switchTimeoutRef.current) {
            window.clearTimeout(switchTimeoutRef.current);
        }

        switchTimeoutRef.current = window.setTimeout(() => {
            setDisplayAudience(nextAudience);
            setIsSwitching(false);
        }, 210);
    };

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setHeadingVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.25 }
        );
        if (sectionRef.current) observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        return () => {
            if (switchTimeoutRef.current) {
                window.clearTimeout(switchTimeoutRef.current);
            }
        };
    }, []);

    return (
        <section
            id="audience"
            ref={sectionRef}
            className="landing-section scroll-mt-20 bg-white md:scroll-mt-24"
        >
            <div className="appContainer space-y-16 md:space-y-20">
                <div>
                    <div className="text-center">
                        <h3 className="text-2xl font-extrabold leading-tight text-black sm:text-4xl md:text-5xl">
                            <span className="mx-auto inline-flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-1.5">
                                <span>Built For</span>
                                <RoughNotation
                                    type="underline"
                                    show={headingVisible}
                                    color="#f0c544"
                                    strokeWidth={3}
                                    padding={3}
                                    animationDelay={500}
                                    animationDuration={1200}
                                >
                                    <span>Both</span>
                                </RoughNotation>
                                <RoughNotation
                                    type="circle"
                                    show={headingVisible}
                                    color="#f59e0b"
                                    strokeWidth={3}
                                    padding={8}
                                    animationDelay={900}
                                    animationDuration={1100}
                                >
                                    <span>Students</span>
                                </RoughNotation>
                                <span>And Parents</span>
                            </span>
                        </h3>
                        <p className="mx-auto mt-4 max-w-3xl text-sm leading-relaxed text-black/60 md:text-base">
                            Explore how our university serves as a hub of excellence, bringing
                            together top-tier education, cutting-edge research, and
                            groundbreaking innovation to transform the world.
                        </p>

                        <div
                            className="mx-auto mt-6 grid w-full max-w-sm grid-cols-2 rounded-2xl bg-sky-100 p-1 sm:inline-flex sm:w-auto sm:max-w-none sm:rounded-full"
                            role="group"
                            aria-label="Choose audience type"
                        >
                            <button
                                type="button"
                                onClick={() => handleAudienceChange("students")}
                                aria-pressed={activeAudience === "students"}
                                aria-controls={contentPanelId}
                                className={`landing-cta min-w-0 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:rounded-full sm:px-8 sm:py-2 ${
                                    activeAudience === "students"
                                        ? "bg-black text-white"
                                        : "text-black/55 hover:text-black"
                                }`}
                            >
                                For Students
                            </button>
                            <button
                                type="button"
                                onClick={() => handleAudienceChange("parents")}
                                aria-pressed={activeAudience === "parents"}
                                aria-controls={contentPanelId}
                                className={`landing-cta min-w-0 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:rounded-full sm:px-8 sm:py-2 ${
                                    activeAudience === "parents"
                                        ? "bg-black text-white"
                                        : "text-black/55 hover:text-black"
                                }`}
                            >
                                For Parents
                            </button>
                        </div>
                    </div>

                    <p className="sr-only" aria-live="polite" aria-atomic="true">
                        Showing details for {activeAudience === "students" ? "students" : "parents"}.
                    </p>

                    <div
                        id={contentPanelId}
                        className={`landing-card-lift mt-10 rounded-2xl border border-black/10 bg-amber-300 px-4 py-5 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] sm:px-6 sm:py-6 md:px-12 md:py-8 ${
                            isSwitching ? "translate-y-1 opacity-50" : "translate-y-0 opacity-100"
                        }`}
                    >
                        <div className="landing-grid-gap grid items-center lg:grid-cols-[0.48fr_0.52fr]">
                            <ul className="space-y-4">
                                {active.points.map((point, index) => (
                                    <li
                                        key={`${displayAudience}-${point}`}
                                        className="flex items-start gap-3 border-b border-black/10 pb-3 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
                                        style={{ transitionDelay: isSwitching ? "0ms" : `${index * 40}ms` }}
                                    >
                                        <FiCheckCircle className="mt-0.5 shrink-0 text-lg text-black" />
                                        <span className="landing-scribble-hover text-sm font-medium text-black/85 md:text-base">
                                            {point}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            <div className="mx-auto w-full max-w-[540px]">
                                <div className="relative h-[180px] w-full sm:h-[220px] md:h-[260px] lg:h-[300px]">
                                    <Image
                                        src={active.image}
                                        alt={active.imageAlt}
                                        width={1282}
                                        height={854}
                                        className="absolute bottom-0 right-0 h-full w-full object-contain transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] sm:-bottom-5 sm:scale-[1.1]"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="landing-grid-gap grid items-center lg:grid-cols-[0.44fr_0.56fr]">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-black/55">
                            WHY UNITRACKO EXISTS?
                        </p>
                        <h3 className="mt-4 text-3xl font-extrabold leading-tight text-black sm:text-4xl md:text-5xl">
                            Because One Missed Step
                            <span className="hidden md:inline">
                                <br />
                            </span>{" "}
                            Can Change Everything.
                        </h3>

                        <p className="mt-5 max-w-lg text-sm leading-relaxed text-black/60 md:text-base">
                            From Class 11 onward, the admission race quietly begins. Multiple
                            exams. Multiple portals. Endless deadlines. Decisions that shape an entire future.
                            <span className="block pt-3">
                                Most students realize the gaps only when it&apos;s too late.
                            </span>
                            <span className="block pt-3">
                                UniTracko brings exams, applications, colleges, career clarity and
                                financing into one structured system - so your future isn&apos;t left
                                to memory, confusion, or last-minute stress.
                            </span>
                        </p>

                        <Link
                            href="/login"
                            className="landing-cta mt-6 inline-flex w-full items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-black/85 sm:w-auto"
                        >
                            Get a demo
                        </Link>
                    </div>

                    <div className="mx-auto w-full max-w-[640px]">
                        <Image
                            src="/landing-page/whyus.png"
                            alt="One missed step impact"
                            width={1282}
                            height={854}
                            className="h-auto w-full object-cover"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
