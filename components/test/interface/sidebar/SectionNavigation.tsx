'use client'

interface SectionDef {
  name: string;
  subsections: Record<string, { questions: number; type?: string }>;
}

interface SectionNavigationProps {
  sections: Record<string, SectionDef>;
  currentSection: string;
  sectionProgress: Record<string, { name: string; attempted: number; total: number }>;
  currentSubsection: 'section_a' | 'section_b';
  onSectionChange: (sectionKey: string) => void;
  onSubsectionChange: (subsection: 'section_a' | 'section_b') => void;
}

export default function SectionNavigation({
  sections,
  currentSection,
  sectionProgress,
  currentSubsection,
  onSectionChange,
  onSubsectionChange,
}: SectionNavigationProps) {
  return (
    <div className="w-56 bg-slate-800/95 border-r border-slate-700 flex flex-col overflow-y-auto shrink-0">
      <div className="px-4 py-3.5 border-b border-slate-700/80">
        <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Sections</h3>
      </div>
      <div className="p-2.5 flex-1 space-y-3">
        {Object.entries(sections).map(([sectionKey, section]) => {
          const total = Object.values(section.subsections).reduce((s: number, sub) => s + sub.questions, 0);
          const attempted = sectionProgress[sectionKey]?.attempted || 0;
          const progressPct = total > 0 ? Math.round((attempted / total) * 100) : 0;
          const isActive = currentSection === sectionKey;
          return (
            <div key={sectionKey} className="rounded-lg overflow-hidden border border-slate-700/60 bg-slate-800/50">
              <button
                onClick={() => onSectionChange(sectionKey)}
                className={`w-full text-left px-3.5 py-3 rounded-t-lg transition-all duration-150 text-sm border-l-2 ${
                  isActive
                    ? 'bg-pink-600/20 text-white border-pink-500'
                    : 'text-slate-300 hover:bg-slate-700/70 border-transparent hover:border-slate-600'
                }`}
              >
                <div className="font-semibold text-slate-200">{section.name}</div>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 h-1 rounded-full bg-slate-700 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-pink-500/80 transition-all duration-300"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 tabular-nums shrink-0">{attempted}/{total}</span>
                </div>
              </button>
              {isActive && Object.entries(section.subsections).map(([subKey, subsection]) => (
                <button
                  key={subKey}
                  onClick={() => onSubsectionChange(subKey as 'section_a' | 'section_b')}
                  className={`w-full text-left pl-4 pr-3 py-2.5 first:border-t first:border-slate-700/50 text-xs transition last:rounded-b-lg ${
                    currentSubsection === subKey
                      ? 'bg-pink-500/25 text-pink-300 font-medium'
                      : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-300'
                  }`}
                >
                  <span className="text-slate-500 font-normal">Sec {subKey.split('_')[1]?.toUpperCase()}</span>
                  <span className="mx-1.5 text-slate-600">·</span>
                  {subsection.type}
                  <span className="ml-1 text-slate-500">{subsection.questions}Q</span>
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
