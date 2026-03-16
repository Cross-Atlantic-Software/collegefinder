"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
        imageAlt: "Students using unitracko",
    },
    parents: {
        points: [
            "Single dashboard for your child’s entire journey",
            "No missed forms, no surprise fees, no last-minute panic",
            "Clear cost and scholarship visibility",
            "Progress tracking with structured updates",
            "Confidence in every decision point",
        ],
        image: "/landing-page/how_it_works.png",
        imageAlt: "Parents confidence view",
    },
};

export default function AudienceSection() {
    const [activeAudience, setActiveAudience] = useState<AudienceKey>("students");
    const [headingVisible, setHeadingVisible] = useState(false);
    const sectionRef = useRef<HTMLElement>(null);
    const active = audienceContent[activeAudience];

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

    return (
        <section ref={sectionRef} className="landing-section bg-white">
            <div className="appContainer space-y-16 md:space-y-20">
                <div>
                    <div className="text-center">
                        <h3 className="text-4xl font-extrabold leading-tight text-black md:text-5xl">
                            Built For{" "}
                            <RoughNotation
                                type="underline"
                                show={headingVisible}
                                color="#f0c544"
                                strokeWidth={3}
                                padding={3}
                                animationDelay={500}
                                animationDuration={1200}
                            >
                                Both
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
                                <span className="ml-2">Students</span>
                            </RoughNotation>
                            And
                            <span className="ml-2">Parents</span>
                        </h3>
                        <p className="mx-auto mt-4 max-w-3xl text-sm text-black/60 md:text-base">
                            Explore how our university serves as a hub of excellence, bringing
                            together top-tier education, cutting-edge research, and
                            groundbreaking innovation to transform the world.
                        </p>

                        <div className="mx-auto mt-6 inline-flex rounded-full bg-sky-100 p-1">
                            <button
                                type="button"
                                onClick={() => setActiveAudience("students")}
                                className={`landing-cta rounded-full px-8 py-2 text-sm font-semibold ${
                                    activeAudience === "students"
                                        ? "bg-black text-white"
                                        : "text-black/55 hover:text-black"
                                }`}
                            >
                                For Students
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveAudience("parents")}
                                className={`landing-cta rounded-full px-8 py-2 text-sm font-semibold ${
                                    activeAudience === "parents"
                                        ? "bg-black text-white"
                                        : "text-black/55 hover:text-black"
                                }`}
                            >
                                For Parents
                            </button>
                        </div>
                    </div>

                    <div className="landing-card-lift mt-10 rounded-2xl border border-black/10 bg-amber-300 px-7 py-9 md:px-12 md:py-12">
                        <div className="landing-grid-gap grid items-center lg:grid-cols-[0.48fr_0.52fr]">
                            <ul className="space-y-4">
                                {active.points.map((point) => (
                                    <li key={point} className="flex items-start gap-3 border-b border-black/10 pb-3">
                                        <FiCheckCircle className="mt-0.5 shrink-0 text-lg text-black" />
                                        <span className="landing-scribble-hover text-sm font-medium text-black/85 md:text-base">
                                            {point}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            <div className="mx-auto w-full max-w-[560px]">
                                <Image
                                    src={active.image}
                                    alt={active.imageAlt}
                                    width={1282}
                                    height={854}
                                    className="h-auto w-full object-cover"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="landing-grid-gap grid items-center lg:grid-cols-[0.44fr_0.56fr]">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-black/55">
                            WHY UNITRACKO EXISTS?
                        </p>
                        <h3 className="mt-4 text-4xl font-extrabold leading-tight text-black md:text-5xl">
                            Because One Missed Step
                            <br />
                            Can Change Everything.
                        </h3>

                        <p className="mt-5 max-w-lg text-sm leading-relaxed text-black/60 md:text-base">
                            From Class 11 onward, the admission race quietly begins. Multiple
                            exams. Multiple portals. Endless deadlines. Decisions that shape an
                            entire future.
                            <br />
                            Most students realize the gaps only when it&apos;s too late.
                            <br />
                            Unitracko brings exams, applications, colleges, career clarity and
                            financing into one structured system — so your future isn&apos;t left to
                            memory, confusion, or last-minute stress.
                        </p>

                        <Link
                            href="/login"
                            className="landing-cta mt-6 inline-flex items-center rounded-full bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-black/85"
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
