import { BiBell, BiMenu, BiPlus, BiSearch } from "react-icons/bi";
import { Button } from "../shared";

type TopBarProps = {
  onToggleSidebar: () => void;
};

export default function TopBar({ onToggleSidebar }: TopBarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/20">
      <div className="flex items-center gap-3 px-4 py-3 md:px-6">
        {/* Mobile sidebar toggle */}
        <button
          onClick={onToggleSidebar}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900/80 md:hidden"
        >
          <BiMenu className="h-8 w-8" />
        </button>

        {/* Search */}
        <div className="flex-1">
          <div className="flex items-center gap-2 rounded-full bg-white/10 p-3 text-xs text-slate-300">
            <BiSearch className="text-xl"/>
            <input
              placeholder="Search exams, tutorials, colleges..."
              className="w-full bg-transparent text-[13px] outline-none placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Right side */}
        <button className="relative inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 hover:bg-pink transition duration-500">
          <BiBell className="h-4 w-4" />
          <span className="absolute top-1 right-1 h-3 w-3 rounded-full bg-red-400" />
        </button>

      </div>
    </header>
  );
}
