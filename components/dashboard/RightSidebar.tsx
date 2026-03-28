import Link from "next/link";
import { FaCalendarAlt } from "react-icons/fa";
import { Button } from "../shared";
import { FaArrowRightLong } from "react-icons/fa6";
import { FiCheckCircle } from "react-icons/fi";
import UrgentImportantSwiper from "./UrgentImportantSwiper";

export default function RightSidebar() {
  return (
    <>
      {/* Urgent banner */}
      <UrgentImportantSwiper />

      {/* Upcoming deadlines */}
      <section className="rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 text-slate-700 dark:text-slate-300 shadow-sm transition-all duration-300 hover:shadow-md animate-fade-in">
        <h3 className="type-heading">Upcoming Deadlines</h3>
        <p className="type-body mt-1">
          Based on your profile
        </p>
        <div className="mt-3 space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 px-4 py-3 transition-all duration-200 hover:border-action-500 dark:hover:border-action-500/50"
            >
              <p className="text-action-700 dark:text-action-500 flex gap-2 text-xs font-medium items-center mb-2"> <FaCalendarAlt className="h-3 w-3" /> Nov 15, 2025</p>
              <p className="font-bold text-slate-900 dark:text-slate-100">JEE (Main)</p>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Registration opens</p>
            </div>
          ))}
        </div>
      </section>

      {/* Eligible exams */}
      <section className="rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 text-slate-700 dark:text-slate-300 shadow-sm transition-all duration-300 hover:shadow-md animate-fade-in">
        <h3 className="type-heading">Eligible Exams</h3>
        <p className="type-body mt-1">
          Based on your profile
        </p>

        <div className="mt-4 flex items-center gap-2 flex-col bg-gradient-to-br from-action-50 to-highlight-100 dark:from-slate-700 dark:to-slate-700 p-6 rounded-lg border border-action-100 dark:border-slate-600">
          <span className="metric-value text-5xl text-brand-ink dark:text-white block">~18</span>
          <span className="metric-label">
            Matching exams found
          </span>
        </div>

        <div className="mt-3 space-y-2">
          {["JEE Main", "BITSAT", "VITEEE"].map((exam) => (
            <Link
              href='/'
              key={exam}
              className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100 transition-all duration-200 hover:border-action-500 dark:hover:border-action-500/50 hover:shadow-sm group"
            >
              <span>{exam}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-highlight-100 dark:bg-slate-600 px-3 py-1 text-xs font-semibold tracking-tight text-brand-ink dark:text-slate-100 transition-all duration-200">
                <FiCheckCircle className="h-3.5 w-3.5" />
                ELIGIBLE
              </span>
            </Link>
          ))}
        </div>

  <Button variant="themeButtonOutline" size="md" className="w-full mt-5 justify-center gap-2 rounded-full" href="/exams/eligible">See Full List <FaArrowRightLong className="h-3 w-3" /></Button>
      </section>
    </>
  );
}
