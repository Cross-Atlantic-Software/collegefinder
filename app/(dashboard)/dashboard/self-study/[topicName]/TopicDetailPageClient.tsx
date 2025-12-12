"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";
import Image from "next/image";
import ArticleModal from "@/components/dashboard/ArticleModal";
import VideoModal from "@/components/dashboard/VideoModal";

type Purpose = {
  id: number;
  name: string;
  status: boolean;
};

type Lecture = {
  id: number;
  name: string;
  content_type: "VIDEO" | "ARTICLE";
  video_file: string | null;
  iframe_code: string | null;
  article_content: string | null;
  thumbnail: string | null;
  description: string | null;
  purposes: Purpose[];
  sort_order: number;
};

type Subtopic = {
  id: number;
  name: string;
  description: string | null;
  sort_order: number;
  lectures: Lecture[];
};

type Props = {
  topic: {
    id: number;
    name: string;
    thumbnail: string | null;
    description: string | null;
    sub_id: number;
  };
  subtopics: Subtopic[];
};

export default function TopicDetailPageClient({ topic, subtopics }: Props) {
  const router = useRouter();
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);

  const handleLectureClick = (lecture: Lecture) => {
    setSelectedLecture(lecture);
    if (lecture.content_type === "ARTICLE") {
      setShowArticleModal(true);
    } else if (lecture.content_type === "VIDEO") {
      setShowVideoModal(true);
    }
  };

  return (
    <div className="w-full space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/15 transition text-slate-200"
        >
          <FiArrowLeft className="text-xl" />
        </button>
        <h1 className="text-2xl font-semibold text-slate-50">{topic.name}</h1>
      </div>

      {/* Subtopics */}
      <div className="space-y-8">
        {subtopics.map((subtopic) => (
          <div key={subtopic.id} className="space-y-4">
            {/* Subtopic Header */}
            <h2 className="text-base font-semibold text-slate-50">
              {subtopic.name}
            </h2>

            {/* Lectures - Horizontal Scroll */}
            {subtopic.lectures.length > 0 ? (
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {subtopic.lectures.map((lecture) => (
                  <div
                    key={lecture.id}
                    onClick={() => handleLectureClick(lecture)}
                    className="flex-shrink-0 w-full rounded-lg bg-black/20 p-3 shadow-sm cursor-pointer hover:bg-black/30 transition group sm:w-[200px]"
                  >
                    <div className="h-[130px] w-full rounded-md bg-white/20 overflow-hidden relative mb-3">
                      {lecture.thumbnail ? (
                        <Image
                          src={lecture.thumbnail}
                          alt={lecture.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 640px) 100vw, 200px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">
                          {lecture.content_type === "VIDEO" ? "Video" : "Article"}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-slate-100 line-clamp-2">
                        {lecture.name}
                      </p>

                      {/* Purpose Tags */}
                      {lecture.purposes && lecture.purposes.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {lecture.purposes.map((purpose) => (
                            <span
                              key={purpose.id}
                              className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300"
                            >
                              {purpose.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-300">No lectures available</p>
            )}
          </div>
        ))}
      </div>

      {/* Modals */}
      {selectedLecture && (
        <>
          {showArticleModal && (
            <ArticleModal
              lecture={selectedLecture}
              isOpen={showArticleModal}
              onClose={() => {
                setShowArticleModal(false);
                setSelectedLecture(null);
              }}
            />
          )}
          {showVideoModal && (
            <VideoModal
              lecture={selectedLecture}
              isOpen={showVideoModal}
              onClose={() => {
                setShowVideoModal(false);
                setSelectedLecture(null);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

