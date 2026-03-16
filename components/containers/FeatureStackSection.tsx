"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FiArrowRight, FiChevronRight } from "react-icons/fi";
import { RoughNotation } from "react-rough-notation";

type FeatureCard = {
    title: string;
    highlightWord: string;
    description: string;
    image: string;
    imageAlt: string;
    bgClass: string;
};

const featureCards: FeatureCard[] = [
    {
        title: "Navigate the\nRight Exam",
        highlightWord: "Right Exam",
        description:
            "Search and filter 1,000+ entrance exams. View eligibility, dates, fees and syllabus — verified in real time. No exam ever slips through.",
        image: "/landing-page/feature-1.png",
        imageAlt: "Exam discovery interface",
        bgClass: "bg-[#cfe0f1]",
    },
    {
        title: "All‑In\nTracking",
        highlightWord: "Tracking",
        description:
            "Stay fully updated directly through Unitracko. Track exams, admits, and deadlines from one dashboard. No confusion, no overlap.",
        image: "/landing-page/feature-2.png",
        imageAlt: "All in tracking panel",
        bgClass: "bg-amber-100",
    },
    {
        title: "The Clarity\nEngine",
        highlightWord: "Clarity",
        description:
            "Before 1,000 decisions, compare not one, but every option side-by-side. Explore fees, cutoff trends and fit clarity.",
        image: "/landing-page/feature-3.png",
        imageAlt: "Clarity engine comparison",
        bgClass: "bg-sky-100",
    },
    {
        title: "One‑Click Form\nFilling",
        highlightWord: "One\u2011Click",
        description:
            "Auto-fill almost all college forms accurately with your data and save hours. No repeated entries, less errors, total clarity.",
        image: "/landing-page/feature-4.png",
        imageAlt: "One click form filling",
        bgClass: "bg-amber-100",
    },
    {
        title: "Perfect Fit\nAlgorithm",
        highlightWord: "Perfect Fit",
        description:
            "Assessments-based aptitude mapping recommends exams, courses and careers aligned to your strengths. Clarity for students and peace of mind for parents.",
        image: "/landing-page/feature-6.png",
        imageAlt: "Perfect fit algorithm",
        bgClass: "bg-amber-100",
    },
];

