// components/dashboard/Applications.tsx
"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

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
                {app.exam_name}
              </h3>
              <p className="text-[11px] text-slate-300">
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
        <div className="rounded-lg bg-white/5 p-2">
          <p className="text-slate-400">Applied on</p>
          <p className="mt-0.5 font-medium text-slate-100">
            {new Date(app.created_at).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        </div>
        <div className="rounded-lg bg-white/5 p-2">
          <p className="text-slate-400">Status</p>
          <p className="mt-0.5 font-medium text-slate-100">
            {statusConfig.label}
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
          {app.status === "approved" && (
            <Button
              variant="DarkGradient"
              size="sm"
              className="flex items-center gap-2"
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
              className="flex items-center gap-2"
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
              className="flex items-center gap-2"
              onClick={() => onStartWorkflow(app)}
            >
              <MdRefresh className="h-3 w-3" />
              Retry
            </Button>
          )}
        </div>
      </div>
    </div>
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

      const response = await fetch(`${API_URL}/user/automation-applications${statusParam}`, {
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
    <main className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">My Applications</h1>
          <p className="text-sm text-slate-400">Manage your exam automation requests</p>
        </div>
        <Button
          variant="DarkGradient"
          size="md"
          className="flex items-center gap-2"
          onClick={() => setShowCreateModal(true)}
        >
          <MdAdd className="h-5 w-5" />
          New Application
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex w-full overflow-hidden rounded-md bg-white/10 text-sm font-medium text-slate-300">
        <button
          onClick={() => setActiveTab("all")}
          className={`flex-1 py-3 text-center transition ${activeTab === "all"
            ? "bg-pink text-white"
            : "hover:bg-white/5"
            }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveTab("approved")}
          className={`flex-1 py-3 text-center transition ${activeTab === "approved"
            ? "bg-pink text-white"
            : "hover:bg-white/5"
            }`}
        >
          Ready
        </button>
        <button
          onClick={() => setActiveTab("running")}
          className={`flex-1 py-3 text-center transition ${activeTab === "running"
            ? "bg-pink text-white"
            : "hover:bg-white/5"
            }`}
        >
          In Progress
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          className={`flex-1 py-3 text-center transition ${activeTab === "completed"
            ? "bg-pink text-white"
            : "hover:bg-white/5"
            }`}
        >
          Completed
        </button>
      </div>

      {/* Refresh button */}
      <div className="flex justify-end">
        <button
          onClick={fetchApplications}
          disabled={isLoading}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
        >
          <MdRefresh className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Content */}
      <section>
        {isLoading ? (
          <div className="flex min-h-[160px] items-center justify-center text-sm text-slate-400">
            <FiRefreshCw className="h-5 w-5 animate-spin mr-2" />
            Loading applications...
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="flex flex-col min-h-[160px] items-center justify-center text-sm text-slate-400 gap-4">
            <p>No applications found.</p>
            <Button
              variant="themeButtonOutline"
              size="sm"
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

      {/* Create Modal */}
      <StudentExamCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onStartWorkflow={handleNewExamWorkflow}
      />

      {/* Workflow Modal */}
      {selectedExamId && (
        <StudentWorkflowModal
          isOpen={showWorkflowModal}
          onClose={() => {
            setShowWorkflowModal(false);
            setSelectedExamId(null);
            setSelectedExamName("");
            fetchApplications(); // Refresh after closing workflow
          }}
          examId={selectedExamId}
          examName={selectedExamName}
        />
      )}
    </main>
  );
}
