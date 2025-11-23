// src/components/exams/ExamPreparation.tsx
"use client";

import React, { useState } from "react";
import { Button } from "@/components/shared";
import { MdOutlineReplay, MdOutlineHistory, MdSchool } from "react-icons/md";
import { IoPlayCircleOutline } from "react-icons/io5";

import SelfStudyTab from "./SelfStudyTab";
import CoachingCentersTab from "./CoachingCentersTab";

type PrepMode = "self" | "coaching";

type Playlist = {
  id: string;
  title: string;
  subject: string;
};

type SubjectSection = {
  id: string;
  name: string;
  playlists: Playlist[];
};

const SUBJECTS: SubjectSection[] = [
  {
    id: "phy",
    name: "Physics",
    playlists: [
      { id: "p1", title: "Explore Selfcare Activities", subject: "Physics" },
      { id: "p2", title: "Mechanics Marathon", subject: "Physics" },
      { id: "p3", title: "Modern Physics Boost", subject: "Physics" },
      { id: "p4", title: "Electrostatics Sprint", subject: "Physics" },
      { id: "p5", title: "Explore Selfcare Activities", subject: "Physics" },
      { id: "p6", title: "Mechanics Marathon", subject: "Physics" },
    ],
  },
  {
    id: "chem",
    name: "Chemistry",
    playlists: [
      { id: "c1", title: "Organic One-Shots", subject: "Chemistry" },
      { id: "c2", title: "Physical Chem Crash", subject: "Chemistry" },
      { id: "c3", title: "Inorganic Memory Hacks", subject: "Chemistry" },
      { id: "c4", title: "Reaction Practice Set", subject: "Chemistry" },
      { id: "c5", title: "Organic One-Shots", subject: "Chemistry" },
      { id: "c6", title: "Physical Chem Crash", subject: "Chemistry" },
    ],
  },
];

export default function ExamPreparation() {
  const [mode, setMode] = useState<PrepMode>("self");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"latest" | "popular">("latest");

  const toggleSort = () =>
    setSortBy((p) => (p === "latest" ? "popular" : "latest"));

  return (
    <div className="w-full space-y-5">
      {/* PERFORMANCE RADAR STRIP */}
      <div className="flex flex-col gap-3 rounded-md bg-amber-400/90 p-4 text-slate-900 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center text-3xl text-white/40">
            <MdSchool />
          </div>
          <div>
            <p className="text-md font-semibold">Performance Radar</p>
            <p className="text-xs font-medium opacity-90">
              Current Score: 7.5
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            variant="DarkGradient"
            size="sm"
            className="flex items-center justify-center gap-1 rounded-md text-white"
          >
            <MdOutlineReplay className="text-lg" />
            Take the Retest
          </Button>

          <Button
            variant="themeButtonOutline"
            size="sm"
            className="flex items-center justify-center gap-1 rounded-md bg-white text-slate-900"
          >
            <MdOutlineHistory className="text-lg" />
            View Old Scores
          </Button>
        </div>
      </div>

      {/* MODE TABS (updated usage) */}
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          onClick={() => setMode("self")}
          className={`flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition ${
            mode === "self"
              ? "bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow"
              : "bg-white/10 text-slate-200 hover:bg-white/15"
          }`}
        >
          <IoPlayCircleOutline className="text-lg" />
          Self-Study Mode
        </button>

        <button
          onClick={() => setMode("coaching")}
          className={`flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition ${
            mode === "coaching"
              ? "bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow"
              : "bg-white/10 text-slate-200 hover:bg-white/15"
          }`}
        >
          <MdSchool className="text-lg" />
          Coaching Centers
        </button>
      </div>

      {/* TAB CONTENT */}
      {mode === "self" ? (
        <SelfStudyTab
          subjects={SUBJECTS}
          query={query}
          onQueryChange={setQuery}
          sortBy={sortBy}
          onToggleSort={toggleSort}
        />
      ) : (
        <CoachingCentersTab />
      )}
    </div>
  );
}