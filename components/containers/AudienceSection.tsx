"use client";

import Image from "next/image";
// import Link from "next/link"; // restore when the "Why UniTracko Exists" section below is re-enabled
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { FiCheckCircle } from "react-icons/fi";
import { RoughNotation } from "react-rough-notation";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import eyeAnim from "@/public/LottieiCONS/doodle-black-221-eye-hover-pinch.json";
import idCardAnim from "@/public/LottieiCONS/doodle-black-16-id-business-card-hover-pinch.json";
import folderUserAnim from "@/public/LottieiCONS/doodle-black-714-folder-user-hover-pinch.json";
import type { LandingPageContent } from "@/types/landingPage";

type AudienceKey = "students" | "parents";

const WHY_CHOOSE_CARDS: Array<{ text: string; doodle?: object; svg?: string }> = [
    { text: "No Commissions.\nNo Hidden Agendas.\nNo Guesswork.", doodle: idCardAnim },
    { text: "You decide.\nWe empower.", doodle: folderUserAnim },
    { text: "Insights backed by\nreal information.", doodle: eyeAnim },
    { text: "Clarity you can\ntrust.", svg: "/LottieiCONS/doodle-black-717-web-protection-hover-pinch.gif" },
];

/** Site-style hand-drawn doodle that plays once, then loops with a short pause. */
function CardDoodle({ animationData }: { animationData: object }) {
    const lottieRef = useRef<LottieRefCurrentProps>(null);
    return (
        <Lottie
            lottieRef={lottieRef}
            animationData={animationData}
            loop={false}
            onComplete={() => {
                setTimeout(() => lottieRef.current?.goToAndPlay(0, true), 1400);
            }}
            className="h-12 w-12"
        />
    );
}

export default function AudienceSection({ audience }: { audience: LandingPageContent["audience"] }) {
    const [activeAudience, setActiveAudience] = useState<AudienceKey>("students");
    const [displayAudience, setDisplayAudience] = useState<AudienceKey>("students");
    const [isSwitching, setIsSwitching] = useState(false);
    const [headingVisible, setHeadingVisible] = useState(false);
    const sectionRef = useRef<HTMLElement>(null);
    const switchTimeoutRef = useRef<number | null>(null);
    const contentPanelId = useId();

    const audienceContent = useMemo(
        (): Record<
            AudienceKey,
            {
                points: string[];
                image: string;
                imageAlt: string;
            }
        > => ({
            students: {
                points: [
                    "Guidance based on student goals and preferences.",
                    "Uncover opportunities beyond the obvious choices.",
                    "Access to transparent, student-first intelligent decision support.",
                    "Psycho-analytical profiling and assessment-based aptitude mapping.",
                ],
                image: "/landing-page/how_it_works.png",
                imageAlt: "Students using UniTracko",
            },
            parents: {
                points: [
                    "Recommendations based on fit—not incentives.",
                    "No commission-based suggestions.",
                    "Cost and scholarship clarity.",
                    "Live progress tracking at every step.",
                ],
                image: "/landing-page/parent.png",
                imageAlt: "Parents confidence view",
            },
        }),
        []
    );

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
                    observer.disconnect();
                    queueMicrotask(() => setHeadingVisible(true));
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
            ref={sectionRef}
            className="landing-section scroll-mt-20 bg-white md:scroll-mt-24"
        >
            <div className="appContainer space-y-16 md:space-y-20">
                <div>
                    <div className="text-center">
                        <h3 className="overflow-visible text-2xl font-extrabold leading-tight text-black sm:text-4xl md:text-5xl">
                            <span className="mx-auto inline-flex max-w-full flex-wrap items-baseline justify-center gap-x-3 gap-y-2 sm:gap-x-4">
                                <span className="relative z-10 inline-block shrink-0">
                                    {audience.headingBuiltFor}
                                </span>
                                <RoughNotation
                                    type="underline"
                                    show={headingVisible}
                                    color="#f0c544"
                                    strokeWidth={3}
                                    padding={3}
                                    animationDelay={500}
                                    animationDuration={1200}
                                >
                                    <span className="inline-block px-0.5">{audience.headingBoth}</span>
                                </RoughNotation>
                                <RoughNotation
                                    type="circle"
                                    show={headingVisible && activeAudience === "students"}
                                    color="#f59e0b"
                                    strokeWidth={3}
                                    padding={[4, 6, 4, 2]}
                                    animationDelay={activeAudience === "students" ? 250 : 0}
                                    animationDuration={1100}
                                >
                                    <span className="inline-block px-1">{audience.headingStudents}</span>
                                </RoughNotation>
                                <span className="relative z-10 inline-block shrink-0">
                                    {audience.headingAnd}
                                </span>
                                <RoughNotation
                                    type="circle"
                                    show={headingVisible && activeAudience === "parents"}
                                    color="#f59e0b"
                                    strokeWidth={3}
                                    padding={[4, 6, 4, 2]}
                                    animationDelay={activeAudience === "parents" ? 250 : 0}
                                    animationDuration={1100}
                                >
                                    <span className="inline-block px-1">{audience.headingParents}</span>
                                </RoughNotation>
                            </span>
                        </h3>

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
                                {audience.tabStudents}
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
                                {audience.tabParents}
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

                {/* ===== "Why UniTracko Exists" section — temporarily hidden (kept for later) =====
                <div className="landing-grid-gap grid items-center lg:grid-cols-[0.44fr_0.56fr]">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-black/55">
                            {audience.whyLabel}
                        </p>
                        <h3 className="mt-4 text-3xl font-extrabold leading-tight text-black sm:text-4xl md:text-5xl">
                            {audience.whyTitle}
                            <span className="hidden md:inline">
                                <br />
                            </span>{" "}
                            {audience.whyTitleBreak}
                        </h3>

                        <p className="mt-5 max-w-lg whitespace-pre-line text-sm leading-relaxed text-black/60 md:text-base">
                        {audience.whyBody}
                            <span className="mt-3 block whitespace-pre-line pt-3">
                            {audience.whyBody2}
                            </span>
                        </p>

                        <Link
                            href="/signup"
                            className="landing-cta mt-6 inline-flex w-full items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-black/85 sm:w-auto"
                        >
                            {audience.whyCta}
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
                ===== end hidden section ===== */}

                {/* Why Choose UniTracko? */}
                <div className="text-center">
                    <h3 className="text-3xl font-extrabold leading-tight text-black sm:text-4xl md:text-5xl">
                        Why Choose <span className="text-[#f0c544]">UniTracko?</span>
                    </h3>
                    <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-black/60 md:text-base">
                        The admission race begins in Class 11 and most students don&apos;t realize how
                        much they&apos;re missing until it&apos;s too late. UniTracko makes sure that
                        never happens.
                    </p>

                    <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {WHY_CHOOSE_CARDS.map((card) => (
                            <div
                                key={card.text}
                                className="group flex flex-col items-center gap-4 rounded-[22px] border-2 border-black/10 bg-amber-50/70 px-6 py-8 text-center transition-all duration-300 hover:-translate-y-1 hover:border-[#f0c544] hover:shadow-[0_12px_30px_-12px_rgba(240,197,68,0.6)]"
                            >
                                <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#f0c544]/25">
                                    {card.svg ? (
                                        <Image src={card.svg} alt="" width={48} height={48} className="h-12 w-12" unoptimized />
                                    ) : card.doodle ? (
                                        <CardDoodle animationData={card.doodle} />
                                    ) : null}
                                </span>
                                <p className="whitespace-pre-line text-base font-semibold leading-relaxed text-black">
                                    {card.text}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
