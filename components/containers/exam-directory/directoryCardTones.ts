/** Playbook feature card colors — blue and amber, alternating. */
export const DIRECTORY_CARD_BG = ["bg-[#cfe0f1]", "bg-amber-100"] as const;

/** Keeps sparse directory cards and lock overlays the same height in every grid row. */
export const DIRECTORY_CARD_MIN_HEIGHT_CLASS = "min-h-[17.5rem]" as const;

export const DIRECTORY_CARD_GRID_CLASS =
  "grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 [&>*]:h-full [&>*]:min-h-[17.5rem]" as const;

export function directoryCardBgClass(toneIndex: number): (typeof DIRECTORY_CARD_BG)[number] {
  return DIRECTORY_CARD_BG[toneIndex % DIRECTORY_CARD_BG.length];
}
