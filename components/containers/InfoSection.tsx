"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FiArrowRight } from "react-icons/fi";
import { RoughNotation } from "react-rough-notation";

export default function InfoSection() {
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
      { threshold: 0.25 },
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="problem"
      ref={sectionRef}
      className="landing-section scroll-mt-20 bg-white md:scroll-mt-24"
    >
      <div className="appContainer">
        <div className="landing-grid-gap grid items-center lg:grid-cols-[1fr_0.95fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-black/55">
              THE PROBLEM
            </p>

            <h2 className="mt-5 text-4xl font-extrabold leading-tight text-black md:text-5xl">
              <span className="text-black/45">
                1k+ exams, 40k+ colleges
                <br />
                and 17 Mn students.
              </span>
              <br />
              You&apos;re expected to
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
                track all manually ?
              </RoughNotation>
            </h2>

            <p className="mt-6 max-w-2xl text-base leading-relaxed text-black/60">
              Unitracko puts your entire college admission journey into one
              powerful, structured system — so nothing slips, nothing gets
              missed, and nothing is left to chance.
            </p>

            <Link
              href="/login"
              className="landing-cta group mt-8 inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-black/85"
            >
              Remove your headache
              <FiArrowRight className="landing-icon-slide text-base" />
            </Link>
          </div>

          <div className="mx-auto w-full max-w-[620px]">
            <div className="overflow-hidden rounded-[28px] border border-[#E7EBF0] bg-white p-2 shadow-[0_32px_62px_-40px_rgba(15,23,42,0.6)]">
              <div className="overflow-hidden rounded-3xl border border-[#E8ECF1] bg-[#F6F8FA]">
                <div className="grid min-h-[420px] grid-cols-[52px_1fr] lg:min-h-[460px]">
                  <aside className="border-r border-[#E8ECF1] bg-white/65 px-3 py-4">
                    <div className="flex h-full flex-col items-center gap-4">
                      <div className="h-7 w-7 rounded-md bg-[#DCD6EC]" />
                      <div className="mt-2 h-8 w-8 rounded-xl bg-[#F7EFC8]" />
                      <div className="h-6 w-6 rounded-md bg-[#E1E7EF]" />
                      <div className="h-6 w-6 rounded-md bg-[#E1E7EF]" />
                      <div className="h-6 w-6 rounded-md bg-[#E1E7EF]" />
                      <div className="mt-auto h-6 w-6 rounded-md bg-[#E1E7EF]" />
                    </div>
                  </aside>

                  <div className="flex flex-col">
                    <div className="border-b border-[#E8ECF1] bg-white/75 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 flex-1 rounded-md bg-[#E9EDF2]" />
                        <div className="h-8 w-20 rounded-md bg-[#E9EDF2]" />
                        <div className="h-8 w-8 rounded-full bg-[#E9EDF2]" />
                      </div>
                    </div>

                    <div className="flex-1 px-4 py-4 lg:px-5 lg:py-5">
                      <div className="mb-4">
                        <p className="text-[1.35rem] font-semibold text-black/85">
                          Dashboard
                        </p>
                        <p className="mt-0.5 text-xs text-black/45">
                          a overlook on things
                        </p>
                      </div>

                      <div className="grid gap-3 lg:grid-cols-[1.82fr_0.88fr]">
                        <div className="space-y-3">
                          <div className="h-40 rounded-2xl border border-[#E4E8ED] bg-[#ECEFF3] lg:mr-2" />
                          <div className="h-44 rounded-2xl border border-[#E4E8ED] bg-[#ECEFF3] lg:ml-1 lg:mr-4" />
                        </div>

                        <div className="space-y-3 lg:pt-1">
                          <div className="h-24 rounded-2xl border border-[#E4E8ED] bg-[#EEF1F4] lg:-ml-2" />

                          <div className="rounded-2xl border border-[#E4E8ED] bg-[#EEF1F4] p-3 lg:ml-2">
                            <div className="h-5 w-36 rounded bg-[#DFE3E8]" />
                            <div className="mt-3 space-y-2.5">
                              <div className="grid grid-cols-[84px_1fr] gap-2">
                                <div className="h-16 rounded-xl bg-[#DEE2E7]" />
                                <div className="pt-1">
                                  <div className="h-4 w-24 rounded bg-[#D4D8DD]" />
                                  <div className="mt-2 h-3 w-20 rounded bg-[#DCE0E5]" />
                                </div>
                              </div>

                              <div className="grid grid-cols-[84px_1fr] gap-2 lg:ml-1">
                                <div className="h-16 rounded-xl bg-[#DEE2E7]" />
                                <div className="pt-1">
                                  <div className="h-4 w-20 rounded bg-[#D4D8DD]" />
                                  <div className="mt-2 h-3 w-24 rounded bg-[#DCE0E5]" />
                                </div>
                              </div>

                              <div className="grid grid-cols-[84px_1fr] gap-2 lg:-ml-1">
                                <div className="h-16 rounded-xl bg-[#DEE2E7]" />
                                <div className="pt-1">
                                  <div className="h-4 w-24 rounded bg-[#D4D8DD]" />
                                  <div className="mt-2 h-3 w-16 rounded bg-[#DCE0E5]" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
