import { BiSearch } from "react-icons/bi";
import { IoFunnel } from "react-icons/io5";
import { Button } from "../shared";

export default function MiddleContent() {
  return (
    <>
      {/* Welcome card */}
      <section className="rounded-md bg-darkGradient p-5 text-sm shadow-xl hidden">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-xs text-pink-100/90">Welcome back,</p>
            <h1 className="text-xl font-semibold">Dinesh!</h1>
            <p className="mt-1 text-xs text-pink-100/90">
              Ready to level up your college journey?
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div className="rounded-xl bg-white/10 px-3 py-2">
              <p className="text-[11px] opacity-80">All India Rank</p>
              <p className="text-lg font-semibold">#2340</p>
            </div>
            <div className="rounded-xl bg-white/10 px-3 py-2">
              <p className="text-[11px] opacity-80">Profile Strength</p>
              <p className="text-lg font-semibold">85%</p>
            </div>
            <div className="rounded-xl bg-white/10 px-3 py-2">
              <p className="text-[11px] opacity-80">Day Streak</p>
              <p className="text-lg font-semibold">🔥 15</p>
            </div>
          </div>
        </div>
      </section>

      {/* Middle search bar */}
      <section className="flex items-center gap-2 rounded-full bg-white/10 p-1 pl-4 text-xs text-slate-300 hidden">
        <BiSearch className="text-xl"/>
        <input
          placeholder="Search exams, tutorials, colleges..."
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-slate-500"
        />
        <Button variant="themeButton" size="sm" className="flex gap-2"> <IoFunnel /> Filters</Button>
      </section>

      {/* Feed cards */}
      <section className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <article
            key={i}
            className="rounded-md bg-white/20 p-4 text-xs text-slate-200"
          >
            <h2 className="text-sm font-semibold">
              Why Winning Is Not Everything – Jack Sock Shows Amazing
              Sportsmanship
            </h2>
            <p className="mt-1 text-[11px] text-slate-400">
              By | April 13, 2019
            </p>
            <p className="mt-2 line-clamp-2 text-[12px] text-slate-300">
              In this day and age of cut-throat rivalries in the sporting world,
              athletes are rarely seen giving their opponents an edge of any
              sort. Winning at all costs is the norm...
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="DarkGradient" size="sm" className="!py-2"> Show More</Button>
              <Button variant="themeButton" size="sm" className="!py-2"> View More</Button>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
