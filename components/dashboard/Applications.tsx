// app/applications/page.tsx
"use client";

import React, { useMemo, useState } from "react";
import { BiSearch } from "react-icons/bi";
import { IoFunnel } from "react-icons/io5";
import {
  MdSchool,
  MdCheckCircle,
  MdHourglassTop,
  MdOutlineArrowForwardIos,
} from "react-icons/md";
import { Button } from "@/components/shared";

type ApplicationStatus = "pending" | "submitted";

type Application = {
  id: string;
  college: string;
  program: string;
  exam: string;
  city: string;
  status: ApplicationStatus;
  progressLabel: string;
  appliedOn?: string;
  deadline?: string;
};

const APPLICATIONS: Application[] = [
  {
    id: "1",
    college: "IIIT Hyderabad",
    program: "B.Tech CSE",
    exam: "JEE Main",
    city: "Hyderabad",
    status: "pending",
    progressLabel: "Documents pending · 70% complete",
    appliedOn: "Oct 12, 2025",
    deadline: "Nov 30, 2025",
  },
  {
    id: "2",
    college: "NIT Trichy",
    program: "B.Tech ECE",
    exam: "JEE Main",
    city: "Tiruchirappalli",
    status: "pending",
    progressLabel: "Payment pending · 40% complete",
    appliedOn: "Oct 5, 2025",
    deadline: "Nov 28, 2025",
  },
  {
    id: "3",
    college: "VIT Vellore",
    program: "B.Tech Mechanical",
    exam: "VITEEE",
    city: "Vellore",
    status: "submitted",
    progressLabel: "Submitted · Awaiting review",
    appliedOn: "Sep 25, 2025",
    deadline: "Closed",
  },
  {
    id: "4",
    college: "SRM Kattankulathur",
    program: "B.Tech CSE (AI)",
    exam: "SRMJEEE",
    city: "Chennai",
    status: "submitted",
    progressLabel: "Submitted · Slot booking next",
    appliedOn: "Sep 30, 2025",
    deadline: "Dec 10, 2025",
  },
];

function ApplicationCard({ app }: { app: Application }) {
  const isPending = app.status === "pending";

  const statusChip = useMemo(
    () =>
      isPending ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-0.5 text-xs font-medium text-amber-700">
          <MdHourglassTop className="h-4 w-4" />
          In Progress
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-medium text-emerald-700">
          <MdCheckCircle className="h-4 w-4" />
          Submitted
        </span>
      ),
    [isPending]
  );

  return (
    <div className="rounded-md bg-white/5 p-4 text-xs text-slate-200 shadow-sm">
      {/* Top row */}
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-lg text-pink">
          <MdSchool />
        </div>

        <div className="flex-1 space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-50 mb-2">
                {app.college}
              </h3>
              <p className="text-[11px] text-slate-300">
                {app.program} · {app.city}
              </p>
            </div>

            {statusChip}
          </div>

          <p className="text-[11px] text-slate-400">
            Based on <span className="font-medium">{app.exam}</span> score
          </p>
        </div>
      </div>

      {/* Meta row */}
      <div className="mt-4 grid gap-3 text-[11px] sm:grid-cols-3">
        <div className="rounded-lg bg-white/5 p-2">
          <p className="text-slate-400">Applied on</p>
          <p className="mt-0.5 font-medium text-slate-100">
            {app.appliedOn || "--"}
          </p>
        </div>
        <div className="rounded-lg bg-white/5 p-2">
          <p className="text-slate-400">Last date</p>
          <p className="mt-0.5 font-medium text-slate-100">
            {app.deadline || "--"}
          </p>
        </div>
        <div className="rounded-lg bg-white/5 p-2">
          <p className="text-slate-400">Status</p>
          <p className="mt-0.5 font-medium text-slate-100">
            {app.progressLabel}
          </p>
        </div>
      </div>

      {/* Footer actions */}
      <div className="mt-4 flex flex-col gap-2 border-t border-white/5 pt-3 text-[11px] sm:flex-row sm:items-center sm:justify-between">
        <p className="text-slate-400">
          Application ID:&nbsp;
          <span className="font-mono text-slate-200">{app.id}</span>
        </p>

        <div className="flex gap-2">
          {isPending && (
            <Button
              variant="DarkGradient"
              size="sm"
              className="flex items-center gap-2"
            >
              Continue application
              <MdOutlineArrowForwardIos className="h-3 w-3" />
            </Button>
          )}

          <Button
            variant={isPending ? "themeButtonOutline" : "themeButton"}
            size="sm"
          >
            View details
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ApplicationsPage() {
  const [activeTab, setActiveTab] = useState<ApplicationStatus | "all">(
    "pending"
  );
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return APPLICATIONS.filter((app) => {
      const matchesTab =
        activeTab === "all" ? true : app.status === activeTab;
      const q = query.toLowerCase();
      const matchesQuery =
        !q ||
        app.college.toLowerCase().includes(q) ||
        app.program.toLowerCase().includes(q) ||
        app.exam.toLowerCase().includes(q);
      return matchesTab && matchesQuery;
    });
  }, [activeTab, query]);

  return (
    <main className="flex flex-col gap-4">
      {/* Search */}
      <section className="flex items-center gap-2 rounded-full bg-white/10 p-1 pl-4 text-xs text-slate-300">
        <BiSearch className="text-xl" />
        <input
          placeholder="Search applications by college, program or exam..."
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-slate-500"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button
          variant="themeButton"
          size="sm"
          className="flex items-center gap-2 rounded-full"
        >
          <IoFunnel />
          Filters
        </Button>
      </section>

      {/* Tabs */}
      <div className="flex w-full overflow-hidden rounded-md bg-white/10 text-sm font-medium text-slate-300">
        <button
          onClick={() => setActiveTab("all")}
          className={`flex-1 py-3 text-center transition ${
            activeTab === "all"
              ? "bg-pink text-white"
              : "hover:bg-white/5"
          }`}
        >
          All Applications
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          className={`flex-1 py-3 text-center transition ${
            activeTab === "pending"
              ? "bg-pink text-white"
              : "hover:bg-white/5"
          }`}
        >
          In-progress
        </button>
        <button
          onClick={() => setActiveTab("submitted")}
          className={`flex-1 py-3 text-center transition ${
            activeTab === "submitted"
              ? "bg-pink text-white"
              : "hover:bg-white/5"
          }`}
        >
          Submitted
        </button>
      </div>

      {/* Content */}
      <section className="">
        {filtered.length === 0 ? (
          <div className="flex min-h-[160px] items-center justify-center text-sm text-slate-400">
            No applications found for this filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {filtered.map((app) => (
              <ApplicationCard key={app.id} app={app} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
