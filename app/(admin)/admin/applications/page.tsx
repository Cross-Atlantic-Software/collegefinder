'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FiPlay, FiCheck, FiClock, FiX, FiRefreshCw, FiUser, FiFileText, FiPlus, FiTrash2, FiSearch } from 'react-icons/fi';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import { WorkflowModal } from '@/components/admin/WorkflowModal';
import { getApiBaseUrl } from '@/api/client';
import { getAllExams, type Exam } from '@/api/exams';
import {
  examApplicationButtonLabel,
  getExamApplicationWindowStatus,
  isExamApplicationButtonEnabled,
} from '@/lib/examDisplay';

type ApplicationStatus = 'pending' | 'approved' | 'running' | 'completed' | 'failed';
type AdminFilter = 'all' | 'in_process' | 'completed' | 'failed';

interface Application {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  user_phone: string;
  exam_name: string;
  exam_id: number;
  exam_slug: string;
  status: ApplicationStatus;
  created_at: string;
  session_id?: string;
}

interface UserOption {
  id: number;
  name: string;
  email: string;
  phone_number: string;
}

const ADMIN_FILTERS: { id: AdminFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'in_process', label: 'In Process' },
  { id: 'completed', label: 'Completed' },
  { id: 'failed', label: 'Failed' },
];

function getProgressLabel(status: ApplicationStatus): string {
  if (status === 'failed') return 'Failed';
  if (status === 'completed') return 'Completed';
  return 'In Process';
}

