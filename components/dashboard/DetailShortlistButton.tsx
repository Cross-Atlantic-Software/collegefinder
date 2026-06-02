"use client";

import { FaHeart, FaRegHeart } from "react-icons/fa";
import { Button } from "@/components/shared";

type DetailShortlistButtonProps = {
  isShortlisted: boolean;
  isSaving: boolean;
  onClick: () => void;
  /** e.g. "Shortlist exam", "Shortlist college" */
  shortlistLabel: string;
  disabled?: boolean;
};

/** Shared shortlist CTA for exam, college, scholarship, and coaching detail sidebars. */
export function DetailShortlistButton({
  isShortlisted,
  isSaving,
  onClick,
  shortlistLabel,
  disabled = false,
}: DetailShortlistButtonProps) {
  return (
    <Button
      type="button"
      variant={isShortlisted ? "themeButtonOutline" : "themeButton"}
      size="sm"
      className="w-full justify-center !rounded-full"
      onClick={onClick}
      disabled={disabled || isSaving}
    >
      {isSaving ? (
        "Saving..."
      ) : isShortlisted ? (
        <>
          <FaHeart className="h-4 w-4 shrink-0" aria-hidden />
          Shortlisted
        </>
      ) : (
        <>
          <FaRegHeart className="h-4 w-4 shrink-0" aria-hidden />
          {shortlistLabel}
        </>
      )}
    </Button>
  );
}
