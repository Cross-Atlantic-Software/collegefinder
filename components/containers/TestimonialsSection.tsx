"use client";

import Image from "next/image";
import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { PublicTestimonial } from "@/api";
import type { LandingPageContent } from "@/types/landingPage";

const MARQUEE_SPEED_PX_PER_SEC = 48;
const CARD_GAP_PX = 16;
const MARQUEE_DURATION_MIN_SEC = 14;
const MARQUEE_DURATION_MAX_SEC = 55;

type Props = {
  testimonials: PublicTestimonial[];
  copy: LandingPageContent["testimonials"];
};

function ProfileAvatar({ name, src }: { name: string; src?: string | null }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return src ? (
    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-amber-300/90 shadow-sm md:h-16 md:w-16">
      <Image src={src} alt="" fill className="object-cover" sizes="80px" unoptimized />
    </div>
  ) : (
    <div
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-amber-300/80 bg-amber-200/90 text-base font-bold text-black/80 shadow-sm md:h-16 md:w-16 md:text-lg"
      aria-hidden
    >
      {initial}
    </div>
  );
}

function StarRow({ rating }: { rating: number }) {
  const n = Math.min(5, Math.max(1, Math.round(rating)));
  return (
    <div className="flex items-center justify-center gap-0.5 md:justify-start" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < n ? "text-amber-400" : "text-black/15"} aria-hidden>
          ★
        </span>
      ))}
    </div>
  );
}

function TestimonialCard({ t }: { t: PublicTestimonial }) {
  return (
    <article className="box-border shrink-0 basis-full rounded-2xl border border-black/15 bg-gradient-to-b from-amber-50/95 to-white px-4 py-6 shadow-md ring-1 ring-black/[0.04] md:basis-[calc((100%-2rem)/3)] md:py-8">
      <div className="flex h-full flex-col items-center gap-4 md:flex-row md:items-start md:gap-5 md:text-left">
        <ProfileAvatar name={t.name} src={t.profile_image_url} />
        <div className="min-w-0 flex-1 text-center md:text-left">
          <StarRow rating={t.rating} />
          <blockquote className="mt-3 line-clamp-5 text-sm leading-relaxed text-black/85 md:text-base">
            &ldquo;{t.body}&rdquo;
          </blockquote>
          <p className="mt-4 text-xs font-semibold text-black md:text-sm">{t.name}</p>
        </div>
      </div>
    </article>
  );
}

export default function TestimonialsSection({ testimonials, copy }: Props) {
  const list = testimonials || [];
  const n = list.length;
  const trackRef = useRef<HTMLDivElement>(null);
  const [loopShiftPx, setLoopShiftPx] = useState(0);

  const titleBefore = copy?.titleBefore?.trim() || "What people say about";
  const titleHighlight = copy?.titleHighlight?.trim() || "UniTracko";
  const subtitle = copy?.subtitle?.trim() || "Real words from students and parents using the platform.";

  const duplicated = useMemo(
    () => (n > 0 ? [...list, ...list, ...list] : []),
    [list, n],
  );

  /** Measure first full “set” width from DOM (works with %/basis widths). */
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track || n < 1) {
      setLoopShiftPx(0);
      return;
    }

    const measure = () => {
      if (track.children.length < n + 1) {
        setLoopShiftPx(0);
        return;
      }
      const first = track.children[0] as HTMLElement;
      const afterFirstSet = track.children[n] as HTMLElement;
      const px = afterFirstSet.offsetLeft - first.offsetLeft;
      setLoopShiftPx(px > 0 ? px : 0);
    };

    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(track);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [n, duplicated.length]);

  const shiftPx = loopShiftPx;
  const durationSec =
    shiftPx > 0
      ? Math.min(
          MARQUEE_DURATION_MAX_SEC,
          Math.max(MARQUEE_DURATION_MIN_SEC, shiftPx / MARQUEE_SPEED_PX_PER_SEC),
        )
      : 45;

  const marqueeStyle: CSSProperties | undefined =
    shiftPx > 0
      ? {
          ["--testimonials-shift" as string]: `${shiftPx}px`,
          ["--testimonials-duration" as string]: `${durationSec}s`,
        }
      : undefined;

  return (
    <section id="testimonials" className="landing-section scroll-mt-20 bg-white md:scroll-mt-24">
      <div className="appContainer">
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
            <div className="testimonials-marquee-wrap overflow-hidden py-1">
              <div
                ref={trackRef}
                className="testimonials-marquee-track flex w-full min-w-0 flex-nowrap"
                style={{
                  gap: CARD_GAP_PX,
                  ...(marqueeStyle ?? {}),
                }}
              >
                {duplicated.map((t, i) => (
                  <TestimonialCard key={`${t.id}-${i}`} t={t} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
