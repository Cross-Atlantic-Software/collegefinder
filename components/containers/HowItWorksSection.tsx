"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FiCheck, FiChevronDown, FiChevronRight } from "react-icons/fi";

const steps = [
    { title: "Discover", description: "Find exams and colleges that fit your profile." },
    {
        title: "Plan",
        description:
            "Track submissions, payments and updates in real time. No missed steps. No last-minute scrambling.",
    },
    { title: "One click apply", description: "Reuse verified details across forms instantly." },
    { title: "Preparation", description: "Stay exam-ready with reminders and resources." },
    { title: "Decide", description: "Compare outcomes and pick the right path." },
];

const OPEN_DURATION_MS = 4200;
const HOW_IT_WORKS_VIDEO_EMBED_URL =
    "https://www.youtube.com/embed/M7lc1UVf-VE?rel=0&modestbranding=1";
const HOW_IT_WORKS_VIDEO_WATCH_URL = "https://www.youtube.com/watch?v=M7lc1UVf-VE";

export default function HowItWorksSection() {
    const sectionRef = useRef<HTMLElement | null>(null);
    const [isInView, setIsInView] = useState(false);
    const [revealedStepCount, setRevealedStepCount] = useState(0);
    const [openStep, setOpenStep] = useState(0);
    const [totalProgress, setTotalProgress] = useState(0);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setOpenStep((prev) => (prev + 1) % steps.length);
        }, OPEN_DURATION_MS);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [openStep]);

    useEffect(() => {
        const startTime = performance.now();
        const totalDuration = OPEN_DURATION_MS * steps.length;
        let frameId = 0;

        const animate = (now: number) => {
            const elapsed = now - startTime;
            const rawProgress = (elapsed % totalDuration) / totalDuration;
            setTotalProgress(rawProgress * 100);
            frameId = window.requestAnimationFrame(animate);
        };

        frameId = window.requestAnimationFrame(animate);

        return () => {
            window.cancelAnimationFrame(frameId);
        };
    }, []);

    useEffect(() => {
        const sectionNode = sectionRef.current;
        if (!sectionNode) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) {
                    setIsInView(true);
                    observer.unobserve(sectionNode);
                }
            },
            {
                threshold: 0.2,
            },
        );

        observer.observe(sectionNode);

        return () => {
            observer.disconnect();
        };
    }, []);

    useEffect(() => {
        if (!isInView) {
            return;
        }

        let nextCount = 0;

        const intervalId = window.setInterval(() => {
            nextCount += 1;
            setRevealedStepCount(nextCount);

            if (nextCount >= steps.length) {
                window.clearInterval(intervalId);
            }
        }, 170);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [isInView]);

    return (
        <section
            id="how-it-works"
            ref={sectionRef}
            className="landing-section scroll-mt-20 bg-white md:scroll-mt-24"
        >
            <div className="appContainer">
                <div className="landing-grid-gap grid items-start lg:grid-cols-[0.42fr_0.58fr]">
                    <div>
                        <h3
                            className={`text-4xl font-extrabold leading-tight text-black transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] md:text-5xl ${
                                isInView ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
                            }`}
                        >
                            How It Works?
                        </h3>
                        <p
                            className={`mt-4 max-w-xl text-sm leading-relaxed text-black/60 transition-all delay-100 duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] md:text-base ${
                                isInView ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
                            }`}
                        >
                            Explore how our university serves as a hub of excellence, bringing
                            together top-tier education, cutting-edge research, and
                            groundbreaking innovation to transform the world.
                        </p>

                        <div className="relative mt-8">
                            <span
                                aria-hidden="true"
                                className="pointer-events-none absolute bottom-6 left-[18px] top-6 w-px bg-black/10"
                            />
                            <span
                                aria-hidden="true"
                                className="pointer-events-none absolute left-[18px] top-6 w-px -translate-x-1/2 rounded-full bg-yellow-400/90"
                                style={{ height: `calc((100% - 3rem) * ${totalProgress / 100})` }}
                            />

                            <ul>
                                {steps.map((step, index) => {
                                    const isOpen = openStep === index;
                                    const isCompleted = index < openStep;
                                    const isStepRevealed = index < revealedStepCount;

                                    return (
                                        <li
                                            key={step.title}
                                            className={`relative py-3 transition-all duration-600 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                                                isStepRevealed
                                                    ? "translate-y-0 opacity-100"
                                                    : "pointer-events-none translate-y-5 opacity-0"
                                            }`}
                                        >
                                            {index !== 0 ? (
                                                <span
                                                    aria-hidden="true"
                                                    className="pointer-events-none absolute left-[40px] right-0 top-0 h-px bg-black/10"
                                                />
                                            ) : null}

                                            <button
                                                type="button"
                                                onClick={() => setOpenStep(index)}
                                                className="flex w-full items-center justify-between gap-4 text-left"
                                            >
                                                <span className="flex items-center gap-4">
                                                    <span
                                                        className={`relative z-[1] inline-flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-300 ${
                                                            isCompleted
                                                                                                                                ? "border-yellow-400 bg-yellow-400"
                                                                : isOpen
                                                                                                                                    ? "border-yellow-400 bg-yellow-100"
                                                                                                                                    : "border-yellow-300 bg-white"
                                                        }`}
                                                    >
                                                        <FiCheck
                                                            className={`text-base transition-all duration-300 ${
                                                                isCompleted
                                                                                                                                        ? "animate-tick-pop text-black"
                                                                    : isOpen
                                                                                                                                            ? "animate-tick-pop text-black/90"
                                                                                                                                            : "text-black/45"
                                                            }`}
                                                        />
                                                    </span>
                                                    <span
                                                        className={`text-base leading-none transition-colors duration-300 md:text-lg ${
                                                            isOpen
                                                                ? "text-black"
                                                                : isCompleted
                                                                  ? "text-black/75"
                                                                  : "text-black/85"
                                                        }`}
                                                    >
                                                        {step.title}
                                                    </span>
                                                </span>
                                                {isOpen ? (
                                                    <FiChevronDown className="mb-0.5 shrink-0 self-end text-lg text-black/75 md:text-xl" />
                                                ) : (
                                                    <FiChevronRight className="mb-0.5 shrink-0 self-end text-lg text-black/75 md:text-xl" />
                                                )}
                                            </button>

                                            <div
                                                className={`grid overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                                                    isOpen
                                                        ? "mt-2 grid-rows-[1fr] opacity-100"
                                                        : "mt-0 grid-rows-[0fr] opacity-0"
                                                }`}
                                            >
                                                <div className="overflow-hidden">
                                                    <p className="pl-[52px] pr-7 text-sm leading-relaxed text-black/60 md:text-base">
                                                        {step.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>

                        <div
                            className={`mt-8 flex flex-wrap items-center gap-4 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                                isInView ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
                            }`}
                            style={{ transitionDelay: "760ms" }}
                        >
                            <Link
                                href="/login"
                                className="landing-cta group inline-flex items-center gap-2 rounded-full bg-black px-8 py-3 text-sm font-semibold text-white hover:bg-black/85 md:text-base"
                            >
                                Get a demo
                                <FiChevronRight className="landing-icon-slide text-base" />
                            </Link>
                            <Link
                                href="/login"
                                className="landing-cta group inline-flex items-center gap-2 rounded-full border border-black/20 bg-white px-8 py-3 text-sm font-semibold text-black/75 hover:text-black md:text-base"
                            >
                                Get started free
                                <FiChevronRight className="landing-icon-slide text-base" />
                            </Link>
                        </div>
                    </div>

                    <div
                        className={`relative mx-auto w-full max-w-[760px] pt-10 transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] lg:self-center lg:pt-0 ${
                            isInView ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                        }`}
                        style={{ transitionDelay: "560ms" }}
                    >
                        <svg
                            viewBox="0 0 220 120"
                            aria-hidden="true"
                            className="pointer-events-none absolute -left-10 -top-2 z-30 h-20 w-44 text-black"
                        >
                            <path
                                d="M18 88 C44 70, 63 67, 85 66"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="8"
                                strokeLinecap="round"
                            />
                            <path
                                d="M72 45 C88 58, 102 65, 118 74"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="8"
                                strokeLinecap="round"
                            />
                            <path
                                d="M136 10 C126 38, 124 60, 123 84"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="8"
                                strokeLinecap="round"
                            />
                        </svg>

                        <div className="absolute -left-5 bottom-0 z-0 h-[82%] w-[82%] rounded-[18px] bg-sky-200" />
                        <div className="absolute right-0 top-0 z-0 h-[82%] w-[86%] rounded-[18px] bg-amber-200" />

                        <div className="landing-card-lift relative z-10 aspect-[751/512] overflow-hidden rounded-[30px] border border-black/15 bg-black shadow-[0_24px_60px_-28px_rgba(2,6,23,0.5)] ring-1 ring-black/5">
                            <iframe
                                src={HOW_IT_WORKS_VIDEO_EMBED_URL}
                                title="How it works video preview"
                                className="h-full w-full"
                                loading="lazy"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                referrerPolicy="strict-origin-when-cross-origin"
                                allowFullScreen
                            />
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-black/5" />
                            <div className="pointer-events-none absolute bottom-4 left-4 rounded-full bg-black/55 px-3 py-1 text-[11px] font-semibold tracking-wide text-white/90 backdrop-blur-sm">
                                Quick Platform Walkthrough
                            </div>
                            <a
                                href={HOW_IT_WORKS_VIDEO_WATCH_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="landing-cta absolute right-4 top-4 rounded-full border border-white/25 bg-black/60 px-4 py-2 text-xs font-semibold tracking-wide text-white backdrop-blur-md hover:bg-black/75"
                            >
                                Open on YouTube
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
