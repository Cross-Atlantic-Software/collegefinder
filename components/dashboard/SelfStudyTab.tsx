"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FiChevronLeft, FiChevronRight, FiPlayCircle } from "react-icons/fi";
import type { ExamPrepLectureDto } from "@/api/auth/profile";
import VideoModal from "@/components/dashboard/VideoModal";
import { formatDurationFromSeconds } from "@/lib/formatDuration";
import {
  useExamPrepLecturesBySubjectQuery,
  useExamPrepRecommendedQuery,
} from "@/lib/examPrepLectureQueries";

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

type TopicGroup = {
  id: string;
  name: string;
  lectures: ExamPrepLectureDto[];
};

const VIDEOS_PER_TOPIC = 5;
const MAX_VISIBLE_TOPICS = 5;
const HERO_CYCLE_MS = 7000;

/** Matches exam prep / profile dashboard palette */
const SITE = {
  surface: "bg-[#eaf4ff]",
  surfaceMuted: "bg-[#f8fbff]",
  border: "border-[#dceeff]",
  borderHover: "hover:border-[#FAD53C]",
  pillActive: "border-[#FAD53C] bg-[#FAD53C] text-black shadow-sm",
  pillInactive:
    "border-[#dceeff] bg-[#eaf4ff] text-black/70 hover:border-[#FAD53C] hover:bg-[#FAD53C]/10",
  cta: "border border-black bg-black text-[#FAD53C] hover:bg-black/90",
  input:
    "border border-[#dceeff] bg-[#eaf4ff] text-black placeholder:text-black/40 focus:border-[#FAD53C] focus:ring-1 focus:ring-[#FAD53C]/25",
  card: "border border-[#dceeff] bg-white",
} as const;

const VIDEO_GRID_CLASS =
  "grid grid-cols-[repeat(auto-fill,minmax(148px,1fr))] gap-2 sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] sm:gap-2.5 md:grid-cols-[repeat(auto-fill,minmax(168px,1fr))]";

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
    title: lec.title,
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

const toHeroEmbedUrl = (youtubeId: string): string => {
  return `https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${youtubeId}&playsinline=1&modestbranding=1&rel=0`;
};

