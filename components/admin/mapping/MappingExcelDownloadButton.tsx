'use client';

import { FiDownload } from 'react-icons/fi';

type MappingExcelDownloadButtonProps = {
  onClick: () => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  /** Shown on the button when not loading. */
  label?: string;
};

/**
 * Styled “Download mapping Excel” control for admin → Mapping sub-pages.
 * Wire `onClick` to your API’s `downloadXxxMappingExcel()` (blob download).
 * New mapping sections can reuse this next to the template download.
 */
export default function MappingExcelDownloadButton({
  onClick,
  loading = false,
  disabled = false,
  label = 'Download mapping Excel',
}: MappingExcelDownloadButtonProps) {
  return (
    <button
      type="button"
      onClick={() => void onClick()}
      disabled={disabled || loading}
      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
    >
      <FiDownload className="h-4 w-4" />
      {loading ? 'Preparing…' : label}
    </button>
  );
}
