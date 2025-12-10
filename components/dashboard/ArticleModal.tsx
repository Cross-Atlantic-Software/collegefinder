"use client";

import React from "react";
import { FiX } from "react-icons/fi";

type Lecture = {
  id: number;
  name: string;
  article_content: string | null;
  description: string | null;
};

type Props = {
  lecture: Lecture;
  isOpen: boolean;
  onClose: () => void;
};

export default function ArticleModal({ lecture, isOpen, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-black/40 backdrop-blur-md rounded-lg shadow-xl overflow-hidden flex flex-col border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-xl font-semibold text-slate-50">{lecture.name}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/15 transition text-slate-200"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {lecture.article_content ? (
            <div
              className="prose prose-invert max-w-none prose-headings:text-slate-50 prose-p:text-slate-200 prose-a:text-amber-300 prose-strong:text-slate-50 prose-img:rounded-lg prose-li:text-slate-200"
              dangerouslySetInnerHTML={{ __html: lecture.article_content }}
            />
          ) : (
            <p className="text-slate-400">No content available</p>
          )}
        </div>
      </div>
    </div>
  );
}

