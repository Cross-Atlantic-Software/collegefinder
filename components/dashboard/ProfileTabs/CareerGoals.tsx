// src/components/user/CareerGoalsTab.tsx
"use client";

import Image from "next/image";
import { useState } from "react";

const interestOptions = [
    { id: "tech", label: "Technology", image: "/icons/tech.png" },
    { id: "design", label: "Design", image: "/icons/design.png" },
    { id: "medical", label: "Medical", image: "/icons/medical.png" },
    { id: "engineering", label: "Engineering", image: "/icons/engineering.png" },
    { id: "business", label: "Business", image: "/icons/business.png" },
    { id: "science", label: "Science", image: "/icons/science.png" },
];

const vibeOptions = [
    "Problem Solver",
    "Creative Mind",
    "Team Player",
    "Leader",
];

export default function CareerGoalsTab() {
    const [selectedInterests, setSelectedInterests] = useState<string[]>([
        "design",
    ]);

    const [dreamCareers, setDreamCareers] = useState<string[]>([
        "Software Engineer",
        "Data Scientist",
    ]);

    const [careerInput, setCareerInput] = useState("");
    const [selectedVibes, setSelectedVibes] = useState<string[]>([
        "Creative Mind",
    ]);

    const toggleInterest = (id: string) => {
        setSelectedInterests((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );
    };

    const toggleVibe = (label: string) => {
        setSelectedVibes((prev) =>
            prev.includes(label)
                ? prev.filter((x) => x !== label)
                : [...prev, label],
        );
    };

    const addCareer = () => {
        const value = careerInput.trim();
        if (!value) return;
        if (!dreamCareers.includes(value)) {
            setDreamCareers((prev) => [...prev, value]);
        }
        setCareerInput("");
    };

    const removeCareer = (label: string) => {
        setDreamCareers((prev) => prev.filter((c) => c !== label));
    };

    const handleCareerKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addCareer();
        }
    };

    return (
        <section className="rounded bg-white/5 text-sm text-slate-100 p-4">
            {/* Section title */}
            <h2 className="mb-1 text-base font-semibold text-pink sm:text-lg">
                Academic Profile
            </h2>
            <p className="text-sm sm:text-sm text-slate-300 dark:text-slate-200">Tell us what excites you! This helps us find the perfect matches.</p>

            {/* What excites you */}
            <div className="mt-4 space-y-3">
                <h3 className="text-sm font-semibold sm:text-lg text-slate-100 dark:text-slate-200">
                    What excites you?
                </h3>
                <div className="grid gap-4 sm:grid-cols-3">
                    {interestOptions.map((opt) => {
                        const active = selectedInterests.includes(opt.id);
                        return (
                            <button
                                key={opt.id}
                                type="button"
                                onClick={() => toggleInterest(opt.id)}
                                className={[
                                    "flex flex-col items-center justify-center rounded-md p-5 text-center transition duration-500",
                                    "border group",
                                    active
                                        ? "bg-pink text-pink border-pink"
                                        : "bg-white/5 border-white/20 hover:bg-pink",
                                ].join(" ")}
                            >
                                <Image
                                    src={opt.image}
                                    alt={opt.label}
                                    width={60}
                                    height={60}
                                    className="mb-2 h-14 w-14 object-contain sm:h-16 sm:w-16"
                                    priority
                                />
                                <span
                                    className={`text-md font-semibold transition duration-500 ${
                                        active ? "text-white" : "text-slate-200 group-hover:text-white dark:text-slate-200"
                                    }`}
                                >
                                    {opt.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Dream Careers */}
            <div className="mt-8 space-y-3">
                <h3 className="text-sm font-semibold sm:text-lg text-slate-100 dark:text-slate-200">
                    Dream Careers
                </h3>

                {/* Chips */}
                <div className="flex flex-wrap gap-2">
                    {dreamCareers.map((career) => (
                        <button
                            key={career}
                            type="button"
                            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#7B2FF7] via-[#C32DE0] to-[#FF2D92] px-4 py-1.5 text-xs font-medium shadow-md"
                            onClick={() => removeCareer(career)}
                        >
                            <span>{career}</span>
                            <span className="text-sm">×</span>
                        </button>
                    ))}
                </div>

                {/* Input */}
                <div className="mt-2">
                    <label className="mb-1 block text-sm font-medium text-slate-300 dark:text-slate-200">
                        Type to add more careers
                    </label>
                    <div className="">
                        <input
                            type="text"
                            value={careerInput}
                            onChange={(e) => setCareerInput(e.target.value)}
                            onKeyDown={handleCareerKeyDown}
                            placeholder="e.g. Product Manager"
                            className="w-full rounded border border-pink/10 bg-white/10 px-3 py-3 text-sm text-slate-100 outline-none placeholder:text-white/50 focus:outline-none focus:border-pink transition duration-500 dark:text-white"
                        />
                    </div>
                </div>
            </div>

            {/* Your Vibe */}
            <div className="mt-8 space-y-3">
                <h3 className="text-sm font-semibold sm:text-lg text-slate-100 dark:text-slate-200">
                    Your Vibe
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                    {vibeOptions.map((vibe) => {
                        const active = selectedVibes.includes(vibe);
                        return (
                            <button
                                key={vibe}
                                type="button"
                                onClick={() => toggleVibe(vibe)}
                                className={[
                                    "flex flex-col items-center justify-center rounded-md p-4 text-center transition duration-500",
                                    "border group",
                                    active
                                        ? "bg-pink text-pink border-pink"
                                        : "bg-white/5 border-white/20 hover:bg-pink",
                                ].join(" ")}
                            >
                                <span className={`text-md font-semibold transition duration-500 ${
                                        active ? "text-white" : "text-slate-200 group-hover:text-white dark:text-slate-200"
                                    }`}
                                >{vibe}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
