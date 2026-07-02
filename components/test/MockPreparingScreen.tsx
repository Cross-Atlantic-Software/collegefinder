'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/shared';
import { getNextMockNumber } from '@/api/tests';

interface MockPreparingScreenProps {
  examId: number;
  examName: string;
  mockNumber: number;
  onReady: () => void;
  onBack: () => void;
}

const POLL_MS = 4000;

export default function MockPreparingScreen({
  examId,
  examName,
  mockNumber,
  onReady,
  onBack,
}: MockPreparingScreenProps) {
  const [message, setMessage] = useState('Preparing your mock test…');
  const [error, setError] = useState<string | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const readyCalled = useRef(false);
  const onReadyRef = useRef(onReady);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    const tick = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;

    const finishReady = () => {
      if (cancelled || readyCalled.current) return;
      readyCalled.current = true;
      onReadyRef.current();
    };

    const poll = async () => {
      try {
        const res = await getNextMockNumber(examId, { trigger: false });
        if (cancelled) return;

        const status = res.data?.mock?.status ?? res.data?.status;
        const totalQ = res.data?.mock?.total_questions ?? 0;

        if (status === 'ready') {
          setMessage('Your mock test is ready!');
          finishReady();
          return;
        }

        if (status === 'failed') {
          setError(
            res.data?.message ||
              res.data?.mock?.generation_error ||
              'Mock test generation failed. Please go back and try again.'
          );
          return;
        }

        if (status === 'generating') {
          setMessage(
            totalQ > 0
              ? `Preparing your mock test… (${totalQ} questions generated so far)`
              : 'Preparing your mock test… This may take a few minutes.'
          );
        } else {
          setMessage('Preparing your mock test…');
        }

        pollTimer = setTimeout(poll, POLL_MS);
      } catch {
        if (!cancelled) {
          pollTimer = setTimeout(poll, POLL_MS);
        }
      }
    };

    const start = async () => {
      try {
        await getNextMockNumber(examId, { trigger: true });
      } catch {
        // still poll — generation may have been triggered earlier
      }
      if (!cancelled) poll();
    };

    start();

    return () => {
      cancelled = true;
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [examId]);

  const minutes = Math.floor(elapsedSec / 60);
  const seconds = elapsedSec % 60;
  const timeLabel =
    minutes > 0 ? `${minutes}m ${seconds.toString().padStart(2, '0')}s` : `${seconds}s`;

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto text-slate-900">
      <div className="relative isolate min-h-screen w-full overflow-hidden">
        <Image
          src="/login-3.png"
          alt=""
          fill
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-white/72 backdrop-blur-[1px]" />

        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center px-4 py-10">
          <Image
            src="/svgs/logo-unitracko.svg"
            alt="UniTracko"
            width={148}
            height={33}
            className="mb-8 h-8 w-auto"
            priority
          />

          <div className="w-full rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-xl backdrop-blur text-center">
            <p className="text-sm font-medium uppercase tracking-wide text-slate-500">Mock Test</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">{examName}</h1>
            <p className="mt-1 text-sm text-[#8a6700] dark:text-[#FAD53C]">Mock {mockNumber}</p>

            {!error ? (
              <>
                <div className="mx-auto mt-8 flex h-14 w-14 items-center justify-center">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-[#FAD53C]" />
                </div>
                <p className="mt-6 text-base font-medium text-slate-800">{message}</p>
                <p className="mt-2 text-sm text-slate-500">
                  AI is generating your questions. Please stay on this page.
                </p>
                <p className="mt-4 text-xs text-slate-400">Elapsed: {timeLabel}</p>
              </>
            ) : (
              <>
                <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
                <div className="mt-6">
                  <Button
                    onClick={onBack}
                    variant="themeButtonOutline"
                    className="rounded-full"
                  >
                    Back to Exams
                  </Button>
                </div>
              </>
            )}
          </div>

          {!error && (
            <button
              type="button"
              onClick={onBack}
              className="mt-6 text-sm text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline"
            >
              Cancel and go back
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
