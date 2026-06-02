"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import type { ExamTaggedLecturePreview } from "@/api/exams";

type ExamDetailRecommendedVideosProps = {
  count: number;
  lectures: ExamTaggedLecturePreview[];
  title?: string;
  subtitle?: string;
};

const EXAM_PREP_HREF = "/dashboard?section=exam-prep&mode=self";

export function ExamDetailRecommendedVideos({
  count,
  lectures,
  title = "Recommended Videos",
  subtitle = "Tagged for this exam in Exam Prep.",
}: ExamDetailRecommendedVideosProps) {
  const slides =
    lectures.length > 0
      ? lectures
      : count > 0
        ? [
            {
              id: 0,
              title: "Exam prep videos",
              channel: null,
              subjectName: "Self study",
              topicName: null,
              hookSummary: `${count} video${count === 1 ? "" : "s"} tagged for this exam in Exam Prep.`,
            },
          ]
        : [];

  const [activeIndex, setActiveIndex] = useState(0);

  if (count <= 0 || slides.length === 0) return null;

  return (
    <article className="min-w-0 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900 md:p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h3>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        </div>
        {slides.length > 1 ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
              className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white ring-1 ring-slate-200 transition hover:ring-black disabled:opacity-30 dark:bg-slate-800 dark:ring-slate-700"
              disabled={activeIndex === 0}
              aria-label="Previous video"
            >
              <ChevronRight className="h-3.5 w-3.5 rotate-180" />
            </button>
            <button
              type="button"
              onClick={() => setActiveIndex((i) => Math.min(slides.length - 1, i + 1))}
              className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white ring-1 ring-slate-200 transition hover:ring-black disabled:opacity-30 dark:bg-slate-800 dark:ring-slate-700"
              disabled={activeIndex === slides.length - 1}
              aria-label="Next video"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}
      </div>

      <div className="mt-2.5 overflow-hidden rounded-xl">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {slides.map((item) => {
            const track = item.subjectName?.trim() || item.topicName?.trim() || "Self study";
            const reason =
              item.hookSummary?.trim() ||
              [item.topicName?.trim(), item.channel?.trim()].filter(Boolean).join(" · ") ||
              "Watch curated prep videos for this exam.";

            return (
              <div
                key={item.id}
                className="w-full shrink-0 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-800/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="line-clamp-2 text-[13px] font-semibold text-slate-900 dark:text-slate-100">
                    {item.title}
                  </p>
                  <span className="shrink-0 rounded-full bg-yellow-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                    Video
                  </span>
                </div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                  {track}
                </p>
                <p className="mt-1 line-clamp-3 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  {reason}
                </p>
                <Link
                  href={EXAM_PREP_HREF}
                  className="mt-2 inline-flex items-center gap-1 rounded-full bg-black px-3 py-1 text-[11px] font-semibold text-white transition hover:bg-neutral-800"
                >
                  Watch video <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            );
          })}
        </div>

        {slides.length > 1 ? (
          <div className="mt-2 flex items-center justify-center gap-1.5">
            {slides.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveIndex(idx)}
                aria-label={`Show video ${idx + 1}`}
                className={`relative h-1 overflow-hidden rounded-full transition-all ${
                  idx === activeIndex ? "w-8 bg-[#FAD53C]/30" : "w-1.5 bg-slate-200 dark:bg-slate-700"
                }`}
              >
                {idx === activeIndex ? (
                  <span className="absolute inset-y-0 left-0 w-full rounded-full bg-[#FAD53C]" />
                ) : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {count > slides.length ? (
        <p className="mt-2 text-center text-[10px] font-medium text-slate-400">
          +{count - slides.length} more in Exam Prep
        </p>
      ) : null}
    </article>
  );
}
