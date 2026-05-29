"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";
import { RoughNotation } from "react-rough-notation";
import { getAllExams, type Exam } from "@/api/exams";
import { getAllStreams, type Stream } from "@/api/streams";
import OnboardingLoader from "@/components/shared/OnboardingLoader";
import { LockedExamPreviewCard } from "@/components/containers/exam-directory/LockedExamPreviewCard";
import { PublicExamCard } from "@/components/containers/exam-directory/PublicExamCard";
import {
  examsForStream,
  splitExamsForPublicDirectory,
} from "@/lib/examDirectoryUtils";

export default function ExamDirectoryDiscovery() {
  const headerRef = useRef<HTMLDivElement>(null);
  const [headingVisible, setHeadingVisible] = useState(false);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedStreamId, setSelectedStreamId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [streamsRes, examsRes] = await Promise.all([getAllStreams(), getAllExams()]);
        if (cancelled) return;

        if (!streamsRes.success || !streamsRes.data?.streams?.length) {
          setError(streamsRes.message || "Could not load streams.");
          return;
        }
        if (!examsRes.success || !examsRes.data) {
          setError(examsRes.message || "Could not load exams.");
          return;
        }

        const nextStreams = [...streamsRes.data.streams].sort(
          (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)
        );
        setStreams(nextStreams);
        setExams(examsRes.data.exams);
        setSelectedStreamId((prev) => prev ?? nextStreams[0]?.id ?? null);
      } catch {
        if (!cancelled) setError("Could not load exam directory.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          queueMicrotask(() => setHeadingVisible(true));
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const streamExams = useMemo(() => {
    if (selectedStreamId == null) return [];
    return examsForStream(exams, selectedStreamId);
  }, [exams, selectedStreamId]);

  const { visible, lockedPreview, hasMoreLocked } = useMemo(
    () => splitExamsForPublicDirectory(streamExams),
    [streamExams]
  );

  const selectedStream = streams.find((s) => s.id === selectedStreamId);

  if (loading) {
    return (
      <main className="min-h-[50vh] bg-[#cfe0f1]/35 py-16">
        <div className="appContainer flex justify-center">
          <OnboardingLoader message="Loading exams…" />
        </div>
      </main>
    );
  }

  if (error) {
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
            <h2 className="text-2xl font-extrabold leading-snug text-black sm:text-3xl">
              <RoughNotation
                type="underline"
                show={headingVisible}
                color="#f0c544"
                strokeWidth={3}
                padding={3}
                animationDelay={500}
                animationDuration={1500}
                multiline
              >
                Your Stream. Your Exams. Your Call.
              </RoughNotation>
            </h2>
            <p className="mt-1.5 text-xs text-black/50 sm:text-sm">
              From engineering to medical — verified details, zero guesswork.
            </p>

            <div
              className="mx-auto mt-3 flex w-full max-w-full overflow-x-auto rounded-xl bg-sky-100 p-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:inline-flex sm:w-auto sm:max-w-none sm:rounded-full [&::-webkit-scrollbar]:hidden"
              role="tablist"
              aria-label="Academic streams"
            >
              {streams.map((stream) => {
                const isActive = stream.id === selectedStreamId;
                return (
                  <button
                    key={stream.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setSelectedStreamId(stream.id)}
                    className={`landing-cta min-w-0 shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:rounded-full sm:px-5 sm:py-1.5 sm:text-sm ${
                      isActive
                        ? "bg-black text-white"
                        : "text-black/55 hover:text-black"
                    }`}
                  >
                    {stream.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5" role="tabpanel">
            {selectedStream ? (
              <p className="mb-3 text-sm text-black/55">
                Showing top exams for{" "}
                <span className="font-semibold text-black">{selectedStream.name}</span>
                {hasMoreLocked ? " — log in to see the full list." : "."}
              </p>
            ) : null}

            {visible.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-black/15 bg-white/80 px-6 py-14 text-center">
                <p className="text-sm text-black/60">
                  No exams are listed for this stream yet. Try another stream or check back soon.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {visible.map((exam, index) => (
                  <PublicExamCard
                    key={exam.id}
                    exam={exam}
                    name={exam.name}
                    toneIndex={index}
                  />
                ))}
                {hasMoreLocked ? (
                  <LockedExamPreviewCard exam={lockedPreview} toneIndex={visible.length} />
                ) : null}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
