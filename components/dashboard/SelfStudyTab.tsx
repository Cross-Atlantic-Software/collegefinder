"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { FiExternalLink, FiPlayCircle } from "react-icons/fi";
import type { ExamPrepLectureDto } from "@/api/auth/profile";
import { formatDurationFromSeconds } from "@/lib/formatDuration";
import {
  useExamPrepLecturesBySubjectQuery,
  useExamPrepRecommendedQuery,
} from "@/lib/examPrepLectureQueries";
import { useExamPrepStrengthsQuery } from "@/lib/strengthQueries";

type Topic = {
  id: number;
  name: string;
  thumbnail: string | null;
  description: string | null;
  home_display: boolean;
  sort_order: number;
};

type SubjectSection = {
  id: string;
  name: string;
  topics: Topic[];
  allTopics: Topic[];
};

type Props = {
  subjects: SubjectSection[];
  query: string;
  onQueryChange: (v: string) => void;
  sortBy: "latest" | "popular";
  onToggleSort: () => void;
};

type VideoItem = {
  id: string;
  youtubeId: string;
  title: string;
  channel: string;
  duration: string;
  views: string;
  published: string;
  viewsCount: number;
  recencyScore: number;
  examTier: number;
  tags: string[];
  youtubeUrl: string;
  hookSummary?: string | null;
};

type TabStripItem = {
  id: string;
  label: ReactNode;
};

type TopicGroup = {
  id: string;
  name: string;
  lectures: ExamPrepLectureDto[];
};

const LECTURES_PER_TOPIC_PAGE = 6;

function formatCompact(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(Math.round(n));
}

function formatRelativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diff = Date.now() - t;
  const day = 86400000;
  if (diff < day) return "Today";
  if (diff < day * 2) return "Yesterday";
  if (diff < day * 7) return `${Math.floor(diff / day)} days ago`;
  if (diff < day * 60) return `${Math.floor(diff / (day * 7))} wk ago`;
  return `${Math.floor(diff / (day * 30))} mo ago`;
}

function prepLectureToVideoItem(lec: ExamPrepLectureDto): VideoItem {
  const viewsCount = Math.floor(lec.likes + lec.subscribers / 1000);
  const recencyScore = new Date(lec.updatedAt).getTime();
  const likesStr = formatCompact(lec.likes);
  const subsStr = formatCompact(lec.subscribers);

  return {
    id: `lec-${lec.id}-${lec.youtubeId}`,
    youtubeId: lec.youtubeId,
    title: `${lec.topicName} • ${lec.title}`,
    channel: lec.channel || "YouTube",
    duration: formatDurationFromSeconds(lec.durationSeconds ?? undefined),
    views: `${likesStr} likes · ${subsStr} subs`,
    published: formatRelativeTime(lec.updatedAt),
    viewsCount,
    recencyScore,
    examTier: lec.examTier ?? 2,
    tags: [lec.subjectName.toLowerCase(), lec.topicName.toLowerCase()],
    youtubeUrl: `https://www.youtube.com/watch?v=${lec.youtubeId}`,
    hookSummary: lec.hookSummary,
  };
}

const sortVideos = (videos: VideoItem[], sortBy: "latest" | "popular"): VideoItem[] => {
  const items = [...videos];
  return items.sort((a, b) => {
    const tierDiff = (a.examTier ?? 2) - (b.examTier ?? 2);
    if (tierDiff !== 0) return tierDiff;

    if (sortBy === "popular") {
      const popularDiff = b.viewsCount - a.viewsCount;
      if (popularDiff !== 0) return popularDiff;
      return b.recencyScore - a.recencyScore;
    }

    const latestDiff = b.recencyScore - a.recencyScore;
    if (latestDiff !== 0) return latestDiff;
    return b.viewsCount - a.viewsCount;
  });
};

const toEmbedUrl = (youtubeId: string, startSeconds = 12, endSeconds = 20): string => {
  return `https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${youtubeId}&start=${startSeconds}&end=${endSeconds}&playsinline=1&modestbranding=1&rel=0`;
};

