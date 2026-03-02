'use client'
import { useState, useEffect } from "react";
import { Button } from "@/components/shared";
import { getAllExams } from "@/api";
import { getExamFormats, getTestRules, ExamFormat, FormatRules } from "@/api/tests";
import TestInterface from "./TestInterface";
import AnalyticsTab from "@/components/test/AnalyticsTab";

interface Exam {
  id: number;
  name: string;
  description: string;
  code: string;
  format?: any;
}

type ViewState = 'exam-selection' | 'format-selection' | 'test-active';

export default function TestModule() {
  const [activeTab, setActiveTab] = useState("practice");
  const [viewState, setViewState] = useState<ViewState>('exam-selection');
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<ExamFormat | null>(null);
  const [availableFormats, setAvailableFormats] = useState<{ [key: string]: ExamFormat }>({});
  const [formatRules, setFormatRules] = useState<FormatRules | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [formatLoading, setFormatLoading] = useState(false);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchExams();
  }, []);

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
        // If only one format, skip format selection and go directly to rules notice
        if (formatEntries.length === 1) {
          const [formatId, format] = formatEntries[0];
          const formatWithId = { ...format, format_id: formatId };
          setSelectedFormat(formatWithId);
          setRulesLoading(true);
          try {
            const rulesResponse = await getTestRules(exam.id, formatId);
            if (rulesResponse.success && rulesResponse.data) {
              setFormatRules(rulesResponse.data);
              setViewState('test-active');
            } else {
              setError('Failed to load test rules');
              setViewState('format-selection');
            }
          } catch (err) {
            console.error('Error fetching rules:', err);
            setError('Failed to load test rules');
            setViewState('format-selection');
          } finally {
            setRulesLoading(false);
          }
        } else {
          setViewState('format-selection');
        }
      } else {
        // No formats - go directly to fullscreen with basic format
        const fallbackFormat = {
          format_id: 'default',
          name: `${exam.name} Practice Test`,
          duration_minutes: 60,
          total_marks: 0,
          sections: {},
          marking_scheme: { correct: 1, incorrect: -0.25, unattempted: 0 },
          rules: [
            'Practice mode - answer questions at your own pace',
            'Questions are AI-generated based on exam syllabus',
            'You can exit anytime - progress is saved'
          ]
        };
        setSelectedFormat(fallbackFormat);
        setFormatRules({
          format: fallbackFormat,
          rules: fallbackFormat.rules,
          marking_scheme: fallbackFormat.marking_scheme,
          sections: {}
        });
        setViewState('test-active');
      }
    } catch (error) {
      console.error('Error fetching exam formats:', error);
      const fallbackFormat = {
        format_id: 'default',
        name: `${exam.name} Practice Test`,
        duration_minutes: 60,
        total_marks: 0,
        sections: {},
        marking_scheme: { correct: 1, incorrect: -0.25, unattempted: 0 },
        rules: ['Click Start Test to begin your practice session']
      };
      setSelectedFormat(fallbackFormat);
      setFormatRules({
        format: fallbackFormat,
        rules: fallbackFormat.rules,
        marking_scheme: fallbackFormat.marking_scheme,
        sections: {}
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
        exam={selectedExam} 
        format={selectedFormat}
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
          onClick={() => setActiveTab("history")}
          className={`flex-1 py-3 text-center transition ${
            activeTab === "history" ? "bg-pink-600 text-white" : "hover:bg-white/5"
          }`}
        >
          Test History
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`flex-1 py-3 text-center transition ${
            activeTab === "analytics" ? "bg-pink-600 text-white" : "hover:bg-white/5"
          }`}
        >
          Analytics
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
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div className="text-center">
                        <div className="text-pink-400 font-semibold">{format.duration_minutes}m</div>
                        <div className="text-slate-400">Duration</div>
                      </div>
                      <div className="text-center">
                        <div className="text-pink-400 font-semibold">{format.total_marks}</div>
                        <div className="text-slate-400">Marks</div>
                      </div>
                      <div className="text-center">
                        <div className="text-pink-400 font-semibold">{Object.keys(format.sections).length}</div>
                        <div className="text-slate-400">Sections</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="text-xs text-slate-400 mb-2">Sections:</div>
                    <div className="flex flex-wrap gap-1">
                      {Object.values(format.sections).map((section: any, index) => (
                        <span key={index} className="text-xs bg-pink-600/20 text-pink-300 px-2 py-1 rounded">
                          {section.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => handleFormatSelect(format)}
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
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-slate-400">
                        <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                        AI Questions Available
                      </div>
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

      {activeTab === "history" && (
        <div className="text-center py-12">
          <div className="text-slate-400">
            <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-lg font-medium mb-2">No test history yet</p>
            <p className="text-sm">Your completed tests will appear here</p>
          </div>
        </div>
      )}

      {activeTab === "analytics" && <AnalyticsTab />}
    </div>
  );
}