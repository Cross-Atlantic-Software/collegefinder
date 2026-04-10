// components/dashboard/Applications.tsx
"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  MdSchool,
  MdCheckCircle,
  MdHourglassTop,
  MdAdd,
  MdRefresh,
  MdError,
} from "react-icons/md";
import { FiPlay, FiRefreshCw } from "react-icons/fi";
import { Button } from "@/components/shared";
import { StudentExamCreateModal } from "./StudentExamCreateModal";
import { StudentWorkflowModal } from "./StudentWorkflowModal";
import { getApiBaseUrl } from "@/api/client";

type ApplicationStatus = "pending" | "approved" | "running" | "completed" | "failed";

type Application = {
  id: number;
  exam_id: number;
  exam_name: string;
  exam_slug: string;
  status: ApplicationStatus;
  created_at: string;
  session_id?: string;
};

function ApplicationCard({
  app,
  onStartWorkflow,
  onViewProgress
}: {
  app: Application;
  onStartWorkflow: (app: Application) => void;
  onViewProgress: (app: Application) => void;
}) {
  const detailHref = `/dashboard/exams/${app.exam_id || app.exam_slug}?from=dashboard-applications`;

  const getStatusConfig = (status: ApplicationStatus) => {
    switch (status) {
      case "pending":
        return {
          icon: <MdHourglassTop className="h-4 w-4" />,
          label: "Pending Approval",
          bgColor: "bg-amber-100",
          textColor: "text-amber-700",
        };
      case "approved":
        return {
          icon: <MdCheckCircle className="h-4 w-4" />,
          label: "Ready to Start",
          bgColor: "bg-blue-100",
          textColor: "text-blue-700",
        };
      case "running":
        return {
          icon: <FiRefreshCw className="h-4 w-4 animate-spin" />,
          label: "In Progress",
          bgColor: "bg-purple-100",
          textColor: "text-purple-700",
        };
      case "completed":
        return {
          icon: <MdCheckCircle className="h-4 w-4" />,
          label: "Completed",
          bgColor: "bg-emerald-100",
          textColor: "text-emerald-700",
        };
      case "failed":
        return {
          icon: <MdError className="h-4 w-4" />,
          label: "Failed",
          bgColor: "bg-red-100",
          textColor: "text-red-700",
        };
      default:
        return {
          icon: <MdHourglassTop className="h-4 w-4" />,
          label: status,
          bgColor: "bg-gray-100",
          textColor: "text-gray-700",
        };
    }
  };

  const statusConfig = getStatusConfig(app.status);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
      {/* Top row */}
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <MdSchool />
        </div>

        <div className="flex-1 space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <Link href={detailHref} className="mb-2 inline-block text-sm font-semibold text-slate-900 transition-colors hover:text-black dark:text-slate-100 dark:hover:text-white">
                {app.exam_name}
              </Link>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Exam Registration Automation
              </p>
            </div>

            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}>
              {statusConfig.icon}
              {statusConfig.label}
            </span>
          </div>
        </div>
      </div>

      {/* Meta row */}
      <div className="mt-4 grid gap-3 text-[11px] sm:grid-cols-2">
        <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/70">
          <p className="text-slate-500 dark:text-slate-400">Applied on</p>
          <p className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">
            {new Date(app.created_at).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        </div>
        <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/70">
          <p className="text-slate-500 dark:text-slate-400">Status</p>
          <p className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">
            {statusConfig.label}
          </p>
        </div>
      </div>

      {/* Footer actions */}
      <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-3 text-[11px] dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-slate-500 dark:text-slate-400">
          Application ID:&nbsp;
          <span className="font-mono text-slate-700 dark:text-slate-200">{app.id}</span>
        </p>

        <div className="flex gap-2">
          {app.status === "approved" && (
            <Button
              variant="themeButton"
              size="sm"
              className="flex items-center gap-2 rounded-full !border-black !bg-black !text-[#FAD53C] transition-all duration-200 hover:!bg-black/90 active:scale-95"
              onClick={() => onStartWorkflow(app)}
            >
              <FiPlay className="h-3 w-3" />
              Start Automation
            </Button>
          )}

          {app.status === "running" && (
            <Button
              variant="themeButton"
              size="sm"
              className="flex items-center gap-2 rounded-full !border-black !bg-black !text-[#FAD53C] transition-all duration-200 hover:!bg-black/90 active:scale-95"
              onClick={() => onViewProgress(app)}
            >
              <FiRefreshCw className="h-3 w-3 animate-spin" />
              View Progress
            </Button>
          )}

          {(app.status === "completed" || app.status === "failed") && (
            <Button
              variant="themeButtonOutline"
              size="sm"
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-95 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              onClick={() => onStartWorkflow(app)}
            >
              <MdRefresh className="h-3 w-3" />
              Retry
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

export default function ApplicationsPage() {
  const [activeTab, setActiveTab] = useState<ApplicationStatus | "all">("all");
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  const [selectedExamName, setSelectedExamName] = useState<string>("");

  // Fetch applications
  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      const statusParam = activeTab !== 'all' ? `?status=${activeTab}` : '';

      const response = await fetch(`${getApiBaseUrl()}/user/automation-applications${statusParam}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      } as RequestInit);

      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }

      const data = await response.json();
      setApplications(data.data || []);
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError('Failed to load applications. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const filteredApplications = useMemo(() => {
    if (activeTab === "all") return applications;
    return applications.filter((app) => app.status === activeTab);
  }, [activeTab, applications]);

  const handleStartWorkflow = (app: Application) => {
    setSelectedExamId(app.exam_id);
    setSelectedExamName(app.exam_name);
    setShowWorkflowModal(true);
  };

  const handleViewProgress = (app: Application) => {
    setSelectedExamId(app.exam_id);
    setSelectedExamName(app.exam_name);
    setShowWorkflowModal(true);
  };

  const handleNewExamWorkflow = (examId: number, examName: string) => {
    setSelectedExamId(examId);
    setSelectedExamName(examName);
    setShowWorkflowModal(true);
    // Refresh applications list
    fetchApplications();
  };

  return (
    <div className="w-full min-h-screen bg-[#f5f9ff] text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <section className="w-full bg-[#f5f9ff]">
        <header className="border-b border-slate-200 bg-white px-4 pt-2 pb-0 dark:border-slate-800 dark:bg-slate-900 md:px-6">
          <div className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-slate-900 dark:text-slate-100">My Applications</p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Manage your exam automation requests.
              </p>
            </div>
            <Button
              variant="themeButton"
              size="sm"
              className="flex items-center gap-2 rounded-full !border-black !bg-black !px-4 !py-2 !text-[#FAD53C] transition-all duration-200 hover:!bg-black/90 active:scale-95"
              onClick={() => setShowCreateModal(true)}
            >
              <MdAdd className="h-4 w-4" />
              New Application
            </Button>
          </div>
        </header>

        <div className="bg-[#f8fbff] p-4 dark:bg-slate-950/40 md:p-6" style={{ animation: "fade-in 220ms ease-out" }}>
          <main className="flex flex-col gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="grid grid-cols-2 gap-1 md:grid-cols-4">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`rounded-full px-4 py-2.5 text-center text-sm font-medium transition-all duration-200 active:scale-95 ${
                    activeTab === "all"
                      ? "bg-black text-[#FAD53C]"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setActiveTab("approved")}
                  className={`rounded-full px-4 py-2.5 text-center text-sm font-medium transition-all duration-200 active:scale-95 ${
                    activeTab === "approved"
                      ? "bg-black text-[#FAD53C]"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                  }`}
                >
                  Ready
                </button>
                <button
                  onClick={() => setActiveTab("running")}
                  className={`rounded-full px-4 py-2.5 text-center text-sm font-medium transition-all duration-200 active:scale-95 ${
                    activeTab === "running"
                      ? "bg-black text-[#FAD53C]"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                  }`}
                >
                  In Progress
                </button>
                <button
                  onClick={() => setActiveTab("completed")}
                  className={`rounded-full px-4 py-2.5 text-center text-sm font-medium transition-all duration-200 active:scale-95 ${
                    activeTab === "completed"
                      ? "bg-black text-[#FAD53C]"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                  }`}
                >
                  Completed
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={fetchApplications}
                disabled={isLoading}
                className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-70 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              >
                <MdRefresh className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
                {error}
              </div>
            )}

            <section>
              {isLoading ? (
                <div className="flex min-h-[160px] items-center justify-center text-sm text-slate-500 dark:text-slate-400">
                  <FiRefreshCw className="mr-2 h-5 w-5 animate-spin" />
                  Loading applications...
                </div>
              ) : filteredApplications.length === 0 ? (
                <div className="flex min-h-[160px] flex-col items-center justify-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                  <p>No applications found.</p>
                  <Button
                    variant="themeButtonOutline"
                    size="sm"
                    className="rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-95 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                    onClick={() => setShowCreateModal(true)}
                  >
                    Create your first application
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                  {filteredApplications.map((app) => (
                    <ApplicationCard
                      key={app.id}
                      app={app}
                      onStartWorkflow={handleStartWorkflow}
                      onViewProgress={handleViewProgress}
                    />
                  ))}
                </div>
              )}
            </section>

            <StudentExamCreateModal
              isOpen={showCreateModal}
              onClose={() => setShowCreateModal(false)}
              onStartWorkflow={handleNewExamWorkflow}
            />

            {selectedExamId && (
              <StudentWorkflowModal
                isOpen={showWorkflowModal}
                onClose={() => {
                  setShowWorkflowModal(false);
                  setSelectedExamId(null);
                  setSelectedExamName("");
                  fetchApplications();
                }}
                examId={selectedExamId}
                examName={selectedExamName}
              />
            )}
          </main>
        </div>
      </section>
    </div>
  );
}
