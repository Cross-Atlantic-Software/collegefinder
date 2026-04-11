type DashboardHeaderProps = {
  fullName: string;
  airRank: string;
  stream: string;
  targetIntake: string;
  profileStrength: number;
};

export default function DashboardHeader({
  fullName,
  airRank,
  stream,
  targetIntake,
  profileStrength,
}: DashboardHeaderProps) {
  return (
    <section className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="px-4 py-2 md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">Dashboard</p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{fullName}</p>
          </div>

          <div className="ml-auto flex shrink-0 flex-wrap justify-end gap-2">
            <div className="min-w-[90px] rounded-lg bg-slate-50 px-2.5 py-2 text-left dark:bg-slate-800/80">
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">AIR</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">{airRank}</p>
            </div>
            <div className="min-w-[90px] rounded-lg bg-slate-50 px-2.5 py-2 text-left dark:bg-slate-800/80">
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Stream</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">{stream}</p>
            </div>
            <div className="min-w-[90px] rounded-lg bg-slate-50 px-2.5 py-2 text-left dark:bg-slate-800/80">
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Intake</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">{targetIntake}</p>
            </div>
            <div className="min-w-[90px] rounded-lg bg-slate-50 px-2.5 py-2 text-left dark:bg-slate-800/80">
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Profile</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">{profileStrength}%</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
