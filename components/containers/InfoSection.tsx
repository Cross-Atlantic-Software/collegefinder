"use client";

import Link from "next/link";
import Image from "next/image";
import { FiArrowRight } from "react-icons/fi";
import type { LandingPageContent } from "@/types/landingPage";
import { useAuth } from "@/contexts/AuthContext";

const PROBLEM_POINTS = [
  "Too many options, not enough clarity",
  "Important deadlines easily missed",
  "Confusing and biased recommendations",
  "Uncertainty about where to begin",
];

/** Hand-drawn doodle tick: sketchy yellow circle outline with a wobbly check (no fill, no animation). */
function TickBadge() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="mt-0.5 h-6 w-6 shrink-0"
      fill="none"
      stroke="#f0c544"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {/* sketchy, slightly-open circle for a hand-drawn feel */}
      <path d="M14.5 2.8C7.8 1.7 2.6 6.3 2.6 12c0 5.6 4.4 9.6 10 9.4 5.3-.2 9-4.4 8.8-9.8C21.2 6.4 18 3 12.6 2.6" />
      {/* wobbly doodle checkmark */}
      <path d="M7 12.4c1.2.8 2.3 2 3.1 3.4 1.5-3 3.6-5.6 6.4-7.6" />
    </svg>
  );
}

export default function InfoSection({ info }: { info: LandingPageContent["info"] }) {
  const { isAuthenticated } = useAuth();

  const ctaHref = isAuthenticated
    ? "/dashboard?section=applications"
    : "https://unitracko.com/applications-directory";

  return (
    <section id="reality" className="landing-section scroll-mt-20 bg-white md:scroll-mt-24">
      <div className="appContainer">
        <div className="landing-grid-gap grid items-center lg:grid-cols-[1fr_0.95fr]">
          <div>
            <h2 className="text-4xl font-extrabold leading-tight text-black md:text-5xl">
              Still Tracking It All <span className="text-[#f0c544]">Manually?</span>
            </h2>

            <p className="mt-5 max-w-2xl text-lg font-semibold leading-snug text-black">
              Here&rsquo;s Why It May Not Be Working For You
            </p>

            <ul className="mt-6 max-w-2xl list-none space-y-3 pl-0 text-base leading-relaxed text-black/70">
              {PROBLEM_POINTS.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <TickBadge />
                  <span>{point}</span>
                </li>
              ))}
            </ul>

            <Link
              href={ctaHref}
              className="landing-cta group mt-8 inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-black/85"
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
