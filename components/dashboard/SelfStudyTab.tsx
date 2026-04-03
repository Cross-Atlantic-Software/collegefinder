// src/components/exams/SelfStudyTab.tsx
"use client";

import React, { useMemo } from "react";
import { FiExternalLink, FiPlayCircle } from "react-icons/fi";
import Image from "next/image";

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
  title: string;
  channel: string;
  duration: string;
  views: string;
  published: string;
  youtubeUrl: string;
  thumbnailUrl: string;
};

const YOUTUBE_VIDEO_IDS = [
  "8hly31xKli0", // Physics Wallah - JEE Physics
  "rfscVS0vtbw", // Vedantu - Coordinate Geometry
  "HGTJBPNC-Gw", // Khan Academy - Mock Test Strategy
  "3fumBcKC6RE", // Unacademy - Current Electricity
  "x8SGzV5ZthE", // Physics Wallah - Thermodynamics
  "Q33KBiDriJY", // Allen - Organic Chemistry
  "qz0aGYrrlhU", // Vedantu - Limits and Continuity
  "mU6anWqZJcc", // Unacademy - Atomic Structure
];

const VIDEO_META = [
  { duration: "42:10", views: "1.2M views", published: "2 months ago" },
  { duration: "35:22", views: "940K views", published: "5 months ago" },
  { duration: "16:48", views: "510K views", published: "3 weeks ago" },
  { duration: "24:13", views: "780K views", published: "1 month ago" },
  { duration: "28:55", views: "2.1M views", published: "4 months ago" },
  { duration: "19:20", views: "890K views", published: "6 months ago" },
  { duration: "31:09", views: "1.5M views", published: "2 weeks ago" },
  { duration: "22:44", views: "670K views", published: "7 months ago" },
];

const CHANNELS = [
  "Physics Wallah",
  "Vedantu JEE",
  "Khan Academy",
  "Unacademy JEE",
  "Allen Kota",
  "Aakash Institute",
  "BYJU'S Classes",
  "Exam Fear",
];

const buildVideoItem = (subjectName: string, topicName: string, index: number): VideoItem => {
  const videoId = YOUTUBE_VIDEO_IDS[index % YOUTUBE_VIDEO_IDS.length];
  const meta = VIDEO_META[index % VIDEO_META.length];
  const channel = CHANNELS[index % CHANNELS.length];

  return {
    id: `${subjectName}-${topicName}-${index}`,
    title: `${topicName} | ${subjectName} Complete Strategy`,
    channel,
    duration: meta.duration,
    views: meta.views,
    published: meta.published,
    youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  };
};

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

    return subjects
      .map((s) => ({
        ...s,
        topics: s.topics.filter(
          (t) =>
            t.name.toLowerCase().includes(q) ||
            s.name.toLowerCase().includes(q)
        ),
        allTopics: s.allTopics.filter(
          (t) =>
            t.name.toLowerCase().includes(q) ||
            s.name.toLowerCase().includes(q)
        ),
      }))
      .filter((s) => s.topics.length > 0 || s.allTopics.length > 0);
  }, [query, subjects]);

  const allVideos = useMemo(() => {
    const topics = filteredSubjects.flatMap((subject) =>
      (subject.topics.length > 0 ? subject.topics : subject.allTopics).map((topic, idx) =>
        buildVideoItem(subject.name, topic.name, idx)
      )
    );
    return topics;
  }, [filteredSubjects]);

  const recommendedVideo = allVideos[0] ?? null;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-white p-3 shadow-sm dark:bg-slate-900 md:p-4">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Video Dashboard</h3>
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
              className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
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
            className="group grid gap-3 rounded-xl bg-slate-50 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm dark:bg-slate-800/60 md:grid-cols-[260px,1fr]"
          >
            <div className="relative h-36 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
              <Image
                src={recommendedVideo.thumbnailUrl}
                alt={recommendedVideo.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="260px"
              />
              <span className="absolute right-2 top-2 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
                {recommendedVideo.duration}
              </span>
            </div>

            <div className="flex flex-col justify-center">
              <p className="mb-2 inline-flex w-fit items-center gap-1 rounded-full bg-black px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#FAD53C]">
                <FiPlayCircle className="text-[11px]" /> Recommended
              </p>
              <h4 className="line-clamp-2 text-base font-semibold text-slate-900 dark:text-slate-100">{recommendedVideo.title}</h4>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {recommendedVideo.channel} • {recommendedVideo.views} • {recommendedVideo.published}
              </p>
              <p className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
                Open on YouTube <FiExternalLink className="text-xs" />
              </p>
            </div>
          </a>
        ) : null}
      </section>

      {filteredSubjects.length === 0 ? (
        <div className="flex min-h-[180px] items-center justify-center rounded-xl bg-white text-sm text-slate-500 shadow-sm dark:bg-slate-900 dark:text-slate-300">
          No topics found.
        </div>
      ) : (
        <>
          {filteredSubjects.map((subject) => {
            const displayTopics = subject.topics.length > 0 ? subject.topics : subject.allTopics;
            const videos = displayTopics.map((topic, idx) =>
              buildVideoItem(subject.name, topic.name, idx)
            );

            return (
              <section
                key={subject.id}
                className="rounded-2xl bg-white p-3 shadow-sm dark:bg-slate-900 md:p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{subject.name}</h3>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {videos.length} videos
                  </span>
                </div>

                <div className="space-y-2">
                  {videos.map((video) => (
                    <a
                      key={video.id}
                      href={video.youtubeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="group grid gap-3 rounded-xl bg-slate-50 p-2.5 transition-all duration-200 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 md:grid-cols-[176px,1fr,120px] md:items-center"
                    >
                      <div className="relative h-[98px] overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                        <Image
                          src={video.thumbnailUrl}
                          alt={video.title}
                          fill
                          className="object-cover"
                          sizes="176px"
                        />
                        <span className="absolute right-2 top-2 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
                          {video.duration}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <p className="line-clamp-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{video.title}</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{video.channel}</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{video.views} • {video.published}</p>
                      </div>

                      <div className="hidden justify-end md:flex">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 shadow-sm dark:bg-slate-900 dark:text-slate-200">
                          Watch <FiExternalLink className="text-[11px]" />
                        </span>
                      </div>
                    </a>
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
