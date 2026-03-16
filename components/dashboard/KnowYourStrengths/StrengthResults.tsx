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
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-500/30 border-t-pink" />
      </div>
    );
  }

  if (!hasResults || !results) {
    return (
      <div className="rounded-md bg-white/5 border border-white/10 p-8 text-center">
        <FaHourglassHalf className="w-12 h-12 text-pink mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-100 mb-2">Analysis In Progress</h3>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
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
      <h2 className="text-2xl font-bold text-slate-100 text-center">Your Strength Analysis</h2>

      {/* Top 5 Strengths */}
      <div className="rounded-md bg-white/5 border border-white/10 p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
          <FaStar className="text-pink" />
          Top 5 Strengths
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {strengths.map((strength, idx) => (
            <div
              key={idx}
              className="rounded-md bg-white/5 border border-white/10 px-4 py-3 text-center"
            >
              <span className="text-xs text-slate-400 block mb-1">#{idx + 1}</span>
              <span className="text-sm font-semibold text-slate-100">{strength}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Career Recommendations */}
      <div className="rounded-md bg-white/5 border border-white/10 p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
          <FaBriefcase className="text-pink" />
          Career Recommendations
        </h3>
        <div className="space-y-3">
          {careers.map((rec, idx) => (
            <div
              key={idx}
              className="rounded-md bg-white/5 border border-white/10 p-4 flex flex-col sm:flex-row gap-3"
            >
              <div className="flex-shrink-0">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-pink/20 text-pink text-sm font-bold">
                  {idx + 1}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-100 text-sm">{rec.career}</p>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">{rec.details}</p>
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
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-pink text-white font-medium rounded-full text-sm border border-pink hover:bg-white hover:text-pink transition duration-500"
          >
            <FaDownload className="w-4 h-4" />
            Download Full Report
          </a>
        </div>
      )}
    </div>
  );
}
