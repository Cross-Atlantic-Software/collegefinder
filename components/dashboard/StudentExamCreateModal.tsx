"use client";

import React, { useState, useEffect } from "react";
import { FiX, FiPlay, FiRefreshCw } from "react-icons/fi";
import { Button, Notification } from "@/components/shared";

interface AutomationExam {
    id: number;
    name: string;
    slug: string;
    url: string;
    is_active: boolean;
}

interface StudentExamCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStartWorkflow: (examId: number, examName: string) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export function StudentExamCreateModal({
    isOpen,
    onClose,
    onStartWorkflow,
}: StudentExamCreateModalProps) {
    const [exams, setExams] = useState<AutomationExam[]>([]);
    const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchExams();
        }
    }, [isOpen]);

    const fetchExams = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_URL}/user/automation-exams`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch available exams');
            }

            const data = await response.json();
            setExams(data.data || []);
        } catch (err) {
            console.error('Error fetching exams:', err);
            setError('Failed to load available exams. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!selectedExamId) {
            setError("Please select an exam");
            return;
        }

        const selectedExam = exams.find(e => e.id === selectedExamId);
        if (!selectedExam) {
            setError("Selected exam not found");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const token = localStorage.getItem('auth_token');

            // Create application (auto-approved)
            const response = await fetch(`${API_URL}/user/automation-applications`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    exam_id: selectedExamId
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to create application');
            }

            // Close modal and immediately start workflow
            onClose();
            onStartWorkflow(selectedExamId, selectedExam.name);

        } catch (err: any) {
            console.error('Error creating application:', err);
            setError(err.message || 'Failed to create application. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="relative w-full max-w-md rounded-lg bg-white/10 p-6 shadow-xl backdrop-blur-md border border-white/20">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 text-slate-300 hover:text-white transition"
                >
                    <FiX className="h-6 w-6" />
                </button>

                <div className="space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">Apply for Exam</h2>
                        <p className="text-sm text-slate-300">
                            Select an exam to start the automated registration process
                        </p>
                    </div>

                    {error && (
                        <Notification
                            type="error"
                            message={error}
                            onClose={() => setError(null)}
                        />
                    )}

                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-slate-200">
                            Available Exams
                        </label>

                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <FiRefreshCw className="h-6 w-6 animate-spin text-slate-400" />
                                <span className="ml-2 text-slate-400">Loading exams...</span>
                            </div>
                        ) : exams.length === 0 ? (
                            <div className="py-8 text-center text-slate-400">
                                No exams available for automation at this time.
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {exams.map((exam) => (
                                    <button
                                        key={exam.id}
                                        onClick={() => setSelectedExamId(exam.id)}
                                        className={`w-full p-4 rounded-lg text-left transition ${selectedExamId === exam.id
                                            ? 'bg-pink/20 border-2 border-pink'
                                            : 'bg-white/5 border border-white/10 hover:bg-white/10'
                                            }`}
                                    >
                                        <p className="font-medium text-white">{exam.name}</p>
                                        <p className="text-xs text-slate-400 mt-1 truncate">
                                            {exam.url}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-white/10">
                        <Button
                            type="button"
                            variant="themeButtonOutline"
                            size="md"
                            className="flex-1"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="DarkGradient"
                            size="md"
                            className="flex-1 flex items-center justify-center gap-2"
                            onClick={handleSubmit}
                            disabled={isSubmitting || !selectedExamId || isLoading}
                        >
                            {isSubmitting ? (
                                <>
                                    <FiRefreshCw className="h-4 w-4 animate-spin" />
                                    Starting...
                                </>
                            ) : (
                                <>
                                    <FiPlay className="h-4 w-4" />
                                    Start Automation
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default StudentExamCreateModal;
