"use client";

import Image from "next/image";
import { PiSquaresFourFill } from "react-icons/pi";
import Heading from "../shared/Typography";

const items = [
    {
        title: "Programs for the International students",
        description:
            "Explore how our university serves as a hub of excellence, bringing together top-tier education, cutting-edge.",
    },
    {
        title: "Part time programs with stay.",
        description:
            "Explore how our university serves as a hub of excellence, bringing together top-tier education, cutting-edge.",
    },
    {
        title: "Job opportunities for the best results.",
        description:
            "Explore how our university serves as a hub of excellence, bringing together top-tier education, cutting-edge.",
    },
    {
        title: "Programs for the International students",
        description:
            "Explore how our university serves as a hub of excellence, bringing together top-tier education, cutting-edge.",
    },
];

export default function InternationalInfoSection() {
    return (
        <section className="relative overflow-hidden bg-lightGradient dark:bg-none py-16 dark:bg-[#050816]">
            <div className="appContainer">
                <div className="mx-auto px-4 lg:px-0">
                    {/* Heading */}
                    <div className="mb-10">
                        <Heading align="center" head="Information for International students" description="Explore how our university serves as a hub of excellence, bringing together top-tier education, cutting-edge research, and groundbreaking innovation to transform the world."/>
                    </div>

                    {/* Content */}
                    <div className="flex flex-col items-center gap-10 lg:grid lg:grid-cols-[45%_55%] lg:items-center">
                        {/* LEFT – list */}
                        <div className="w-full space-y-6">
                            {items.map((item, index) => (
                                <div
                                    key={item.title + index}
                                    className={`flex gap-4 pb-6 ${
                                        index !== items.length - 1
                                            ? "border-b border-pink/20"
                                            : ""
                                    }`}
                                >
                                    <div className="flex h-12 w-12 items-center justify-center rounded bg-white shadow-sm shadow-pink/10 dark:bg-slate-900 flex-shrink-0">
                                        <PiSquaresFourFill className="text-xl text-pink" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-900 md:text-base dark:text-slate-50">
                                            {item.title}
                                        </h3>
                                        <p className="mt-1 text-xs leading-relaxed text-slate-700 md:text-sm dark:text-slate-300">
                                            {item.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* RIGHT – tablet image */}
                        <div className="flex w-full justify-center">
                            <div className="relative w-full max-w-xl">
                                <Image
                                    src="/featuresslide.png" // update to your actual image path
                                    alt="International students dashboard preview"
                                    width={1000}
                                    height={700}
                                    priority
                                    className="h-auto w-full object-contain drop-shadow-xl"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