function HorizontalTabStrip({
  tabs,
  activeId,
  onChange,
}: {
  tabs: TabStripItem[];
  activeId: string;
  onChange: (id: string) => void;
}) {
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const updateIndicator = () => {
      const activeEl = tabRefs.current[activeId];
      if (!activeEl) return;
      setIndicatorStyle({ left: activeEl.offsetLeft, width: activeEl.offsetWidth });
    };

    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [activeId, tabs]);

  if (tabs.length === 0) return null;

  return (
    <div className="relative -mb-px flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              tabRefs.current[tab.id] = el;
            }}
            type="button"
            onClick={() => onChange(tab.id)}
            className={[
              "flex min-w-max items-center gap-2 border-b-2 border-transparent px-4 py-2.5 text-sm font-medium transition-colors duration-300 ease-in-out",
              isActive
                ? "border-b-slate-900 text-slate-900 dark:border-b-slate-100 dark:text-slate-100"
                : "text-black/30 hover:text-black/60 dark:text-white/40 dark:hover:text-white/75",
            ].join(" ")}
          >
            {tab.label}
          </button>
        );
      })}

      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 h-0.5 bg-slate-900 transition-all duration-300 ease-in-out dark:bg-slate-100"
        style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
      />
    </div>
  );
}

function LectureGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-xl bg-slate-50 shadow-sm dark:bg-slate-800/70">
          <div className="aspect-video animate-pulse bg-slate-200 dark:bg-slate-700" />
          <div className="space-y-2 p-2.5">
            <div className="h-3 w-5/6 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-2.5 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-2.5 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-5 w-14 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
      ))}
    </div>
  );
}

function RecommendedSubjectVideoCard({
  lecture,
  cardIndex,
}: {
  lecture: ExamPrepLectureDto;
  cardIndex: number;
}) {
  const video = prepLectureToVideoItem(lecture);

  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-b from-slate-50 to-white dark:border-slate-700 dark:from-slate-800/80 dark:to-slate-900">
      <div className="border-b border-slate-200/80 px-3 py-2 dark:border-slate-700">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">
          {lecture.subjectName}
        </p>
      </div>
      <a
        href={video.youtubeUrl}
        target="_blank"
        rel="noreferrer"
        title={video.hookSummary || undefined}
        className="group flex min-h-0 flex-1 flex-col"
      >
        <div className="relative aspect-video overflow-hidden bg-black">
          <iframe
            src={toEmbedUrl(video.youtubeId, 8 + (cardIndex % 6), 16 + (cardIndex % 6))}
            title={video.title}
            loading="lazy"
            className="h-full w-full"
            allow="autoplay; encrypted-media; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
          />
          <span className="absolute right-2 top-2 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
            {video.duration}
          </span>
        </div>
        <div className="relative flex flex-1 flex-col p-3">
          {video.hookSummary ? (
            <div className="pointer-events-none absolute bottom-full left-3 right-3 z-20 mb-2 hidden max-h-32 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 text-[11px] leading-snug text-slate-700 shadow-lg group-hover:block dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
              {video.hookSummary}
            </div>
          ) : null}
          <p className="mb-2 inline-flex w-fit items-center gap-1 rounded-full bg-black px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#FAD53C]">
            <FiPlayCircle className="text-[11px]" /> Recommended
          </p>
          <h4 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900 dark:text-slate-100">
            {video.title}
          </h4>
          <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            {video.channel} • {video.views}
          </p>
          <span className="mt-auto inline-flex w-fit items-center gap-1 rounded-full bg-black px-3 py-1.5 text-[11px] font-semibold text-[#FAD53C]">
            View <FiExternalLink className="text-[10px]" />
          </span>
        </div>
      </a>
    </article>
  );
}

