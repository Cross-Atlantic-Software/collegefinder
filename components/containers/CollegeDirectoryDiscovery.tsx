"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";
import { RoughNotation } from "react-rough-notation";
import { getCollegesByProgram, type PublicCollege } from "@/api/colleges";
import { getAllPrograms } from "@/api/public/programs";
import OnboardingLoader from "@/components/shared/OnboardingLoader";
import { LockedCollegePreviewCard } from "@/components/containers/college-directory/LockedCollegePreviewCard";
import { PublicCollegeCard } from "@/components/containers/college-directory/PublicCollegeCard";
import { DIRECTORY_CARD_GRID_CLASS } from "@/components/containers/exam-directory/directoryCardTones";
import {
  resolveCollegeDirectoryPrograms,
  splitCollegesForPublicDirectory,
  type CollegeDirectoryProgram,
} from "@/lib/collegeDirectoryUtils";

export default function CollegeDirectoryDiscovery() {
  const headerRef = useRef<HTMLDivElement>(null);
  const [headingVisible, setHeadingVisible] = useState(false);
  const [programs, setPrograms] = useState<CollegeDirectoryProgram[]>([]);
  const [colleges, setColleges] = useState<PublicCollege[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [loadingColleges, setLoadingColleges] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoadingPrograms(true);
      setError(null);
      try {
        const res = await getAllPrograms();
        if (cancelled) return;

        if (!res.success || !res.data?.programs?.length) {
          setError(res.message || "Could not load programs.");
          return;
        }

        const directoryPrograms = resolveCollegeDirectoryPrograms(res.data.programs);
        if (!directoryPrograms.length) {
          setError("No programs are available for the college directory yet.");
          return;
        }

        setPrograms(directoryPrograms);
        setSelectedProgramId((prev) => {
          if (prev != null && directoryPrograms.some((p) => p.id === prev)) return prev;
          return directoryPrograms[0]?.id ?? null;
        });
      } catch {
        if (!cancelled) setError("Could not load college directory.");
      } finally {
        if (!cancelled) setLoadingPrograms(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const loadCollegesForProgram = useCallback(async (programId: number) => {
    setLoadingColleges(true);
    setError(null);
    try {
      const res = await getCollegesByProgram(programId);
      if (!res.success || !res.data) {
        setColleges([]);
        setError(res.message || "Could not load colleges.");
        return;
      }
      setColleges(res.data.colleges);
    } catch {
      setColleges([]);
      setError("Could not load colleges.");
    } finally {
      setLoadingColleges(false);
    }
  }, []);

  useEffect(() => {
    if (selectedProgramId == null) return;
    loadCollegesForProgram(selectedProgramId);
  }, [selectedProgramId, loadCollegesForProgram]);

  useEffect(() => {
    if (loadingPrograms || (error != null && programs.length === 0)) return;

    const el = headerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          queueMicrotask(() => {
            setHeadingVisible(true);
            observer.disconnect();
          });
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadingPrograms, error, programs.length]);

  const { visible, lockedPreview, hasMoreLocked } = useMemo(
    () => splitCollegesForPublicDirectory(colleges),
    [colleges]
  );

  const selectedProgram = programs.find((p) => p.id === selectedProgramId);

  if (loadingPrograms) {
    return (
      <main className="min-h-[50vh] bg-[#cfe0f1]/35 py-16">
        <div className="appContainer flex justify-center">
          <OnboardingLoader message="Loading colleges…" />
        </div>
      </main>
    );
  }

  if (error && programs.length === 0) {
    return (
      <main className="min-h-[50vh] bg-[#cfe0f1]/35 py-16">
        <div className="appContainer text-center">
          <p className="text-sm text-black/65">{error}</p>
          <Link
            href="/"
            className="landing-cta mt-6 inline-flex rounded-full border border-black/30 px-4 py-2 text-sm font-semibold text-black hover:bg-black hover:text-white"
          >
            Back to home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-gradient-to-b from-[#cfe0f1]/50 via-white to-white">
      <section className="scroll-mt-20 pb-6 pt-4 md:scroll-mt-24 md:pb-8 md:pt-5">
        <div className="appContainer">
          <Link
            href="/#the-playbook"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-black/70 transition-colors hover:text-black sm:text-sm"
          >
            <FiArrowLeft aria-hidden />
            Back to The Playbook
          </Link>

          <div ref={headerRef} className="mx-auto mt-3 text-center md:mt-4">
            <h2 className="overflow-visible text-2xl font-extrabold leading-snug text-black sm:text-3xl">
              <span className="inline-flex flex-wrap items-baseline justify-center gap-x-1.5">
                Find the Right{" "}
                <RoughNotation
                  type="underline"
                  show={headingVisible}
                  color="#f0c544"
                  strokeWidth={3}
                  padding={3}
                  animationDelay={500}
                  animationDuration={1500}
                >
                  <span className="inline-block">College with Confidence</span>
                </RoughNotation>
              </span>
            </h2>
            <p className="mt-1.5 text-xs text-black/50 sm:text-sm">
              Key details like fees, cutoffs, placements, and college fit in one place.
            </p>

            <div
              className="mx-auto mt-3 flex w-full max-w-full overflow-x-auto rounded-xl bg-sky-100 p-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:inline-flex sm:w-auto sm:max-w-none sm:rounded-full [&::-webkit-scrollbar]:hidden"
              role="tablist"
              aria-label="Programs"
            >
              {programs.map((program) => {
                const isActive = program.id === selectedProgramId;
                return (
                  <button
                    key={program.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setSelectedProgramId(program.id)}
                    className={`landing-cta min-w-0 shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:rounded-full sm:px-5 sm:py-1.5 sm:text-sm ${
                      isActive
                        ? "bg-black text-white"
                        : "text-black/55 hover:text-black"
                    }`}
                  >
                    {program.displayName}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5" role="tabpanel">
            {selectedProgram ? (
              <p className="mb-3 text-sm text-black/55">
                Showing top colleges for{" "}
                <span className="font-semibold text-black">{selectedProgram.displayName}</span>
                {hasMoreLocked ? " — log in to see the full list." : "."}
              </p>
            ) : null}

            {loadingColleges ? (
              <div className="flex justify-center py-16">
                <OnboardingLoader message="Loading colleges…" />
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-dashed border-black/15 bg-white/80 px-6 py-14 text-center">
                <p className="text-sm text-black/60">{error}</p>
              </div>
            ) : visible.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-black/15 bg-white/80 px-6 py-14 text-center">
                <p className="text-sm text-black/60">
                  No colleges are listed for this program yet. Try another program or check back
                  soon.
                </p>
              </div>
            ) : (
              <div className={DIRECTORY_CARD_GRID_CLASS}>
                {visible.map((college, index) => (
                  <PublicCollegeCard
                    key={college.id}
                    college={college}
                    toneIndex={index}
                  />
                ))}
                {hasMoreLocked ? (
                  <LockedCollegePreviewCard
                    college={lockedPreview}
                    toneIndex={visible.length}
                  />
                ) : null}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
