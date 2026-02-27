'use client'
import { Button } from "@/components/shared";
import { FormatRules } from "@/api/tests";

interface TestRulesProps {
  examName: string;
  formatRules: FormatRules;
  onStartTest: () => void;
  onBack: () => void;
  backLabel?: string;
  loading?: boolean;
}

export default function TestRules({ examName, formatRules, onStartTest, onBack, backLabel = 'Back to Exams', loading = false }: TestRulesProps) {
  const { format, rules, marking_scheme, sections } = formatRules;

  // Calculate total questions (handle empty sections)
  const totalQuestions = sections && Object.keys(sections).length > 0
    ? Object.values(sections).reduce((total: number, section: any) => {
        return total + Object.values(section.subsections || {}).reduce((sectionTotal: number, subsection: any) => {
          return sectionTotal + (subsection.questions || 0);
        }, 0);
      }, 0)
    : 0;
  
  const hasSections = sections && Object.keys(sections).length > 0;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-white">{examName}</h1>
        <h2 className="text-xl text-pink-300">{format.name}</h2>
        <p className="text-slate-300">Please read the instructions carefully before starting the test</p>
      </div>

      {/* Test Overview */}
      <div className="bg-white/10 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white mb-4">Test Overview</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-white/5 rounded-lg">
            <div className="text-2xl font-bold text-pink-400">{format.duration_minutes}</div>
            <div className="text-sm text-slate-300">Minutes</div>
          </div>
          <div className="text-center p-4 bg-white/5 rounded-lg">
            <div className="text-2xl font-bold text-pink-400">{totalQuestions}</div>
            <div className="text-sm text-slate-300">Questions</div>
          </div>
          <div className="text-center p-4 bg-white/5 rounded-lg">
            <div className="text-2xl font-bold text-pink-400">{format.total_marks}</div>
            <div className="text-sm text-slate-300">Total Marks</div>
          </div>
        </div>
      </div>

      {/* Section Breakdown - only show when format has sections */}
      {hasSections && (
      <div className="bg-white/10 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Section Breakdown</h3>
        
        <div className="space-y-4">
          {Object.entries(sections).map(([sectionKey, section]: [string, any]) => (
            <div key={sectionKey} className="border border-white/10 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold text-white">{section.name}</h4>
                <span className="text-sm text-pink-300">{section.marks} marks</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(section.subsections || {}).map(([subKey, subsection]: [string, any]) => (
                  <div key={subKey} className="bg-white/5 rounded p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-200">
                        Section {subKey.split('_')[1]?.toUpperCase()} ({subsection.type})
                      </span>
                      <span className="text-xs text-slate-400">
                        {subsection.questions} questions × {subsection.marks_per_question} marks
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      )}

      {/* Marking Scheme */}
      <div className="bg-white/10 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Marking Scheme</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            <div>
              <div className="text-sm font-medium text-green-400">Correct Answer</div>
              <div className="text-xs text-slate-300">+{marking_scheme.correct} marks</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
            <div>
              <div className="text-sm font-medium text-red-400">Incorrect Answer</div>
              <div className="text-xs text-slate-300">{marking_scheme.incorrect} marks</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-gray-500/10 border border-gray-500/20 rounded-lg">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            <div>
              <div className="text-sm font-medium text-gray-400">Unattempted</div>
              <div className="text-xs text-slate-300">{marking_scheme.unattempted} marks</div>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-white/10 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Instructions</h3>
        
        <div className="space-y-3">
          {rules.map((rule, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-pink-400 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-slate-300 text-sm">{rule}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Important Notes */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <svg className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <h4 className="font-medium text-yellow-400 mb-1">Important</h4>
            <p className="text-sm text-slate-300">
              Once you start the test, switching tabs or leaving the test window will trigger a warning. 
              Make sure you have a stable internet connection and are in a distraction-free environment.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-4">
        <Button
          onClick={onBack}
          variant="themeButtonOutline"
          disabled={loading}
        >
          {backLabel}
        </Button>
        
        <Button
          onClick={onStartTest}
          variant="themeButton"
          size="lg"
          disabled={loading}
          className="px-8"
        >
          {loading ? 'Starting Test...' : 'Start Test'}
        </Button>
      </div>
    </div>
  );
}