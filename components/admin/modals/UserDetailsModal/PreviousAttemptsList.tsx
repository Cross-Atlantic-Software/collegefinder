'use client';

interface PreviousAttempt {
  exam_name: string;
  year: number;
  rank: number | null;
}

interface PreviousAttemptsListProps {
  attempts: PreviousAttempt[];
}

export default function PreviousAttemptsList({ attempts }: PreviousAttemptsListProps) {
  return (
    <>
      {attempts.map((attempt, index) => (
        <div
          key={index}
          className="flex items-center justify-between p-2.5 rounded-md bg-gray-50 border border-gray-200"
        >
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{attempt.exam_name}</p>
            <p className="text-xs text-gray-600 mt-0.5">Year: {attempt.year}</p>
          </div>
          <div className="text-right">
            {attempt.rank ? (
              <p className="text-sm font-semibold text-gray-900">Rank: {attempt.rank}</p>
            ) : (
              <p className="text-xs text-gray-500 italic">No rank provided</p>
            )}
          </div>
        </div>
      ))}
    </>
  );
}

