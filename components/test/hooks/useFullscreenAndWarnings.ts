'use client';

import { useState, useEffect, useCallback } from 'react';

export interface UseFullscreenAndWarningsOptions {
  /** When set, tab visibility and beforeunload will trigger warning (test in progress). */
  testAttemptId: number | null;
  /** Run exitFullscreen on unmount. */
  exitOnUnmount?: boolean;
}

export function useFullscreenAndWarnings({
  testAttemptId,
  exitOnUnmount = true,
}: UseFullscreenAndWarningsOptions) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tabChangeWarning, setTabChangeWarning] = useState(false);

  const enterFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch (e) {
      console.error('Failed to enter fullscreen:', e);
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch (e) {
      console.error('Failed to exit fullscreen:', e);
    }
  }, []);

  // Request fullscreen when test starts
  useEffect(() => {
    document.documentElement.requestFullscreen?.().catch(() => {});
  }, [testAttemptId]);

  // Tab visibility and beforeunload
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && testAttemptId) setTabChangeWarning(true);
    };
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (testAttemptId) {
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave? Your test progress may be lost.';
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [testAttemptId]);

  // Track fullscreen state
  useEffect(() => {
    const onFullscreen = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreen);
    return () => document.removeEventListener('fullscreenchange', onFullscreen);
  }, []);

  // Exit fullscreen on unmount
  useEffect(() => {
    if (!exitOnUnmount) return;
    return () => {
      exitFullscreen();
    };
  }, [exitOnUnmount, exitFullscreen]);

  return {
    enterFullscreen,
    exitFullscreen,
    isFullscreen,
    tabChangeWarning,
    setTabChangeWarning,
  };
}
