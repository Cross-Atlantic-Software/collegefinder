'use client';

type AdminListPaginationProps = {
  total: number;
  page: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  /** Extra classes on the outer bar (e.g. dark mode border). */
  className?: string;
};

export function AdminListPagination({
  total,
  page,
  pageSize = 10,
  onPageChange,
  className = '',
}: AdminListPaginationProps) {
  if (total <= 0) return null;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const rangeStart = (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, total);

  return (
    <div
      className={`flex flex-col gap-2 border-t border-slate-200 bg-[#F6F8FA] px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-800/40 ${className}`}
    >
      <p className="text-xs text-slate-600 dark:text-slate-400">
        Showing {rangeStart}–{rangeEnd} of {total}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, safePage - 1))}
          disabled={safePage <= 1}
          className="rounded border border-slate-300 bg-white px-2.5 py-1 text-xs hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:hover:bg-slate-800"
        >
          Prev
        </button>
        <span className="text-xs text-slate-700 dark:text-slate-300">
          Page {safePage} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
          disabled={safePage >= totalPages}
          className="rounded border border-slate-300 bg-white px-2.5 py-1 text-xs hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:hover:bg-slate-800"
        >
          Next
        </button>
      </div>
    </div>
  );
}
