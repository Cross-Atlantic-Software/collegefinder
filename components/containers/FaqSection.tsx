"use client";

import { useEffect, useRef, useState } from "react";
import { FiPlus } from "react-icons/fi";
import { RoughNotation } from "react-rough-notation";
import type { LandingPageContent } from "@/types/landingPage";

export default function FaqSection({ faq }: { faq: LandingPageContent["faq"] }) {
    const faqItems = faq.items || [];
    const [openIndex, setOpenIndex] = useState(0);
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
            id="faq"
            ref={sectionRef}
            className="landing-section scroll-mt-20 bg-white md:scroll-mt-24"
        >
            <div className="appContainer">
                <h3 className="text-center text-4xl font-extrabold leading-tight text-black md:text-5xl">
                    {faq.titleLine1}
                    <br />
                    <RoughNotation
                        type="underline"
                        show={isVisible}
                        color="#f0c544"
                        strokeWidth={3}
                        padding={3}
                        animationDelay={500}
                        animationDuration={1300}
                    >
                        {faq.titleLine2}
                    </RoughNotation>
                </h3>

                <div className="mx-auto mt-12 max-w-5xl divide-y divide-black/10 border-y border-black/10 bg-transparent md:mt-14">
                    {faqItems.map((item, index) => {
                        const isOpen = openIndex === index;

                        return (
                            <div
                                key={`faq-${index}`}
                                className="rounded-none px-1 py-6 transition-colors duration-300 hover:bg-amber-100/70 md:px-2 md:py-7"
                            >
                                <button
                                    type="button"
                                    onClick={() => setOpenIndex(isOpen ? -1 : index)}
                                    className="flex w-full items-start justify-between gap-7 text-left md:gap-8"
                                >
                                    <span className="text-lg font-semibold leading-snug text-black md:text-xl">
                                        {item.question}
                                    </span>
                                    <span
                                        className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${
                                            isOpen
                                                ? "bg-amber-300 text-black"
                                                : "bg-slate-200 text-slate-500"
                                        }`}
                                    >
                                        <FiPlus
                                            className={`text-base transition-transform duration-300 ${
                                                isOpen ? "rotate-45" : "rotate-0"
                                            }`}
                                        />
                                    </span>
                                </button>

                                <div
                                    className={`grid overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                                        isOpen
                                            ? "mt-4 grid-rows-[1fr] opacity-100"
                                            : "mt-0 grid-rows-[0fr] opacity-0"
                                    }`}
                                >
                                    <p className="max-w-4xl overflow-hidden whitespace-pre-line text-sm leading-relaxed text-black/65 md:text-base">
                                        {item.answer}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