function RecommendedVideosSkeleton({ count }: { count: number }) {
  const slots = Math.max(count, 1);
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: slots }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/40"
        >
          <div className="h-9 animate-pulse border-b border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800" />
          <div className="aspect-video animate-pulse bg-slate-200 dark:bg-slate-700" />
          <div className="space-y-2 p-3">
            <div className="h-3 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SelfStudyTab({
  subjects,
  query,
  onQueryChange,
  sortBy,
  onToggleSort,
}: Props) {
  const { strengths: userStrengths, loading: strengthsLoading } = useExamPrepStrengthsQuery();
  const filteredSubjects = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return subjects;

    return subjects.filter((subject) => {
      if (subject.name.toLowerCase().includes(q)) return true;
      return [...subject.topics, ...subject.allTopics].some((topic) => topic.name.toLowerCase().includes(q));
    });
  }, [query, subjects]);

  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(filteredSubjects[0]?.id ?? null);
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [visibleByTopicId, setVisibleByTopicId] = useState<Record<string, number>>({});

  useEffect(() => {
    setActiveSubjectId((current) => {
      if (!filteredSubjects.length) return null;
      if (current && filteredSubjects.some((subject) => subject.id === current)) return current;
      return filteredSubjects[0].id;
    });
  }, [filteredSubjects]);

  useEffect(() => {
    setVisibleByTopicId({});
  }, [activeSubjectId, query, sortBy]);

  const recommendedQuery = useExamPrepRecommendedQuery(sortBy);
  const subjectQuery = useExamPrepLecturesBySubjectQuery({
    subjectId: activeSubjectId,
    search: query,
  });

  const recommendedLectures = useMemo(() => {
    const lectures = recommendedQuery.data?.lectures ?? [];
    if (!lectures.length && recommendedQuery.data?.lecture) {
      return [recommendedQuery.data.lecture];
    }
    const bySubjectId = new Map(lectures.map((lecture) => [lecture.subjectId, lecture]));
    return filteredSubjects
      .map((subject) => bySubjectId.get(subject.id))
      .filter((lecture): lecture is ExamPrepLectureDto => lecture != null);
  }, [recommendedQuery.data?.lectures, recommendedQuery.data?.lecture, filteredSubjects]);

  const activeSubject = useMemo(
    () => filteredSubjects.find((subject) => subject.id === activeSubjectId) ?? null,
    [activeSubjectId, filteredSubjects]
  );

  const subjectLectures = subjectQuery.data?.lectures ?? [];

  const subjectTabs = useMemo<TabStripItem[]>(
    () => filteredSubjects.map((subject) => ({ id: subject.id, label: subject.name })),
    [filteredSubjects]
  );

  const topicGroups = useMemo<TopicGroup[]>(() => {
    const grouped = new Map<string, ExamPrepLectureDto[]>();
    for (const lecture of subjectLectures) {
      const key = String(lecture.topicId);
      const list = grouped.get(key);
      if (list) {
        list.push(lecture);
      } else {
        grouped.set(key, [lecture]);
      }
    }

    return [...grouped.entries()]
      .map(([topicId, lectures]) => ({
        id: topicId,
        name: lectures[0]?.topicName || `Topic ${topicId}`,
        lectures,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  }, [subjectLectures]);

  const topicTabs = useMemo<TabStripItem[]>(
    () =>
      topicGroups.map((topic) => ({
        id: topic.id,
        label: (
          <span className="inline-flex items-center gap-1">
            <span>{topic.name}</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {topic.lectures.length}
            </span>
          </span>
        ),
      })),
    [topicGroups]
  );

  useEffect(() => {
    if (!topicTabs.length) {
      setActiveTopicId(null);
      return;
    }

    setActiveTopicId((current) => {
      if (current && topicTabs.some((tab) => tab.id === current)) return current;
      return topicTabs[0].id;
    });
  }, [topicTabs]);

  const activeTopic = useMemo(
    () => topicGroups.find((topic) => topic.id === activeTopicId) ?? null,
    [activeTopicId, topicGroups]
  );

  const activeTopicVideos = useMemo(() => {
    if (!activeTopic) return [];
    return sortVideos(activeTopic.lectures.map(prepLectureToVideoItem), sortBy);
  }, [activeTopic, sortBy]);

  const recommendedLoading = recommendedQuery.isLoading && recommendedLectures.length === 0;
  const subjectLoading = subjectQuery.isLoading && !!activeSubjectId;
  const hasSubjects = filteredSubjects.length > 0;
  const activeLimit = activeTopic ? Math.min(activeTopicVideos.length, visibleByTopicId[activeTopic.id] ?? LECTURES_PER_TOPIC_PAGE) : 0;
  const visibleTopicVideos = activeTopicVideos.slice(0, activeLimit);
  const hasMoreTopicVideos = activeTopic ? activeTopicVideos.length > activeLimit : false;
  const searchText = query.trim();

  return (
    <div className="min-w-0 space-y-4 overflow-x-hidden">
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.75fr)]">
        <section className="rounded-2xl border border-slate-200/70 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-4">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Recommended Videos</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                One top pick per subject from your stream
              </p>
            </div>

            <div className="flex w-full items-center gap-2 md:w-auto">
              <input
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder="Search videos by topic or subject"
                className="w-full rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-700 outline-none ring-0 placeholder:text-slate-400 focus:bg-slate-200/70 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-700/70 md:w-[300px]"
              />
              <button
                type="button"
                onClick={onToggleSort}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                {sortBy === "latest" ? "Latest" : "Popular"}
              </button>
            </div>
          </div>

          {recommendedQuery.isError ? (
            <div className="flex min-h-[220px] items-center justify-center rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-red-600 dark:bg-slate-800/40 dark:text-red-300">
              <div>
                <p className="font-semibold">Could not load the recommended video.</p>
                <button
                  type="button"
                  onClick={() => void recommendedQuery.refetch()}
                  className="mt-3 rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-900/40 dark:text-red-200 dark:hover:bg-red-950/30"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : recommendedLoading ? (
            <RecommendedVideosSkeleton count={filteredSubjects.length || 3} />
          ) : recommendedLectures.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {recommendedLectures.map((lecture, index) => (
                <RecommendedSubjectVideoCard key={lecture.subjectId} lecture={lecture} cardIndex={index} />
              ))}
            </div>
          ) : (
            <div className="flex min-h-[220px] items-center justify-center rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500 dark:bg-slate-800/40 dark:text-slate-300">
              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-200">No recommended video yet.</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {recommendedQuery.data?.message || "Try another sort option or check back after more lectures are tagged."}
                </p>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200/70 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Your Strengths</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Top strengths from your analysis</p>
            </div>
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">
              {strengthsLoading ? "Loading" : userStrengths?.length ? `${userStrengths.length} listed` : "No data"}
            </span>
          </div>

          {strengthsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-10 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
              ))}
            </div>
          ) : userStrengths && userStrengths.length > 0 ? (
            <div className="space-y-2">
              {userStrengths.slice(0, 5).map((strength, index) => (
                <div
                  key={`${strength}-${index}`}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/70"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black text-xs font-semibold text-[#FAD53C]">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{strength}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
              Your strength results will appear here once the analysis is available.
            </div>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200/70 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-4">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Study by Subject</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click a subject to load its lectures, then switch topics within that subject.
            </p>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {subjectQuery.isFetching && subjectQuery.data ? "Updating lectures..." : null}
          </div>
        </div>

        {!hasSubjects ? (
          <div className="flex min-h-[180px] items-center justify-center rounded-xl bg-slate-50 px-4 py-12 text-center text-sm text-slate-500 dark:bg-slate-800/40 dark:text-slate-300">
            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-200">
                {searchText ? "No subjects match this search." : "No subjects available yet."}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {searchText
                  ? "Try a different query or clear the search box to browse all subjects."
                  : "Once your stream is configured, subject tabs will appear here."}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Subjects</h4>
                <span className="text-xs text-slate-500 dark:text-slate-400">{filteredSubjects.length} tabs</span>
              </div>
              <HorizontalTabStrip
                tabs={subjectTabs}
                activeId={activeSubjectId ?? subjectTabs[0]?.id ?? ""}
                onChange={(id) => setActiveSubjectId(id)}
              />
            </div>

            {subjectQuery.isError ? (
              <div className="flex min-h-[220px] items-center justify-center rounded-xl bg-slate-50 px-4 py-10 text-center text-sm text-red-600 dark:bg-slate-800/40 dark:text-red-300">
                <div>
                  <p className="font-semibold">Could not load lectures for this subject.</p>
                  <button
                    type="button"
                    onClick={() => void subjectQuery.refetch()}
                    className="mt-3 rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-900/40 dark:text-red-200 dark:hover:bg-red-950/30"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : subjectLoading ? (
              <div className="space-y-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="h-4 w-40 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                  <div className="h-3 w-20 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                </div>
                <div className="h-11 w-full animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
                <LectureGridSkeleton />
              </div>
            ) : topicTabs.length === 0 ? (
              <div className="flex min-h-[220px] items-center justify-center rounded-xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500 dark:bg-slate-800/40 dark:text-slate-300">
                <div>
                  <p className="font-semibold text-slate-700 dark:text-slate-200">
                    {searchText
                      ? `No videos found for "${searchText}" in ${activeSubject?.name || "this subject"}.`
                      : `No videos found for ${activeSubject?.name || "this subject"} yet.`}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Try a broader search or pick another subject tab.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Topics</h4>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{topicTabs.length} topics</span>
                  </div>
                  <HorizontalTabStrip
                    tabs={topicTabs}
                    activeId={activeTopicId ?? topicTabs[0]?.id ?? ""}
                    onChange={(id) => setActiveTopicId(id)}
                  />
                </div>

                <div className="w-full min-w-0">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {activeTopic?.name || "Topic"}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {activeTopicVideos.length} videos in this topic
                      </p>
                    </div>
                  </div>

                  <div className="w-full min-w-0 pb-1">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                      {visibleTopicVideos.map((video, index) => (
                        <div key={video.id} className="group relative min-w-0">
                          <a
                            href={video.youtubeUrl}
                            target="_blank"
                            rel="noreferrer"
                            title={video.hookSummary || undefined}
                            className="block min-w-0 overflow-hidden rounded-xl bg-slate-50 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-800/70"
                          >
                            <div className="relative aspect-video overflow-hidden bg-black">
                              <iframe
                                src={toEmbedUrl(video.youtubeId, 8 + (index % 6), 14 + (index % 6))}
                                title={video.title}
                                loading="lazy"
                                className="h-full w-full"
                                allow="autoplay; encrypted-media; picture-in-picture"
                                referrerPolicy="strict-origin-when-cross-origin"
                              />
                              <span className="absolute right-1.5 top-1.5 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
                                {video.duration}
                              </span>
                            </div>

                            <div className="space-y-1 p-2.5">
                              <p className="line-clamp-2 text-xs font-semibold leading-4 text-slate-900 dark:text-slate-100">
                                {video.title}
                              </p>
                              <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{video.channel}</p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">{video.views}</p>
                              <span className="inline-flex items-center gap-1 rounded-full bg-black px-3 py-1 text-[11px] font-semibold text-[#FAD53C]">
                                View <FiExternalLink className="text-[10px]" />
                              </span>
                            </div>
                          </a>
                          {video.hookSummary ? (
                            <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1 hidden w-[min(100%,280px)] -translate-x-1/2 rounded-lg border border-slate-200 bg-white p-2 text-[11px] leading-snug text-slate-700 shadow-xl group-hover:block dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
                              {video.hookSummary}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>

                    {hasMoreTopicVideos ? (
                      <div className="mt-3 flex justify-center">
                        <button
                          type="button"
                          onClick={() =>
                            activeTopic &&
                            setVisibleByTopicId((prev) => ({
                              ...prev,
                              [activeTopic.id]: Math.min(
                                activeTopicVideos.length,
                                (prev[activeTopic.id] ?? LECTURES_PER_TOPIC_PAGE) + LECTURES_PER_TOPIC_PAGE
                              ),
                            }))
                          }
                          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                        >
                          Load more lectures ({activeTopicVideos.length - activeLimit} more)
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
