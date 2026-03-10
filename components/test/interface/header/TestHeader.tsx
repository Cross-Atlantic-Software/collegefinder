'use client'
import { Button } from "@/components/shared";

interface TestHeaderProps {
  examName: string;
  formatName: string;
  questionNumber: number;
  totalQuestions: number;
  timeRemaining: number;
  isFullscreen: boolean;
  completingTest: boolean;
  error: string | null;
  onEnterFullscreen: () => void;
  onSubmitTest: () => void;
}

export default function TestHeader({
  examName,
  formatName,
  questionNumber,
  totalQuestions,
  timeRemaining,
  isFullscreen,
  completingTest,
  error,
  onEnterFullscreen,
  onSubmitTest,
}: TestHeaderProps) {
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-800 border-b border-slate-700 p-4">
      {error && (
        <div className="mb-3 p-2 bg-red-500/20 border border-red-500/30 rounded text-red-400 text-sm">
          {error}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-white">{examName} - {formatName}</h1>
          {questionNumber > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-700/80 border border-slate-600">
              <span className="text-slate-400 text-sm">Question</span>
              <span className="text-white font-semibold tabular-nums">
                {questionNumber}
              </span>
              <span className="text-slate-500 text-sm">of</span>
              <span className="text-slate-300 font-medium tabular-nums">
                {totalQuestions}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-sm text-slate-400">
            Time Remaining: <span className="text-pink-400 font-mono">{formatTime(timeRemaining)}</span>
          </div>
          
          {!isFullscreen && (
            <Button onClick={onEnterFullscreen} size="sm" variant="themeButtonOutline">
              Enter Fullscreen
            </Button>
          )}
          
          <Button
            onClick={onSubmitTest}
            size="sm"
            variant="themeButton"
            disabled={completingTest}
            className="bg-green-600 hover:bg-green-700"
          >
            {completingTest ? 'Submitting...' : 'Submit Test'}
          </Button>
        </div>
      </div>
    </div>
  );
}
