"use client";

import React, { useMemo } from "react";
import { FiExternalLink, FiPlayCircle } from "react-icons/fi";
import type { ExamPrepLectureDto } from "@/api/auth/profile";

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
  /** Admin lectures for the user's stream; empty when none or stream not set */
  prepLectures: ExamPrepLectureDto[];
  query: string;
  onQueryChange: (v: string) => void;
  sortBy: "latest" | "popular";
  onToggleSort: () => void;
  userStrengths?: string[] | null;
  strengthsLoading?: boolean;
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
  tags: string[];
  youtubeUrl: string;
  hookSummary?: string | null;
};

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
    duration: "—",
    views: `${likesStr} likes · ${subsStr} subs`,
    published: formatRelativeTime(lec.updatedAt),
    viewsCount,
    recencyScore,
    tags: [lec.subjectName.toLowerCase(), lec.topicName.toLowerCase()],
    youtubeUrl: `https://www.youtube.com/watch?v=${lec.youtubeId}`,
    hookSummary: lec.hookSummary,
  };
}

const matchesQuery = (video: VideoItem, queryText: string, subjectName: string, topicNames: string[]): boolean => {
  if (!queryText) return true;

  const searchableText = [
    video.title,
    video.channel,
    video.tags.join(" "),
    subjectName,
    topicNames.join(" "),
    video.hookSummary || "",
  ]
    .join(" ")
    .toLowerCase();

  return searchableText.includes(queryText);
};

const sortVideos = (videos: VideoItem[], sortBy: "latest" | "popular"): VideoItem[] => {
  const items = [...videos];
  if (sortBy === "popular") {
    return items.sort((a, b) => b.viewsCount - a.viewsCount);
  }
  return items.sort((a, b) => b.recencyScore - a.recencyScore);
};

const toEmbedUrl = (youtubeId: string, startSeconds = 12, endSeconds = 20): string => {
  return `https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${youtubeId}&start=${startSeconds}&end=${endSeconds}&playsinline=1&modestbranding=1&rel=0`;
};

type RowModel = { id: string; title: string; videos: VideoItem[] };
type SubjectWithRows = SubjectSection & { rows: RowModel[] };

function buildSubjectsWithVideosFromPrep(
  subjectsTaxonomy: SubjectSection[],
  prepLectures: ExamPrepLectureDto[],
  queryText: string,
  sortBy: "latest" | "popular"
): SubjectWithRows[] {
  const q = queryText.toLowerCase().trim();

  const matchesLecture = (lec: ExamPrepLectureDto) => {
    if (!q) return true;
    const hay = [lec.title, lec.channel, lec.subjectName, lec.topicName, lec.hookSummary || ""].join(" ").toLowerCase();
    return hay.includes(q);
  };

  const filtered = prepLectures.filter(matchesLecture);
  const bucket = new Map<string, Map<number, ExamPrepLectureDto[]>>();

  for (const lec of filtered) {
    if (!bucket.has(lec.subjectId)) bucket.set(lec.subjectId, new Map());
    const tm = bucket.get(lec.subjectId)!;
    if (!tm.has(lec.topicId)) tm.set(lec.topicId, []);
    tm.get(lec.topicId)!.push(lec);
  }

  const subjectNameById = new Map(subjectsTaxonomy.map((s) => [s.id, s.name]));
  const subjectOrder = subjectsTaxonomy.map((s) => s.id);
  const seen = new Set<string>();
  const sections: SubjectWithRows[] = [];

  const pushSubject = (sid: string, topicMap: Map<number, ExamPrepLectureDto[]>) => {
    const rows: RowModel[] = [...topicMap.entries()]
      .map(([topicId, lecs]) => {
        const topicTitle = lecs[0]?.topicName || `Topic ${topicId}`;
        const videos = sortVideos(
          lecs
            .map((l) => prepLectureToVideoItem(l))
            .filter((v) => matchesQuery(v, q, subjectNameById.get(sid) || lecs[0]?.subjectName || "", [topicTitle])),
          sortBy
        );
        return { id: `${sid}-topic-${topicId}`, title: topicTitle, videos };
      })
      .filter((r) => r.videos.length > 0)
      .sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));

    if (rows.length === 0) return;

    sections.push({
      id: sid,
      name: subjectNameById.get(sid) || topicMap.values().next().value?.[0]?.subjectName || "Subject",
      topics: [],
      allTopics: [],
      rows,
    });
  };

  for (const sid of subjectOrder) {
    const topicMap = bucket.get(sid);
    if (!topicMap || topicMap.size === 0) continue;
    seen.add(sid);
    pushSubject(sid, topicMap);
  }

  for (const [sid, topicMap] of bucket) {
    if (seen.has(sid)) continue;
    pushSubject(sid, topicMap);
  }

  return sections;
}

