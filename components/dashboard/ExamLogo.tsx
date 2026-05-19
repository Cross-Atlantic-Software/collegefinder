"use client";

import { MdSchool } from "react-icons/md";
import { examLogoUrl } from "@/lib/examDisplay";

type ExamLogoProps = {
  exam: { exam_logo?: string | null; logo_file_name?: string | null; name: string };
  className?: string;
  imageClassName?: string;
};

/** Exam logo on the right: full image visible (object-contain), fallback icon if missing. */
export function ExamLogo({ exam, className = "", imageClassName = "" }: ExamLogoProps) {
  const src = examLogoUrl(exam);

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-800 ${className}`}
    >
      {src ? (
        <img
          src={src}
          alt={`${exam.name} logo`}
          className={`max-h-full max-w-full object-contain object-center ${imageClassName}`}
          loading="lazy"
        />
      ) : (
        <MdSchool className="h-8 w-8 text-slate-300 dark:text-slate-600" aria-hidden />
      )}
    </div>
  );
}
