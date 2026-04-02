"use client";

import { useState, useEffect } from "react";
import { FaStar, FaBriefcase, FaDownload, FaHourglassHalf } from "react-icons/fa";
import { getStrengthResults } from "@/api";
import type { StrengthResultData } from "@/api/strength";

export default function StrengthResults() {
  const [results, setResults] = useState<StrengthResultData | null>(null);
  const [hasResults, setHasResults] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await getStrengthResults();
        if (res.success && res.data) {
          setResults(res.data.results);
          setHasResults(res.data.has_results);
        }
      } catch (err) {
        console.error("Error fetching results:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-100" />
      </div>
    );
  }

  if (!hasResults || !results) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <FaHourglassHalf className="mx-auto mb-4 h-12 w-12 text-[#b88900]" />
        <h3 className="mb-2 text-xl font-semibold text-slate-900 dark:text-slate-100">Analysis In Progress</h3>
        <p className="mx-auto max-w-md text-sm text-slate-500 dark:text-slate-400">
          Your Strength Analysis is being prepared by our certified Gallup Strengths Coach.
          You will see your results here once the analysis is complete.
        </p>
      </div>
    );
  }

  const strengths: string[] = Array.isArray(results.strengths) ? results.strengths : [];
  const careers = Array.isArray(results.career_recommendations) ? results.career_recommendations : [];

  return (
    <div className="space-y-6">
      <h2 className="text-center text-2xl font-bold text-slate-900 dark:text-slate-100">Your Strength Analysis</h2>

      {/* Top 5 Strengths */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
          <FaStar className="text-[#b88900]" />
          Top 5 Strengths
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {strengths.map((strength, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center dark:border-slate-700 dark:bg-slate-800"
            >
              <span className="mb-1 block text-xs text-slate-500 dark:text-slate-400">#{idx + 1}</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{strength}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Career Recommendations */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
          <FaBriefcase className="text-[#b88900]" />
          Career Recommendations
        </h3>
        <div className="space-y-3">
          {careers.map((rec, idx) => (
            <div
              key={idx}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800 sm:flex-row"
            >
              <div className="flex-shrink-0">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#FAD53C]/35 text-sm font-bold text-[#8f6700]">
                  {idx + 1}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{rec.career}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{rec.details}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Report Download */}
      {results.report_url && (
        <div className="flex justify-center">
          <a
            href={results.report_url}
            download="strength-report.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-black bg-black px-8 py-3 text-sm font-medium text-[#FAD53C] transition duration-200 hover:bg-black/90"
          >
            <FaDownload className="w-4 h-4" />
            Download Full Report
          </a>
        </div>
      )}
    </div>
  );
}