export default function SelfStudyTab({
  subjects,
  prepLectures,
  query,
  onQueryChange,
  sortBy,
  onToggleSort,
  userStrengths,
  strengthsLoading = false,
}: Props) {
  const filteredSubjects = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return subjects;

    return subjects.filter((s) => {
      if (s.name.toLowerCase().includes(q)) return true;
      return [...s.topics, ...s.allTopics].some((topic) => topic.name.toLowerCase().includes(q));
    });
  }, [query, subjects]);

  const subjectsWithVideos = useMemo(() => {
    return buildSubjectsWithVideosFromPrep(filteredSubjects, prepLectures, query, sortBy);
  }, [filteredSubjects, prepLectures, query, sortBy]);

  const allVideos = useMemo(() => {
    return subjectsWithVideos.flatMap((subject) => subject.rows.flatMap((row) => row.videos));
  }, [subjectsWithVideos]);

  const recommendedVideo = useMemo(() => {
    if (allVideos.length === 0) return null;
    return sortVideos([...allVideos], sortBy)[0];
  }, [allVideos, sortBy]);

  return (
    <div className="min-w-0 space-y-4 overflow-x-hidden">
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.75fr)]">
        <section className="rounded-2xl border border-slate-200/70 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-4">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Recommended Videos</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">From your stream — sorted by engagement</p>
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

          {recommendedVideo ? (
            <a
              href={recommendedVideo.youtubeUrl}
              target="_blank"
              rel="noreferrer"
              title={recommendedVideo.hookSummary || undefined}
              className="group overflow-hidden rounded-2xl bg-gradient-to-r from-slate-100 to-slate-50 p-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm dark:from-slate-800/80 dark:to-slate-900/80 md:grid md:grid-cols-[300px,1fr] md:items-center md:gap-4"
            >
              <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
                <iframe
                  src={toEmbedUrl(recommendedVideo.youtubeId, 10, 22)}
                  title={recommendedVideo.title}
                  loading="lazy"
                  className="h-full w-full"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  referrerPolicy="strict-origin-when-cross-origin"
                />
                <span className="absolute right-2 top-2 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  {recommendedVideo.duration}
                </span>
              </div>

              <div className="relative flex flex-col justify-center p-2 md:p-0">
                {recommendedVideo.hookSummary ? (
                  <div className="pointer-events-none absolute bottom-full left-0 right-0 z-20 mb-2 hidden max-h-36 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-700 shadow-lg group-hover:block dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 md:max-w-xl">
                    {recommendedVideo.hookSummary}
                  </div>
                ) : null}
                <p className="mb-2 inline-flex w-fit items-center gap-1 rounded-full bg-black px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#FAD53C]">
                  <FiPlayCircle className="text-[11px]" /> Recommended
                </p>
                <h4 className="line-clamp-2 text-base font-semibold text-slate-900 dark:text-slate-100 md:text-lg">{recommendedVideo.title}</h4>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {recommendedVideo.channel} • {recommendedVideo.views} • {recommendedVideo.published}
                </p>
                <span className="mt-3 inline-flex w-fit items-center gap-1 rounded-full bg-black px-3 py-1.5 text-xs font-semibold text-[#FAD53C]">
                  View <FiExternalLink className="text-xs" />
                </span>
              </div>
            </a>
          ) : null}
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

      {subjectsWithVideos.length === 0 ? (
        <div className="flex min-h-[180px] items-center justify-center rounded-xl bg-white text-sm text-slate-500 shadow-sm dark:bg-slate-900 dark:text-slate-300">
          {prepLectures.length === 0
            ? "No videos yet for your stream. Admins can tag lectures with your stream in Lecture Manager."
            : "No videos found for this search."}
        </div>
      ) : (
        <>
          {subjectsWithVideos.map((subject) => {
            return (
              <section
                key={subject.id}
                className="w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{subject.name}</h3>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {subject.rows.reduce((total, row) => total + row.videos.length, 0)} videos
                  </span>
                </div>

                <div className="space-y-4">
                  {subject.rows.map((row) => (
                    <div key={row.id}>
                      <div className="mb-2 flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{row.title}</h4>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{row.videos.length} videos</span>
                      </div>

                      <div className="w-full min-w-0 pb-1">
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                          {row.videos.map((video, index) => (
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
                                  <p className="line-clamp-2 text-xs font-semibold leading-4 text-slate-900 dark:text-slate-100">{video.title}</p>
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
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}
