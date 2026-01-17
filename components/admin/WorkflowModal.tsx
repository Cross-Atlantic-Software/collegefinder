'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiPlay, FiPause, FiRefreshCw, FiCheck, FiAlertCircle, FiLock } from 'react-icons/fi';
import {
    connectToWorkflow,
    submitOTP,
    submitCaptcha,
    submitCustomInput,
    type WorkflowHandlers
} from '@/lib/websocket';

interface LogEntry {
    message: string;
    level: 'info' | 'success' | 'warning' | 'error';
    timestamp: string;
}

interface WorkflowModalProps {
    isOpen: boolean;
    onClose: () => void;
    examId: string;
    examName: string;
    userId: string;
    userName: string;
}

export function WorkflowModal({
    isOpen,
    onClose,
    examId,
    examName,
    userId,
    userName,
}: WorkflowModalProps) {
    const [status, setStatus] = useState<'idle' | 'connecting' | 'running' | 'waiting' | 'success' | 'failed'>('idle');
    const [progress, setProgress] = useState(0);
    const [currentStep, setCurrentStep] = useState('');
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [screenshot, setScreenshot] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);

    // Input modals
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [showCaptchaModal, setShowCaptchaModal] = useState(false);
    const [showCustomModal, setShowCustomModal] = useState(false);
    const [captchaImage, setCaptchaImage] = useState('');
    const [customField, setCustomField] = useState({ id: '', label: '', type: 'text' });
    const [inputValue, setInputValue] = useState('');

    const wsRef = useRef<WebSocket | null>(null);
    const logsEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll logs
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    if (!isOpen) return null;

    const addLog = (message: string, level: LogEntry['level']) => {
        setLogs(prev => [...prev, {
            message,
            level,
            timestamp: new Date().toLocaleTimeString(),
        }]);
    };

    const startWorkflow = () => {
        setStatus('connecting');
        setLogs([]);
        setProgress(0);
        addLog('Connecting to automation server...', 'info');

        const handlers: Partial<WorkflowHandlers> = {
            onSessionCreated: (id) => {
                setSessionId(id);
                setStatus('running');
                addLog(`Session created: ${id}`, 'success');
            },
            onLog: (message, level) => {
                addLog(message, level);
            },
            onScreenshot: (imageBase64) => {
                setScreenshot(imageBase64);
            },
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
            onError: (message) => {
                addLog(`Error: ${message}`, 'error');
            },
            onClose: () => {
                if (status === 'running') {
                    setStatus('failed');
                    addLog('Connection lost', 'error');
                }
            },
        };

        wsRef.current = connectToWorkflow(examId, userId, handlers);
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

    const getStatusColor = () => {
        switch (status) {
            case 'running': return 'text-blue-500';
            case 'waiting': return 'text-amber-500';
            case 'success': return 'text-green-500';
            case 'failed': return 'text-red-500';
            default: return 'text-gray-400';
        }
    };

    const getStatusIcon = () => {
        switch (status) {
            case 'running': return <FiRefreshCw className="w-5 h-5 animate-spin" />;
            case 'waiting': return <FiAlertCircle className="w-5 h-5" />;
            case 'success': return <FiCheck className="w-5 h-5" />;
            case 'failed': return <FiX className="w-5 h-5" />;
            default: return null;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-6xl h-[90vh] bg-gray-900 rounded-xl shadow-xl flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <div>
                        <h2 className="text-xl font-bold text-white">Automation Workflow</h2>
                        <p className="text-sm text-gray-400">
                            {examName} • {userName}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-2 ${getStatusColor()}`}>
                            {getStatusIcon()}
                            <span className="capitalize font-medium">{status}</span>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-white transition"
                        >
                            <FiX className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Screenshot Panel */}
                    <div className="flex-1 p-4 flex flex-col">
                        <h3 className="text-sm font-medium text-gray-400 mb-2">Live Preview</h3>
                        <div className="flex-1 bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
                            {screenshot ? (
                                <img
                                    src={`data:image/png;base64,${screenshot}`}
                                    alt="Browser screenshot"
                                    className="w-full h-full object-contain"
                                />
                            ) : (
                                <p className="text-gray-500">
                                    {status === 'idle' ? 'Click "Start" to begin automation' : 'Waiting for screenshot...'}
                                </p>
                            )}
                        </div>

                        {/* Progress Bar */}
                        {status !== 'idle' && (
                            <div className="mt-4">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-400">{currentStep || 'Initializing...'}</span>
                                    <span className="text-gray-400">{progress}%</span>
                                </div>
                                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 transition-all duration-300"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Logs Panel */}
                    <div className="w-80 border-l border-gray-700 p-4 flex flex-col">
                        <h3 className="text-sm font-medium text-gray-400 mb-2">Activity Log</h3>
                        <div className="flex-1 overflow-y-auto bg-gray-800 rounded-lg p-3 font-mono text-xs">
                            {logs.length === 0 ? (
                                <p className="text-gray-500">No activity yet</p>
                            ) : (
                                logs.map((log, i) => (
                                    <div
                                        key={i}
                                        className={`mb-1 ${log.level === 'error' ? 'text-red-400' :
                                                log.level === 'warning' ? 'text-amber-400' :
                                                    log.level === 'success' ? 'text-green-400' : 'text-gray-300'
                                            }`}
                                    >
                                        <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
                                    </div>
                                ))
                            )}
                            <div ref={logsEndRef} />
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-gray-700 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-300 hover:text-white transition"
                    >
                        Close
                    </button>
                    {status === 'idle' && (
                        <button
                            onClick={startWorkflow}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition"
                        >
                            <FiPlay className="w-4 h-4" />
                            Start Automation
                        </button>
                    )}
                    {(status === 'success' || status === 'failed') && (
                        <button
                            onClick={() => {
                                setStatus('idle');
                                setLogs([]);
                                setProgress(0);
                                setScreenshot(null);
                            }}
                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center gap-2 transition"
                        >
                            <FiRefreshCw className="w-4 h-4" />
                            Reset
                        </button>
                    )}
                </div>

                {/* OTP Modal */}
                {showOtpModal && (
                    <InputModal
                        title="Enter OTP"
                        description="Please enter the OTP sent to your phone"
                        value={inputValue}
                        onChange={setInputValue}
                        onSubmit={handleSubmitOtp}
                        onCancel={() => setShowOtpModal(false)}
                        placeholder="Enter 6-digit OTP"
                        maxLength={6}
                    />
                )}

                {/* Captcha Modal */}
                {showCaptchaModal && (
                    <InputModal
                        title="Solve Captcha"
                        description="Enter the text shown in the captcha image"
                        value={inputValue}
                        onChange={setInputValue}
                        onSubmit={handleSubmitCaptcha}
                        onCancel={() => setShowCaptchaModal(false)}
                        placeholder="Enter captcha text"
                        captchaImage={captchaImage}
                    />
                )}

                {/* Custom Input Modal */}
                {showCustomModal && (
                    <InputModal
                        title={customField.label}
                        description="Please provide the following information"
                        value={inputValue}
                        onChange={setInputValue}
                        onSubmit={handleSubmitCustom}
                        onCancel={() => setShowCustomModal(false)}
                        placeholder={`Enter ${customField.label.toLowerCase()}`}
                        inputType={customField.type}
                    />
                )}
            </div>
        </div>
    );
}

// Input Modal Component
function InputModal({
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
}) {
    return (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
            <div className="bg-gray-800 rounded-xl p-6 w-full max-w-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                        <FiLock className="w-5 h-5 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">{title}</h3>
                </div>
                <p className="text-gray-400 text-sm mb-4">{description}</p>

                {captchaImage && (
                    <img
                        src={`data:image/png;base64,${captchaImage}`}
                        alt="Captcha"
                        className="w-full rounded-lg mb-4"
                    />
                )}

                <input
                    type={inputType}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    maxLength={maxLength}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
                />

                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2 text-gray-300 hover:text-white border border-gray-600 rounded-lg transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onSubmit}
                        disabled={!value.trim()}
                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition"
                    >
                        Submit
                    </button>
                </div>
            </div>
        </div>
    );
}

export default WorkflowModal;
