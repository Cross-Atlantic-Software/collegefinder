'use client'

interface DonutChartProps {
  correct: number;
  incorrect: number;
  skipped: number;
}

export default function DonutChart({ correct, incorrect, skipped }: DonutChartProps) {
  const total = correct + incorrect + skipped || 1;
  const r = 36;
  const circumference = 2 * Math.PI * r;
  const correctPct = (correct / total) * circumference;
  const incorrectPct = (incorrect / total) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="14" />
        {correct > 0 && (
          <circle
            cx="50" cy="50" r={r}
            fill="none"
            stroke="#34d399"
            strokeWidth="14"
            strokeDasharray={`${correctPct} ${circumference - correctPct}`}
            strokeDashoffset={circumference / 4}
            strokeLinecap="butt"
            transform="rotate(-90 50 50)"
          />
        )}
        {incorrect > 0 && (
          <circle
            cx="50" cy="50" r={r}
            fill="none"
            stroke="#f87171"
            strokeWidth="14"
            strokeDasharray={`${incorrectPct} ${circumference - incorrectPct}`}
            style={{ strokeDashoffset: `calc(${circumference / 4} + ${correctPct})` }}
            transform="rotate(-90 50 50)"
          />
        )}
        {skipped > 0 && (
          <circle
            cx="50" cy="50" r={r}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="14"
            strokeDasharray={`${(skipped / total) * circumference} ${circumference - (skipped / total) * circumference}`}
            style={{ strokeDashoffset: `calc(${circumference / 4} + ${correctPct + incorrectPct})` }}
            transform="rotate(-90 50 50)"
          />
        )}
        <text x="50" y="54" textAnchor="middle" className="fill-white" fontSize="13" fontWeight="bold">
          {total}
        </text>
      </svg>
      <div className="flex gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> {correct} Correct
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> {incorrect} Wrong
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" /> {skipped} Skipped
        </span>
      </div>
    </div>
  );
}