function getProgressBadgeClass(status: ApplicationStatus): string {
  if (status === 'failed') return 'bg-red-100 text-red-800';
  if (status === 'completed') return 'bg-green-100 text-green-800';
  if (status === 'running') return 'bg-purple-100 text-purple-800';
  return 'bg-blue-100 text-blue-800';
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filter, setFilter] = useState<AdminFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showWorkflow, setShowWorkflow] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [syncingAppId, setSyncingAppId] = useState<number | null>(null);
  const [deletingAppId, setDeletingAppId] = useState<number | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [catalogExams, setCatalogExams] = useState<Exam[]>([]);
  const [examSearch, setExamSearch] = useState('');
  const [examsLoading, setExamsLoading] = useState(false);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [newAppUserId, setNewAppUserId] = useState<number | null>(null);
  const [newAppTaxonomyExamId, setNewAppTaxonomyExamId] = useState<number | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    try {
      setIsLoading(true);
      const adminToken = localStorage.getItem('admin_token') || '';
      const statusParam = filter !== 'all' ? `?status=${filter}` : '';

      const response = await fetch(`${getApiBaseUrl()}/admin/automation-applications${statusParam}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }

      const data = await response.json();
      setApplications(data.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError('Failed to load applications. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const loadCatalogExams = async () => {
    setExamsLoading(true);
    try {
      const response = await getAllExams();
      if (!response.success || !response.data?.exams) {
        throw new Error(response.message || 'Failed to load exams');
      }
      setCatalogExams(response.data.exams);
    } catch (err) {
      console.error('Error loading catalog exams:', err);
      setCreateError(err instanceof Error ? err.message : 'Failed to load exams.');
    } finally {
      setExamsLoading(false);
    }
  };

  const searchUsers = async (search: string) => {
    try {
      const adminToken = localStorage.getItem('admin_token') || '';
      const response = await fetch(
        `${getApiBaseUrl()}/admin/users-for-automation?search=${encodeURIComponent(search)}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      if (response.ok) {
        const data = await response.json();
        setUsers(data.data || []);
      }
    } catch (err) {
      console.error('Error searching users:', err);
    }
  };

  const filteredCatalogExams = useMemo(() => {
    const q = examSearch.trim().toLowerCase();
    if (!q) return catalogExams;
    return catalogExams.filter((exam) => {
      const haystack = [exam.name, exam.code, exam.abbreviation].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [catalogExams, examSearch]);

  const selectedCatalogExam = catalogExams.find((e) => e.id === newAppTaxonomyExamId) ?? null;
  const selectedExamCanApply =
    selectedCatalogExam != null &&
    isExamApplicationButtonEnabled(getExamApplicationWindowStatus(selectedCatalogExam));

  const handleStartAutomation = async (app: Application) => {
    setSyncingAppId(app.id);

    try {
      const adminToken = localStorage.getItem('admin_token') || '';
      await fetch(`${getApiBaseUrl()}/admin/automation-applications/${app.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'running' }),
      });

      setSelectedApp(app);
      setShowWorkflow(true);
      fetchApplications();
    } catch (err) {
      console.error('Error starting automation:', err);
      alert('Failed to start automation');
    } finally {
      setSyncingAppId(null);
    }
  };

  const handleCreateApplication = async () => {
    if (!newAppUserId || !newAppTaxonomyExamId) {
      setCreateError('Please select both a user and an exam');
      return;
    }

    if (!selectedExamCanApply) {
      setCreateError('This exam is not open for applications yet.');
      return;
    }

    setIsCreating(true);
    setCreateError(null);
    try {
      const adminToken = localStorage.getItem('admin_token') || '';
      const response = await fetch(`${getApiBaseUrl()}/admin/automation-applications`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: newAppUserId,
          taxonomy_exam_id: newAppTaxonomyExamId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setShowCreateModal(false);
        setNewAppUserId(null);
        setNewAppTaxonomyExamId(null);
        setUserSearch('');
        setExamSearch('');
        fetchApplications();
      } else {
        setCreateError(data.message || 'Failed to create application');
      }
    } catch (err) {
      console.error('Error creating application:', err);
      setCreateError('Failed to create application');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (appId: number) => {
    if (!confirm('Are you sure you want to delete this application? This action cannot be undone.')) {
      return;
    }

    setDeletingAppId(appId);
    try {
      const adminToken = localStorage.getItem('admin_token') || '';
      const response = await fetch(`${getApiBaseUrl()}/admin/automation-applications/${appId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      if (response.ok) {
        fetchApplications();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to delete application');
      }
    } catch (err) {
      console.error('Error deleting application:', err);
      alert('Failed to delete application');
    } finally {
      setDeletingAppId(null);
    }
  };

  const openCreateModal = () => {
    setShowCreateModal(true);
    setCreateError(null);
    setNewAppUserId(null);
    setNewAppTaxonomyExamId(null);
    setUserSearch('');
    setExamSearch('');
    void loadCatalogExams();
    void searchUsers('');
  };

  return (
    <div className="min-h-screen bg-[#F6F8FA] flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 p-4 overflow-auto">
          <div className="mb-3">
            <h1 className="text-xl font-bold text-slate-900 mb-1">Exam Applications</h1>
            <p className="text-sm text-slate-600">View student applications and run automation when needed</p>
          </div>

          {error && (
            <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm rounded-lg">
              {error}
            </div>
          )}

          <div className="mb-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex rounded-lg border border-slate-300 overflow-hidden">
                {ADMIN_FILTERS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setFilter(tab.id)}
                    className={`min-w-[88px] px-4 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                      filter === tab.id
                        ? 'bg-brand-ink text-white'
                        : 'bg-white text-slate-700 hover:bg-[#F6F8FA]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <button
                onClick={fetchApplications}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-300 hover:border-slate-400 transition-colors"
                title="Refresh"
              >
                <FiRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#341050] hover:bg-[#2a0c40] text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              <FiPlus className="h-4 w-4" />
              New Application
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-slate-500">Loading applications...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#F6F8FA] border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">USER</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">EXAM</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">PROGRESS</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">APPLIED</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-slate-700">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {applications.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-4 text-center text-sm text-slate-500">
                          No applications found for this filter.
                        </td>
                      </tr>
                    ) : (
                      applications.map((app) => (
                        <tr key={app.id} className="hover:bg-[#F6F8FA] transition-colors">
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-[#341050]/10 flex items-center justify-center shrink-0">
                                <FiUser className="w-4 h-4 text-[#341050]" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-slate-900 text-sm truncate">
                                  {app.user_name || 'Unknown'}
                                </p>
                                <p className="text-xs text-slate-500 truncate">{app.user_email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <FiFileText className="w-4 h-4 text-slate-400 shrink-0" />
                              <span className="text-slate-900 text-sm">{app.exam_name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getProgressBadgeClass(app.status)}`}
                            >
                              {app.status === 'running' ? (
                                <FiRefreshCw className="w-3 h-3 animate-spin" />
                              ) : app.status === 'completed' ? (
                                <FiCheck className="w-3 h-3" />
                              ) : app.status === 'failed' ? (
                                <FiX className="w-3 h-3" />
                              ) : (
                                <FiClock className="w-3 h-3" />
                              )}
                              {getProgressLabel(app.status)}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-slate-600 text-xs">
                            {new Date(app.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <div className="flex justify-end gap-2">
                              {(app.status === 'approved' || app.status === 'pending') && (
                                <button
                                  onClick={() => handleStartAutomation(app)}
                                  disabled={syncingAppId === app.id}
                                  className="px-3 py-1.5 text-sm bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 rounded-lg flex items-center gap-1 transition"
                                >
                                  {syncingAppId === app.id ? (
                                    <>
                                      <FiRefreshCw className="w-3 h-3 animate-spin" />
                                      Starting...
                                    </>
                                  ) : (
                                    <>
                                      <FiPlay className="w-3 h-3" />
                                      Start Automation
                                    </>
                                  )}
                                </button>
                              )}
                              {app.status === 'running' && (
                                <button
                                  onClick={() => {
                                    setSelectedApp(app);
                                    setShowWorkflow(true);
                                  }}
                                  className="px-3 py-1.5 text-sm bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg flex items-center gap-1 transition"
                                >
                                  <FiRefreshCw className="w-3 h-3 animate-spin" />
                                  View Progress
                                </button>
                              )}
                              {(app.status === 'completed' || app.status === 'failed') && (
                                <button
                                  onClick={() => handleStartAutomation(app)}
                                  className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg flex items-center gap-1 transition"
                                >
                                  <FiRefreshCw className="w-3 h-3" />
                                  Retry
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(app.id)}
                                disabled={deletingAppId === app.id}
                                className="px-3 py-1.5 text-sm bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 rounded-lg flex items-center gap-1 transition"
                                title="Delete application"
                              >
                                {deletingAppId === app.id ? (
                                  <FiRefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <FiTrash2 className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">New Application</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-500 hover:text-slate-800 transition-colors"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {createError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {createError}
                </div>
              ) : null}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Search User</label>
                <input
                  type="text"
                  placeholder="Search by name, email or phone..."
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    searchUsers(e.target.value);
                  }}
                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none text-slate-900"
                />
                {users.length > 0 && (
                  <div className="mt-2 border border-slate-200 rounded-lg max-h-36 overflow-auto">
                    {users.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => setNewAppUserId(user.id)}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-[#F6F8FA] ${
                          newAppUserId === user.id ? 'bg-[#341050]/10' : ''
                        }`}
                      >
                        <p className="font-medium text-slate-900">{user.name || user.email}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Search Exam</label>
                <div className="relative">
                  <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    placeholder="Search by exam name or code..."
                    value={examSearch}
                    onChange={(e) => setExamSearch(e.target.value)}
                    className="w-full px-3 py-1.5 pl-9 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none text-slate-900"
                  />
                </div>
                {examsLoading ? (
                  <p className="mt-2 text-xs text-slate-500">Loading exams...</p>
                ) : (
                  <div className="mt-2 border border-slate-200 rounded-lg max-h-48 overflow-auto">
                    {filteredCatalogExams.length === 0 ? (
                      <p className="px-3 py-4 text-center text-xs text-slate-500">No exams match your search.</p>
                    ) : (
                      filteredCatalogExams.map((exam) => {
                        const windowStatus = getExamApplicationWindowStatus(exam);
                        const canApply = isExamApplicationButtonEnabled(windowStatus);
                        const statusLabel = examApplicationButtonLabel(windowStatus);
                        const isSelected = newAppTaxonomyExamId === exam.id;

                        return (
                          <button
                            key={exam.id}
                            type="button"
                            disabled={!canApply}
                            onClick={() => canApply && setNewAppTaxonomyExamId(exam.id)}
                            className={`w-full px-3 py-2 text-left text-sm border-b border-slate-100 last:border-b-0 ${
                              !canApply
                                ? 'cursor-not-allowed bg-slate-50 opacity-70'
                                : isSelected
                                  ? 'bg-[#341050]/10'
                                  : 'hover:bg-[#F6F8FA]'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-medium text-slate-900">{exam.name}</span>
                              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                {statusLabel}
                              </span>
                            </div>
                            {exam.code ? (
                              <p className="text-xs text-slate-500 mt-0.5">{exam.code}</p>
                            ) : null}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="border-t border-slate-200 px-4 py-3 flex justify-end gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-[#F6F8FA] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateApplication}
                disabled={isCreating || !newAppUserId || !newAppTaxonomyExamId || !selectedExamCanApply}
                className="px-3 py-1.5 text-sm bg-[#341050] hover:bg-[#2a0c40] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedApp && (
        <WorkflowModal
          isOpen={showWorkflow}
          onClose={() => {
            setShowWorkflow(false);
            setSelectedApp(null);
            fetchApplications();
          }}
          examId={String(selectedApp.exam_id)}
          examName={selectedApp.exam_name}
          userId={String(selectedApp.user_id)}
          userName={selectedApp.user_name}
        />
      )}
    </div>
  );
}
