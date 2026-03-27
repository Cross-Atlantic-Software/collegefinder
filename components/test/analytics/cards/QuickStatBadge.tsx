'use client'

interface QuickStatBadgeProps {
  label: string;
  value: string | number;
  color: string;
}

export default function QuickStatBadge({ label, value, color }: QuickStatBadgeProps) {
  return (
    <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${color}`} />
      <span className="text-xs text-slate-400">{label}</span>
      <span className="ml-auto text-sm font-semibold text-white">{value}</span>
    </div>
  );
}
