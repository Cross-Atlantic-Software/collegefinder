"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FiArrowUpRight, FiClock, FiFileText } from "react-icons/fi";
import { PiCompassRoseBold } from "react-icons/pi";
import { RoughNotation } from "react-rough-notation";

const painPoints = [
    { label: "No scattered portals", Icon: PiCompassRoseBold },
    { label: "No forgotten forms", Icon: FiFileText },
    { label: "No last minute chaos", Icon: FiClock },
];

export default function Hero() {
    const sectionRef = useRef<HTMLElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.3 }
        );
        if (sectionRef.current) observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} className="relative isolate min-h-[100svh] overflow-hidden">
            <Image
                src="/landing-page/hero-1.png"
                alt="Admission journey background"
                fill
                priority
                className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-black/50" />

            <div className="appContainer relative z-10 flex min-h-[100svh] items-end py-16 md:py-20 lg:pb-24">
                <div className="max-w-3xl">
                    <h1 className="text-4xl font-extrabold leading-tight text-white md:text-6xl">
                        Your Entire Admission Journey
                        <span className="mt-1 block">
                            <RoughNotation
                                type="underline"
                                show={isVisible}
                                color="#f0c544"
                                strokeWidth={3}
                                padding={4}
                                animationDelay={700}
                                animationDuration={1400}
                            >
                                <span className="text-[#f0c544]">Finally Under Control</span>
                            </RoughNotation>
                        </span>
                    </h1>

                    <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/90 md:text-xl">
                        The exam you missed. The deadline you forgot. The college you never knew
                        existed. It happens to thousands of students every year. It doesn&apos;t have
                        to happen to you.
                    </p>

                    <div className="mt-8 flex flex-wrap items-center gap-5 md:gap-8">
                        {painPoints.map(({ label, Icon }) => (
                            <div
                                key={label}
                                className="inline-flex items-center gap-2 text-sm font-medium text-white"
                            >
                                <span className="inline-flex h-9 w-9 items-center justify-center text-white">
                                    <Icon className="text-[15px]" />
                                </span>
                                <span>{label}</span>
                            </div>
                        ))}
                    </div>

                    <Link
                        href="/login"
                        className="landing-cta group mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-white/90"
                    >
                        Start your Journey
                        <FiArrowUpRight className="landing-icon-slide text-base" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
