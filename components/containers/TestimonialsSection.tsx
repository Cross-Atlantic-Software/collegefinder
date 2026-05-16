"use client";

import Image from "next/image";
import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useEffect,
  type CSSProperties,
} from "react";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import { RoughNotation } from "react-rough-notation";
import eyeAnim from "@/public/LottieiCONS/doodle-black-221-eye-hover-pinch.json";
import idCardAnim from "@/public/LottieiCONS/doodle-black-16-id-business-card-hover-pinch.json";
import folderUserAnim from "@/public/LottieiCONS/doodle-black-714-folder-user-hover-pinch.json";
import type { PublicTestimonial } from "@/api";
import type { LandingPageContent } from "@/types/landingPage";

const MARQUEE_SPEED_PX_PER_SEC = 48;
const CARD_GAP_PX = 16;
const MARQUEE_DURATION_MIN_SEC = 14;
const MARQUEE_DURATION_MAX_SEC = 55;

const CARD_DOODLES = [eyeAnim, idCardAnim, folderUserAnim] as const;

type Props = {
  testimonials: PublicTestimonial[];
  copy: LandingPageContent["testimonials"];
};

function CardCornerDoodle({
  animationData,
  className,
}: {
  animationData: (typeof CARD_DOODLES)[number];
  className?: string;
}) {
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  return (
    <Lottie
      lottieRef={lottieRef}
      animationData={animationData}
      loop={false}
      onComplete={() => {
        setTimeout(() => lottieRef.current?.goToAndPlay(0, true), 1200);
      }}
      className={className}
    />
  );
}

function ProfileAvatar({ name, src }: { name: string; src?: string | null }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return src ? (
    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-black/10 bg-white shadow-sm md:h-16 md:w-16">
      <Image src={src} alt="" fill className="object-cover" sizes="80px" unoptimized />
    </div>
  ) : (
    <div
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-black/10 bg-amber-100/90 text-base font-bold text-black/80 shadow-sm md:h-16 md:w-16 md:text-lg"
      aria-hidden
    >
      {initial}
    </div>
  );
}

function StarRow({ rating }: { rating: number }) {
  const n = Math.min(5, Math.max(1, Math.round(rating)));
  return (
    <div
      className="flex items-center justify-center gap-0.5 md:justify-start"
      aria-label={`${n} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < n ? "text-[#f0c544]" : "text-black/12"} aria-hidden>
          ★
        </span>
      ))}
    </div>
  );
}

function TestimonialCard({ t, doodleIndex }: { t: PublicTestimonial; doodleIndex: number }) {
  const doodle = CARD_DOODLES[doodleIndex % CARD_DOODLES.length];
  return (
    <div className="box-border shrink-0 basis-full snap-start pb-4 pl-2 pr-2 pt-4 sm:pb-5 sm:pl-3 sm:pr-3 sm:pt-5 md:basis-[calc((100%-1rem)/2)]">
      <article
        className="relative overflow-visible rounded-[1.35rem] border-2 border-amber-100 bg-white px-4 py-6 [box-shadow:4px_4px_0_rgb(254,243,199),9px_9px_0_rgb(253,230,138)] md:rounded-[1.6rem] md:px-5 md:py-8"
      >
        {/* Half in / half out on the top-right corner — unchanged */}
        <div
          className="pointer-events-none absolute right-0 top-0 z-20 h-[3.75rem] w-[3.75rem] -translate-y-1/2 translate-x-1/2 opacity-[0.95] md:h-[4.5rem] md:w-[4.5rem]"
          aria-hidden
        >
          <CardCornerDoodle animationData={doodle} className="h-full w-full" />
        </div>
        <div className="relative z-10 flex h-full flex-col items-center gap-4 pr-8 pt-1 md:flex-row md:items-start md:gap-5 md:pr-12 md:pt-0 md:text-left">
          <ProfileAvatar name={t.name} src={t.profile_image_url} />
          <div className="min-w-0 flex-1 text-center md:text-left">
            <StarRow rating={t.rating} />
            <blockquote className="mt-3 line-clamp-5 text-sm leading-relaxed text-black/70 md:text-base">
              &ldquo;{t.body}&rdquo;
            </blockquote>
            <p className="mt-4 text-xs font-semibold text-black md:text-sm">{t.name}</p>
          </div>
        </div>
      </article>
    </div>
  );
}

export default function TestimonialsSection({ testimonials, copy }: Props) {
  const list = useMemo(() => testimonials ?? [], [testimonials]);
  const n = list.length;
  const trackRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [loopShiftPx, setLoopShiftPx] = useState(0);
  const [headingVisible, setHeadingVisible] = useState(false);

  const titleBefore = copy?.titleBefore?.trim() || "Students & Parents Experience with";
  const titleHighlight = copy?.titleHighlight?.trim() || "UniTracko";
  const subtitle = copy?.subtitle?.trim() || "From missed deadlines and confusion to clarity and control.";

  const duplicated = useMemo(
    () => (n > 0 ? [...list, ...list, ...list] : []),
    [list, n],
  );

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          queueMicrotask(() => setHeadingVisible(true));
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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
    <section
      id="testimonials"
      ref={sectionRef}
      className="landing-section scroll-mt-20 bg-white md:scroll-mt-24"
    >
      <div className="appContainer">
        <h3 className="text-center text-3xl font-extrabold leading-tight text-black md:text-5xl">
          <span className="text-black">{titleBefore} </span>
          <RoughNotation
            type="underline"
            show={headingVisible}
            color="#f0c544"
            strokeWidth={3}
            padding={3}
            animationDelay={400}
            animationDuration={1300}
          >
            <span className="text-black">{titleHighlight}</span>
          </RoughNotation>
        </h3>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-relaxed text-black/65 md:mt-4 md:text-base">
          {subtitle}
        </p>

        {n === 0 ? (
          <p className="mx-auto mt-10 max-w-md text-center text-sm text-black/45 md:mt-12">
            Stories from our community will appear here soon.
          </p>
        ) : (
          <div className="relative mx-auto mt-8 w-full max-w-5xl md:mt-14">
            {/* Mobile: swipeable cards are easier to read than a moving marquee. */}
            <div className="md:hidden">
              <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 pt-1 scrollbar-hide">
                {list.map((t, i) => (
                  <div key={`mobile-${t.id}-${i}`} className="w-[92%] shrink-0">
                    <TestimonialCard t={t} doodleIndex={i} />
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop: keep marquee behavior. */}
            <div className="testimonials-marquee-wrap hidden overflow-hidden px-2 md:block md:px-4">
              <div
                ref={trackRef}
                className="testimonials-marquee-track flex w-full min-w-0 flex-nowrap"
                style={{
                  gap: CARD_GAP_PX,
                  ...(marqueeStyle ?? {}),
                }}
              >
                {duplicated.map((t, i) => (
                  <TestimonialCard key={`${t.id}-${i}`} t={t} doodleIndex={i} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
