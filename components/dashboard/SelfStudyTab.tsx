// src/components/exams/SelfStudyTab.tsx
"use client";

import React, { useMemo } from "react";
import { FiExternalLink, FiPlayCircle } from "react-icons/fi";

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
};

type VideoSeed = Omit<VideoItem, "id" | "youtubeId" | "youtubeUrl"> & {
  youtubeId: string;
};

const SUBJECT_VIDEO_LIBRARY: Record<string, VideoSeed[]> = {
  physics: [
    {
      youtubeId: "3fumBcKC6RE",
      title: "Current Electricity - One Shot Revision",
      channel: "Unacademy JEE",
      duration: "24:13",
      views: "780K views",
      viewsCount: 780000,
      published: "1 month ago",
      recencyScore: 7,
      tags: ["physics", "jee", "current electricity", "revision"],
    },
    {
      youtubeId: "x8SGzV5ZthE",
      title: "Thermodynamics High-Yield Problems",
      channel: "Physics Wallah",
      duration: "28:55",
      views: "2.1M views",
      viewsCount: 2100000,
      published: "4 months ago",
      recencyScore: 4,
      tags: ["physics", "thermodynamics", "problem solving"],
    },
    {
      youtubeId: "8hly31xKli0",
      title: "Complete Physics Practice Session",
      channel: "Physics Wallah",
      duration: "42:10",
      views: "1.2M views",
      viewsCount: 1200000,
      published: "2 months ago",
      recencyScore: 6,
      tags: ["physics", "practice", "concepts"],
    },
  ],
  chemistry: [
    {
      youtubeId: "Q33KBiDriJY",
      title: "Organic Chemistry Concepts in 20 Minutes",
      channel: "Allen Kota",
      duration: "19:20",
      views: "890K views",
      viewsCount: 890000,
      published: "6 months ago",
      recencyScore: 2,
      tags: ["chemistry", "organic", "jee"],
    },
    {
      youtubeId: "mU6anWqZJcc",
      title: "Atomic Structure - Quick Revision",
      channel: "Aakash Institute",
      duration: "22:44",
      views: "670K views",
      viewsCount: 670000,
      published: "7 months ago",
      recencyScore: 1,
      tags: ["chemistry", "atomic structure", "revision"],
    },
    {
      youtubeId: "HGTJBPNC-Gw",
      title: "Chemistry Mock-Test Attempt Strategy",
      channel: "Khan Academy",
      duration: "16:48",
      views: "510K views",
      viewsCount: 510000,
      published: "3 weeks ago",
      recencyScore: 8,
      tags: ["chemistry", "strategy", "mock test"],
    },
  ],
  mathematics: [
    {
      youtubeId: "rfscVS0vtbw",
      title: "Coordinate Geometry One Shot",
      channel: "Vedantu JEE",
      duration: "35:22",
      views: "940K views",
      viewsCount: 940000,
      published: "5 months ago",
      recencyScore: 3,
      tags: ["mathematics", "coordinate geometry", "jee"],
    },
    {
      youtubeId: "qz0aGYrrlhU",
      title: "Limits and Continuity Crash Revision",
      channel: "Vedantu JEE",
      duration: "31:09",
      views: "1.5M views",
      viewsCount: 1500000,
      published: "2 weeks ago",
      recencyScore: 9,
      tags: ["mathematics", "calculus", "limits"],
    },
    {
      youtubeId: "HGTJBPNC-Gw",
      title: "Math Mock-Test Tactics and Time Split",
      channel: "Khan Academy",
      duration: "16:48",
      views: "510K views",
      viewsCount: 510000,
      published: "3 weeks ago",
      recencyScore: 8,
      tags: ["mathematics", "strategy", "mock test"],
    },
  ],
  default: [
    {
      youtubeId: "8hly31xKli0",
      title: "Study Sprint: Focused Revision Session",
      channel: "Exam Prep Hub",
      duration: "42:10",
      views: "1.2M views",
      viewsCount: 1200000,
      published: "2 months ago",
      recencyScore: 6,
      tags: ["revision", "exam prep", "self study"],
    },
    {
      youtubeId: "rfscVS0vtbw",
      title: "Problem Solving Techniques for Fast Accuracy",
      channel: "Exam Prep Hub",
      duration: "35:22",
      views: "940K views",
      viewsCount: 940000,
      published: "5 months ago",
      recencyScore: 3,
      tags: ["problem solving", "speed", "accuracy"],
    },
    {
      youtubeId: "3fumBcKC6RE",
      title: "Weekly Self Study Roadmap",
      channel: "Exam Prep Hub",
      duration: "24:13",
      views: "780K views",
      viewsCount: 780000,
      published: "1 month ago",
      recencyScore: 7,
      tags: ["roadmap", "planning", "self study"],
    },
  ],
};

