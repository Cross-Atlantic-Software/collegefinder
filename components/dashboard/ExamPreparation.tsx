"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/shared";
import { FiAlertCircle } from "react-icons/fi";
import { useExamPrepSubjectsQuery } from "@/lib/examPrepSubjectQueries";

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

type ChapterSection = {
  id: number;
  name: string;
  sort_order: number;
  topics: Topic[];
  allTopics: Topic[];
};

type SubjectSection = {
  id: string;
  name: string;
  chapters?: ChapterSection[];
  topics: Topic[];
  allTopics: Topic[];
};

type ExamPreparationProps = {
  /** Synced with dashboard sidebar (Self study vs Coaching). URL `?mode=` overrides when present. */
  initialMode?: PrepMode;
};

export default function ExamPreparation({ initialMode = "self" }: ExamPreparationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<PrepMode>(initialMode);
  const [query, setQuery] = useState("");
  const subjectsQuery = useExamPrepSubjectsQuery();

  const subjects = useMemo<SubjectSection[]>(() => {
    const raw = subjectsQuery.data?.subjects;
    if (!raw) return [];
    return raw.map((subj) => ({
      id: String(subj.id),
      name: subj.name,
      chapters: subj.chapters || [],
      topics: subj.topics || [],
      allTopics: subj.allTopics || [],
    }));
  }, [subjectsQuery.data?.subjects]);

  const loading = subjectsQuery.isLoading;
  const requiresStreamSelection = subjectsQuery.data?.requiresStreamSelection ?? false;
  const error = subjectsQuery.isError
    ? subjectsQuery.error instanceof Error
      ? subjectsQuery.error.message
      : "Failed to load subjects"
    : null;

  useEffect(() => {
    const requestedMode = searchParams.get("mode");
    if (requestedMode === "self" || requestedMode === "coaching") {
      setMode(requestedMode);
      return;
    }
    setMode(initialMode);
  }, [searchParams, initialMode]);

  return (
    <div className="min-h-screen w-full min-w-0 max-w-full overflow-x-hidden bg-[#f5f9ff] text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <section className="w-full min-w-0 max-w-full overflow-x-hidden bg-[#f5f9ff]">
        <header className="border-b border-slate-200 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-900 md:px-6">
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">Exam Prep</p>
        </header>

        <div className="min-w-0 max-w-full overflow-x-hidden bg-[#f8fbff] p-2 dark:bg-slate-950/40 md:p-3" style={{ animation: "fade-in 220ms ease-out" }}>
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