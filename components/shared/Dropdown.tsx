'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { FiChevronDown, FiCheck, FiSearch } from 'react-icons/fi';

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
  /** Show a search field to filter long option lists */
  searchable?: boolean;
  /** Max dropdown list height in px before scrolling (~36px per row; default shows ~5 items) */
  maxMenuHeight?: number;
  /** Render menu in a portal to avoid clipping inside scrollable modals */
  usePortal?: boolean;
}

const DEFAULT_MAX_MENU_HEIGHT = 180;

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
  searchable = false,
  maxMenuHeight = DEFAULT_MAX_MENU_HEIGHT,
  usePortal = true,
}: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number; width: number } | null>(
    null
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const menuId = useRef(`dropdown-${Math.random().toString(36).slice(2, 9)}`).current;

  const selected = options.find((o) => o.value === value);
  const displayLabel = selected?.label ?? placeholder;

  const filteredOptions = useMemo(() => {
    if (!searchable || !searchQuery.trim()) return options;
    const q = searchQuery.trim().toLowerCase();
    return options.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [options, searchQuery, searchable]);

  const updateMenuPosition = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMenuStyle({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setIsOpen(false);
      setSearchQuery('');
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      return;
    }

    updateMenuPosition();

    if (searchable) {
      requestAnimationFrame(() => searchInputRef.current?.focus());
    }

    if (!usePortal) return;

    const handleReposition = () => updateMenuPosition();
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);
    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [isOpen, searchable, usePortal]);

  const sizeClasses = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm';
  const isActive = variant === 'status' && (value === true || value === 'true');
  const statusBg =
    variant === 'status' && isActive
      ? 'bg-green-100 text-green-800'
      : variant === 'status' && !isActive && value !== undefined && value !== null
        ? 'bg-gray-100 text-gray-800'
        : 'bg-white text-gray-700 border border-gray-300';

  const menuContent = (
    <div
      ref={menuRef}
      id={`dropdown-menu-${menuId}`}
      className={
        usePortal
          ? 'fixed z-[99999] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg'
          : 'absolute left-0 top-full z-[9999] mt-1 min-w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg'
      }
      style={{
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
        ...(usePortal && menuStyle
          ? { top: menuStyle.top, left: menuStyle.left, width: menuStyle.width }
          : {}),
      }}
    >
      {searchable ? (
        <div className="border-b border-gray-100 p-2">
          <div className="relative">
            <FiSearch className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onMouseDown={(e) => e.stopPropagation()}
              placeholder="Search..."
              className="w-full rounded-lg border border-gray-200 py-1.5 pl-8 pr-2 text-sm outline-none focus:border-pink/50 focus:ring-1 focus:ring-pink/30"
            />
          </div>
        </div>
      ) : null}

      <div className="overflow-y-auto py-1" style={{ maxHeight: maxMenuHeight }}>
        {filteredOptions.length === 0 ? (
          <p className="px-3 py-2 text-sm text-gray-500">No matches found</p>
        ) : (
          filteredOptions.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                  setSearchQuery('');
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
          })
        )}
      </div>
    </div>
  );

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => {
          if (disabled) return;
          if (!isOpen) {
            updateMenuPosition();
            setIsOpen(true);
          } else {
            setIsOpen(false);
            setSearchQuery('');
          }
        }}
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
        <span className="truncate">{displayLabel}</span>
        <FiChevronDown
          className={`h-3.5 w-3.5 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (!usePortal || menuStyle) &&
        (usePortal && typeof document !== 'undefined'
          ? createPortal(menuContent, document.body)
          : menuContent)}
    </div>
  );
}

export default Dropdown;
