'use client';

interface QuestionAreaEmptyProps {
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export default function QuestionAreaEmpty({ loading, error, onRetry }: QuestionAreaEmptyProps) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center space-y-4">
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto" />
            <p className="text-slate-300">Question loading</p>
          </>
        ) : error ? (
          <>
            <div className="text-red-400 mb-4">{error}</div>
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
            >
              Retry
            </button>
          </>
        ) : (
          <div className="text-slate-400 text-sm">Select a section to begin</div>
        )}
      </div>
    </div>
  );
}
