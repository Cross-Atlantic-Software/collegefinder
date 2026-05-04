"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import type { PublicTestimonial } from "@/api";
import type { LandingPageContent } from "@/types/landingPage";

const AUTO_MS = 2000;

type Props = {
  testimonials: PublicTestimonial[];
  copy: LandingPageContent["testimonials"];
};

function ProfileAvatar({ name, src }: { name: string; src?: string | null }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  if (src) {
    return (
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-amber-300/90 shadow-sm md:h-20 md:w-20">
        <Image
          src={src}
          alt=""
          fill
          className="object-cover"
          sizes="80px"
          unoptimized
        />
      </div>
    );
  }
  return (
    <div
      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-amber-300/80 bg-amber-200/90 text-lg font-bold text-black/80 shadow-sm md:h-20 md:w-20 md:text-xl"
      aria-hidden
    >
      {initial}
    </div>
  );
}

function StarRow({ rating }: { rating: number }) {
  const n = Math.min(5, Math.max(1, Math.round(rating)));
  return (
    <div className="flex items-center gap-0.5" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={i < n ? "text-amber-400" : "text-black/15"}
          aria-hidden
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function TestimonialsSection({ testimonials, copy }: Props) {
  const list = testimonials || [];
  const n = list.length;
  const [index, setIndex] = useState(0);
  const [pause, setPause] = useState(false);

  const titleBefore = copy?.titleBefore?.trim() || "What people say about";
  const titleHighlight = copy?.titleHighlight?.trim() || "UniTracko";
  const subtitle = copy?.subtitle?.trim() || "Real words from students and parents using the platform.";

  const go = useCallback(
    (dir: -1 | 1) => {
      if (n <= 0) return;
      setIndex((i) => (i + dir + n) % n);
    },
    [n],
  );

  useEffect(() => {
    if (n <= 1 || pause) return;
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1 + n) % n);
    }, AUTO_MS);
    return () => clearInterval(t);
  }, [n, pause]);

  return (
    <section
      id="testimonials"
      className="landing-section scroll-mt-20 bg-white md:scroll-mt-24"
      onMouseEnter={() => n > 0 && setPause(true)}
      onMouseLeave={() => n > 0 && setPause(false)}
    >
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
          <div className="relative mx-auto mt-10 max-w-3xl">
            <div className="overflow-hidden rounded-2xl border border-black/10 bg-gradient-to-b from-amber-50/80 to-white shadow-sm">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${index * 100}%)` }}
              >
                {list.map((t) => (
                  <article
                    key={t.id}
                    className="w-full shrink-0 px-6 py-8 md:px-10 md:py-10"
                    aria-hidden={list[index]?.id !== t.id}
                  >
                    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8">
                      <ProfileAvatar name={t.name} src={t.profile_image_url} />
                      <div className="min-w-0 flex-1 text-center sm:text-left">
                        <StarRow rating={t.rating} />
                        <blockquote className="mt-4 text-lg leading-relaxed text-black/85 md:text-xl">
                          &ldquo;{t.body}&rdquo;
                        </blockquote>
                        <p className="mt-6 text-sm font-semibold text-black md:text-base">{t.name}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => go(-1)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/15 bg-white text-black shadow-sm transition hover:border-black/25 hover:bg-amber-50"
                aria-label="Previous testimonial"
              >
                <FiChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex gap-1.5" aria-hidden>
                {list.map((t, i) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setIndex(i)}
                    className={`h-2 rounded-full transition-all ${
                      i === index ? "w-6 bg-black" : "w-2 bg-black/20 hover:bg-black/35"
                    }`}
                    aria-label={`Go to testimonial ${i + 1}`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => go(1)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/15 bg-white text-black shadow-sm transition hover:border-black/25 hover:bg-amber-50"
                aria-label="Next testimonial"
              >
                <FiChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
