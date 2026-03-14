'use client'

interface KPICardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}

export default function KPICard({ label, value, sub, accent = false }: KPICardProps) {
  return (
    <div className="bg-white/10 rounded-xl p-4 flex flex-col gap-1 border border-white/5">
      <p className="text-xs text-slate-400 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold ${accent ? 'text-pink-400' : 'text-white'}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  );
}
