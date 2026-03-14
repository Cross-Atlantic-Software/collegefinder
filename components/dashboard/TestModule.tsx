'use client'
import { useState, useEffect } from "react";
import { Button } from "@/components/shared";
import { getAllExams } from "@/api";
import type { Exam } from "@/api/exams";
import { getExamFormats, getTestRules, getUserAnalyticsSummary, ExamFormat, FormatRules } from "@/api/tests";
import TestInterface from "./TestInterface";
import AnalyticsTab from "@/components/test/AnalyticsTab";

type ViewState = 'exam-selection' | 'format-selection' | 'test-active';

function getFormatTotalQuestions(format: ExamFormat): number {
  return Object.values(format.sections || {}).reduce(
    (sum, section) =>
      sum +
      Object.values(section.subsections || {}).reduce((s, sub) => s + (sub?.questions ?? 0), 0),
    0
  );
}

/** Fallback format when API returns no format or empty sections (avoids client crash). */
function buildFallbackFormat(exam: Exam): ExamFormat {
  return {
    format_id: 'default',
    name: `${exam.name} Practice Test`,
    duration_minutes: 60,
    total_marks: 0,
    sections: {
      Practice: {
        name: 'Practice',
        marks: 0,
        subsections: {
          'Section A': { type: 'MCQ', questions: 1, marks_per_question: 1 },
        },
      },
    },
    marking_scheme: { correct: 1, incorrect: -0.25, unattempted: 0 },
    rules: [
      'Practice mode - answer questions at your own pace',
      'Questions are AI-generated based on exam syllabus',
      'You can exit anytime - progress is saved',
    ],
  };
}

