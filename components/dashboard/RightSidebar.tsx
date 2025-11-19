import Link from "next/link";
import { FaCalendarAlt } from "react-icons/fa";
import { HiCalendarDateRange } from "react-icons/hi2";
import { Button } from "../shared";
import { FaArrowRightLong } from "react-icons/fa6";

export default function RightSidebar() {
  return (
    <>
      {/* Urgent banner */}
      <section className="rounded-md bg-lightGradient p-4 text-xs text-slate-900 shadow-lg">
        <p className="text-lg font-semibold uppercase tracking-wide text-pink">
          Urgent & Important
        </p>
        <p className="mt-2 text-sm font-semibold">
          IIT Madras B.Sc. (Bachelor of Science)
        </p>
        <p className="mt-1 text-[11px]">
          Based on your profile, this exam is highly recommended.
        </p>
      </section>

      {/* Upcoming deadlines */}
      <section className="rounded-md bg-white/5 p-4 text-slate-200">
        <h3 className="text-lg font-semibold">Upcoming Deadlines</h3>
        <p className="mt-1 text-sm text-slate-300">
          Based on your profile
        </p>
        <div className="mt-3 space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-md bg-white/5 px-3 py-2.5"
            >
              <p className="text-pink flex gap-2 text-sm items-center mb-2"> <FaCalendarAlt /> Nov 15, 2025</p>
              <p className="font-semibold text-lg">JEE (Main)</p>
              <p className="text-slate-200 text-xs">Registration opens</p>
            </div>
          ))}
        </div>
      </section>

      {/* Eligible exams */}
      <section className="rounded-md bg-white/5 p-4 text-slate-200">
        <h3 className="text-lg font-semibold">Eligible Exams</h3>
        <p className="mt-1 text-sm text-slate-300">
          Based on your profile
        </p>

        <div className="mt-3 flex items-center gap-2 flex-col bg-lightGradient p-5 rounded-md">
          <span className="text-4xl font-semibold text-pink block">~18</span>
          <span className="text-sm text-slate-600">
            Matching exams found
          </span>
        </div>

        <div className="mt-3 space-y-2">
          {["JEE Main", "BITSAT", "VITEEE"].map((exam) => (
            <Link
              href='/'
              key={exam}
              className="flex items-center justify-between rounded-md bg-white/5 px-4 py-3 text-md font-medium text-white shadow-sm hover:bg-pink transition duration-500 hover:text-white group"
            >
              <span>{exam}</span>
              <span className="rounded bg-pink px-3 py-1 text-xs font-semibold tracking-wide text-white group-hover:bg-white group-hover:text-pink transition duration-500">
                ELIGIBLE
              </span>
            </Link>
          ))}
        </div>

        <Button variant="DarkGradient" size="md" className="w-full mt-4 justify-center rounded-full gap-2" href="/exams/eligible">See Full List <FaArrowRightLong /></Button>
      </section>
    </>
  );
}
