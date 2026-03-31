"use client";

import { useEffect, useRef, useState } from "react";
import { FiCheck } from "react-icons/fi";
import { RoughNotation } from "react-rough-notation";

const contactPoints = [
    {
        title: "Course & College Fit",
        description: "Matched to your profile, not just popularity.",
    },
    {
        title: "Application Roadmap",
        description: "Every deadline and milestone, in one place.",
    },
    {
        title: "Scholarships & Loan Clarity",
        description: "Know the real cost before you decide.",
    },
];

export default function ContactSection() {
    const [isVisible, setIsVisible] = useState(false);
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.25 }
        );
        if (sectionRef.current) observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <section
            id="contact"
            ref={sectionRef}
            className="landing-section scroll-mt-20 bg-white md:scroll-mt-24"
        >
            <div className="appContainer">
                <div className="relative landing-grid-gap grid items-start lg:grid-cols-[0.46fr_0.54fr]">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-black/60">
                            CONTACT US
                        </p>

                        <h3 className="mt-4 text-4xl font-extrabold leading-[1.05] text-black md:text-5xl lg:text-[3.2rem]">
                            Plan Your Admission
                            <br />
                            Journey With{" "}
                            <RoughNotation
                                type="underline"
                                show={isVisible}
                                color="#f0c544"
                                strokeWidth={3}
                                padding={3}
                                animationDelay={500}
                                animationDuration={1300}
                            >
                                Precision
                            </RoughNotation>
                            .
                        </h3>

                        <p className="mt-4 max-w-lg text-sm leading-relaxed text-black/60 md:text-base">
                        Exam discovery to final decision, everything in one structured system.
                        </p>

                        <ul className="mt-8 space-y-6">
                            {contactPoints.map((point) => (
                                <li key={point.title} className="flex items-start gap-3">
                                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-300 text-black">
                                        <FiCheck className="text-sm" />
                                    </span>
                                    <div>
                                        <p className="text-base font-semibold text-black">
                                            <span className="landing-scribble-hover">{point.title}</span>
                                        </p>
                                        <p className="mt-1 text-sm text-black/60">{point.description}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="relative mx-auto w-full max-w-[460px]">
                        <div className="landing-card-lift rounded-2xl border border-black/10 bg-white p-6 shadow-sm md:p-8">
                            <p className="text-2xl font-bold text-black">Personal data</p>
                            <p className="mt-1 text-sm text-black/50">Specify details as in your passport</p>

                            <div className="mt-6 space-y-5">
                                <div>
                                    <label className="text-xs font-medium uppercase tracking-wide text-black/50">
                                        Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Type Your Name"
                                        className="mt-1 w-full border-b border-black/20 bg-transparent pb-2 text-sm text-black placeholder:text-black/35 transition-colors duration-200 focus:border-black/40 focus:outline-none"
                                    />
                                </div>

                                <div className="grid gap-5">
                                    <div>
                                        <label className="text-xs font-medium uppercase tracking-wide text-black/50">
                                            Your Email
                                        </label>
                                        <input
                                            type="email"
                                            placeholder="Type Your Email"
                                            className="mt-1 w-full border-b border-black/20 bg-transparent pb-2 text-sm text-black placeholder:text-black/35 transition-colors duration-200 focus:border-black/40 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium uppercase tracking-wide text-black/50">
                                            Your Contact Number
                                        </label>
                                        <input
                                            type="tel"
                                            placeholder="Type Your number"
                                            className="mt-1 w-full border-b border-black/20 bg-transparent pb-2 text-sm text-black placeholder:text-black/35 transition-colors duration-200 focus:border-black/40 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-5">
                                    <div>
                                        <label className="text-xs font-medium uppercase tracking-wide text-black/50">
                                            Current Class
                                        </label>
                                        <select className="mt-1 w-full border-b border-black/20 bg-transparent pb-2 text-sm text-black transition-colors duration-200 focus:border-black/40 focus:outline-none">
                                            <option>10th</option>
                                            <option>11th</option>
                                            <option>12th</option>
                                            <option>Dropper</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-xs font-medium uppercase tracking-wide text-black/50">
                                            Stream Interested in
                                        </label>
                                        <select className="mt-1 w-full border-b border-black/20 bg-transparent pb-2 text-sm text-black transition-colors duration-200 focus:border-black/40 focus:outline-none">
                                            <option>PCMB</option>
                                            <option>PCM</option>
                                            <option>PCB</option>
                                            <option>Commerce</option>
                                            <option>Humanities</option>
                                        </select>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className="landing-cta mt-5 w-full rounded-full bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-black/85"
                                >
                                    Start My Admission Plan
                                </button>

                                <p className="text-center text-xs font-semibold text-green-700">
                                    Your Data stays private. No spam. No pressure. No promotional
                                    calls
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
