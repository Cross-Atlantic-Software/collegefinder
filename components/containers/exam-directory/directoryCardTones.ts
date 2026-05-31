/** Playbook feature card colors — blue and amber, alternating. */
export const DIRECTORY_CARD_BG = ["bg-[#cfe0f1]", "bg-amber-100"] as const;

export function directoryCardBgClass(toneIndex: number): (typeof DIRECTORY_CARD_BG)[number] {
  return DIRECTORY_CARD_BG[toneIndex % DIRECTORY_CARD_BG.length];
}
