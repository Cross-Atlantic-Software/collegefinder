'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FiPlay, FiCheck, FiClock, FiX, FiRefreshCw, FiUser, FiFileText, FiPlus } from 'react-icons/fi';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import { WorkflowModal } from '@/components/admin/WorkflowModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

// Application type
interface Application {
    id: number;
    user_id: number;
    user_name: string;
    user_email: string;
    user_phone: string;
    exam_name: string;
    exam_id: number;
    exam_slug: string;
    status: 'pending' | 'approved' | 'running' | 'completed' | 'failed';
    created_at: string;
    session_id?: string;
}

interface AutomationExam {
    id: number;
    name: string;
    slug: string;
    url: string;
    is_active: boolean;
}

interface UserOption {
    id: number;
    name: string;
    email: string;
    phone_number: string;
}

export default function ApplicationsPage() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'running' | 'completed' | 'failed'>('all');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Workflow modal state
    const [showWorkflow, setShowWorkflow] = useState(false);
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [syncingAppId, setSyncingAppId] = useState<number | null>(null);

    // Create modal state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [automationExams, setAutomationExams] = useState<AutomationExam[]>([]);
    const [users, setUsers] = useState<UserOption[]>([]);
    const [newAppUserId, setNewAppUserId] = useState<number | null>(null);
    const [newAppExamId, setNewAppExamId] = useState<number | null>(null);
    const [userSearch, setUserSearch] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Fetch applications from API
    const fetchApplications = useCallback(async () => {
        try {
            setIsLoading(true);
            const adminToken = localStorage.getItem('admin_token') || '';

            const statusParam = filter !== 'all' ? `?status=${filter}` : '';
            const response = await fetch(`${API_URL}/admin/automation-applications${statusParam}`, {
                headers: {
                    'Authorization': `Bearer ${adminToken}`,
                    'Content-Type': 'application/json'
                }
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

    // Fetch automation exams for create modal
    const fetchAutomationExams = async () => {
        try {
            const adminToken = localStorage.getItem('admin_token') || '';
            const response = await fetch(`${API_URL}/admin/automation-exams`, {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            if (response.ok) {
                const data = await response.json();
                setAutomationExams(data.data || []);
            }
        } catch (err) {
            console.error('Error fetching automation exams:', err);
        }
    };

    // Search users for create modal
    const searchUsers = async (search: string) => {
        try {
            const adminToken = localStorage.getItem('admin_token') || '';
            const response = await fetch(`${API_URL}/admin/users-for-automation?search=${encodeURIComponent(search)}`, {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            if (response.ok) {
                const data = await response.json();
                setUsers(data.data || []);
            }
        } catch (err) {
            console.error('Error searching users:', err);
        }
    };

    // Approve application
    const handleApprove = async (appId: number) => {
        try {
            const adminToken = localStorage.getItem('admin_token') || '';
            const response = await fetch(`${API_URL}/admin/automation-applications/${appId}/approve`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });

            if (response.ok) {
                fetchApplications();
            }
        } catch (err) {
            console.error('Error approving application:', err);
        }
    };

    // Start automation for an application
    const handleStartAutomation = async (app: Application) => {
        setSyncingAppId(app.id);

        try {
            // Update application status to running
            const adminToken = localStorage.getItem('admin_token') || '';
            await fetch(`${API_URL}/admin/automation-applications/${app.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${adminToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'running' })
            });

            // Open workflow modal
            setSelectedApp(app);
            setShowWorkflow(true);

            // Refresh applications
            fetchApplications();
        } catch (error) {
            console.error('Error starting automation:', error);
            alert('Failed to start automation');
        } finally {
            setSyncingAppId(null);
        }
    };

    // Create new application
    const handleCreateApplication = async () => {
        if (!newAppUserId || !newAppExamId) {
            alert('Please select both a user and an exam');
            return;
        }

        setIsCreating(true);
        try {
            const adminToken = localStorage.getItem('admin_token') || '';
            const response = await fetch(`${API_URL}/admin/automation-applications`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${adminToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: newAppUserId,
                    exam_id: newAppExamId
                })
            });

            if (response.ok) {
                setShowCreateModal(false);
                setNewAppUserId(null);
                setNewAppExamId(null);
                fetchApplications();
            } else {
                const data = await response.json();
                alert(data.message || 'Failed to create application');
            }
        } catch (err) {
            console.error('Error creating application:', err);
            alert('Failed to create application');
        } finally {
            setIsCreating(false);
        }
    };

    // Get status badge
    const getStatusBadge = (status: Application['status']) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-blue-100 text-blue-800',
            running: 'bg-purple-100 text-purple-800',
            completed: 'bg-green-100 text-green-800',
            failed: 'bg-red-100 text-red-800',
        };

        const icons = {
            pending: <FiClock className="w-3 h-3" />,
            approved: <FiCheck className="w-3 h-3" />,
            running: <FiRefreshCw className="w-3 h-3 animate-spin" />,
            completed: <FiCheck className="w-3 h-3" />,
            failed: <FiX className="w-3 h-3" />,
        };

        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
                {icons[status]}
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <AdminSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <AdminHeader />
                <main className="flex-1 p-6 overflow-auto">
                    {/* Header */}
                    <div className="mb-6 flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Exam Applications</h1>
                            <p className="text-gray-600">Manage and automate exam registrations</p>
                        </div>
                        <button
                            onClick={() => {
                                setShowCreateModal(true);
                                fetchAutomationExams();
                                searchUsers('');
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                        >
                            <FiPlus className="w-4 h-4" />
                            New Application
                        </button>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex gap-2 mb-6">
                        {(['all', 'pending', 'approved', 'running', 'completed', 'failed'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setFilter(tab)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === tab
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                        <button
                            onClick={fetchApplications}
                            className="ml-auto px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            title="Refresh"
                        >
                            <FiRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
                            {error}
                        </div>
                    )}

                    {/* Applications Table */}
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        {isLoading ? (
                            <div className="p-12 text-center text-gray-500">
                                <FiRefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                                Loading applications...
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exam</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applied</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {applications.map((app) => (
                                        <tr key={app.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <FiUser className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{app.user_name || 'Unknown'}</p>
                                                        <p className="text-sm text-gray-500">{app.user_email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <FiFileText className="w-4 h-4 text-gray-400" />
                                                    <span className="text-gray-900">{app.exam_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(app.status)}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 text-sm">
                                                {new Date(app.created_at).toLocaleDateString('en-IN', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {app.status === 'pending' && (
                                                        <button
                                                            onClick={() => handleApprove(app.id)}
                                                            className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition"
                                                        >
                                                            Approve
                                                        </button>
                                                    )}
                                                    {app.status === 'approved' && (
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
                                                            className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg flex items-center gap-1 transition"
                                                        >
                                                            <FiRefreshCw className="w-3 h-3" />
                                                            Retry
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {!isLoading && applications.length === 0 && (
                            <div className="p-12 text-center text-gray-500">
                                No applications found for this filter.
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Create Application Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">New Application</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Search User
                                </label>
                                <input
                                    type="text"
                                    placeholder="Search by name, email or phone..."
                                    value={userSearch}
                                    onChange={(e) => {
                                        setUserSearch(e.target.value);
                                        searchUsers(e.target.value);
                                    }}
                                    className="w-full px-3 py-2 border rounded-lg text-gray-900"
                                />
                                {users.length > 0 && (
                                    <div className="mt-2 border rounded-lg max-h-40 overflow-auto">
                                        {users.map(user => (
                                            <button
                                                key={user.id}
                                                onClick={() => setNewAppUserId(user.id)}
                                                className={`w-full px-3 py-2 text-left hover:bg-gray-50 ${newAppUserId === user.id ? 'bg-blue-50' : ''}`}
                                            >
                                                <p className="font-medium">{user.name || user.email}</p>
                                                <p className="text-sm text-gray-500">{user.email}</p>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Select Exam
                                </label>
                                <select
                                    value={newAppExamId || ''}
                                    onChange={(e) => setNewAppExamId(Number(e.target.value))}
                                    className="w-full px-3 py-2 border rounded-lg text-gray-900"
                                >
                                    <option value="">Select an exam...</option>
                                    {automationExams.map(exam => (
                                        <option key={exam.id} value={exam.id}>{exam.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateApplication}
                                disabled={isCreating || !newAppUserId || !newAppExamId}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {isCreating ? 'Creating...' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Workflow Modal */}
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
