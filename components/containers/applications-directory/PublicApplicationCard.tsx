"use client";

import { MdSchool } from "react-icons/md";
import type { PublicApplication } from "@/api/applications";
import { applicationStatusDisplay } from "@/lib/applicationStatusDisplay";

export type PublicApplicationCardProps = {
  application: PublicApplication;
};

export function PublicApplicationCard({ application }: PublicApplicationCardProps) {
  const statusConfig = applicationStatusDisplay(application.status);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-700 shadow-sm ring-1 ring-black/[0.04] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-600">
          <MdSchool />
        </div>

        <div className="flex-1 space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-900">{application.exam_name}</p>
              <p className="text-[11px] text-slate-500">Exam Registration Automation</p>
            </div>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}
            >
              {statusConfig.icon}
              {statusConfig.label}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-[11px] sm:grid-cols-2">
        <div className="rounded-lg bg-slate-50 p-2">
          <p className="text-slate-500">Applied on</p>
          <p className="mt-0.5 font-medium text-slate-900">
            {new Date(application.created_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="rounded-lg bg-slate-50 p-2">
          <p className="text-slate-500">Status</p>
          <p className="mt-0.5 font-medium text-slate-900">{statusConfig.label}</p>
        </div>
      </div>
    </article>
  );
}
