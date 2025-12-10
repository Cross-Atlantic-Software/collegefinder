"use client";

import React from "react";
import { FiX } from "react-icons/fi";

type Lecture = {
  id: number;
  name: string;
  video_file: string | null;
  description: string | null;
};

type Props = {
  lecture: Lecture;
  isOpen: boolean;
  onClose: () => void;
};

export default function VideoModal({ lecture, isOpen, onClose }: Props) {
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

        {/* Video Content */}
        <div className="flex-1 p-6 flex items-center justify-center">
          {lecture.video_file ? (
            <div className="w-full aspect-video">
              <video
                controls
                className="w-full h-full rounded-lg"
                src={lecture.video_file}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          ) : (
            <p className="text-slate-400">No video available</p>
          )}
        </div>

        {/* Description */}
        {lecture.description && (
          <div className="p-4 border-t border-white/10">
            <p className="text-sm text-slate-200">{lecture.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}

