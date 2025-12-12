"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/shared";
import { MdOutlineReplay, MdOutlineHistory, MdSchool } from "react-icons/md";
import { IoPlayCircleOutline } from "react-icons/io5";
import { getSubjectsByStream } from "@/api/auth/profile";
import { FiAlertCircle } from "react-icons/fi";

import SelfStudyTab from "./SelfStudyTab";
import CoachingCentersTab from "./CoachingCentersTab";

type PrepMode = "self" | "coaching";

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

export default function ExamPreparation() {
  const router = useRouter();
  const [mode, setMode] = useState<PrepMode>("self");
  const [query, setQuery] = useState("");
  const [subjects, setSubjects] = useState<SubjectSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [requiresStreamSelection, setRequiresStreamSelection] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true);
        // Client-side API call, but filtering happens SERVER-SIDE in the backend
        // Backend only returns subjects matching user's stream_id - no client-side filtering
        const response = await getSubjectsByStream();
        if (response.success && response.data) {
          if (response.data.requiresStreamSelection) {
            setRequiresStreamSelection(true);
            setSubjects([]);
          } else {
            setRequiresStreamSelection(false);
            // Map API response to component format
            const mappedSubjects: SubjectSection[] = (response.data.subjects || []).map((subj: { id: string; name: string; topics: Topic[]; allTopics: Topic[] }) => ({
              id: String(subj.id),
              name: subj.name,
              topics: subj.topics || [],
              allTopics: subj.allTopics || []
            }));
            setSubjects(mappedSubjects);
          }
        } else {
          setError(response.message || 'Failed to load subjects');
        }
      } catch (err) {
        console.error('Error fetching subjects:', err);
        setError('Failed to load subjects');
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  return (
    <div className="w-full space-y-5">
      {/* PERFORMANCE RADAR STRIP */}
      {/* <div className="flex flex-col gap-3 rounded-md bg-amber-400/90 p-4 text-slate-900 shadow-sm sm:flex-row sm:items-center sm:justify-between">
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
      </div> */}

      {/* MODE TABS */}
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

      {/* Stream Selection Required Message */}
      {requiresStreamSelection && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <FiAlertCircle className="h-8 w-8 text-amber-600" />
            <div>
              <h3 className="text-lg font-semibold text-amber-900 mb-1">
                Stream Selection Required
              </h3>
              <p className="text-sm text-amber-700 mb-4">
                Please select your stream in your academics profile to view exam preparation materials.
              </p>
              <Button
                onClick={() => router.push('/dashboard?tab=academics')}
                variant="DarkGradient"
                size="sm"
                className="text-white"
              >
                Go to Academics Profile
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && !requiresStreamSelection && (
        <div className="flex items-center justify-center py-12">
          <div className="text-sm text-slate-400">Loading subjects...</div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && !requiresStreamSelection && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-center">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* TAB CONTENT */}
      {!loading && !requiresStreamSelection && !error && (
        mode === "self" ? (
          <SelfStudyTab
            subjects={subjects}
            query={query}
            onQueryChange={setQuery}
            sortBy="latest"
            onToggleSort={() => {}}
          />
        ) : (
          <CoachingCentersTab />
        )
      )}
    </div>
  );
}