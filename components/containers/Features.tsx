"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FiChevronRight } from "react-icons/fi";
import { RoughNotation } from "react-rough-notation";

export default function Features() {
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
            { threshold: 0.3 }
        );
        if (sectionRef.current) observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} className="bg-white pb-14 pt-20 md:pb-16 md:pt-24">
            <div className="appContainer">
                <div className="mx-auto text-center">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-black/55">FEATURES</p>
                    <h2 className="mt-4 text-4xl font-extrabold leading-tight text-black md:text-5xl">
                        <RoughNotation
                            type="underline"
                            show={isVisible}
                            color="#f0c544"
                            strokeWidth={4}
                            padding={5}
                            animationDelay={500}
                            animationDuration={1500}
                            multiline
                        >
                            UNLOCK THE ULTIMATE COMMAND CENTRE
                        </RoughNotation>
                    </h2>
                    <p className="mt-4 text-sm text-black/50 md:text-base">
                        We&apos;ve built the unfair advantage you&apos;ve been looking for.
                    </p>
                </div>
            </div>
        </section>
    );
}
