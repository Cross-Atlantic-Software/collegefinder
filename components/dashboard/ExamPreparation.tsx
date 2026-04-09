"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/shared";
import { getSubjectsByStream } from "@/api/auth/profile";
import { getStrengthResults } from "@/api/strength";
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

type ExamPreparationProps = {
  initialMode?: PrepMode;
};

export default function ExamPreparation({ initialMode }: ExamPreparationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<PrepMode>(initialMode ?? "self");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"latest" | "popular">("latest");
  const [subjects, setSubjects] = useState<SubjectSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [requiresStreamSelection, setRequiresStreamSelection] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userStrengths, setUserStrengths] = useState<string[] | null>(null);
  const [strengthsLoading, setStrengthsLoading] = useState(true);

  useEffect(() => {
    const requestedMode = searchParams.get("mode");
    if (requestedMode === "self" || requestedMode === "coaching") {
      setMode(requestedMode);
    }
  }, [searchParams]);

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

  useEffect(() => {
    const fetchStrengths = async () => {
      try {
        const response = await getStrengthResults();
        if (response.success && response.data?.has_results && response.data.results?.strengths) {
          setUserStrengths(response.data.results.strengths);
        } else {
          setUserStrengths(null);
        }
      } catch (err) {
        console.error("Error fetching strength results:", err);
        setUserStrengths(null);
      } finally {
        setStrengthsLoading(false);
      }
    };

    fetchStrengths();
  }, []);

  return (
    <div className="min-h-screen w-full min-w-0 max-w-full overflow-x-hidden bg-[#f5f9ff] text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <section className="w-full min-w-0 max-w-full overflow-x-hidden bg-[#f5f9ff]">
        <header className="border-b border-slate-200 bg-white px-4 pt-2 pb-0 dark:border-slate-800 dark:bg-slate-900 md:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Link
                  href="/dashboard"
                  className="font-semibold text-black/70 hover:text-black hover:underline dark:text-slate-200 dark:hover:text-white"
                >
                  Dashboard
                </Link>
                <span>/</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">Exam Prep</span>
                <span>/</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {mode === "self" ? "Self Study" : "Coaching Institutes"}
                </span>
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">Exam Prep</p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Practice by subject or explore top coaching options.
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="min-w-0 max-w-full overflow-x-hidden bg-[#f8fbff] p-4 dark:bg-slate-950/40 md:p-6" style={{ animation: "fade-in 220ms ease-out" }}>
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
                variant="themeButton"
                size="sm"
                className="rounded-full !border-black !bg-black !text-[#FAD53C] transition-all duration-200 hover:!bg-black/90"
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
          <div className="text-sm text-slate-500 dark:text-slate-300">Loading subjects...</div>
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
            sortBy={sortBy}
            onToggleSort={() => setSortBy((prev) => (prev === "latest" ? "popular" : "latest"))}
            userStrengths={userStrengths}
            strengthsLoading={strengthsLoading}
          />
        ) : (
          <CoachingCentersTab />
        )
      )}
        </div>
      </section>
    </div>
  );
}