export default function TestModule() {
  const [activeTab, setActiveTab] = useState("practice");
  const [viewState, setViewState] = useState<ViewState>('exam-selection');
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [historyAnalyticsExam, setHistoryAnalyticsExam] = useState<Exam | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<ExamFormat | null>(null);
  const [availableFormats, setAvailableFormats] = useState<{ [key: string]: ExamFormat }>({});
  const [formatRules, setFormatRules] = useState<FormatRules | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [formatLoading, setFormatLoading] = useState(false);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [examAttemptStats, setExamAttemptStats] = useState<Map<number, { lastAttemptedAt: string | null; totalMocks: number }>>(new Map());
  const [historyStatsLoading, setHistoryStatsLoading] = useState(false);

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    if (activeTab === "history-analytics" && !historyAnalyticsExam && exams.length > 0) {
      const fetchHistoryStats = async () => {
        setHistoryStatsLoading(true);
        try {
          const res = await getUserAnalyticsSummary();
          if (res.success && res.data?.attempts) {
            const attempts = res.data.attempts;
            const byExam = new Map<number, { lastAttemptedAt: string | null; totalMocks: number }>();
            for (const a of attempts) {
              const examId = a.exam_id ?? (exams.find((e) => e.name === a.exam_name)?.id);
              if (examId == null) continue;
              const existing = byExam.get(examId);
              const completedAt = a.completed_at ? new Date(a.completed_at).getTime() : 0;
              const prevLast = existing?.lastAttemptedAt ? new Date(existing.lastAttemptedAt).getTime() : 0;
              byExam.set(examId, {
                lastAttemptedAt: completedAt > prevLast ? a.completed_at! : (existing?.lastAttemptedAt ?? a.completed_at ?? null),
                totalMocks: (existing?.totalMocks ?? 0) + 1,
              });
            }
            setExamAttemptStats(byExam);
          }
        } catch {
          setExamAttemptStats(new Map());
        } finally {
          setHistoryStatsLoading(false);
        }
      };
      fetchHistoryStats();
    }
  }, [activeTab, historyAnalyticsExam, exams]);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const response = await getAllExams();
      if (response.success && response.data) {
        setExams(response.data.exams);
      } else {
        setError(response.message || 'Failed to fetch exams');
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
      setError('An error occurred while fetching exams');
    } finally {
      setLoading(false);
    }
  };

  const handleExamSelect = async (exam: Exam) => {
    setSelectedExam(exam);
    setFormatLoading(true);
    setError(null);
    
    try {
      // Always fetch formats first - we ALWAYS show notice card before test
      const formatsResponse = await getExamFormats(exam.id);
      if (formatsResponse.success && formatsResponse.data && Object.keys(formatsResponse.data.formats).length > 0) {
        setAvailableFormats(formatsResponse.data.formats);
        const formatEntries = Object.entries(formatsResponse.data.formats);
        // Same flow for single or multi-format: pick format, load rules, go to test (no format-selection screen)
        let formatIndex = 0;
        if (formatEntries.length > 1) {
          try {
            const analyticsRes = await getUserAnalyticsSummary(exam.id);
            const attempts = analyticsRes.data?.attempts ?? [];
            formatIndex = attempts.length % formatEntries.length;
          } catch {
            // use 0 (first paper) if analytics fail
          }
        }
        const [formatId, format] = formatEntries[formatIndex];
        const hasSections = format?.sections && Object.keys(format.sections).length > 0;
        const formatWithId = hasSections
          ? { ...format, format_id: formatId }
          : buildFallbackFormat(exam);
        setSelectedFormat(formatWithId);
        if (!hasSections) {
          setFormatRules({
            format: formatWithId,
            rules: formatWithId.rules,
            marking_scheme: formatWithId.marking_scheme,
            sections: formatWithId.sections ?? {},
          });
          setViewState('test-active');
        } else {
          setRulesLoading(true);
          setError(null);
          try {
            const rulesResponse = await getTestRules(exam.id, formatId);
            if (rulesResponse.success && rulesResponse.data) {
              setFormatRules(rulesResponse.data);
              setViewState('test-active');
            } else {
              setError('Failed to load test rules');
              setViewState('exam-selection');
            }
          } catch (err) {
            console.error('Error fetching rules:', err);
            setError('Failed to load test rules');
            setViewState('exam-selection');
          } finally {
            setRulesLoading(false);
          }
        }
      } else {
        // No formats - go directly to fullscreen with basic format
        const fallbackFormat = buildFallbackFormat(exam);
        setSelectedFormat(fallbackFormat);
        setFormatRules({
          format: fallbackFormat,
          rules: fallbackFormat.rules,
          marking_scheme: fallbackFormat.marking_scheme,
          sections: fallbackFormat.sections ?? {},
        });
        setViewState('test-active');
      }
    } catch (error) {
      console.error('Error fetching exam formats:', error);
      const fallbackFormat = buildFallbackFormat(exam);
      setSelectedFormat(fallbackFormat);
      setFormatRules({
        format: fallbackFormat,
        rules: fallbackFormat.rules,
        marking_scheme: fallbackFormat.marking_scheme,
        sections: fallbackFormat.sections ?? {},
      });
      setViewState('test-active');
    } finally {
      setFormatLoading(false);
    }
  };

  const handleFormatSelect = async (format: ExamFormat) => {
    if (!selectedExam) return;
    
    setSelectedFormat(format);
    setRulesLoading(true);
    setError(null);
    
    try {
      const rulesResponse = await getTestRules(selectedExam.id, format.format_id);
      if (rulesResponse.success && rulesResponse.data) {
        setFormatRules(rulesResponse.data);
        setViewState('test-active');
      } else {
        setError('Failed to load test rules');
      }
    } catch (error) {
      console.error('Error fetching test rules:', error);
      setError('Failed to load test rules');
    } finally {
      setRulesLoading(false);
    }
  };

  const handleBackToExams = () => {
    setViewState('exam-selection');
    setSelectedExam(null);
    setSelectedFormat(null);
    setAvailableFormats({});
    setFormatRules(null);
    setError(null);
  };

  const handleBackToFormats = () => {
    setViewState('format-selection');
    setSelectedFormat(null);
    setFormatRules(null);
    setError(null);
  };

  // Render different views based on state
  if (viewState === 'test-active' && selectedExam) {
    return (
      <TestInterface 
        exam={{ id: selectedExam.id, name: selectedExam.name, description: selectedExam.description ?? '', code: selectedExam.code }}
        format={selectedFormat ?? undefined}
        onExit={handleBackToExams} 
      />
    );
  }

  return (
    <div className="w-full space-y-5">
      {/* Tab Navigation */}
      <div className="flex w-full rounded-md bg-white/10 text-sm font-medium text-slate-300 overflow-hidden">
        <button
          onClick={() => setActiveTab("practice")}
          className={`flex-1 py-3 text-center transition ${
            activeTab === "practice" ? "bg-pink-600 text-white" : "hover:bg-white/5"
          }`}
        >
          Practice Tests
        </button>
        <button
          onClick={() => setActiveTab("history-analytics")}
          className={`flex-1 py-3 text-center transition ${
            activeTab === "history-analytics" ? "bg-pink-600 text-white" : "hover:bg-white/5"
          }`}
        >
          History and Analytics
        </button>
      </div>

      {/* Content */}
      {activeTab === "practice" && viewState === 'format-selection' && selectedExam && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Select Format</h2>
              <p className="text-slate-300 text-sm">Choose a test format for {selectedExam.name}</p>
            </div>
            <Button
              onClick={handleBackToExams}
              variant="themeButtonOutline"
              size="sm"
            >
              Back to Exams
            </Button>
          </div>

          {error && (
            <div className="rounded-md bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
              {error}
            </div>
          )}

          {formatLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white/10 rounded-lg p-6 animate-pulse">
                  <div className="h-6 bg-white/20 rounded mb-3"></div>
                  <div className="h-4 bg-white/10 rounded mb-2"></div>
                  <div className="h-4 bg-white/10 rounded mb-4"></div>
                  <div className="h-10 bg-white/20 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(availableFormats).map(([formatId, format]) => (
                <div key={formatId} className="bg-white/10 rounded-lg p-6 hover:bg-white/20 transition group">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-white group-hover:text-pink-300 transition mb-2">
                      {format.name}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div className="text-center">
                        <div className="text-pink-400 font-semibold">{format.duration_minutes}m</div>
                        <div className="text-slate-400">Duration</div>
                      </div>
                      <div className="text-center">
                        <div className="text-pink-400 font-semibold">{format.total_marks}</div>
                        <div className="text-slate-400">Marks</div>
                      </div>
                      <div className="text-center">
                        <div className="text-pink-400 font-semibold">{getFormatTotalQuestions(format)}</div>
                        <div className="text-slate-400">Questions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-pink-400 font-semibold">{Object.keys(format.sections || {}).length}</div>
                        <div className="text-slate-400">Sections</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="text-xs text-slate-400 mb-2">Sections:</div>
                    <div className="flex flex-wrap gap-1">
                      {Object.values(format.sections || {}).map((section: any, index) => (
                        <span key={index} className="text-xs bg-pink-600/20 text-pink-300 px-2 py-1 rounded">
                          {section.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => handleFormatSelect({ ...format, format_id: formatId })}
                    variant="themeButton"
                    size="sm"
                    className="w-full group-hover:scale-105 transition-transform"
                    disabled={rulesLoading}
                  >
                    {rulesLoading ? 'Loading...' : 'Select Format'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "practice" && viewState === 'exam-selection' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white">Select an Exam</h2>
              <p className="text-slate-300 text-sm">Choose an exam to start practicing with AI-generated questions</p>
            </div>
            {error && (
              <Button
                onClick={fetchExams}
                variant="themeButtonOutline"
                size="sm"
              >
                Retry
              </Button>
            )}
          </div>

          {error && (
            <div className="rounded-md bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white/10 rounded-lg p-4 animate-pulse">
                  <div className="h-6 bg-white/20 rounded mb-2"></div>
                  <div className="h-4 bg-white/10 rounded mb-3"></div>
                  <div className="h-10 bg-white/20 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exams.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <div className="text-slate-400">
                    <p className="text-lg font-medium mb-2">No exams available</p>
                    <p className="text-sm">Please check back later or contact support.</p>
                  </div>
                </div>
              ) : (
                exams.map((exam) => (
                  <div key={exam.id} className="bg-white/10 rounded-lg p-4 hover:bg-white/20 transition group">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-white group-hover:text-pink-300 transition">
                        {exam.name}
                      </h3>
                      <span className="text-xs bg-pink-600/20 text-pink-300 px-2 py-1 rounded">
                        {exam.code}
                      </span>
                    </div>
                    <p className="text-slate-300 text-sm mb-4 line-clamp-2">
                      {exam.description || 'Practice with AI-generated questions tailored for this exam.'}
                    </p>
                    <div className="flex items-center justify-end">
                      <Button
                        onClick={() => handleExamSelect(exam)}
                        variant="themeButton"
                        size="sm"
                        className="group-hover:scale-105 transition-transform"
                        disabled={formatLoading}
                      >
                        {formatLoading && selectedExam?.id === exam.id ? 'Loading...' : 'Start Practice'}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "history-analytics" && historyAnalyticsExam === null && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white">Select an Exam</h2>
              <p className="text-slate-300 text-sm">View history and analytics for an exam</p>
            </div>
            {error && (
              <Button
                onClick={fetchExams}
                variant="themeButtonOutline"
                size="sm"
              >
                Retry
              </Button>
            )}
          </div>

          {error && (
            <div className="rounded-md bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
              {error}
            </div>
          )}

          {loading || historyStatsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white/10 rounded-lg p-4 animate-pulse">
                  <div className="h-6 bg-white/20 rounded mb-2"></div>
                  <div className="h-4 bg-white/10 rounded mb-3"></div>
                  <div className="h-10 bg-white/20 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exams.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <div className="text-slate-400">
                    <p className="text-lg font-medium mb-2">No exams available</p>
                    <p className="text-sm">Please check back later or contact support.</p>
                  </div>
                </div>
              ) : (
                [...exams]
                  .sort((a, b) => {
                    const statsA = examAttemptStats.get(a.id);
                    const statsB = examAttemptStats.get(b.id);
                    const timeA = statsA?.lastAttemptedAt ? new Date(statsA.lastAttemptedAt).getTime() : 0;
                    const timeB = statsB?.lastAttemptedAt ? new Date(statsB.lastAttemptedAt).getTime() : 0;
                    return timeB - timeA;
                  })
                  .map((exam) => {
                    const stats = examAttemptStats.get(exam.id);
                    const lastAttempted = stats?.lastAttemptedAt
                      ? new Date(stats.lastAttemptedAt).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : null;
                    const totalMocks = stats?.totalMocks ?? 0;
                    return (
                      <div key={exam.id} className="bg-white/10 rounded-lg p-4 hover:bg-white/20 transition group flex flex-col h-full min-h-[200px]">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-lg font-semibold text-white group-hover:text-pink-300 transition">
                            {exam.name}
                          </h3>
                          <span className="text-xs bg-pink-600/20 text-pink-300 px-2 py-1 rounded">
                            {exam.code}
                          </span>
                        </div>
                        <p className="text-slate-300 text-sm mb-3 line-clamp-2">
                          {exam.description || 'View your test history and performance analytics.'}
                        </p>
                        {(lastAttempted || totalMocks > 0) && (
                          <div className="mb-3 space-y-2">
                            {totalMocks > 0 && (
                              <div className="inline-flex items-center gap-1.5 bg-pink-600/25 text-pink-200 px-2.5 py-1 rounded-lg text-sm font-medium">
                                <span className="text-pink-300">Total mocks given:</span>
                                <span className="font-semibold text-white">{totalMocks}</span>
                              </div>
                            )}
                            {lastAttempted && (
                              <p className="text-sm text-pink-200 font-medium bg-white/5 px-2.5 py-1.5 rounded-lg border border-pink-500/20">
                                Last attempted: <span className="text-white font-semibold">{lastAttempted}</span>
                              </p>
                            )}
                          </div>
                        )}
                        <div className="flex items-center justify-end mt-auto pt-3">
                          <Button
                            onClick={() => setHistoryAnalyticsExam(exam)}
                            variant="themeButton"
                            size="sm"
                            className="group-hover:scale-105 transition-transform"
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "history-analytics" && historyAnalyticsExam && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white">{historyAnalyticsExam.name} - History & Analytics</h2>
              <p className="text-slate-300 text-sm">Your performance across mocks and attempts</p>
            </div>
            <Button
              onClick={() => setHistoryAnalyticsExam(null)}
              variant="themeButtonOutline"
              size="sm"
            >
              Back to Exams
            </Button>
          </div>
          <AnalyticsTab examId={historyAnalyticsExam.id} />
        </div>
      )}
    </div>
  );
}