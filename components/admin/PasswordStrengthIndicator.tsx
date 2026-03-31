'use client';

import { checkPasswordStrength } from '@/lib/passwordStrength';
import { FiCheck, FiX } from 'react-icons/fi';

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

/**
 * Shows password strength requirements - updates live as user types.
 * Unmet requirements shown first so user sees what's left to do.
 */
export function PasswordStrengthIndicator({ password, className = '' }: PasswordStrengthIndicatorProps) {
  const checks = checkPasswordStrength(password || '');
  const allMet = checks.every((c) => c.met);
  const hasInput = (password || '').length > 0;

  // Show unmet first (what user still needs), then met (progress)
  const sorted = [...checks].sort((a, b) => (a.met === b.met ? 0 : a.met ? 1 : -1));

  return (
    <div className={`mt-1.5 space-y-1 transition-opacity duration-200 ${className}`}>
      {!hasInput ? (
        <ul className="space-y-1">
          {checks.map((check, i) => (
            <li key={i} className="flex items-center gap-2 text-xs text-slate-400">
              <FiX className="h-3.5 w-3.5 shrink-0" />
              <span>{check.label}</span>
            </li>
          ))}
        </ul>
      ) : allMet ? (
        <div className="flex items-center gap-2 text-xs text-green-600 font-medium">
          <FiCheck className="h-4 w-4 shrink-0" />
          <span>Password meets all requirements</span>
        </div>
      ) : (
        <>
          <p className="text-xs font-medium text-slate-600">
            {checks.filter((c) => !c.met).length} more to go:
          </p>
          <ul className="space-y-1">
            {sorted.map((check, i) => (
              <li
                key={i}
                className={`flex items-center gap-2 text-xs transition-colors duration-150 ${
                  check.met ? 'opacity-75' : ''
                }`}
              >
                {check.met ? (
                  <FiCheck className="h-3.5 w-3.5 text-green-600 shrink-0" />
                ) : (
                  <FiX className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                )}
                <span className={check.met ? 'text-green-700' : 'text-slate-700 font-medium'}>
                  {check.label}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
