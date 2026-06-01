"use client";

import { FaHeart, FaRegHeart } from "react-icons/fa";

export type CardShortlistHeartProps = {
  isShortlisted: boolean;
  shortlistSaving: boolean;
  onShortlist: () => void;
  itemLabel: string;
};

export function CardShortlistHeart({
  isShortlisted,
  shortlistSaving,
  onShortlist,
  itemLabel,
}: CardShortlistHeartProps) {
  const ariaLabel = isShortlisted
    ? `Remove ${itemLabel} from shortlist`
    : `Shortlist ${itemLabel}`;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onShortlist();
      }}
      disabled={shortlistSaving}
      aria-pressed={isShortlisted}
      aria-label={ariaLabel}
      title={ariaLabel}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-rose-400"
    >
      {shortlistSaving ? (
        <span
          className="h-3.5 w-3.5 animate-pulse rounded-full bg-slate-300 dark:bg-slate-600"
          aria-hidden
        />
      ) : isShortlisted ? (
        <FaHeart className="h-4 w-4 text-rose-500 dark:text-rose-400" aria-hidden />
      ) : (
        <FaRegHeart className="h-4 w-4" aria-hidden />
      )}
    </button>
  );
}
