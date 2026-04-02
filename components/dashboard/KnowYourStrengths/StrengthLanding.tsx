"use client";

import { FaCheckCircle, FaPlayCircle } from "react-icons/fa";
import { Button } from "@/components/shared";

interface StrengthLandingProps {
  onTakeTest: () => void;
}

export default function StrengthLanding({ onTakeTest }: StrengthLandingProps) {
  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <div className="flex-1">
            <h2 className="mb-3 text-sm font-bold text-slate-900 dark:text-slate-100">
              Strength Analyzer
            </h2>
            <p className="mb-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Discover your natural strengths through a scientifically backed assessment
              powered by Gallup Strengths Psychology. Understand what makes you unique
              and use that knowledge to make better academic and career decisions.
            </p>
            <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Strengths Masters is an organisation of high-performing, Gallup-Certified
              Strengths Coaches with over a decade of experience. They have guided
              thousands of students and parents across multiple countries.
            </p>
          </div>

          {/* Video Placeholder */}
          <div className="w-full lg:w-72 flex-shrink-0">
            <a
              href="https://www.strengthsmasters.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block aspect-video cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition-colors hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                <FaPlayCircle className="h-12 w-12 text-[#FAD53C] transition-all group-hover:scale-110" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-3">
                <p className="text-slate-100 text-sm font-medium">Learn More About Strengths Masters</p>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            <span className="block h-0.5 w-8 rounded-full bg-[#FAD53C]" />
            How this will Help?
          </h3>
          <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
            <li className="flex items-start gap-2">
              <FaCheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#b88900]" />
              <span>Identify your top 5 natural strengths backed by Gallup science</span>
            </li>
            <li className="flex items-start gap-2">
              <FaCheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#b88900]" />
              <span>Get personalized career recommendations aligned with who you are</span>
            </li>
            <li className="flex items-start gap-2">
              <FaCheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#b88900]" />
              <span>Make better stream and subject selection decisions for Class 8+</span>
            </li>
            <li className="flex items-start gap-2">
              <FaCheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#b88900]" />
              <span>Receive a comprehensive report from a certified strengths coach</span>
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            <span className="block h-0.5 w-8 rounded-full bg-[#FAD53C]" />
            Why is it important?
          </h3>
          <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
            <li className="flex items-start gap-2">
              <FaCheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#b88900]" />
              <span>When strengths are understood early, decisions become clearer</span>
            </li>
            <li className="flex items-start gap-2">
              <FaCheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#b88900]" />
              <span>Students who know their strengths outperform academically and professionally</span>
            </li>
            <li className="flex items-start gap-2">
              <FaCheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#b88900]" />
              <span>Avoid choosing careers based on trends - choose based on your natural talent</span>
            </li>
            <li className="flex items-start gap-2">
              <FaCheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#b88900]" />
              <span>Trusted by organisations and students across 14+ countries</span>
            </li>
          </ul>
        </div>
      </div>

      {/* CTA */}
      <div className="flex justify-center pt-2">
        <Button variant="themeButton" size="sm" onClick={onTakeTest} className="!text-sm !rounded-full !border-black !bg-black !text-[#FAD53C] transition-all duration-200 hover:!bg-black/90 active:scale-95">
          Take the Test
        </Button>
      </div>
    </div>
  );
}
