'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FiChevronDown, FiCheck } from 'react-icons/fi';

export interface DropdownOption<T = string> {
  value: T;
  label: string;
}

interface DropdownProps<T extends string | number | boolean = string> {
  options: DropdownOption<T>[];
  value: T | null | undefined;
  onChange: (value: T) => void;
  placeholder?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  /** Render trigger with status badge styling (e.g. Active=green, Disabled=gray) */
  variant?: 'default' | 'status';
  className?: string;
  title?: string;
}

export function Dropdown<T extends string | number | boolean = string>({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  disabled = false,
  size = 'md',
  variant = 'default',
  className = '',
  title,
}: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);
  const displayLabel = selected?.label ?? placeholder;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sizeClasses = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm';
  const isActive = variant === 'status' && (value === true || value === 'true');
  const statusBg =
    variant === 'status' && isActive
      ? 'bg-green-100 text-green-800'
      : variant === 'status' && !isActive && value !== undefined && value !== null
        ? 'bg-gray-100 text-gray-800'
        : 'bg-white text-gray-700 border border-gray-300';

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen((o) => !o)}
        disabled={disabled}
        title={title}
        className={`
          inline-flex items-center gap-1.5 rounded-lg font-medium outline-none transition-colors
          focus:ring-2 focus:ring-pink focus:ring-offset-1
          disabled:cursor-not-allowed disabled:opacity-60
          ${sizeClasses}
          ${className.includes('w-full') ? 'w-full justify-between' : ''}
          ${variant === 'status' ? `${statusBg} min-w-[90px] justify-between` : `${statusBg} hover:border-pink/50`}
        `}
      >
        <span>{displayLabel}</span>
        <FiChevronDown
          className={`h-3.5 w-3.5 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute left-0 top-full z-[9999] mt-1 min-w-full overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
          style={{ boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)' }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`
                  flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors
                  hover:bg-pink/10
                  ${isSelected ? 'bg-pink/10 text-pink font-medium' : 'text-gray-700'}
                `}
              >
                {isSelected ? (
                  <FiCheck className="h-4 w-4 shrink-0 text-pink" />
                ) : (
                  <span className="w-4" />
                )}
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Dropdown;
