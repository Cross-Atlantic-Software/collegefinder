"use client";

import Image from "next/image";
import { Button } from "../shared";
import { BsStars } from "react-icons/bs";
import { FiChevronRight } from "react-icons/fi";
import Link from "next/link";

const experienceList = [
    "Bachelor of Engineering",
    "Civil Engineering",
    "Mechanical Engineering",
    "Automobile Engineering",
    "Aerospace Engineering",
    "Aeronautical Engineering",
];

export default function CareerGuidanceSection() {
    return (
        <section className="relative overflow-hidden bg-white py-16 dark:bg-[#050816]">
            <div className="appContainer">
                <div className="grid items-center gap-12 lg:grid-cols-[45%_55%] lg:gap-20">
                    {/* LEFT SIDE */}
                    <div>
                        {/* Badge */}
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow dark:bg-slate-900 dark:text-white">
                            <BsStars className="text-lg text-orange-500" />
                            <span>Career Guidance</span>
                        </div>

                        {/* Heading */}
                        <h2 className="mb-5 text-4xl font-semibold leading-[1.2] text-slate-900 md:text-5xl dark:text-white">
                            Career Guidance
                            <br />
                            That Actually
                            <br />
                            Delivers
                        </h2>

                        {/* Description */}
                        <p className="max-w-md text-base leading-relaxed text-slate-700 md:text-lg dark:text-slate-300">
                            Explore how our university serves as a hub of excellence, bringing
                            together top-tier education, cutting-edge research, and
                            groundbreaking innovation to transform the world.
                        </p>

                        {/* Buttons */}
                        <div className="mt-8 flex flex-wrap gap-4">
                            <Button variant="themeButton" size="md">
                                Get Started
                            </Button>
                            <Button variant="themeButtonOutline" size="md">
                                Learn More
                            </Button>
                        </div>

                        {/* Social proof */}
                        <div className="mt-8 flex items-center gap-3">
                            <div className="flex items-center">
                                {["A", "B", "C"].map((letter, index) => (
                                    <div
                                        key={letter}
                                        className={`flex h-10 w-10 items-center justify-center rounded-full bg-pink text-lg font-semibold text-white border border-white dark:border-slate-900 ${
                                            index !== 0 ? "-ml-3" : ""
                                        }`}
                                    >
                                        {letter}
                                    </div>
                                ))}
                            </div>
                            <p className="max-w-xs text-sm text-slate-600 dark:text-slate-300">
                                Trusted by million of satisfied users, our financial services
                                made a real impact on people lives.
                            </p>
                        </div>
                    </div>

                    {/* RIGHT SIDE */}
                    <div className="flex flex-col items-stretch">
                        {/* IMAGE + OVERLAY CARD */}
                        <div className="relative w-full max-w-xl lg:ml-auto">
                            {/* Main image */}
                            <div className="relative h-[280px] w-full overflow-hidden rounded-3xl md:h-[340px] lg:h-[420px]">
                                <Image
                                    src="/career-guidance.jpg" // change to your path
                                    alt="Career guidance"
                                    fill
                                    className="object-cover"
                                />
                            </div>

                            {/* Floating card */}
                            <div
                                className="
                                    relative mt-6 w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-xl
                                    dark:border-slate-800 dark:bg-slate-950
                                    md:absolute md:-left-0 md:-bottom-16 md:w-[85%] md:-translate-x-1/2 md:mt-0
                                "
                            >
                                <h3 className="mb-4 text-center text-lg font-semibold text-slate-900 dark:text-white">
                                    Career Guidance
                                </h3>

                                {/* From / To */}
                                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                            From
                                        </label>
                                        <input
                                            type="text"
                                            className="mt-1 w-full rounded-md border border-gray-300 bg-gray-100 py-2 px-3 text-sm dark:border-slate-700 dark:bg-slate-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                            To
                                        </label>
                                        <input
                                            type="text"
                                            className="mt-1 w-full rounded-md border border-gray-300 bg-gray-100 py-2 px-3 text-sm dark:border-slate-700 dark:bg-slate-800"
                                        />
                                    </div>
                                </div>

                                <h4 className="mb-3 text-base font-semibold text-slate-900 dark:text-white">
                                    Experience Required
                                </h4>

                                <ul className="divide-y divide-dotted divide-gray-300 dark:divide-slate-700">
                                    {experienceList.map((item) => {
                                        const slug = item.toLowerCase().replace(/ /g, "-");

                                        return (
                                            <li key={item}>
                                                <Link
                                                    href={`/career/${slug}`}
                                                    className="flex w-full items-center justify-between py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:text-pink dark:text-slate-300 dark:hover:text-pink"
                                                >
                                                    {item}
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        </div>

                        {/* BOTTOM LINKS */}
                        <div className="mt-10 w-full max-w-xl md:mt-24 lg:ml-auto">
                            <div className="mx-auto w-full md:w-[85%] overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                                <button
                                    type="button"
                                    className="flex w-full items-center justify-between px-6 py-4 text-left text-sm font-medium text-slate-800 transition hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                    <span>Securely depot and store funds</span>
                                    <FiChevronRight className="text-slate-500 dark:text-slate-400" />
                                </button>
                                <div className="h-px w-full bg-gray-200 dark:bg-slate-800" />
                                <button
                                    type="button"
                                    className="flex w-full items-center justify-between px-6 py-4 text-left text-sm font-medium text-slate-800 transition hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                    <span>FDIC Insurance-eligible</span>
                                    <FiChevronRight className="text-slate-500 dark:text-slate-400" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
