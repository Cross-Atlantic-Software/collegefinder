'use client';

import { FiCopy } from 'react-icons/fi';
import { useToast } from '@/components/shared';

type SectionCardProps = {
  title: string;
  copyText: string;
  children: React.ReactNode;
  className?: string;
};

export function SectionCard({ title, copyText, children, className = '' }: SectionCardProps) {
  const { showSuccess, showError } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyText);
      showSuccess('Copied to clipboard');
    } catch {
      showError('Could not copy');
    }
  };

  return (
    <section
      className={`rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
        >
          <FiCopy className="h-3.5 w-3.5" />
          Copy
        </button>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}
