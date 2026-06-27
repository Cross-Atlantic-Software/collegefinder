"use client";

import Link from "next/link";
import { Play } from "lucide-react";
import type { ExamTaggedLecturePreview } from "@/api/exams";

type ExamDetailRecommendedVideosProps = {
  count: number;
  lectures: ExamTaggedLecturePreview[];
  title?: string;
  subtitle?: string;
};

const EXAM_PREP_HREF = "/dashboard?section=exam-prep&mode=self";
const VISIBLE_COUNT = 3;

// Preview data has no thumbnail URL, so each card uses a deterministic gradient cover.
const THUMB_GRADIENTS = [
  "from-[#341050] to-[#7c3aed]",
  "from-[#0f766e] to-[#22d3ee]",
  "from-[#b45309] to-[#f59e0b]",
  "from-[#9d174d] to-[#fb7185]",
];

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

  if (count <= 0 || slides.length === 0) return null;

  const visible = slides.slice(0, VISIBLE_COUNT);
  const remaining = count - visible.length;

  return (
    <article className="min-w-0 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900 md:p-5">
      <div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{subtitle}</p>
      </div>

      <div className="mt-3 space-y-3">
        {visible.map((item, idx) => {
          const track = item.subjectName?.trim() || item.topicName?.trim() || "Self study";
          const gradient = THUMB_GRADIENTS[idx % THUMB_GRADIENTS.length];

          return (
            <Link
              key={item.id}
              href={EXAM_PREP_HREF}
              className="group block overflow-hidden rounded-xl border border-slate-100 bg-slate-50/80 transition hover:border-[#FAD53C] hover:shadow-sm dark:border-slate-800 dark:bg-slate-800/40"
            >
              <div
                className={`relative flex aspect-video w-full items-center justify-center bg-gradient-to-br ${gradient}`}
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-black shadow transition group-hover:scale-110">
                  <Play className="h-4 w-4 translate-x-[1px] fill-current" />
                </span>
                <span className="absolute left-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
                  {track}
                </span>
              </div>
              <div className="p-2.5">
                <p className="line-clamp-2 text-[12px] font-semibold leading-tight text-slate-900 dark:text-slate-100">
                  {item.title}
                </p>
                {item.channel?.trim() ? (
                  <p className="mt-0.5 line-clamp-1 text-[10px] text-slate-500 dark:text-slate-400">
                    {item.channel}
                  </p>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>

      {remaining > 0 ? (
        <Link
          href={EXAM_PREP_HREF}
          className="mt-3 block rounded-full bg-black py-1.5 text-center text-[11px] font-semibold text-white transition hover:bg-neutral-800"
        >
          +{remaining} more in Exam Prep
        </Link>
      ) : null}
    </article>
  );
}
