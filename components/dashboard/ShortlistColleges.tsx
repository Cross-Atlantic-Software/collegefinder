'use client';

import { useState, useEffect } from "react";
import { getRecommendedColleges } from "@/api/auth/profile";
import { MdSchool } from "react-icons/md";

type College = {
  id: number;
  college_name: string;
  college_location: string | null;
  college_type: string | null;
  college_logo: string | null;
};

export default function ShortlistColleges() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setMessage(null);
    getRecommendedColleges()
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.data?.colleges) {
          setColleges(res.data.colleges);
          if (res.data.message) setMessage(res.data.message);
        } else {
          setColleges([]);
        }
      })
      .catch(() => {
        if (!cancelled) setColleges([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <div>
      <h3 className="text-lg font-semibold text-slate-100 mb-4">College Shortlist</h3>
      <div className="grid gap-3 grid-cols-1 xl:grid-cols-2">
        {loading && (
          <div className="col-span-full py-6 text-center text-slate-400 text-sm">
            Loading recommended colleges…
          </div>
        )}
        {!loading && colleges.length === 0 && (
          <div className="col-span-full py-6 text-center text-slate-400 text-sm">
            {message || "No recommended colleges. Complete your profile (stream & interests) and ensure colleges are linked to your recommended exams."}
          </div>
        )}
        {!loading &&
          colleges.map((college) => (
            <div
              key={college.id}
              className="relative w-full overflow-hidden rounded-md bg-white/5 p-5 flex items-start gap-4"
            >
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-pink-50 text-3xl text-pink-500 shadow-sm dark:bg-pink-500/10 overflow-hidden">
                {college.college_logo ? (
                  <img
                    src={college.college_logo}
                    alt={college.college_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <MdSchool />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-lg font-semibold text-slate-100 truncate">
                  {college.college_name}
                </h4>
                {college.college_location && (
                  <p className="text-sm text-slate-300 mt-0.5 truncate">
                    {college.college_location}
                  </p>
                )}
                {college.college_type && (
                  <span className="inline-flex mt-2 rounded-full bg-slate-100/10 px-2.5 py-0.5 text-xs text-slate-300">
                    {college.college_type}
                  </span>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
