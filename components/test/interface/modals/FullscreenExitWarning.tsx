'use client';

import { Button } from '@/components/shared';

interface FullscreenExitWarningProps {
  onReenterFullscreen: () => void;
}

export default function FullscreenExitWarning({ onReenterFullscreen }: FullscreenExitWarningProps) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Fullscreen exited</h3>
          <p className="text-gray-600 mb-4">
            You have exited fullscreen mode. For the best test experience and to avoid any issues,
            please re-enter fullscreen to continue your test.
          </p>
          <Button onClick={onReenterFullscreen} variant="themeButton" className="w-full">
            Re-enter fullscreen
          </Button>
        </div>
      </div>
    </div>
  );
}
