'use client';
import { TestRules } from '../rules';
import type { FormatRules } from '@/api/tests';
import Image from 'next/image';

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
  const introSteps = [
    {
      label: 'Step 1',
      title: 'Read Format',
      description: 'Review exam pattern, duration, and section structure before you start.',
    },
    {
      label: 'Step 2',
      title: 'Check Marking',
      description: 'Understand positive, negative, and unattempted scoring for each question.',
    },
    {
      label: 'Step 3',
      title: 'Start Test',
      description: 'Begin only when you are ready to continue in a focused environment.',
    },
  ];

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto text-slate-900">
      <div className="relative isolate min-h-screen w-full overflow-hidden">
        <Image
          src="/login-3.png"
          alt="Login page background"
          fill
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-white/72 backdrop-blur-[1px]" />

        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col items-center px-4 py-8 md:py-10">
          <div className="mb-6">
            <Image
              src="/svgs/logo-unitracko.svg"
              alt="UniTracko"
              width={148}
              height={33}
              className="h-8 w-auto"
              priority
            />
          </div>

          <div className="relative w-full max-w-6xl pt-14 sm:pt-16">
            <div className="absolute left-1/2 top-0 z-20 w-full -translate-x-1/2 px-2">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {introSteps.map((step) => (
                  <div
                    key={step.label}
                    className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-md backdrop-blur"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{step.label}</p>
                    <h3 className="mt-1 text-sm font-semibold text-slate-900">{step.title}</h3>
                    <p className="mt-2 text-xs leading-5 text-slate-600">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white/92 p-4 pt-20 shadow-xl backdrop-blur sm:p-6 sm:pt-24">
              <TestRules
                examName={examName}
                formatRules={formatRules}
                onStartTest={onStartTest}
                onBack={onBack}
                backLabel="Back to Exams"
                loading={loading}
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 w-full max-w-6xl">
              <div className="rounded-2xl border border-red-200 bg-red-50/95 p-4 text-sm text-red-700 shadow-sm">
                {error}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
