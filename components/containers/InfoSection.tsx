"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { FiArrowRight } from "react-icons/fi";
import { RoughNotation } from "react-rough-notation";
import type { LandingPageContent } from "@/types/landingPage";

/** Intro text + bullet phrases split on middle dot · or bullet • (from CMS body). */
function parseRealityBody(body: string): { lead: string; bullets: string[] } {
  if (!body?.trim()) return { lead: "", bullets: [] };
  const lines = body
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const sep = /[·•]/;
  const bulletBlockStart = lines.findIndex((l) => sep.test(l));
  if (bulletBlockStart === -1) {
    return { lead: body.trim(), bullets: [] };
  }
  const lead = lines.slice(0, bulletBlockStart).join("\n").trim();
  const bulletChunk = lines.slice(bulletBlockStart).join(" ");
  const bullets = bulletChunk
    .split(/\s*[·•]\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
  return { lead, bullets };
}

const ROTATE_MS = 5600;
const FLIP_MS = 820;
const FLIP_EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
const SCRIBBLE_TYPES = ["underline", "circle", "box"] as const;
const SCRIBBLE_COLOR = "rgba(240, 197, 68, 0.92)";

function RotatingBodyBullets({ lines, inline = false }: { lines: string[]; inline?: boolean }) {
  const [active, setActive] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const flipTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (lines.length < 2 || reduceMotion) return;

    const id = window.setInterval(() => {
      if (flipTimeoutRef.current) {
        window.clearTimeout(flipTimeoutRef.current);
      }
      setIsFlipping(true);
      flipTimeoutRef.current = window.setTimeout(() => {
        setActive((i) => (i + 1) % lines.length);
        setIsFlipping(false);
      }, FLIP_MS);
    }, ROTATE_MS);

    return () => {
      clearInterval(id);
      if (flipTimeoutRef.current) {
        window.clearTimeout(flipTimeoutRef.current);
      }
    };
  }, [lines.length, reduceMotion]);

  if (lines.length === 0) return null;

  if (reduceMotion || lines.length === 1) {
    if (inline) {
      return <span className="font-semibold text-black">{lines[0]}</span>;
    }

    return (
      <ul className="mt-2 max-w-2xl list-none space-y-2 pl-0 text-base leading-relaxed text-black/60">
        {lines.map((line) => (
          <li key={line} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-black/35" aria-hidden />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (inline) {
    return (
      <span className="relative inline-block min-h-[1.6rem] align-baseline [perspective:1200px]">
        <span
          className="absolute inset-0 origin-bottom whitespace-nowrap text-[1.06rem] font-semibold leading-snug text-black"
          style={{
            opacity: isFlipping ? 0 : 1,
            filter: isFlipping ? "blur(2px)" : "blur(0px)",
            transform: isFlipping ? "rotateX(86deg) translateY(-4px) scale(0.985)" : "rotateX(0deg) translateY(0) scale(1)",
            transition: `transform ${FLIP_MS}ms ${FLIP_EASE}, opacity ${FLIP_MS}ms ${FLIP_EASE}, filter ${FLIP_MS}ms ${FLIP_EASE}`,
            transformStyle: "preserve-3d",
            backfaceVisibility: "hidden",
            willChange: "transform, opacity, filter",
          }}
        >
          <RoughNotation
            key={`inline-active-${active}`}
            type={SCRIBBLE_TYPES[active % SCRIBBLE_TYPES.length]}
            show={!isFlipping}
            color={SCRIBBLE_COLOR}
            strokeWidth={1.8}
            animationDuration={900}
            padding={2}
          >
            {lines[active]}
          </RoughNotation>
        </span>

        <span
          className="absolute inset-0 origin-top whitespace-nowrap text-[1.06rem] font-semibold leading-snug text-black"
          style={{
            opacity: isFlipping ? 1 : 0,
            filter: isFlipping ? "blur(0px)" : "blur(3px)",
            transform: isFlipping ? "rotateX(0deg) translateY(0) scale(1)" : "rotateX(-86deg) translateY(4px) scale(0.985)",
            transition: `transform ${FLIP_MS}ms ${FLIP_EASE}, opacity ${FLIP_MS}ms ${FLIP_EASE}, filter ${FLIP_MS}ms ${FLIP_EASE}`,
            transformStyle: "preserve-3d",
            backfaceVisibility: "hidden",
            willChange: "transform, opacity, filter",
          }}
        >
          <RoughNotation
            key={`inline-next-${active + 1}`}
            type={SCRIBBLE_TYPES[(active + 1) % SCRIBBLE_TYPES.length]}
            show={isFlipping}
            color={SCRIBBLE_COLOR}
            strokeWidth={1.8}
            animationDuration={900}
            padding={2}
          >
            {lines[(active + 1) % lines.length]}
          </RoughNotation>
        </span>

        <span className="invisible block whitespace-nowrap text-[1.06rem] font-semibold leading-snug">
          {lines[active]}
        </span>
      </span>
    );
  }

  return (
    <div className="mt-2 max-w-2xl">
      <div className="relative min-h-[2rem] [perspective:1200px]">
        <span
          className="absolute inset-0 origin-bottom text-[1.06rem] font-semibold leading-snug text-black"
          style={{
            opacity: isFlipping ? 0 : 1,
            filter: isFlipping ? "blur(2px)" : "blur(0px)",
            transform: isFlipping ? "rotateX(86deg) translateY(-4px) scale(0.985)" : "rotateX(0deg) translateY(0) scale(1)",
            transition: `transform ${FLIP_MS}ms ${FLIP_EASE}, opacity ${FLIP_MS}ms ${FLIP_EASE}, filter ${FLIP_MS}ms ${FLIP_EASE}`,
            transformStyle: "preserve-3d",
            backfaceVisibility: "hidden",
            willChange: "transform, opacity, filter",
          }}
        >
          <RoughNotation
            key={`active-${active}`}
            type={SCRIBBLE_TYPES[active % SCRIBBLE_TYPES.length]}
            show={!isFlipping}
            color={SCRIBBLE_COLOR}
            strokeWidth={1.8}
            animationDuration={900}
            padding={2}
          >
            {lines[active]}
          </RoughNotation>
        </span>

        <span
          className="absolute inset-0 origin-top text-[1.06rem] font-semibold leading-snug text-black"
          style={{
            opacity: isFlipping ? 1 : 0,
            filter: isFlipping ? "blur(0px)" : "blur(3px)",
            transform: isFlipping ? "rotateX(0deg) translateY(0) scale(1)" : "rotateX(-86deg) translateY(4px) scale(0.985)",
            transition: `transform ${FLIP_MS}ms ${FLIP_EASE}, opacity ${FLIP_MS}ms ${FLIP_EASE}, filter ${FLIP_MS}ms ${FLIP_EASE}`,
            transformStyle: "preserve-3d",
            backfaceVisibility: "hidden",
            willChange: "transform, opacity, filter",
          }}
        >
          <RoughNotation
            key={`next-${active + 1}`}
            type={SCRIBBLE_TYPES[(active + 1) % SCRIBBLE_TYPES.length]}
            show={isFlipping}
            color={SCRIBBLE_COLOR}
            strokeWidth={1.8}
            animationDuration={900}
            padding={2}
          >
            {lines[(active + 1) % lines.length]}
          </RoughNotation>
        </span>

        <span className="invisible block text-[1.06rem] font-semibold leading-snug">
          {lines[active]}
        </span>
      </div>
    </div>
  );
}

export default function InfoSection({ info }: { info: LandingPageContent["info"] }) {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const { lead, bullets } = useMemo(() => parseRealityBody(info.body || ""), [info.body]);
  const cleanedLead = useMemo(
    () => lead.replace(/\s*[-–—]\s*nothing slips,\s*nothing gets missed\.?/i, "").trim(),
    [lead],
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="reality"
      ref={sectionRef}
      className="landing-section scroll-mt-20 bg-white md:scroll-mt-24"
    >
      <div className="appContainer">
        <div className="landing-grid-gap grid items-center lg:grid-cols-[1fr_0.95fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-black/55">
              {info.label}
            </p>

            <h2 className="mt-5 text-4xl font-extrabold leading-tight text-black md:text-5xl ">
              <span className="block whitespace-pre-line text-black/45">
                {info.statsLine}
              </span>
              <br />
              <RoughNotation
                type="highlight"
                show={isVisible}
                color="rgba(240, 197, 68, 0.35)"
                strokeWidth={1}
                padding={4}
                animationDelay={600}
                animationDuration={1400}
                multiline
              >
                {info.highlightQuestion}
              </RoughNotation>
            </h2>

            {bullets.length >= 1 ? (
              <>
                {bullets.length > 1 ? (
                  cleanedLead ? (
                    <p className="mt-5 max-w-2xl whitespace-pre-line text-base leading-relaxed text-black/60">
                      <span>{cleanedLead}</span>{" "}
                      <RotatingBodyBullets lines={bullets} inline />
                    </p>
                  ) : (
                    <RotatingBodyBullets lines={bullets} />
                  )
                ) : (
                  <p className="mt-6 max-w-2xl text-lg font-medium leading-snug text-black/70">
                    {bullets[0]}
                  </p>
                )}
              </>
            ) : (
              <p className="mt-6 max-w-2xl whitespace-pre-line text-base leading-relaxed text-black/60">
                {info.body}
              </p>
            )}

            <Link
              href={info.ctaHref || "/login"}
              className="landing-cta group mt-2 inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-black/85"
            >
              {info.ctaLabel}
              <FiArrowRight className="landing-icon-slide text-base" />
            </Link>
          </div>

          <div className="mx-auto w-full max-w-[740px]">
            <div className="overflow-hidden rounded-[28px] pb-0">
              <Image
                src="/landing-page/problem3.png"
                alt="Unitracko dashboard preview"
                width={1240}
                height={920}
                className="h-auto w-full rounded-[22px]"
                priority={false}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
