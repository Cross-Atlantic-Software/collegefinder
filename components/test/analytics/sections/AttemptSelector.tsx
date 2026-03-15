'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Check, FileText } from 'lucide-react';
import type { AnalyticsSummaryAttempt } from '@/api/tests';
import { attemptLabel, accuracyColor, fmt } from '../utils';

interface AttemptSelectorProps {
  attempts: AnalyticsSummaryAttempt[];
  selectedAttemptId: number | null;
  onSelect: (id: number) => void;
}

export default function AttemptSelector({
  attempts,
  selectedAttemptId,
  onSelect,
}: AttemptSelectorProps) {
  const [open, setOpen] = useState(false);
  const [focusIdx, setFocusIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selected = attempts.find((a) => a.id === selectedAttemptId) ?? null;

  const close = useCallback(() => {
    setOpen(false);
    setFocusIdx(-1);
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) close();
    }
    if (open) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open, close]);

  useEffect(() => {
    if (open && focusIdx >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-item]');
      items[focusIdx]?.scrollIntoView({ block: 'nearest' });
    }
  }, [focusIdx, open]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setOpen(true);
        setFocusIdx(attempts.findIndex((a) => a.id === selectedAttemptId));
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusIdx((prev) => Math.min(prev + 1, attempts.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusIdx((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusIdx >= 0 && focusIdx < attempts.length) {
          onSelect(attempts[focusIdx].id);
          close();
        }
        break;
      case 'Escape':
        e.preventDefault();
        close();
        break;
    }
  }

  function shortDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 min-w-0">
      <label className="text-xs text-slate-400 uppercase tracking-wider whitespace-nowrap">
        Viewing Attempt
      </label>

      <div ref={containerRef} className="relative flex-1 min-w-0" onKeyDown={handleKeyDown}>
        {/* Trigger */}
        <button
          type="button"
          onClick={() => {
            setOpen((v) => !v);
            if (!open) setFocusIdx(attempts.findIndex((a) => a.id === selectedAttemptId));
          }}
          className="w-full flex items-center gap-3 rounded-xl bg-white/[0.06] border border-white/10 hover:border-white/20 px-4 py-2.5 text-left transition focus:outline-none focus:ring-2 focus:ring-pink-500/50"
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <FileText className="w-4 h-4 text-pink-400 flex-shrink-0" />
          <span className="flex-1 min-w-0 truncate text-sm font-medium text-white">
            {selected ? attemptLabel(selected) : 'Select attempt'}
          </span>
          {selected && (
            <span className={`text-xs flex-shrink-0 ${accuracyColor(selected.accuracy_percentage)}`}>
              {fmt(selected.accuracy_percentage, 0)}%
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Dropdown menu */}
        {open && (
          <div
            ref={listRef}
            role="listbox"
            className="absolute z-50 mt-2 w-full max-h-72 overflow-y-auto rounded-xl bg-[#1a1a2e]/95 backdrop-blur-xl border border-white/15 shadow-2xl shadow-black/40 py-1.5 animate-in fade-in slide-in-from-top-2 duration-150"
          >
            {attempts.map((a, idx) => {
              const isSelected = a.id === selectedAttemptId;
              const isFocused = idx === focusIdx;
              return (
                <button
                  key={a.id}
                  type="button"
                  data-item
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onSelect(a.id);
                    close();
                  }}
                  onMouseEnter={() => setFocusIdx(idx)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    isFocused ? 'bg-white/10' : ''
                  } ${isSelected ? 'bg-pink-500/10' : ''}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-medium truncate ${
                          isSelected ? 'text-pink-300' : 'text-white'
                        }`}
                      >
                        {attemptLabel(a)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-slate-500">{shortDate(a.completed_at)}</span>
                      <span className="text-xs text-pink-400/70">{a.total_score} pts</span>
                      <span className={`text-xs ${accuracyColor(a.accuracy_percentage)}`}>
                        {fmt(a.accuracy_percentage, 0)}% acc
                      </span>
                    </div>
                  </div>
                  <div className="w-5 flex-shrink-0 flex justify-center">
                    {isSelected && <Check className="w-4 h-4 text-pink-400" />}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
