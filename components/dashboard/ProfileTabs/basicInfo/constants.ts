export const genderOptions = [
  { label: "Male", icon: "/icons/male.png" },
  { label: "Female", icon: "/icons/female.png" },
  { label: "Prefer not to say", icon: "/icons/not-say.png" },
];

export const inputBase =
  "w-full rounded-xl border border-black/15 bg-[#f8fbff] px-3 py-2 text-sm text-black placeholder:text-black/30 transition-all duration-200 focus:outline-none focus:border-[#FAD53C] focus:ring-1 focus:ring-[#FAD53C]";

// A single inline [label : input] field — use inside a 2-col grid
export const fieldRow = "flex items-center gap-3 min-w-0";
export const fieldLabel = "shrink-0 text-xs font-semibold text-black/55 w-[100px] text-right leading-tight";
export const fieldGrid = "grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3";

export const floatingLabelClass = (hasValue: boolean) =>
  [
    "pointer-events-none absolute left-4 z-10 px-1 font-medium transition-all duration-200 ease-out",
    hasValue
      ? "top-0 -translate-y-1/2 text-[10px] text-black bg-[#f8fbff]"
      : "top-1/2 -translate-y-1/2 text-xs text-black/45 bg-transparent",
    "peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-[10px] peer-focus:text-black peer-focus:bg-[#f8fbff]",
  ].join(" ");
