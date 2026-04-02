// src/components/exams/SelfStudyTab.tsx
"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { IoChevronDown, IoChevronUp } from "react-icons/io5";
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

export default function SelfStudyTab({
  subjects,
  query,
  onQueryChange,
  sortBy,
  onToggleSort,
}: Props) {
  const router = useRouter();
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());

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

  const toggleSubjectExpansion = (subjectId: string) => {
    setExpandedSubjects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(subjectId)) {
        newSet.delete(subjectId);
      } else {
        newSet.add(subjectId);
      }
      return newSet;
    });
  };

  const handleTopicClick = (topicName: string) => {
    router.push(`/dashboard/self-study/${encodeURIComponent(topicName)}`);
  };

  return (
    <div className="space-y-4">

      {/* Content panel */}
      <div>
        {filteredSubjects.length === 0 ? (
          <div className="flex min-h-[180px] items-center justify-center rounded-xl bg-white text-sm text-slate-500 shadow-sm dark:bg-slate-900 dark:text-slate-300">
            No topics found.
          </div>
        ) : (
          <div className="space-y-8 w-full">
            {filteredSubjects.map((subject) => {
              const isExpanded = expandedSubjects.has(subject.id);
              const displayTopics = isExpanded ? subject.allTopics : subject.topics;
              const hasMoreTopics = subject.allTopics.length > subject.topics.length;

              return (
                <section key={subject.id} className="space-y-3">
                  {/* Subject header + view more */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      {subject.name}
                    </h3>

                    {hasMoreTopics && (
                      <button
                        onClick={() => toggleSubjectExpansion(subject.id)}
                        className="flex items-center gap-2 text-xs font-semibold text-[#b88900] transition hover:text-[#936d00]"
                      >
                        {isExpanded ? (
                          <>
                            <IoChevronUp className="text-base" />
                            VIEW LESS
                          </>
                        ) : (
                          <>
                            <IoChevronDown className="text-base" />
                            VIEW MORE
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Topics grid */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {displayTopics.map((topic) => (
                      <div
                        key={topic.id}
                        onClick={() => handleTopicClick(topic.name)}
                        className="group w-full cursor-pointer rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                      >
                        <div className="relative h-[130px] w-full overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                          {topic.thumbnail ? (
                            <Image
                              src={topic.thumbnail}
                              alt={topic.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate-400">
                              No Image
                            </div>
                          )}
                        </div>

                        <div className="mt-3 space-y-1.5">
                          <p className="line-clamp-2 text-xs font-medium text-slate-900 dark:text-slate-100">
                            {topic.name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
