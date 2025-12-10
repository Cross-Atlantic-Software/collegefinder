// src/components/exams/SelfStudyTab.tsx
"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BiSearch } from "react-icons/bi";
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
                    <h3 className="text-base font-semibold text-slate-50">
                      {subject.name}
                    </h3>

                    {hasMoreTopics && (
                      <button
                        onClick={() => toggleSubjectExpansion(subject.id)}
                        className="flex items-center gap-2 text-xs font-semibold text-amber-300 hover:text-amber-200 transition"
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
                        className="w-full rounded-lg bg-black/20 p-3 shadow-sm cursor-pointer hover:bg-black/30 transition group"
                      >
                        <div className="h-[130px] w-full rounded-md bg-white/20 overflow-hidden relative">
                          {topic.thumbnail ? (
                            <Image
                              src={topic.thumbnail}
                              alt={topic.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              No Image
                            </div>
                          )}
                        </div>

                        <div className="mt-3 space-y-1.5">
                          <p className="text-xs font-medium text-slate-100 line-clamp-2">
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
