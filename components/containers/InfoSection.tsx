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

const ROTATE_MS = 4200;

function RotatingBodyBullets({ lines }: { lines: string[] }) {
  const [active, setActive] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (lines.length < 2 || reduceMotion) return;
    const id = window.setInterval(
      () => setActive((i) => (i + 1) % lines.length),
      ROTATE_MS,
    );
    return () => clearInterval(id);
  }, [lines.length, reduceMotion]);

  if (lines.length === 0) return null;

  if (reduceMotion || lines.length === 1) {
    return (
      <ul className="mt-4 max-w-2xl list-none space-y-2 pl-0 text-base leading-relaxed text-black/60">
        {lines.map((line) => (
          <li key={line} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-black/35" aria-hidden />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div
      className="perspective-[880px] mt-6"
    >
       <div className="relative min-h-[3rem] [perspective:1000px]">
  <span
    key={active}
    className="block text-md inline-flex items-center justify-center bg-black/10 rounded-full px-4 py-2 font-bold leading-snug text-black/60 transition-transform duration-700 ease-in-out"
    style={{
      transform: "rotateY(0deg)",
      animation: "rotateYAnim 0.7s ease"
    }}
  >
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
                {lead ? (
                  <p className="mt-6 max-w-2xl whitespace-pre-line text-base leading-relaxed text-black/60">
                    {lead}
                  </p>
                ) : null}
                {bullets.length > 1 ? (
                  <RotatingBodyBullets lines={bullets} />
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
            <div className="overflow-hidden rounded-[28px] bg-white p-2">
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