function LectureGridSkeleton() {
  return (
    <div className={VIDEO_GRID_CLASS}>
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-lg border border-[#dceeff] bg-[#eaf4ff] shadow-sm">
          <div className="aspect-video animate-pulse bg-[#dceeff]" />
          <div className="space-y-1.5 p-2">
            <div className="h-2.5 w-5/6 animate-pulse rounded bg-[#dceeff]" />
            <div className="h-2 w-1/2 animate-pulse rounded bg-[#dceeff]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function buildYoutubeEmbedIframe(youtubeId: string): string {
  return `<iframe src="https://www.youtube.com/embed/${youtubeId}?autoplay=1&playsinline=1" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
}

function examPrepToModalLecture(lec: ExamPrepLectureDto) {
  const iframeCode = lec.iframeCode?.trim();
  const videoFile = lec.videoFile?.trim();
  return {
    id: lec.id,
    name: `${lec.topicName} • ${lec.title}`,
    iframe_code: iframeCode || (lec.youtubeId ? buildYoutubeEmbedIframe(lec.youtubeId) : null),
    video_file: videoFile || null,
    description: lec.hookSummary,
  };
}

function CompactLectureVideoCard({
  lecture,
  video,
  cardIndex,
  onWatch,
}: {
  lecture: ExamPrepLectureDto;
  video: VideoItem;
  cardIndex: number;
  onWatch: (lecture: ExamPrepLectureDto) => void;
}) {
  return (
    <div className="group relative min-w-0">
      <button
        type="button"
        title={video.hookSummary || video.title}
        onClick={() => onWatch(lecture)}
        className="block min-w-0 w-full overflow-hidden rounded-lg border border-[#dceeff] bg-[#eaf4ff] text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#FAD53C] hover:shadow-md"
      >
        <div className="relative aspect-video overflow-hidden bg-black">
          <iframe
            src={toEmbedUrl(video.youtubeId, 8 + (cardIndex % 6), 14 + (cardIndex % 6))}
            title={video.title}
            loading="lazy"
            className="pointer-events-none h-full w-full scale-110"
            allow="autoplay; encrypted-media; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
          />
          <span className="absolute right-1 top-1 rounded bg-black/80 px-1 py-0.5 text-[9px] font-medium text-white">
            {video.duration}
          </span>
        </div>

        <div className="space-y-0.5 p-2">
          <p className="line-clamp-2 text-[11px] font-semibold leading-tight text-black/85">
            {video.title}
          </p>
          <p className="truncate text-[10px] text-black/50">{video.channel}</p>
          <span className="inline-flex items-center gap-0.5 rounded-full bg-black px-2 py-0.5 text-[9px] font-semibold text-[#FAD53C]">
            Watch <FiPlayCircle className="text-[9px]" />
          </span>
        </div>
      </button>
    </div>
  );
}

function HeroSkeleton() {
  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-[#dceeff] animate-pulse sm:aspect-[21/9]" />
  );
}

function NetflixHeroCarousel({
  lectures,
  heroIndex,
  onIndexChange,
  onWatch,
  onPauseChange,
}: {
  lectures: ExamPrepLectureDto[];
  heroIndex: number;
  onIndexChange: (index: number) => void;
  onWatch: (lecture: ExamPrepLectureDto) => void;
  onPauseChange: (paused: boolean) => void;
}) {
  const current = lectures[heroIndex];
  if (!current) return null;

  const video = prepLectureToVideoItem(current);
  const goPrev = () => onIndexChange((heroIndex - 1 + lectures.length) % lectures.length);
  const goNext = () => onIndexChange((heroIndex + 1) % lectures.length);

  return (
    <div
      className="group relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-black shadow-lg sm:aspect-[21/9]"
      onMouseEnter={() => onPauseChange(true)}
      onMouseLeave={() => onPauseChange(false)}
    >
      {lectures.map((lecture, index) => (
        <div
          key={`${lecture.id}-${lecture.youtubeId}`}
          className={[
            "absolute inset-0 transition-opacity duration-700 ease-in-out",
            index === heroIndex ? "opacity-100" : "pointer-events-none opacity-0",
          ].join(" ")}
        >
          <iframe
            src={toHeroEmbedUrl(lecture.youtubeId)}
            title={lecture.title}
            className="pointer-events-none h-full w-full scale-[1.15] object-cover"
            allow="autoplay; encrypted-media; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      ))}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-transparent" />

      <div className="absolute inset-x-0 bottom-0 p-3 sm:p-5 md:p-6">
        <p className="text-[11px] font-medium text-white/75 sm:text-xs">
          {current.subjectName}
          <span className="mx-1.5 text-white/40">·</span>
          {current.topicName}
        </p>
        <h2 className="mt-1 max-w-lg text-base font-bold leading-snug tracking-tight text-white sm:max-w-xl sm:text-lg md:text-xl">
          {video.title}
        </h2>
        {current.hookSummary ? (
          <p className="mt-1.5 line-clamp-2 max-w-md text-[11px] leading-relaxed text-white/65 sm:text-xs">
            {current.hookSummary}
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap items-center gap-2.5 sm:mt-4">
          <button
            type="button"
            onClick={() => onWatch(current)}
            className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-black bg-black px-4 py-1.5 text-xs font-bold text-[#FAD53C] shadow-md transition hover:bg-black/90 active:scale-95 sm:px-5 sm:py-2 sm:text-sm"
          >
            <FiPlayCircle className="text-base sm:text-lg" />
            Play
          </button>
          <span className="text-[10px] text-white/55 sm:text-xs">{video.views}</span>
        </div>
      </div>

      {lectures.length > 1 ? (
        <>
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous video"
            className="pointer-events-auto absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition hover:bg-black/70 group-hover:opacity-100 sm:left-4 sm:h-10 sm:w-10"
          >
            <FiChevronLeft className="text-xl" />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Next video"
            className="pointer-events-auto absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition hover:bg-black/70 group-hover:opacity-100 sm:right-4 sm:h-10 sm:w-10"
          >
            <FiChevronRight className="text-xl" />
          </button>
          <div className="absolute bottom-3 right-4 flex gap-1.5 sm:bottom-4 sm:right-6">
            {lectures.map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Go to slide ${index + 1}`}
                onClick={() => onIndexChange(index)}
                className={[
                  "pointer-events-auto h-1 rounded-full transition-all",
                  index === heroIndex ? "w-5 bg-[#FAD53C]" : "w-1.5 bg-white/40 hover:bg-white/70",
                ].join(" ")}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

function UpcomingVideosQueue({
  lectures,
  heroIndex,
  onSelect,
}: {
  lectures: ExamPrepLectureDto[];
  heroIndex: number;
  onSelect: (index: number) => void;
}) {
  if (lectures.length <= 1) {
    return (
      <div className="flex h-full min-h-[200px] flex-col justify-center rounded-2xl border border-dashed border-[#dceeff] bg-[#eaf4ff] p-4 text-center text-sm text-black/55">
        More recommended videos will appear here as they are added for your stream.
      </div>
    );
  }

  const upcoming: { lecture: ExamPrepLectureDto; index: number }[] = [];
  for (let offset = 1; offset < lectures.length; offset++) {
    const index = (heroIndex + offset) % lectures.length;
    upcoming.push({ lecture: lectures[index], index });
  }

  return (
    <div className={`flex h-full flex-col rounded-2xl ${SITE.card} p-3 shadow-sm md:p-4`}>
      <div className="mb-3 shrink-0">
        <h3 className="text-sm font-semibold text-black/85">Up next</h3>
        <p className="text-[11px] text-black/50">Tap to preview in the hero</p>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-0.5 [scrollbar-width:thin]">
        {upcoming.map(({ lecture, index }, queuePos) => (
          <button
            key={`${lecture.id}-${index}`}
            type="button"
            onClick={() => onSelect(index)}
            className={`flex w-full items-center gap-3 rounded-xl border ${SITE.border} ${SITE.surface} p-2 text-left transition ${SITE.borderHover} hover:bg-[#FAD53C]/10`}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black text-xs font-bold text-[#FAD53C]">
              {queuePos + 1}
            </span>
            <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-lg bg-black">
              <iframe
                src={toEmbedUrl(lecture.youtubeId, 5, 12)}
                title={lecture.title}
                className="pointer-events-none h-full w-full scale-125"
                loading="lazy"
                allow="autoplay; encrypted-media"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[10px] font-medium text-black/50">
                {lecture.subjectName} · {lecture.topicName}
              </p>
              <p className="truncate text-xs font-semibold text-black/85">{lecture.title}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function TopicPillTabs({
  topicGroups,
  activeTopicId,
  onChange,
  expanded,
  onExpand,
}: {
  topicGroups: TopicGroup[];
  activeTopicId: string | null;
  onChange: (id: string) => void;
  expanded: boolean;
  onExpand: () => void;
}) {
  const visible = expanded ? topicGroups : topicGroups.slice(0, MAX_VISIBLE_TOPICS);
  const hasMore = topicGroups.length > MAX_VISIBLE_TOPICS && !expanded;

  return (
    <div className="flex flex-wrap gap-2">
      {visible.map((topic) => {
        const isActive = topic.id === activeTopicId;
        return (
          <button
            key={topic.id}
            type="button"
            onClick={() => onChange(topic.id)}
            className={[
              "rounded-full px-4 py-2 text-xs font-semibold transition",
              isActive ? SITE.pillActive : SITE.pillInactive,
            ].join(" ")}
          >
            {topic.name}
            <span
              className={[
                "ml-1.5 rounded-full px-1.5 py-0.5 text-[10px]",
                isActive ? "bg-black/10 text-black" : "bg-black/5 text-black/55",
              ].join(" ")}
            >
              {topic.lectures.length}
            </span>
          </button>
        );
      })}
      {hasMore ? (
        <button
          type="button"
          onClick={onExpand}
          className={`rounded-full border border-dashed border-[#dceeff] px-4 py-2 text-xs font-semibold text-black/60 transition hover:border-[#FAD53C] hover:bg-[#FAD53C]/10`}
        >
          + more
        </button>
      ) : null}
    </div>
  );
}

function SubjectStudySection({
  subject,
  query,
  sortBy,
  onWatch,
}: {
  subject: SubjectSection;
  query: string;
  sortBy: "latest" | "popular";
  onWatch: (lecture: ExamPrepLectureDto) => void;
}) {
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [topicsExpanded, setTopicsExpanded] = useState(false);
  const [visibleByTopicId, setVisibleByTopicId] = useState<Record<string, number>>({});

  const subjectQuery = useExamPrepLecturesBySubjectQuery({
    subjectId: subject.id,
    search: query,
  });

  const subjectLectures = subjectQuery.data?.lectures ?? [];

  const topicGroups = useMemo<TopicGroup[]>(() => {
    const grouped = new Map<string, ExamPrepLectureDto[]>();
    for (const lecture of subjectLectures) {
      const key = String(lecture.topicId);
      const list = grouped.get(key);
      if (list) list.push(lecture);
      else grouped.set(key, [lecture]);
    }
    return [...grouped.entries()]
      .map(([topicId, lectures]) => ({
        id: topicId,
        name: lectures[0]?.topicName || `Topic ${topicId}`,
        lectures,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  }, [subjectLectures]);

  const topicIdsKey = useMemo(() => topicGroups.map((t) => t.id).join(","), [topicGroups]);

  useEffect(() => {
    setActiveTopicId((current) => {
      if (!topicGroups.length) return null;
      if (current && topicGroups.some((t) => t.id === current)) return current;
      return topicGroups[0].id;
    });
    setTopicsExpanded(false);
    setVisibleByTopicId({});
  }, [subject.id, query, topicIdsKey]);

  const activeTopic = useMemo(
    () => topicGroups.find((t) => t.id === activeTopicId) ?? null,
    [activeTopicId, topicGroups]
  );

  const activeTopicVideos = useMemo(() => {
    if (!activeTopic) return [];
    return sortVideos(activeTopic.lectures.map(prepLectureToVideoItem), sortBy);
  }, [activeTopic, sortBy]);

  const activeLimit = activeTopic
    ? Math.min(activeTopicVideos.length, visibleByTopicId[activeTopic.id] ?? VIDEOS_PER_TOPIC)
    : 0;
  const visibleTopicVideos = activeTopicVideos.slice(0, activeLimit);
  const hasMoreVideos = activeTopic ? activeTopicVideos.length > activeLimit : false;

  return (
    <section className="space-y-4 border-t border-[#dceeff] pt-6 first:border-t-0 first:pt-0">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xl font-bold text-black/90">{subject.name}</h3>
        {subjectQuery.isFetching && subjectQuery.data ? (
          <span className="text-[11px] text-slate-400">Updating…</span>
        ) : null}
      </div>

      {subjectQuery.isError ? (
        <div className="rounded-xl bg-red-50 px-4 py-8 text-center text-sm text-red-600 dark:bg-red-950/30 dark:text-red-300">
          Could not load videos for {subject.name}.
          <button
            type="button"
            onClick={() => void subjectQuery.refetch()}
            className="ml-2 font-semibold underline"
          >
            Retry
          </button>
        </div>
      ) : subjectQuery.isLoading ? (
        <LectureGridSkeleton />
      ) : topicGroups.length === 0 ? (
        <p className="text-sm text-black/55">No videos available for this subject yet.</p>
      ) : (
        <>
          <TopicPillTabs
            topicGroups={topicGroups}
            activeTopicId={activeTopicId}
            onChange={setActiveTopicId}
            expanded={topicsExpanded}
            onExpand={() => setTopicsExpanded(true)}
          />

          <div className="w-full min-w-0">
            <div className={VIDEO_GRID_CLASS}>
              {visibleTopicVideos.map((video, index) => {
                const lecture = activeTopic?.lectures.find((lec) => `lec-${lec.id}-${lec.youtubeId}` === video.id);
                if (!lecture) return null;
                return (
                  <CompactLectureVideoCard
                    key={video.id}
                    lecture={lecture}
                    video={video}
                    cardIndex={index}
                    onWatch={onWatch}
                  />
                );
              })}
            </div>

            {hasMoreVideos ? (
              <div className="mt-3 flex justify-center">
                <button
                  type="button"
                  onClick={() =>
                    activeTopic &&
                    setVisibleByTopicId((prev) => ({
                      ...prev,
                      [activeTopic.id]: Math.min(
                        activeTopicVideos.length,
                        (prev[activeTopic.id] ?? VIDEOS_PER_TOPIC) + VIDEOS_PER_TOPIC
                      ),
                    }))
                  }
                  className={`rounded-full border ${SITE.border} bg-white px-5 py-2 text-xs font-semibold text-black/70 transition hover:border-[#FAD53C] hover:bg-[#FAD53C]/10`}
                >
                  + more ({activeTopicVideos.length - activeLimit} more)
                </button>
              </div>
            ) : null}
          </div>
        </>
      )}
    </section>
  );
}

export default function SelfStudyTab({
  subjects,
  query,
  onQueryChange,
  sortBy,
  onToggleSort,
}: Props) {
  const filteredSubjects = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return subjects;
    return subjects.filter((subject) => {
      if (subject.name.toLowerCase().includes(q)) return true;
      return [...subject.topics, ...subject.allTopics].some((topic) => topic.name.toLowerCase().includes(q));
    });
  }, [query, subjects]);

  const [heroIndex, setHeroIndex] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);
  const [videoModalLecture, setVideoModalLecture] = useState<ReturnType<typeof examPrepToModalLecture> | null>(null);

  const openVideoModal = useCallback((lecture: ExamPrepLectureDto) => {
    setVideoModalLecture(examPrepToModalLecture(lecture));
  }, []);

  const recommendedQuery = useExamPrepRecommendedQuery(sortBy);

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

  useEffect(() => {
    setHeroIndex((i) => (recommendedLectures.length ? i % recommendedLectures.length : 0));
  }, [recommendedLectures.length]);

  useEffect(() => {
    if (heroPaused || recommendedLectures.length <= 1) return;
    const timer = setInterval(() => {
      setHeroIndex((i) => (i + 1) % recommendedLectures.length);
    }, HERO_CYCLE_MS);
    return () => clearInterval(timer);
  }, [heroPaused, recommendedLectures.length]);

  const recommendedLoading = recommendedQuery.isLoading && recommendedLectures.length === 0;
  const searchText = query.trim();

  return (
    <div className="min-w-0 space-y-6 overflow-x-hidden">
      {/* Recommended hero + up next */}
      <section className={`rounded-2xl ${SITE.card} p-3 shadow-sm md:p-4`}>
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-black/90">Recommended</h3>
            <p className="text-xs text-black/50">Top picks for your stream</p>
          </div>
          <div className="flex w-full items-center gap-2 md:w-auto">
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search by subject or topic"
              className={`w-full rounded-xl px-3 py-2 text-sm outline-none md:w-[260px] ${SITE.input}`}
            />
            <button
              type="button"
              onClick={onToggleSort}
              className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold transition ${SITE.cta}`}
            >
              {sortBy === "latest" ? "Latest" : "Popular"}
            </button>
          </div>
        </div>

        {recommendedQuery.isError ? (
          <div className="flex min-h-[220px] items-center justify-center rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-red-600 dark:bg-slate-800/40 dark:text-red-300">
            <div>
              <p className="font-semibold">Could not load recommended videos.</p>
              <button
                type="button"
                onClick={() => void recommendedQuery.refetch()}
                className="mt-3 rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-900/40 dark:text-red-200"
              >
                Retry
              </button>
            </div>
          </div>
        ) : recommendedLoading ? (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(240px,0.75fr)]">
            <HeroSkeleton />
            <div className="hidden min-h-[200px] animate-pulse rounded-2xl bg-[#eaf4ff] xl:block" />
          </div>
        ) : recommendedLectures.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(240px,0.75fr)]">
            <NetflixHeroCarousel
              lectures={recommendedLectures}
              heroIndex={heroIndex}
              onIndexChange={setHeroIndex}
              onWatch={openVideoModal}
              onPauseChange={setHeroPaused}
            />
            <UpcomingVideosQueue
              lectures={recommendedLectures}
              heroIndex={heroIndex}
              onSelect={setHeroIndex}
            />
          </div>
        ) : (
          <div className="flex min-h-[220px] items-center justify-center rounded-2xl bg-[#eaf4ff] px-4 py-10 text-center text-sm text-black/55">
            <div>
              <p className="font-semibold text-black/75">No recommended video yet.</p>
              <p className="mt-1 text-xs text-black/50">
                {recommendedQuery.data?.message || "Check back after more lectures are tagged for your stream."}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Stacked subjects */}
      {filteredSubjects.length === 0 ? (
        <div className={`rounded-2xl ${SITE.card} p-6 text-center text-sm text-black/55 shadow-sm`}>
          <p className="font-semibold text-black/75">
            {searchText ? "No subjects match this search." : "No subjects available yet."}
          </p>
          {searchText ? (
            <p className="mt-1 text-xs">Try a different query or clear the search box.</p>
          ) : null}
        </div>
      ) : (
        <div className={`rounded-2xl ${SITE.card} p-3 shadow-sm md:p-5`}>
          <div className="space-y-8">
            {filteredSubjects.map((subject) => (
              <SubjectStudySection
                key={subject.id}
                subject={subject}
                query={query}
                sortBy={sortBy}
                onWatch={openVideoModal}
              />
            ))}
          </div>
        </div>
      )}

      {videoModalLecture ? (
        <VideoModal
          lecture={videoModalLecture}
          isOpen={!!videoModalLecture}
          onClose={() => setVideoModalLecture(null)}
        />
      ) : null}
    </div>
  );
}
