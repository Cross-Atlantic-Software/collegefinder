'use client';
import { TestRules } from '../rules';
import type { FormatRules } from '@/api/tests';

interface InstructionsScreenProps {
  examName: string;
  formatRules: FormatRules;
  onStartTest: () => void;
  onBack: () => void;
  loading: boolean;
  error: string | null;
}

export default function InstructionsScreen({
  examName,
  formatRules,
  onStartTest,
  onBack,
  loading,
  error,
}: InstructionsScreenProps) {
  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-y-auto">
      <div className="min-h-full flex flex-col items-center py-8 px-4">
        <TestRules
          examName={examName}
          formatRules={formatRules}
          onStartTest={onStartTest}
          onBack={onBack}
          backLabel="Back to Exams"
          loading={loading}
        />
        {error && (
          <div className="mt-4 w-full max-w-4xl">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm">
              {error}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
