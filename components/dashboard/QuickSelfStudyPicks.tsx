"use client";

import { useEffect, useRef, useState } from "react";
import { BiChevronRight } from "react-icons/bi";
import { Button } from "@/components/shared";
import {
  getQuickStudyYoutubeId,
  QUICK_SELF_STUDY_PICKS,
  QUICK_SELF_STUDY_VIDEO_CYCLE_MS,
} from "@/lib/quickSelfStudyPicks";

const VIDEO_SLIDE_STYLES = `
  @keyframes slideUpVideo {
    0% { transform: translateY(40px) scale(0.95); opacity: 0; }
    100% { transform: translateY(0) scale(1); opacity: 1; }
  }
  .animate-video-slide {
    animation: slideUpVideo 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
`;

type QuickSelfStudyPicksProps = {
  /** Dashboard overview uses flex-1; shortlist sidebars use a capped height. */
  variant?: "dashboard" | "sidebar";
  className?: string;
};

export function QuickSelfStudyPicks({
  variant = "dashboard",
  className = "",
}: QuickSelfStudyPicksProps) {
  const picks = QUICK_SELF_STUDY_PICKS;
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [prevVideoIndex, setPrevVideoIndex] = useState<number | null>(null);
  const [preloadVideoIndex, setPreloadVideoIndex] = useState<number | null>(null);
  const [, setVideoProgressMs] = useState(0);

  const activeVideoRef = useRef(activeVideoIndex);
  useEffect(() => {
    activeVideoRef.current = activeVideoIndex;
  }, [activeVideoIndex]);

  useEffect(() => {
    const tickMs = 100;
    const timer = setInterval(() => {
      setVideoProgressMs((prev) => {
        const next = prev + tickMs;
        if (next === 1000) {
          setPrevVideoIndex(null);
        }
        if (next === QUICK_SELF_STUDY_VIDEO_CYCLE_MS - 1000) {
          setPreloadVideoIndex((activeVideoRef.current + 1) % picks.length);
        }
        if (next >= QUICK_SELF_STUDY_VIDEO_CYCLE_MS) {
          setPrevVideoIndex(activeVideoRef.current);
          setActiveVideoIndex((activeVideoRef.current + 1) % picks.length);
          setPreloadVideoIndex(null);
          return 0;
        }
        return next;
      });
    }, tickMs);
    return () => clearInterval(timer);
  }, [picks.length]);

  const handleVideoSelect = (idx: number) => {
    if (idx === activeVideoIndex) return;
    setPrevVideoIndex(activeVideoIndex);
    setActiveVideoIndex(idx);
    setPreloadVideoIndex(null);
    setVideoProgressMs(0);
  };

  const listClassName =
    variant === "sidebar"
      ? "relative mt-3 max-h-[min(52vh,520px)] overflow-hidden"
      : "relative mt-3 xl:min-h-0 flex-1 xl:overflow-hidden";

  return (
    <article
      className={[
        "flex flex-col rounded-2xl bg-white p-3 pb-5 dark:bg-slate-900",
        variant === "dashboard" ? "xl:min-h-0 flex-1" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <style dangerouslySetInnerHTML={{ __html: VIDEO_SLIDE_STYLES }} />

      <div className="flex shrink-0 items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Quick Self-Study Picks
          </h3>
          <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
            Short tactical videos curated to improve your next mock score.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700"
            aria-hidden
            tabIndex={-1}
          >
            <BiChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <article className="relative mt-3 shrink-0 rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 dark:border-slate-700 dark:bg-slate-800/40">
        <div className="relative aspect-[21/9] w-full overflow-hidden rounded-lg bg-black">
          {picks.map((video, idx) => {
            const isPreload = idx === preloadVideoIndex;
            const isActive = idx === activeVideoIndex;
            const isPrev = idx === prevVideoIndex;
            if (!isActive && !isPreload && !isPrev) return null;

            const vId = getQuickStudyYoutubeId(video.videoUrl);

            let containerClass = "absolute inset-0 h-full w-full ";
            if (isActive) containerClass += "z-20 animate-video-slide";
            else if (isPrev) containerClass += "z-10 opacity-100";
            else if (isPreload) containerClass += "z-0 pointer-events-none opacity-0";

            return (
              <div key={vId || video.title} className={containerClass}>
                {vId ? (
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${vId}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&playsinline=1&loop=1&playlist=${vId}&start=5&end=15`}
                    title={`${video.title} preview`}
                    className="pointer-events-none absolute top-1/2 left-0 aspect-video w-full -translate-y-1/2"
                    loading="lazy"
                    allow="autoplay; encrypted-media; picture-in-picture"
                  />
                ) : (
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="pointer-events-none absolute top-1/2 left-0 aspect-video w-full -translate-y-1/2 object-cover"
                    loading="lazy"
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="relative mt-2.5 min-h-[36px]">
          {picks.map((video, idx) => {
            const isActive = idx === activeVideoIndex;
            const isPrev = idx === prevVideoIndex;
            if (!isActive && !isPrev) return null;

            return (
              <div
                key={`details-${video.title}`}
                className={`absolute inset-0 flex w-full items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800 ${
                  isActive ? "z-20 animate-video-slide" : "z-10 opacity-100"
                }`}
              >
                <p className="line-clamp-2 text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {video.title}
                </p>
                <Button
                  href={video.videoUrl}
                  variant="themeButtonOutline"
                  size="sm"
                  className="!rounded-full px-3 py-1 text-[11px] shrink-0"
                >
                  Watch now
                </Button>
              </div>
            );
          })}
        </div>
      </article>

      <div className={listClassName}>
        <div className="h-full overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:black_transparent] xl:max-h-full [&::-webkit-scrollbar-thumb]:rounded-lg [&::-webkit-scrollbar-thumb]:border-[2px] [&::-webkit-scrollbar-thumb]:border-solid [&::-webkit-scrollbar-thumb]:border-white [&::-webkit-scrollbar-thumb]:bg-black/90 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent dark:[&::-webkit-scrollbar-thumb]:border-slate-900 dark:[&::-webkit-scrollbar-thumb]:bg-[#FAD53C]/80">
          {picks.map((item, idx) => {
            if (idx === activeVideoIndex) return null;
            return (
              <article key={item.title} className="py-2 first:pt-0 last:pb-0">
                <button
                  type="button"
                  onClick={() => handleVideoSelect(idx)}
                  className="flex w-full items-start gap-3 rounded-md px-1 py-1 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <div className="relative h-16 w-28 flex-shrink-0 overflow-hidden rounded-md bg-action-50 dark:bg-slate-700">
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
                      {item.duration}
                    </span>
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-slate-900 dark:text-slate-100">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      {item.tag} · YouTube
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {item.tags.map((tag) => (
                        <span
                          key={`${item.title}-${tag}`}
                          className="rounded-full border border-slate-300/90 px-2 py-0.5 text-[9px] font-medium text-slate-500 dark:border-slate-600 dark:text-slate-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </article>
  );
}
