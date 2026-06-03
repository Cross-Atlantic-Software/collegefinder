'use client'
import { useState, useEffect } from "react";
import { Button } from "@/components/shared";
import { getAllExams } from "@/api";
import type { Exam } from "@/api/exams";
import { getExamFormats, getTestRules, getUserAnalyticsSummary, getNextMockNumber, ExamFormat, FormatRules } from "@/api/tests";
import TestInterface from "./TestInterface";
import MockPreparingScreen from "@/components/test/MockPreparingScreen";
import AnalyticsTab from "@/components/test/AnalyticsTab";
import { formatDurationMinutes } from "@/lib/formatDuration";
import { buildFormatFromExamPattern } from "@/lib/examMockFormat";

type ViewState = 'exam-selection' | 'format-selection' | 'mock-preparing' | 'test-active';

function getFormatTotalQuestions(format: ExamFormat): number {
  return Object.values(format.sections || {}).reduce(
    (sum, section) =>
      sum +
      Object.values(section.subsections || {}).reduce((s, sub) => s + (sub?.questions ?? 0), 0),
    0
  );
}

/** Fallback when API formats fail — uses exam_pattern when available. */
function buildFallbackFormat(exam: Exam): ExamFormat {
  if (exam.examPattern) {
    return buildFormatFromExamPattern(exam);
  }
  return {
    format_id: 'default',
    name: `${exam.name} Practice Test`,
    duration_minutes: 180,
    total_marks: 200,
    sections: {
      General: {
        name: 'General',
        marks: 200,
        subsections: {
          'Section A': { type: 'mcq_single', questions: 50, marks_per_question: 4 },
        },
      },
    },
    marking_scheme: { correct: 4, incorrect: -1, unattempted: 0 },
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
  const [nextMockByExam, setNextMockByExam] = useState<Map<number, number>>(new Map());
  const [selectedMockNumber, setSelectedMockNumber] = useState(1);
  const [historyStatsLoading, setHistoryStatsLoading] = useState(false);

  useEffect(() => {
    fetchExams();
  }, []);

  // Fetch attempt stats when showing exam list (Practice or History tab) so we can show "Start Mock N" and sort History by analytics.
  useEffect(() => {
    const needStats =
      exams.length > 0 &&
      ((activeTab === "practice" && viewState === "exam-selection") ||
        (activeTab === "history-analytics" && !historyAnalyticsExam));
    if (!needStats) return;

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
  }, [activeTab, viewState, historyAnalyticsExam, exams]);

  // Button labels use analytics (completed attempts + 1). Generation is triggered when user picks an exam.
  useEffect(() => {
    if (exams.length === 0 || activeTab !== "practice" || viewState !== "exam-selection") return;
    const map = new Map<number, number>();
    for (const exam of exams) {
      const attempted = examAttemptStats.get(exam.id)?.totalMocks ?? 0;
      map.set(exam.id, attempted + 1);
    }
    setNextMockByExam(map);
  }, [exams, activeTab, viewState, examAttemptStats]);

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

  const loadFormatsForExam = async (exam: Exam): Promise<boolean> => {
    const formatsResponse = await getExamFormats(exam.id);
    if (formatsResponse.success && formatsResponse.data && Object.keys(formatsResponse.data.formats).length > 0) {
      setAvailableFormats(formatsResponse.data.formats);
      const formatEntries = Object.entries(formatsResponse.data.formats);
      const examNumberOfPapers = exam.number_of_papers ?? 1;
      let formatIndex = 0;
      if (formatEntries.length > 1 && examNumberOfPapers <= 1) {
        try {
          const analyticsRes = await getUserAnalyticsSummary(exam.id);
          const attempts = analyticsRes.data?.attempts ?? [];
          formatIndex = attempts.length % formatEntries.length;
        } catch {
          // use first format
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
        return true;
      }
      const rulesResponse = await getTestRules(exam.id, formatId);
      if (rulesResponse.success && rulesResponse.data) {
        setFormatRules(rulesResponse.data);
        return true;
      }
      setError('Failed to load test rules');
      return false;
    }

    const fallbackFormat = buildFallbackFormat(exam);
    setSelectedFormat(fallbackFormat);
    setFormatRules({
      format: fallbackFormat,
      rules: fallbackFormat.rules,
      marking_scheme: fallbackFormat.marking_scheme,
      sections: fallbackFormat.sections ?? {},
    });
    return true;
  };

  const handleExamSelect = async (exam: Exam) => {
    const mockNum = nextMockByExam.get(exam.id) ?? (examAttemptStats.get(exam.id)?.totalMocks ?? 0) + 1;
    setSelectedExam(exam);
    setSelectedMockNumber(mockNum);
    setError(null);

    try {
      const res = await getNextMockNumber(exam.id, { trigger: true });
      const status = res.data?.mock?.status ?? res.data?.status;
      if (status === 'ready') {
        setFormatLoading(true);
        const ok = await loadFormatsForExam(exam);
        setViewState(ok ? 'test-active' : 'exam-selection');
        setFormatLoading(false);
        return;
      }
    } catch {
      // fall through to preparing screen
    }

    setViewState('mock-preparing');
  };

  const handleMockReady = async () => {
    if (!selectedExam) return;
    setFormatLoading(true);
    setError(null);
    try {
      const ok = await loadFormatsForExam(selectedExam);
      if (ok) {
        setViewState('test-active');
      } else {
        setViewState('exam-selection');
      }
    } catch (err) {
      console.error('Error loading formats:', err);
      setError('Failed to load test format');
      setViewState('exam-selection');
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
    setSelectedMockNumber(1);
    setError(null);
  };

  const handleBackToFormats = () => {
    setViewState('format-selection');
    setSelectedFormat(null);
    setFormatRules(null);
    setError(null);
  };

  // Mock is generating — dedicated preparing screen on the mock test page
  if (viewState === 'mock-preparing' && selectedExam) {
    return (
      <MockPreparingScreen
        examId={selectedExam.id}
        examName={selectedExam.name}
        mockNumber={selectedMockNumber}
        onReady={handleMockReady}
        onBack={handleBackToExams}
      />
    );
  }

  // Render test when mock is ready
  if (viewState === 'test-active' && selectedExam) {
    const examNumberOfPapers = selectedExam.number_of_papers ?? 1;
    return (
      <TestInterface 
        exam={{ id: selectedExam.id, name: selectedExam.name, description: selectedExam.description ?? '', code: selectedExam.code ?? '' }}
        format={selectedFormat ?? undefined}
        numberOfPapers={examNumberOfPapers}
        formats={examNumberOfPapers > 1 ? availableFormats : undefined}
        onExit={handleBackToExams} 
      />
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#f5f9ff] text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <section className="w-full bg-[#f5f9ff]">
        <header className="border-b border-slate-200 bg-white px-4 pt-2 pb-0 dark:border-slate-800 dark:bg-slate-900 md:px-6">
          <div className="min-w-0">
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">Mock Test</p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Practice tests and history analytics.</p>

            <div className="relative -mb-px mt-3 flex gap-1 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveTab("practice")}
                className={`flex min-w-max items-center border-b-2 border-transparent px-4 py-2.5 text-sm font-medium transition-colors duration-300 ${
                  activeTab === "practice"
                    ? "border-b-slate-900 text-slate-900 dark:border-b-slate-100 dark:text-slate-100"
                    : "text-black/30 hover:text-black/60 dark:text-white/40 dark:hover:text-white/75"
                }`}
              >
                Practice Tests
              </button>
              <button
                onClick={() => setActiveTab("history-analytics")}
                className={`flex min-w-max items-center border-b-2 border-transparent px-4 py-2.5 text-sm font-medium transition-colors duration-300 ${
                  activeTab === "history-analytics"
                    ? "border-b-slate-900 text-slate-900 dark:border-b-slate-100 dark:text-slate-100"
                    : "text-black/30 hover:text-black/60 dark:text-white/40 dark:hover:text-white/75"
                }`}
              >
                History and Analytics
              </button>
            </div>
          </div>
        </header>

        <div className="bg-[#f8fbff] p-4 dark:bg-slate-950/40 md:p-6" style={{ animation: "fade-in 220ms ease-out" }}>
          {activeTab === "practice" && viewState === 'format-selection' && selectedExam && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Select Format</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Choose a test format for {selectedExam.name}</p>
                </div>
                <Button
                  onClick={handleBackToExams}
                  variant="themeButtonOutline"
                  size="sm"
                  className="rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                >
                  Back to Exams
                </Button>
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
                  {error}
                </div>
              )}

              {formatLoading ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="animate-pulse rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                      <div className="mb-3 h-6 rounded bg-slate-200 dark:bg-slate-700" />
                      <div className="mb-2 h-4 rounded bg-slate-100 dark:bg-slate-800" />
                      <div className="mb-4 h-4 rounded bg-slate-100 dark:bg-slate-800" />
                      <div className="h-10 rounded bg-slate-200 dark:bg-slate-700" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {Object.entries(availableFormats).map(([formatId, format]) => (
                    <div key={formatId} className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                      <div className="mb-4">
                        <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{format.name}</h3>
                        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                          <div className="text-center">
                            <div className="font-semibold text-[#b88900]">
                              {formatDurationMinutes(format.duration_minutes)}
                            </div>
                            <div className="text-slate-500 dark:text-slate-400">Duration</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-[#b88900]">{format.total_marks}</div>
                            <div className="text-slate-500 dark:text-slate-400">Marks</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-[#b88900]">{getFormatTotalQuestions(format)}</div>
                            <div className="text-slate-500 dark:text-slate-400">Questions</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-[#b88900]">{Object.keys(format.sections || {}).length}</div>
                            <div className="text-slate-500 dark:text-slate-400">Sections</div>
                          </div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="mb-2 text-xs text-slate-500 dark:text-slate-400">Sections:</div>
                        <div className="flex flex-wrap gap-1">
                          {Object.values(format.sections || {}).map((section: any, index) => (
                            <span key={index} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              {section.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      <Button
                        onClick={() => handleFormatSelect({ ...format, format_id: formatId })}
                        variant="themeButton"
                        size="sm"
                        className="w-full rounded-full !border-black !bg-black !text-[#FAD53C] transition-all duration-200 hover:!bg-black/90 active:scale-95"
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
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Select an Exam</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Choose an exam to start practicing with AI-generated questions.</p>
                </div>
                {error && (
                  <Button onClick={fetchExams} variant="themeButtonOutline" size="sm" className="rounded-full">
                    Retry
                  </Button>
                )}
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="animate-pulse rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                      <div className="mb-2 h-6 rounded bg-slate-200 dark:bg-slate-700" />
                      <div className="mb-3 h-4 rounded bg-slate-100 dark:bg-slate-800" />
                      <div className="h-10 rounded bg-slate-200 dark:bg-slate-700" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {exams.length === 0 ? (
                    <div className="col-span-full rounded-xl bg-white py-8 text-center shadow-sm dark:bg-slate-900">
                      <p className="mb-2 text-lg font-medium text-slate-500 dark:text-slate-300">No exams available</p>
                      <p className="text-sm text-slate-400 dark:text-slate-500">Please check back later or contact support.</p>
                    </div>
                  ) : (
                    exams.map((exam) => {
                      const attemptedMocks = examAttemptStats.get(exam.id)?.totalMocks ?? 0;
                      const nextMockNumber = nextMockByExam.get(exam.id) ?? attemptedMocks + 1;
                      return (
                        <div key={exam.id} className="group flex min-h-[200px] flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                          <div className="mb-3 flex items-start justify-between">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{exam.name}</h3>
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">{exam.code || '—'}</span>
                          </div>
                          <p className="mb-4 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                            {exam.description || 'Practice with AI-generated questions tailored for this exam.'}
                          </p>
                          <div className="mt-auto flex items-center justify-end">
                            <Button
                              onClick={() => handleExamSelect(exam)}
                              variant="themeButton"
                              size="sm"
                              className="rounded-full !border-black !bg-black !text-[#FAD53C] transition-all duration-200 hover:!bg-black/90 active:scale-95"
                              disabled={formatLoading && selectedExam?.id === exam.id}
                            >
                              {selectedExam?.id === exam.id && formatLoading
                                ? 'Preparing...'
                                : `Start Mock ${nextMockNumber}`}
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

          {activeTab === "history-analytics" && historyAnalyticsExam === null && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Select an Exam</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">View history and analytics for an exam.</p>
                </div>
                {error && (
                  <Button onClick={fetchExams} variant="themeButtonOutline" size="sm" className="rounded-full">
                    Retry
                  </Button>
                )}
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
                  {error}
                </div>
              )}

              {loading || historyStatsLoading ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="animate-pulse rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                      <div className="mb-2 h-6 rounded bg-slate-200 dark:bg-slate-700" />
                      <div className="mb-3 h-4 rounded bg-slate-100 dark:bg-slate-800" />
                      <div className="h-10 rounded bg-slate-200 dark:bg-slate-700" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {exams.length === 0 ? (
                    <div className="col-span-full rounded-xl bg-white py-8 text-center shadow-sm dark:bg-slate-900">
                      <p className="mb-2 text-lg font-medium text-slate-500 dark:text-slate-300">No exams available</p>
                      <p className="text-sm text-slate-400 dark:text-slate-500">Please check back later or contact support.</p>
                    </div>
                  ) : (
                    [...exams]
                      .sort((a, b) => {
                        const statsA = examAttemptStats.get(a.id);
                        const statsB = examAttemptStats.get(b.id);
                        const hasAnalyticsA = (statsA?.totalMocks ?? 0) > 0;
                        const hasAnalyticsB = (statsB?.totalMocks ?? 0) > 0;
                        if (hasAnalyticsA !== hasAnalyticsB) return hasAnalyticsB ? 1 : -1;
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
                        const hasAnalytics = totalMocks > 0 || !!lastAttempted;

                        return (
                          <div key={exam.id} className="group flex min-h-[200px] flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                            <div className="mb-3 flex items-start justify-between">
                              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{exam.name}</h3>
                              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">{exam.code || '—'}</span>
                            </div>
                            <p className="mb-3 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                              {exam.description || 'View your test history and performance analytics.'}
                            </p>

                            {(lastAttempted || totalMocks > 0) && (
                              <div className="mb-3 space-y-2">
                                {totalMocks > 0 && (
                                  <div className="inline-flex items-center gap-1.5 rounded-lg bg-[#FAD53C]/25 px-2.5 py-1 text-sm font-medium text-[#8a6700] dark:text-[#FAD53C]">
                                    <span>Total mocks:</span>
                                    <span className="font-semibold">{totalMocks}</span>
                                  </div>
                                )}
                                {lastAttempted && (
                                  <p className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                    Last attempted: <span className="font-semibold">{lastAttempted}</span>
                                  </p>
                                )}
                              </div>
                            )}

                            <div className="mt-auto flex items-center justify-end pt-3">
                              {hasAnalytics ? (
                                <Button
                                  onClick={() => setHistoryAnalyticsExam(exam)}
                                  variant="themeButton"
                                  size="sm"
                                  className="rounded-full !border-black !bg-black !text-[#FAD53C] transition-all duration-200 hover:!bg-black/90 active:scale-95"
                                >
                                  View
                                </Button>
                              ) : (
                                <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center text-sm italic text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                                  No analytics to view yet.
                                </p>
                              )}
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
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{historyAnalyticsExam.name} - History & Analytics</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Your performance across mocks and attempts.</p>
                </div>
                <Button
                  onClick={() => setHistoryAnalyticsExam(null)}
                  variant="themeButtonOutline"
                  size="sm"
                  className="rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                >
                  Back to Exams
                </Button>
              </div>
              <AnalyticsTab examId={historyAnalyticsExam.id} />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}