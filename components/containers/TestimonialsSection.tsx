"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { PublicTestimonial } from "@/api";
import type { LandingPageContent } from "@/types/landingPage";

/** Horizontal scroll speed for the marquee (pixels per second). */
const MARQUEE_SPEED_PX_PER_SEC = 28;

/** Space between separate cards; must match Tailwind `gap-4` (1rem = 16px). */
const CARD_GAP_PX = 16;

type Props = {
  testimonials: PublicTestimonial[];
  copy: LandingPageContent["testimonials"];
};

function ProfileAvatar({ name, src, compact }: { name: string; src?: string | null; compact?: boolean }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const box = compact ? "h-12 w-12 md:h-16 md:w-16 text-sm md:text-lg" : "h-16 w-16 md:h-20 md:w-20 text-lg md:text-xl";
  if (src) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden rounded-full border-2 border-amber-300/90 shadow-sm ${box}`}
      >
        <Image src={src} alt="" fill className="object-cover" sizes="80px" unoptimized />
      </div>
    );
  }
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full border-2 border-amber-300/80 bg-amber-200/90 font-bold text-black/80 shadow-sm ${box}`}
      aria-hidden
    >
      {initial}
    </div>
  );
}

function StarRow({ rating }: { rating: number }) {
  const n = Math.min(5, Math.max(1, Math.round(rating)));
  return (
    <div className="flex items-center justify-center gap-0.5 sm:justify-start" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < n ? "text-amber-400" : "text-black/15"} aria-hidden>
          ★
        </span>
      ))}
    </div>
  );
}

function TestimonialCard({
  t,
  itemWidthPx,
  compact,
}: {
  t: PublicTestimonial;
  itemWidthPx: number;
  compact: boolean;
}) {
  return (
    <article
      className="box-border shrink-0 rounded-2xl border border-black/10 bg-gradient-to-b from-amber-50/90 to-white px-4 py-6 shadow-sm md:py-8"
      style={itemWidthPx > 0 ? { width: itemWidthPx } : { minWidth: "100%" }}
    >
      <div
        className={`flex h-full flex-col items-center gap-4 ${compact ? "md:flex-row md:items-start md:gap-5 md:text-left" : "sm:flex-row sm:items-start sm:gap-8 sm:text-left"}`}
      >
        <ProfileAvatar name={t.name} src={t.profile_image_url} compact={compact} />
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <StarRow rating={t.rating} />
          <blockquote
            className={`mt-3 leading-relaxed text-black/85 ${compact ? "line-clamp-5 text-sm md:text-base" : "text-base md:text-lg"}`}
          >
            &ldquo;{t.body}&rdquo;
          </blockquote>
          <p className={`mt-4 font-semibold text-black ${compact ? "text-xs md:text-sm" : "text-sm md:text-base"}`}>
            {t.name}
          </p>
        </div>
      </div>
    </article>
  );
}

export default function TestimonialsSection({ testimonials, copy }: Props) {
  const list = testimonials || [];
  const n = list.length;
  const wrapRef = useRef<HTMLDivElement>(null);
  const [itemWidthPx, setItemWidthPx] = useState(0);
  const [perView, setPerView] = useState(1);

  const titleBefore = copy?.titleBefore?.trim() || "What people say about";
  const titleHighlight = copy?.titleHighlight?.trim() || "UniTracko";
  const subtitle = copy?.subtitle?.trim() || "Real words from students and parents using the platform.";

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const update = () => {
      const w = el.getBoundingClientRect().width;
      const pv = typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches ? 3 : 1;
      setPerView(pv);
      // Room for gaps between cards: (perView - 1) gaps at CARD_GAP_PX
      setItemWidthPx(
        w > 0 ? (w - Math.max(0, pv - 1) * CARD_GAP_PX) / pv : 0
      );
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  const duplicated = useMemo(() => (n > 0 ? [...list, ...list] : []), [list, n]);

  const shiftPx =
    n > 0 && itemWidthPx > 0
      ? n * itemWidthPx + Math.max(0, n - 1) * CARD_GAP_PX
      : 0;
  const durationSec =
    shiftPx > 0 ? Math.max(24, shiftPx / MARQUEE_SPEED_PX_PER_SEC) : 45;

  const marqueeStyle: CSSProperties | undefined =
    shiftPx > 0
      ? {
          ["--testimonials-shift" as string]: `${shiftPx}px`,
          ["--testimonials-duration" as string]: `${durationSec}s`,
        }
      : undefined;

  const compact = perView === 3;

  return (
    <section id="testimonials" className="landing-section scroll-mt-20 bg-white md:scroll-mt-24">
      <div className="appContainer py-14 md:py-16">
        <h3 className="text-center text-3xl font-extrabold leading-tight text-black md:text-4xl">
          {titleBefore}{" "}
          <span className="relative inline-block">
            <span className="relative z-10">{titleHighlight}</span>
            <span
              className="absolute bottom-1 left-0 right-0 h-2 bg-amber-300/90"
              aria-hidden
              style={{ transform: "skewX(-2deg)" }}
            />
          </span>
        </h3>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-black/55 md:text-base">{subtitle}</p>

        {n === 0 ? (
          <p className="mx-auto mt-10 max-w-md text-center text-sm text-black/45">
            Stories from our community will appear here soon.
          </p>
        ) : (
          <div className="relative mx-auto mt-10 w-full max-w-6xl">
            <div
              ref={wrapRef}
              className="testimonials-marquee-wrap overflow-hidden py-1"
            >
              <div
                className="testimonials-marquee-track flex flex-nowrap gap-4"
                style={marqueeStyle}
              >
                {duplicated.map((t, i) => (
                  <TestimonialCard key={`${t.id}-${i}`} t={t} itemWidthPx={itemWidthPx} compact={compact} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