const getSubjectLibraryKey = (subjectName: string): string => {
  const normalized = subjectName.toLowerCase();

  if (normalized.includes("physics")) return "physics";
  if (normalized.includes("chemistry")) return "chemistry";
  if (normalized.includes("math")) return "mathematics";
  if (normalized.includes("biology") || normalized.includes("bio")) return "default";

  return "default";
};

const toVideoItem = (seed: VideoSeed, subjectId: string, index: number): VideoItem => {
  return {
    id: `${subjectId}-${seed.youtubeId}-${index}`,
    youtubeId: seed.youtubeId,
    title: seed.title,
    channel: seed.channel,
    duration: seed.duration,
    views: seed.views,
    published: seed.published,
    viewsCount: seed.viewsCount,
    recencyScore: seed.recencyScore,
    tags: seed.tags,
    youtubeUrl: `https://www.youtube.com/watch?v=${seed.youtubeId}`,
  };
};

const matchesQuery = (video: VideoItem, queryText: string, subjectName: string, topicNames: string[]): boolean => {
  if (!queryText) return true;

  const searchableText = [
    video.title,
    video.channel,
    video.tags.join(" "),
    subjectName,
    topicNames.join(" "),
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

const VIDEO_CONTEXT_LABELS = [
  "one shot",
  "quick revision",
  "pyq strategy",
  "concept builder",
  "mistake analysis",
  "exam sprint",
];

const toEmbedUrl = (youtubeId: string, startSeconds = 12, endSeconds = 20): string => {
  return `https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${youtubeId}&start=${startSeconds}&end=${endSeconds}&playsinline=1&modestbranding=1&rel=0`;
};

const buildTopicVideoRow = (
  subject: SubjectSection,
  topicName: string,
  rowSeed: number,
  sortBy: "latest" | "popular",
  queryText: string
): VideoItem[] => {
  const key = getSubjectLibraryKey(subject.name);
  const baseLibrary = SUBJECT_VIDEO_LIBRARY[key] || SUBJECT_VIDEO_LIBRARY.default;
  const feedCount = 12;

  const feed = Array.from({ length: feedCount }, (_, index) => {
    const itemIndex = index + rowSeed;
    const seed = baseLibrary[itemIndex % baseLibrary.length];
    const contextLabel = VIDEO_CONTEXT_LABELS[itemIndex % VIDEO_CONTEXT_LABELS.length];

    return toVideoItem(
      {
        ...seed,
        title: `${topicName} • ${seed.title}`,
        tags: [...seed.tags, topicName.toLowerCase(), contextLabel],
      },
      subject.id,
      index
    );
  });

  return sortVideos(
    feed.filter((video) => matchesQuery(video, queryText, subject.name, [topicName])),
    sortBy
  );
};

export default function SelfStudyTab({
  subjects,
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

    return subjects
      .filter((s) => {
        if (s.name.toLowerCase().includes(q)) return true;
        return [...s.topics, ...s.allTopics].some((topic) =>
          topic.name.toLowerCase().includes(q)
        );
      });
  }, [query, subjects]);

  const subjectsWithVideos = useMemo(() => {
    const q = query.toLowerCase().trim();

    return filteredSubjects
      .map((subject) => {
        const topicNames = (subject.topics.length > 0 ? subject.topics : subject.allTopics).map((topic) =>
          topic.name
        );
        const rows = (topicNames.length > 0 ? topicNames : [subject.name])
          .map((topicName, rowIndex) => ({
            id: `${subject.id}-topic-row-${rowIndex}`,
            title: topicName,
            videos: buildTopicVideoRow(subject, topicName, rowIndex * 2, sortBy, q),
          }))
          .filter((row) => row.videos.length > 0);

        return {
          ...subject,
          rows,
        };
      })
      .filter((subject) => subject.rows.length > 0);
  }, [filteredSubjects, query, sortBy]);

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
              <p className="text-xs text-slate-500 dark:text-slate-400">Curated YouTube playlists by subject and topic</p>
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

              <div className="flex flex-col justify-center p-2 md:p-0">
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
          No videos found for this search.
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
                          <a
                            key={video.id}
                            href={video.youtubeUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="group min-w-0 overflow-hidden rounded-xl bg-slate-50 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-800/70"
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
