"use client";

import { useEffect, useRef, useState } from "react";
import { FiPlus } from "react-icons/fi";
import { RoughNotation } from "react-rough-notation";

const faqItems = [
    {
        question: "How is Unitracko different from Google or WhatsApp groups?",
        answer:
            "Google gives information. Unitracko manages it. Instead of scattered tabs and missed reminders, you get one unified dashboard with automated tracking.",
    },
    {
        question: "Can Unitracko help me find exams I haven't heard of?",
        answer:
            "Yes. It surfaces relevant exams and opportunities based on your profile, not just the most popular options.",
    },
    {
        question: "How does Unitracko complete forms in seconds?",
        answer:
            "Your profile is structured once, then reused across forms with one-click autofill to reduce repetitive manual entry.",
    },
    {
        question: "Is One-Click Form Filling secure?",
        answer:
            "Yes. Personal details are stored with strict access controls and used only for your verified application workflow.",
    },
    {
        question: "Is this only for Engineering or Medical students?",
        answer:
            "No. It supports multiple streams and pathways, including commerce, humanities, design and more.",
    },
    {
        question:
            "What is Psycho-Analytical Profiling and how is it different from regular career quizzes?",
        answer:
            "It combines aptitude, behavior and preference signals to suggest deeper-fit paths instead of generic one-dimensional outcomes.",
    },
    {
        question: "How accurate is the Psycho-Analytical Profiling assessment?",
        answer:
            "Accuracy improves with profile completeness and usage behavior, giving increasingly relevant recommendations over time.",
    },
];

export default function FaqSection() {
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
                    Frequently Asked
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
                        Questions
                    </RoughNotation>
                </h3>

                <div className="mx-auto mt-12 max-w-5xl divide-y divide-black/10 border-y border-black/10 bg-transparent md:mt-14">
                    {faqItems.map((item, index) => {
                        const isOpen = openIndex === index;

                        return (
                            <div
                                key={item.question}
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
                                    <p className="max-w-4xl overflow-hidden text-sm leading-relaxed text-black/65 md:text-base">
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
