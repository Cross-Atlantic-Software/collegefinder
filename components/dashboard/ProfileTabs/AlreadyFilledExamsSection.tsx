"use client";

import { useMemo } from "react";
import Link from "next/link";
import { FiTrash2 } from "react-icons/fi";
import { useQuery } from "@tanstack/react-query";
import { getAcademics } from "@/api";
import { getAllExams } from "@/api/exams";
import { useUpdateAlreadyFilledFormMutation } from "@/lib/dashboardExamShortlistQueries";
import { Button } from "@/components/shared";

export function AlreadyFilledExamsSection() {
  const updateFilled = useUpdateAlreadyFilledFormMutation();

  const { data: academics } = useQuery({
    queryKey: ["profile-academics-filled"],
    queryFn: async () => {
      const res = await getAcademics();
      if (!res.success) throw new Error(res.message || "Failed to load academics");
      return res.data;
    },
    staleTime: 60_000,
  });

  const filledIds = useMemo(
    () =>
      Array.isArray((academics as { already_filled_form?: number[] })?.already_filled_form)
        ? (academics as { already_filled_form: number[] }).already_filled_form
        : [],
    [academics]
  );

  const { data: examNameById } = useQuery({
    queryKey: ["profile-exams-for-filled", filledIds.join(",")],
    queryFn: async () => {
      const res = await getAllExams();
      const map = new Map<number, string>();
      if (res.success && res.data?.exams) {
        for (const e of res.data.exams) {
          map.set(Number(e.id), e.name);
        }
      }
      return map;
    },
    enabled: filledIds.length > 0,
    staleTime: 120_000,
  });

  if (filledIds.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Already filled forms</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          No exams marked yet. Use &quot;Already Filled&quot; on an exam detail page.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Already filled forms</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        These exams appear in your shortlist and Applications → Completed.
      </p>
      <ul className="mt-3 space-y-2">
        {filledIds.map((examId) => {
          const name = examNameById?.get(examId) ?? `Exam #${examId}`;
          const removing =
            updateFilled.isPending && updateFilled.variables?.examId === examId;
          return (
            <li
              key={examId}
              className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800/50"
            >
              <Link
                href={`/dashboard/exams/${examId}?from=dashboard-profile`}
                className="text-sm font-medium text-slate-800 hover:underline dark:text-slate-200"
              >
                {name}
              </Link>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="!rounded-full !px-2 !py-1"
                disabled={removing}
                onClick={() => updateFilled.mutate({ examId, filled: false })}
                title="Remove from already filled"
              >
                <FiTrash2 className="h-3.5 w-3.5" />
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