export default function FeatureStackSection() {
    const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
    const stickyHeaderRef = useRef<HTMLDivElement | null>(null);
    const stackSceneRef = useRef<HTMLDivElement | null>(null);
    const cardsStackRef = useRef<HTMLDivElement | null>(null);
    const [stickyHeaderHeight, setStickyHeaderHeight] = useState(0);
    const [stickyHeaderTop, setStickyHeaderTop] = useState(76);
    const [headerRailHeight, setHeaderRailHeight] = useState(0);
    const [headingVisible, setHeadingVisible] = useState(false);
    const [cardVisible, setCardVisible] = useState<boolean[]>(() => {
        if (
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ) {
            return Array(featureCards.length).fill(true);
        }

        return Array(featureCards.length).fill(false);
    });
    // keep a ref so the scroll handler always sees the latest stickyCardTop
    const stickyCardTopRef = useRef(76);

    useEffect(() => {
        const cards = cardRefs.current.filter(Boolean) as HTMLDivElement[];

        if (cards.length === 0) {
            return;
        }

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            cards.forEach((card) => card.classList.add("is-in-view"));
            return;
        }

        // existing observer keeps the card entrance (is-in-view) animation
        const entranceObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-in-view");
                        entranceObserver.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0.18,
                rootMargin: "0px 0px -10% 0px",
            }
        );

        cards.forEach((card) => entranceObserver.observe(card));

        // scroll-based trigger: fire circle when card reaches its sticky top
        const handleScroll = () => {
            cardRefs.current.forEach((card, idx) => {
                if (!card) return;
                setCardVisible((prev) => {
                    if (prev[idx]) return prev; // already triggered, skip
                    const rect = card.getBoundingClientRect();
                    // card has reached (or passed) its stacked position
                    if (rect.top <= stickyCardTopRef.current + 24) {
                        const next = [...prev];
                        next[idx] = true;
                        return next;
                    }
                    return prev;
                });
            });
        };

        window.addEventListener("scroll", handleScroll, { passive: true });

        return () => {
            entranceObserver.disconnect();
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    useEffect(() => {
        const updateStickyMetrics = () => {
            const siteHeader = document.querySelector("header");
            const fallbackHeaderHeight = window.innerWidth >= 1024 ? 72 : 64;
            const siteHeaderHeight =
                siteHeader instanceof HTMLElement ? siteHeader.offsetHeight : fallbackHeaderHeight;
            const viewportGap = window.innerWidth >= 1024 ? 18 : 12;
            const nextStickyHeaderTop = siteHeaderHeight + viewportGap;

            setStickyHeaderTop(nextStickyHeaderTop);

            if (stickyHeaderRef.current) {
                setStickyHeaderHeight(stickyHeaderRef.current.offsetHeight);
            }

            const cardsStackTop = cardsStackRef.current?.offsetTop ?? 0;
            const lastCard = cardRefs.current[featureCards.length - 1];
            const lastCardTop = lastCard?.offsetTop ?? 0;

            setHeaderRailHeight(cardsStackTop + lastCardTop + 18);
        };

        updateStickyMetrics();

        const resizeObserver = new ResizeObserver(() => {
            updateStickyMetrics();
        });

        if (stickyHeaderRef.current) {
            resizeObserver.observe(stickyHeaderRef.current);
        }

        if (cardsStackRef.current) {
            resizeObserver.observe(cardsStackRef.current);
        }

        const siteHeader = document.querySelector("header");
        if (siteHeader instanceof HTMLElement) {
            resizeObserver.observe(siteHeader);
        }

        cardRefs.current.forEach((card) => {
            if (card) {
                resizeObserver.observe(card);
            }
        });

        window.addEventListener("resize", updateStickyMetrics, { passive: true });

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener("resize", updateStickyMetrics);
        };
    }, []);

    useEffect(() => {
        const el = stackSceneRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setHeadingVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const stickyCardTop = stickyHeaderTop + Math.max(stickyHeaderHeight + 24, 0);

    useEffect(() => {
        stickyCardTopRef.current = stickyCardTop;
    }, [stickyCardTop]);

    const renderFeatureCard = (card: FeatureCard, index: number) => (
        <div
            key={card.title}
            ref={(node) => {
                cardRefs.current[index] = node;
            }}
            className={`feature-stack-card group sticky overflow-hidden rounded-3xl ring-1 ring-black/[0.07] md:h-[420px] ${card.bgClass}`}
            style={{ top: `${stickyCardTop}px`, zIndex: index + 1, transitionDelay: `${index * 0.05}s` }}
        >
            <div className="grid h-full items-stretch lg:grid-cols-[0.4fr_0.6fr]">
                <div className="flex h-full flex-col justify-center px-8 py-12 md:px-14 md:py-14">
                    {/* Step badge */}
                    <span className="feature-step-badge mb-5 inline-flex h-8 w-8 items-center justify-center self-start rounded-full bg-black/[0.07] text-[11px] font-bold tracking-wide text-black/40 ring-1 ring-black/10">
                        {String(index + 1).padStart(2, "0")}
                    </span>

                    <h3 className="whitespace-pre-line text-3xl font-extrabold leading-tight text-black md:text-4xl">
                        {(() => {
                            const hw = card.highlightWord;
                            const idx = card.title.indexOf(hw);
                            if (idx === -1) return card.title;
                            const before = card.title.slice(0, idx);
                            const after = card.title.slice(idx + hw.length);
                            return (
                                <>
                                    {before}
                                    <RoughNotation
                                        type="circle"
                                        show={cardVisible[index]}
                                        color="#f0c544"
                                        strokeWidth={3}
                                        padding={6}
                                        animationDelay={400}
                                        animationDuration={1100}
                                    >
                                        {hw}
                                    </RoughNotation>
                                    {after}
                                </>
                            );
                        })()}
                    </h3>
                    <p className="mt-5 max-w-md text-sm leading-relaxed text-black/65 md:text-base">
                        {card.description}
                    </p>

                    <Link
                        href="/login"
                        className="landing-cta group mt-7 inline-flex w-fit items-center gap-2 rounded-full border border-black/30 px-4 py-2.5 text-sm font-semibold text-black hover:bg-black hover:text-white"
                    >
                        Learn more
                        <FiArrowRight className="landing-icon-slide text-base" />
                    </Link>
                </div>

                <div className="relative h-52 w-full overflow-hidden md:h-full">
                    <Image
                        src={card.image}
                        alt={card.imageAlt}
                        fill
                        className="origin-bottom-right scale-[0.9] object-contain object-right-bottom transition-transform duration-500 ease-out group-hover:scale-[0.935] md:scale-[0.86] md:group-hover:scale-[0.895]"
                    />
                </div>
            </div>
        </div>
    );

    return (
        <section className="landing-section bg-white">
            <div className="appContainer">
                <div ref={stackSceneRef} className="relative mx-auto max-w-6xl">
                    <div className="relative">
                        <div
                            className="pointer-events-none absolute inset-x-0 top-0 z-30"
                            style={{ height: `${Math.max(headerRailHeight, stickyHeaderHeight + 24)}px` }}
                        >
                            <div
                                ref={stickyHeaderRef}
                                className="pointer-events-auto sticky bg-white pb-10 text-center md:pb-12"
                                style={{ top: `${stickyHeaderTop}px` }}
                            >
                                <h2 className="text-4xl font-extrabold leading-tight text-black md:text-5xl">
                                    Unlock the{" "}
                                    <RoughNotation
                                        type="underline"
                                        show={headingVisible}
                                        color="#f0c544"
                                        strokeWidth={4}
                                        padding={4}
                                        animationDelay={500}
                                        animationDuration={1400}
                                    >
                                        Ultimate Command Centre
                                    </RoughNotation>
                                </h2>
                                <p className="mt-4 text-sm text-black/50 md:text-base">
                                    We&apos;ve built the unfair advantage you&apos;ve been looking for.
                                </p>

                                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                                    <Link
                                        href="/login"
                                        className="landing-cta group inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-black/85"
                                    >
                                        Get a demo
                                        <FiChevronRight className="landing-icon-slide text-base" />
                                    </Link>
                                    <Link
                                        href="/login"
                                        className="landing-cta group inline-flex items-center gap-2 rounded-full border border-black/15 bg-white px-6 py-3 text-sm font-semibold text-black/70 hover:text-black"
                                    >
                                        Get started free
                                        <FiChevronRight className="landing-icon-slide text-base" />
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <div
                            ref={cardsStackRef}
                            className="relative space-y-10 md:space-y-12"
                            style={{ paddingTop: `${stickyHeaderHeight + 24}px` }}
                        >
                            {featureCards.map((card, index) => renderFeatureCard(card, index))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
