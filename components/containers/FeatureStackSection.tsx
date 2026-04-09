"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import { RoughNotation } from "react-rough-notation";
import type { LandingPageContent } from "@/types/landingPage";

type FeatureCard = {
    title: string;
    highlightWord: string;
    description: string;
    image: string;
    imageAlt: string;
    bgClass: string;
};

/** Image paths and layout classes only (not editable in CMS). */
const FEATURE_CARD_MEDIA: Pick<FeatureCard, "image" | "imageAlt" | "bgClass">[] = [
    {
        image: "/landing-page/feature-1.png",
        imageAlt: "Exam discovery interface",
        bgClass: "bg-[#cfe0f1]",
    },
    {
        image: "/landing-page/features-2.png",
        imageAlt: "All in tracking panel",
        bgClass: "bg-amber-100",
    },
    {
        image: "/landing-page/features-3.png",
        imageAlt: "Clarity engine comparison",
        bgClass: "bg-sky-100",
    },
    {
        image: "/landing-page/auto-fill.gif",
        imageAlt: "One click form filling",
        bgClass: "bg-amber-100",
    },
    {
        image: "/landing-page/features-5.png",
        imageAlt: "Psycho analytical profiling insights",
        bgClass: "bg-[#cfe0f1]",
    },
    {
        image: "/landing-page/features-6.png",
        imageAlt: "Perfect fit algorithm",
        bgClass: "bg-amber-100",
    },
];

export default function FeatureStackSection({ features }: { features: LandingPageContent["features"] }) {
    const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
    const stackSceneRef = useRef<HTMLDivElement | null>(null);
    const cardsStackRef = useRef<HTMLDivElement | null>(null);
    const [stickyHeaderTop, setStickyHeaderTop] = useState(76);
    const [headingVisible, setHeadingVisible] = useState(false);
    const featureCards = useMemo((): FeatureCard[] => {
        const cms = features.cards || [];
        return cms.map((c, i) => {
            const media = FEATURE_CARD_MEDIA[i] ?? FEATURE_CARD_MEDIA[0];
            return {
                title: c.title,
                highlightWord: c.highlightWord,
                description: c.description,
                ...media,
            };
        });
    }, [features.cards]);

    const [cardVisible, setCardVisible] = useState<boolean[]>(() => {
        const n = (features.cards || []).length;
        if (n === 0) return [];
        const reduced =
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        return Array.from({ length: n }, () => reduced);
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
    }, [featureCards.length]);

    useEffect(() => {
        const updateStickyMetrics = () => {
            const siteHeader = document.querySelector("header");
            const fallbackHeaderHeight = window.innerWidth >= 1024 ? 72 : 64;
            const siteHeaderHeight =
                siteHeader instanceof HTMLElement ? siteHeader.offsetHeight : fallbackHeaderHeight;
            const viewportGap = window.innerWidth >= 1024 ? 18 : 12;
            const nextStickyHeaderTop = siteHeaderHeight + viewportGap;

            setStickyHeaderTop(nextStickyHeaderTop);
        };

        updateStickyMetrics();

        const resizeObserver = new ResizeObserver(() => {
            updateStickyMetrics();
        });

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

    const stickyCardTop = stickyHeaderTop + 24;

    useEffect(() => {
        stickyCardTopRef.current = stickyCardTop;
    }, [stickyCardTop]);

    const renderFeatureCard = (card: FeatureCard, index: number) => (
        <div
            key={`feature-card-${index}`}
            ref={(node) => {
                cardRefs.current[index] = node;
            }}
            className={`feature-stack-card group sticky overflow-hidden rounded-3xl ring-1 ring-black/[0.07] md:h-[500px] ${card.bgClass}`}
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
                                        show={cardVisible[index] ?? false}
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
                    <p className="mt-5 max-w-md whitespace-pre-line text-sm leading-relaxed text-black/65 md:text-base">
                        {card.description}
                    </p>

                    <Link
                        href="/login"
                        className="landing-cta group mt-7 inline-flex w-fit items-center gap-2 rounded-full border border-black/30 px-4 py-2.5 text-sm font-semibold text-black hover:bg-black hover:text-white"
                    >
                        {features.learnMoreLabel}
                        <FiArrowRight className="landing-icon-slide text-base" />
                    </Link>
                </div>

                <div className="relative h-52 w-full overflow-hidden md:h-full">
                    <div
                        className={`absolute inset-x-0 top-0 ${
                            index === 1 || index === 4 ? "-bottom-3 md:-bottom-5" : "bottom-0"
                        }`}
                    >
                        <Image
                            src={card.image}
                            alt={card.imageAlt}
                            fill
                            className="origin-bottom-right scale-[0.9] object-contain object-right-bottom transition-transform duration-500 ease-out group-hover:scale-[0.935] md:scale-[0.86] md:group-hover:scale-[0.895]"
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <section id="the-playbook" className="landing-section scroll-mt-20 bg-white md:scroll-mt-24">
            <div className="appContainer">
                <div ref={stackSceneRef} className="relative mx-auto max-w-6xl">
                    <div className="relative">
                        <div className="bg-white pb-10 text-center md:pb-12">
                            <h2 className="text-4xl font-extrabold leading-tight text-black md:text-5xl">
                                {features.sectionTitleBefore}{" "}
                                <RoughNotation
                                    type="underline"
                                    show={headingVisible}
                                    color="#f0c544"
                                    strokeWidth={4}
                                    padding={4}
                                    animationDelay={500}
                                    animationDuration={1400}
                                >
                                    {features.sectionTitleUnderline}
                                </RoughNotation>
                            </h2>
                            <p className="mt-4 whitespace-pre-line text-sm text-black/50 md:text-base">
                                {features.sectionSubtitle}
                            </p>

                        </div>

                        <div ref={cardsStackRef} className="relative space-y-10 md:space-y-12">
                            {featureCards.map((card, index) => renderFeatureCard(card, index))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
