"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FiArrowUpRight, FiClock, FiFileText } from "react-icons/fi";
import { RoughNotation } from "react-rough-notation";

const painPoints = [
    
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
        <section
            id="home"
            ref={sectionRef}
            className="relative isolate min-h-[100svh] overflow-hidden scroll-mt-20 md:scroll-mt-24"
        >
            <video
                className="absolute inset-0 h-full w-full object-cover object-center"
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                poster="/landing-page/hero-1.png"
                aria-hidden="true"
            >
                <source
                    media="(max-width: 1023px)"
                    src="/landing-page/Unitracko%20AI%20%28Vertical%29.mp4"
                    type="video/mp4"
                />
                <source src="/landing-page/Unitracko%20AI%20.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-black/50" />
        
            <div className="appContainer relative z-10 flex min-h-[100svh] items-end py-12 sm:py-16 md:py-20 lg:pb-24">
                <div className="max-w-3xl pb-[calc(env(safe-area-inset-bottom)+0.25rem)]  md:pb-0">
                    <h1 className="text-[2rem] font-extrabold leading-[1.12] text-white sm:text-4xl md:text-6xl">
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

                    <div className="mt-7 grid w-full gap-3 sm:mt-8 sm:flex sm:flex-wrap sm:items-center sm:gap-5 md:gap-8">
                        {painPoints.map(({ label, Icon }) => (
                            <div
                                key={label}
                                className="inline-flex w-fit items-center gap-2 text-sm font-medium text-white"
                            >
                                <span className="inline-flex h-8 w-8 items-center justify-center text-white sm:h-9 sm:w-9">
                                    <Icon className="text-[14px] sm:text-[15px]" />
                                </span>
                                <span>{label}</span>
                            </div>
                        ))}
                    </div>

                    <Link
                        href="/login"
                        className="landing-cta group mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-white/90 sm:w-auto"
                    >
                        Start your Journey
                        <FiArrowUpRight className="landing-icon-slide text-base" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
