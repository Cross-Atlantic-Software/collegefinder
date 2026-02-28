'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiRefreshCw, FiCheck, FiAlertCircle, FiLock, FiMaximize2, FiMinimize2, FiChevronRight } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import {
    connectToWorkflow,
    submitOTP,
    submitCaptcha,
    submitCustomInput,
    stopWorkflow,
    type WorkflowHandlers
} from '@/lib/websocket';

interface LogEntry {
    message: string;
    level: 'info' | 'success' | 'warning' | 'error';
    timestamp: string;
}

interface StudentWorkflowModalProps {
    isOpen: boolean;
    onClose: () => void;
    examId: number;
    examName: string;
}

export function StudentWorkflowModal({
    isOpen,
    onClose,
    examId,
    examName,
}: StudentWorkflowModalProps) {
    const { user } = useAuth();
    const [status, setStatus] = useState<'idle' | 'connecting' | 'running' | 'waiting' | 'success' | 'failed' | 'stopped'>('idle');
    const [progress, setProgress] = useState(0);
    const [currentStep, setCurrentStep] = useState('');
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [screenshot, setScreenshot] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Input modals
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [showCaptchaModal, setShowCaptchaModal] = useState(false);
    const [showCustomModal, setShowCustomModal] = useState(false);
    const [captchaImage, setCaptchaImage] = useState('');
    const [customField, setCustomField] = useState({ id: '', label: '', type: 'text' });
    const [inputValue, setInputValue] = useState('');

    const wsRef = useRef<WebSocket | null>(null);
    const logsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    useEffect(() => {
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (isOpen && status === 'idle' && user) {
            startWorkflow();
        }
    }, [isOpen, user]);

    if (!isOpen) return null;

    const addLog = (message: string, level: LogEntry['level']) => {
        setLogs(prev => [...prev, {
            message,
            level,
            timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
        }]);
    };

    const startWorkflow = (startFromStep?: number) => {
        if (!user) {
            addLog('Error: User not authenticated', 'error');
            return;
        }

        setStatus('connecting');
        if (!startFromStep) {
            setLogs([]);
            setScreenshot(null);
        }
        setProgress(0);
        addLog(startFromStep ? `Resuming from step ${startFromStep} (reloading current page)...` : 'Connecting to automation server...', 'info');

        const options: { startFromStep?: number; sessionId?: string } = {};
        if (startFromStep) {
            options.startFromStep = startFromStep;
            if (sessionId) options.sessionId = sessionId;
        }

        const handlers: Partial<WorkflowHandlers> = {
            onSessionCreated: (id) => {
                setSessionId(id);
                setStatus('running');
                addLog(`Session started`, 'success');
            },
            onLog: (message, level) => addLog(message, level),
            onScreenshot: (imageBase64) => setScreenshot(imageBase64),
            onStatus: (step, prog, message) => {
                setCurrentStep(step);
                setProgress(prog);
                if (message) addLog(message, 'info');
            },
            onRequestOTP: () => {
                setStatus('waiting');
                setShowOtpModal(true);
                addLog('Waiting for OTP input...', 'warning');
            },
            onRequestCaptcha: (imageBase64) => {
                setStatus('waiting');
                setCaptchaImage(imageBase64);
                setShowCaptchaModal(true);
                addLog('Waiting for captcha solution...', 'warning');
            },
            onRequestCustomInput: (fieldId, label, type) => {
                setStatus('waiting');
                setCustomField({ id: fieldId, label, type });
                setShowCustomModal(true);
                addLog(`Waiting for input: ${label}`, 'warning');
            },
            onResult: (success, message) => {
                setStatus(success ? 'success' : 'failed');
                addLog(message, success ? 'success' : 'error');
            },
            onError: (message) => addLog(`Error: ${message}`, 'error'),
            onClose: () => {
                if (status === 'running') {
                    setStatus('failed');
                    addLog('Connection lost', 'error');
                }
            },
        };

        wsRef.current = connectToWorkflow(
            String(examId),
            String(user.id),
            handlers,
            Object.keys(options).length ? options : undefined
        );
    };

    const handleSubmitOtp = () => {
        if (!inputValue.trim() || !wsRef.current) return;
        submitOTP(wsRef.current, inputValue);
        setShowOtpModal(false);
        setInputValue('');
        setStatus('running');
        addLog('OTP submitted', 'success');
    };

    const handleSubmitCaptcha = () => {
        if (!inputValue.trim() || !wsRef.current) return;
        submitCaptcha(wsRef.current, inputValue);
        setShowCaptchaModal(false);
        setInputValue('');
        setStatus('running');
        addLog('Captcha submitted', 'success');
    };

    const handleSubmitCustom = () => {
        if (!inputValue.trim() || !wsRef.current) return;
        submitCustomInput(wsRef.current, customField.id, inputValue);
        setShowCustomModal(false);
        setInputValue('');
        setStatus('running');
        addLog(`${customField.label} submitted`, 'success');
    };

    const statusConfig: Record<string, { color: string; bgColor: string; icon: React.ReactNode; text: string; pulse?: boolean }> = {
        idle: { color: 'text-gray-400', bgColor: 'bg-gray-500/10', icon: null, text: 'Ready' },
        connecting: { color: 'text-blue-400', bgColor: 'bg-blue-500/10', icon: <FiRefreshCw className="w-4 h-4 animate-spin" />, text: 'Connecting...', pulse: true },
        running: { color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', icon: <FiRefreshCw className="w-4 h-4 animate-spin" />, text: 'Running', pulse: true },
        waiting: { color: 'text-amber-400', bgColor: 'bg-amber-500/10', icon: <FiAlertCircle className="w-4 h-4" />, text: 'Waiting for Input' },
        success: { color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', icon: <FiCheck className="w-4 h-4" />, text: 'Completed' },
        failed: { color: 'text-red-400', bgColor: 'bg-red-500/10', icon: <FiX className="w-4 h-4" />, text: 'Failed' },
        stopped: { color: 'text-orange-400', bgColor: 'bg-orange-500/10', icon: <FiX className="w-4 h-4" />, text: 'Stopped' },
    };

    const currentStatus = statusConfig[status] || statusConfig.idle;
    const isFinished = status === 'success' || status === 'failed' || status === 'stopped';

    const progressBarColor = status === 'failed' ? 'bg-red-500' : status === 'success' ? 'bg-emerald-500' : 'bg-blue-500';

    const getLogIcon = (level: string) => {
        switch (level) {
            case 'success': return '✅';
            case 'warning': return '⚠️';
            case 'error': return '❌';
            default: return '📋';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-2 sm:p-4">
            <div className={`relative flex flex-col bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950 rounded-2xl shadow-2xl border border-gray-800/50 transition-all duration-300 ${
                isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-7xl h-[92vh]'
            }`}>

                {/* ─── Header ─── */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-800/60">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                <span className="text-white text-sm font-bold">E</span>
                            </div>
                            <div>
                                <h2 className="text-base font-semibold text-white leading-tight">Exam Registration</h2>
                                <p className="text-xs text-gray-500">{examName} &bull; {user?.name || user?.email || 'Student'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Status badge */}
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${currentStatus.bgColor} ${currentStatus.color} ${currentStatus.pulse ? 'animate-pulse' : ''}`}>
                            {currentStatus.icon}
                            <span>{currentStatus.text}</span>
                        </div>

                        <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-1.5 text-gray-500 hover:text-white transition rounded-lg hover:bg-gray-800" title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
                            {isFullscreen ? <FiMinimize2 className="w-4 h-4" /> : <FiMaximize2 className="w-4 h-4" />}
                        </button>
                        <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-white transition rounded-lg hover:bg-gray-800">
                            <FiX className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* ─── Progress bar (full-width thin bar below header) ─── */}
                {status !== 'idle' && (
                    <div className="w-full h-1 bg-gray-800/50">
                        <div className={`h-full ${progressBarColor} transition-all duration-500 ease-out`} style={{ width: `${progress}%` }} />
                    </div>
                )}

                {/* ─── Content area ─── */}
                <div className="flex-1 flex overflow-hidden">

                    {/* ─── Live Preview ─── */}
                    <div className="flex-1 flex flex-col p-4 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Live Preview</h3>
                            {currentStep && (
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <FiChevronRight className="w-3 h-3" />
                                    <span className="truncate max-w-[200px]">{currentStep}</span>
                                    <span className="text-gray-600 ml-1">{progress}%</span>
                                </div>
                            )}
                        </div>
                        <div className="flex-1 bg-gray-950/60 rounded-xl border border-gray-800/40 overflow-hidden flex items-center justify-center relative">
                            {screenshot ? (
                                <img
                                    src={`data:image/png;base64,${screenshot}`}
                                    alt="Browser screenshot"
                                    className="w-full h-full object-contain"
                                />
                            ) : (
                                <div className="flex flex-col items-center gap-3 text-gray-600">
                                    <div className="w-16 h-16 rounded-2xl bg-gray-800/50 flex items-center justify-center">
                                        <FiRefreshCw className={`w-7 h-7 ${status === 'idle' || status === 'connecting' ? 'animate-spin' : ''}`} />
                                    </div>
                                    <p className="text-sm">{status === 'idle' ? 'Starting automation...' : 'Waiting for screenshot...'}</p>
                                </div>
                            )}

                            {/* Overlay gradient at bottom for visual depth */}
                            {screenshot && (
                                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-950/40 to-transparent pointer-events-none" />
                            )}
                        </div>
                    </div>

                    {/* ─── Activity Log (commented out for now) ─── */}
                    {/* <div className="w-[340px] border-l border-gray-800/40 flex flex-col bg-gray-950/30">
                        <div className="px-4 pt-4 pb-2">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Activity Log</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto px-3 pb-3 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                            {logs.length === 0 ? (
                                <div className="flex items-center justify-center h-full">
                                    <p className="text-gray-600 text-sm">Waiting for activity...</p>
                                </div>
                            ) : (
                                <div className="space-y-0.5">
                                    {logs.map((log, i) => {
                                        const isStep = log.message.startsWith('📋 Step');
                                        return (
                                            <div key={i} className={`font-mono text-[11px] leading-relaxed px-2 py-1 rounded ${
                                                isStep ? 'bg-gray-800/50 mt-2 border-l-2 border-blue-500/50' : ''
                                            } ${
                                                log.level === 'error' ? 'text-red-400' :
                                                log.level === 'warning' ? 'text-amber-400' :
                                                log.level === 'success' ? 'text-emerald-400' :
                                                'text-gray-400'
                                            }`}>
                                                <span className="text-gray-600 mr-1">[{log.timestamp}]</span>
                                                {!isStep && <span className="mr-1">{getLogIcon(log.level)}</span>}
                                                {log.message}
                                            </div>
                                        );
                                    })}
                                    <div ref={logsEndRef} />
                                </div>
                            )}
                        </div>
                    </div> */}
                </div>

                {/* ─── Footer ─── */}
                <div className="px-5 py-3 border-t border-gray-800/60 flex items-center justify-between">
                    <div>
                        {(status === 'running' || status === 'waiting') && (
                            <button
                                onClick={() => {
                                    if (wsRef.current) {
                                        stopWorkflow(wsRef.current);
                                        setStatus('stopped');
                                        addLog('Stopping workflow...', 'warning');
                                    }
                                }}
                                className="group px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg flex items-center gap-2 transition-all text-sm font-medium border border-red-500/20"
                            >
                                <FiX className="w-4 h-4" />
                                Stop Workflow
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-400 hover:text-white text-sm transition rounded-lg hover:bg-gray-800"
                        >
                            {isFinished ? 'Close' : 'Cancel'}
                        </button>

                        {isFinished && (
                            <>
                                <button
                                    onClick={() => {
                                        setStatus('idle');
                                        setProgress(0);
                                        startWorkflow(7);
                                    }}
                                    className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 rounded-lg flex items-center gap-2 transition-all text-sm font-medium border border-amber-500/20"
                                    title="Resume from the form-filling step without reloading the page"
                                >
                                    <FiRefreshCw className="w-4 h-4" />
                                    Retry from Step 7
                                </button>
                                <button
                                    onClick={() => {
                                        setStatus('idle');
                                        setLogs([]);
                                        setProgress(0);
                                        setScreenshot(null);
                                        startWorkflow();
                                    }}
                                    className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 rounded-lg flex items-center gap-2 transition-all text-sm font-medium border border-blue-500/20"
                                >
                                    <FiRefreshCw className="w-4 h-4" />
                                    Restart
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* ─── OTP Modal ─── */}
                {showOtpModal && (
                    <InputOverlay
                        title="Enter OTP"
                        description="Enter the OTP sent to your registered mobile/email"
                        value={inputValue}
                        onChange={setInputValue}
                        onSubmit={handleSubmitOtp}
                        onCancel={() => setShowOtpModal(false)}
                        placeholder="Enter 6-digit OTP"
                        maxLength={6}
                        accentColor="blue"
                    />
                )}

                {/* ─── Captcha Modal ─── */}
                {showCaptchaModal && (
                    <InputOverlay
                        title="Solve Captcha"
                        description="Enter the text shown in the captcha image"
                        value={inputValue}
                        onChange={setInputValue}
                        onSubmit={handleSubmitCaptcha}
                        onCancel={() => setShowCaptchaModal(false)}
                        placeholder="Enter captcha text"
                        captchaImage={captchaImage}
                        accentColor="purple"
                    />
                )}

                {/* ─── Custom Input Modal ─── */}
                {showCustomModal && (
                    <InputOverlay
                        title={customField.label}
                        description="Please provide the following information"
                        value={inputValue}
                        onChange={setInputValue}
                        onSubmit={handleSubmitCustom}
                        onCancel={() => setShowCustomModal(false)}
                        placeholder={`Enter ${customField.label.toLowerCase()}`}
                        inputType={customField.type}
                        accentColor="blue"
                    />
                )}
            </div>
        </div>
    );
}

function InputOverlay({
    title,
    description,
    value,
    onChange,
    onSubmit,
    onCancel,
    placeholder,
    maxLength,
    captchaImage,
    inputType = 'text',
    accentColor = 'blue',
}: {
    title: string;
    description: string;
    value: string;
    onChange: (v: string) => void;
    onSubmit: () => void;
    onCancel: () => void;
    placeholder: string;
    maxLength?: number;
    captchaImage?: string;
    inputType?: string;
    accentColor?: 'blue' | 'purple';
}) {
    const gradientFrom = accentColor === 'purple' ? 'from-purple-500' : 'from-blue-500';
    const gradientTo = accentColor === 'purple' ? 'to-pink-600' : 'to-indigo-600';
    const ringColor = accentColor === 'purple' ? 'focus:ring-purple-500' : 'focus:ring-blue-500';
    const btnBg = accentColor === 'purple' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700';

    return (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl">
            <div className="bg-gray-900 border border-gray-700/50 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                <div className="flex items-center gap-3 mb-1">
                    <div className={`p-2.5 bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-xl`}>
                        <FiLock className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">{title}</h3>
                </div>
                <p className="text-gray-500 text-sm mb-5 ml-[52px]">{description}</p>

                {captchaImage && (
                    <div className="bg-gray-800 rounded-xl p-2 mb-4">
                        <img
                            src={`data:image/png;base64,${captchaImage}`}
                            alt="Captcha"
                            className="w-full rounded-lg"
                        />
                    </div>
                )}

                <input
                    type={inputType}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    maxLength={maxLength}
                    className={`w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 ${ringColor} focus:border-transparent mb-5 transition`}
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
                />

                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2.5 text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600 rounded-xl transition text-sm font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onSubmit}
                        disabled={!value.trim()}
                        className={`flex-1 px-4 py-2.5 ${btnBg} disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition text-sm font-medium`}
                    >
                        Submit
                    </button>
                </div>
            </div>
        </div>
    );
}

export default StudentWorkflowModal;
