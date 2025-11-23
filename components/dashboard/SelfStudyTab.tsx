// src/components/exams/SelfStudyTab.tsx
"use client";

import React, { useMemo } from "react";
import { BiSearch } from "react-icons/bi";
import { IoSwapVertical } from "react-icons/io5";

type Playlist = {
  id: string;
  title: string;
  subject: string;
  thumb?: string;
};

type SubjectSection = {
  id: string;
  name: string;
  playlists: Playlist[];
};

type Props = {
  subjects: SubjectSection[];
  query: string;
  onQueryChange: (v: string) => void;
  sortBy: "latest" | "popular";
  onToggleSort: () => void;
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
        playlists: s.playlists.filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            p.subject.toLowerCase().includes(q)
        ),
      }))
      .filter((s) => s.playlists.length > 0);
  }, [query, subjects]);

  const sortedPlaylists = (playlists: Playlist[]) => {
    if (sortBy === "popular") return playlists; // hook later
    return playlists; // hook later
  };

  return (
    <div className="space-y-4">
      {/* Search bar (Self Study) */}
      <div className="flex items-center gap-2 rounded-full bg-white/10 p-3 pl-4 text-sm text-slate-200">
        <BiSearch className="text-lg opacity-80" />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search topics, subjects, or keywords..."
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-slate-400"
        />
      </div>

      {/* Content panel */}
      <div>
        {filteredSubjects.length === 0 ? (
          <div className="flex min-h-[180px] items-center justify-center text-sm text-slate-400">
            No playlists found.
          </div>
        ) : (
          <div className="space-y-8 w-full">
            {filteredSubjects.map((subject) => (
              <section key={subject.id} className="space-y-3">
                {/* Subject header + sort */}
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-slate-50">
                    {subject.name}
                  </h3>

                  <button
                    onClick={onToggleSort}
                    className="flex items-center gap-2 text-xs font-semibold text-slate-200 hover:text-white"
                  >
                    <IoSwapVertical className="text-base" />
                    SORT BY{" "}
                    <span className="opacity-80">
                      {sortBy === "latest" ? "Latest" : "Popular"}
                    </span>
                  </button>
                </div>

                {/* Playlists grid (fluid, no fixed width) */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                  {sortedPlaylists(subject.playlists).map((pl) => (
                    <div
                      key={pl.id}
                      className="w-full rounded-lg bg-black/20 p-3 shadow-sm"
                    >
                      <div className="h-[130px] w-full rounded-md bg-white/20" />

                      <div className="mt-3 space-y-1.5">
                        <p className="text-xs font-medium text-slate-100 line-clamp-2">
                          {pl.title}
                        </p>

                        <button className="text-[11px] font-semibold text-amber-300 hover:text-amber-200">
                          VIEW PLAYLIST
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
