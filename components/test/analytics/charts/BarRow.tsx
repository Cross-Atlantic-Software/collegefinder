'use client'

function fmt(n: number | null | undefined, decimals = 0): string {
  if (n === null || n === undefined) return '—';
  return n.toFixed(decimals);
}

interface BarRowProps {
  label: string;
  value: number;
  maxValue: number;
  color: string;
  suffix?: string;
}

export default function BarRow({ label, value, maxValue, color, suffix = '%' }: BarRowProps) {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
  
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-400 w-28 truncate flex-shrink-0" title={label}>
        {label}
      </span>
      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className="text-xs text-slate-300 w-12 text-right flex-shrink-0">
        {fmt(value, 1)}{suffix}
      </span>
    </div>
  );
}
