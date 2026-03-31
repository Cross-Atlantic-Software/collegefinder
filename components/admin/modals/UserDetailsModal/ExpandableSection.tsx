'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import { ReactNode } from 'react';

interface ExpandableSectionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export default function ExpandableSection({
  title,
  isExpanded,
  onToggle,
  children,
}: ExpandableSectionProps) {
  return (
    <div className="bg-white rounded-md border border-slate-200 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-[#F6F8FA] transition-colors"
      >
        <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">{title}</h4>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-slate-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-500" />
        )}
      </button>
      
      {isExpanded && (
        <div className="px-3 pb-3 border-t border-slate-200">
          <div className="pt-3 space-y-2">{children}</div>
        </div>
      )}
    </div>
  );
}

