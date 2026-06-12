"use client";

import { useMemo, useState } from "react";
import { FaCheckCircle, FaGraduationCap, FaArrowRight } from "react-icons/fa";
import { Button, Select } from "@/components/shared";
import CounsellingCollegeCard from "./CounsellingCollegeCard";
import {
  DUMMY_COUNSELLING_EXAMS,
  getDummyCollegesForRank,
  RANK_SOURCE_LABELS,
  type RankSource,
} from "./dummyData";

type Step = "exam" | "rank" | "results";

const STEPS: { id: Step; label: string }[] = [
  { id: "exam", label: "Choose exam" },
  { id: "rank", label: "Enter rank" },
  { id: "results", label: "Your colleges" },
];

const RANK_TABS: { id: RankSource; label: string; description: string }[] = [
  {
    id: "actual",
    label: "Actual AIR",
    description: "Enter your official All India Rank from the exam result.",
  },
  {
    id: "unitracko",
    label: "Unitracko Rank",
    description: "Use the rank synced from your Unitracko profile or mock performance.",
  },
  {
    id: "unitracko_predictor",
    label: "Unitracko Predictor",
    description: "Use the predicted rank from Unitracko’s rank predictor tool.",
  },
];

export default function Counselling() {
  const [step, setStep] = useState<Step>("exam");
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [rankSource, setRankSource] = useState<RankSource>("actual");
  const [rankInput, setRankInput] = useState("");
  const [submittedRank, setSubmittedRank] = useState<number | null>(null);
  const [submittedSource, setSubmittedSource] = useState<RankSource>("actual");

  const examOptions = useMemo(
    () =>
      DUMMY_COUNSELLING_EXAMS.map((exam) => ({
        value: exam.id,
        label: exam.name,
      })),
    []
  );

  const selectedExam = DUMMY_COUNSELLING_EXAMS.find((e) => e.id === selectedExamId);
  const parsedRank = parseInt(rankInput.replace(/\D/g, ""), 10);
  const rankValid = Number.isFinite(parsedRank) && parsedRank > 0;

  const colleges = useMemo(() => {
    if (!selectedExamId || submittedRank == null) return [];
    return getDummyCollegesForRank(selectedExamId, submittedRank);
  }, [selectedExamId, submittedRank]);

  const handleShowResults = () => {
    if (!rankValid || !selectedExamId) return;
    setSubmittedRank(parsedRank);
    setSubmittedSource(rankSource);
    setStep("results");
  };

  const handleStartOver = () => {
    setStep("exam");
    setSelectedExamId(null);
    setRankInput("");
    setSubmittedRank(null);
    setRankSource("actual");
    setSubmittedSource("actual");
  };

  const currentStepIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <div className="w-full min-h-screen bg-[#f5f9ff] text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <section className="w-full bg-[#f5f9ff]">
        <header className="border-b border-slate-200 bg-white px-4 pt-2 pb-0 dark:border-slate-800 dark:bg-slate-900 md:px-6">
          <div className="min-w-0">
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Counselling
            </p>
            <p className="mt-0.5 pb-3 text-xs text-slate-500 dark:text-slate-400">
              Choose your exam, enter your rank, and explore colleges you may get based on
              closing ranks.
            </p>
          </div>
        </header>

        <div
          className="bg-[#f8fbff] p-4 dark:bg-slate-950/40 md:p-6"
          style={{ animation: "fade-in 220ms ease-out" }}
        >
          {/* Step indicator */}
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-[#f8fbff] text-[#b88900] dark:border-slate-700 dark:bg-slate-800">
                  <FaGraduationCap className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    College counselling preview
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Structure only — real data integration coming soon.
                  </p>
                </div>
              </div>

              <ol className="flex flex-wrap items-center gap-2">
                {STEPS.map((s, index) => {
                  const isActive = s.id === step;
                  const isComplete = index < currentStepIndex;
                  return (
                    <li key={s.id} className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                          isActive
                            ? "border-slate-900 bg-slate-900 text-[#FAD53C] dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
                            : isComplete
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300"
                              : "border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
                        }`}
                      >
                        {isComplete ? (
                          <FaCheckCircle className="h-3 w-3" />
                        ) : (
                          <span>{index + 1}</span>
                        )}
                        {s.label}
                      </span>
                      {index < STEPS.length - 1 && (
                        <span className="hidden h-px w-4 bg-slate-200 dark:bg-slate-700 sm:block" />
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>

          {/* Step 1 — Choose exam */}
          {step === "exam" && (
            <div className="mx-auto max-w-xl space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h2 className="mb-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Step 1 — Select your exam
                </h2>
                <p className="mb-5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  Choose the entrance exam you want counselling guidance for. Dummy exams are
                  shown for now.
                </p>

                <label className="mb-2 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Exam
                </label>
                <Select
                  options={examOptions}
                  value={selectedExamId}
                  onChange={setSelectedExamId}
                  placeholder="Select an exam…"
                  isClearable
                />

                {selectedExam && (
                  <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Selected
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {selectedExam.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Code: {selectedExam.code}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button
                  variant="themeButton"
                  size="sm"
                  disabled={!selectedExamId}
                  onClick={() => setStep("rank")}
                  className="inline-flex items-center gap-2 !rounded-full !border-black !bg-black !text-[#FAD53C] !text-sm transition-all duration-200 hover:!bg-black/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continue
                  <FaArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2 — Enter rank */}
          {step === "rank" && (
            <div className="mx-auto max-w-2xl space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h2 className="mb-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Step 2 — Enter your AIR rank
                </h2>
                <p className="mb-5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  Choose how you want to provide your rank, then enter the number below.
                </p>

                {selectedExam && (
                  <div className="mb-5 rounded-xl border border-[#FAD53C]/30 bg-[#FAD53C]/10 px-3 py-2 text-xs text-slate-700 dark:text-slate-200">
                    Exam: <span className="font-semibold">{selectedExam.name}</span>
                  </div>
                )}

                <div className="relative -mb-px flex gap-1 overflow-x-auto border-b border-slate-200 scrollbar-hide dark:border-slate-700">
                  {RANK_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setRankSource(tab.id)}
                      className={`flex min-w-max items-center border-b-2 border-transparent px-4 py-2.5 text-sm font-medium transition-colors duration-300 ${
                        rankSource === tab.id
                          ? "border-b-slate-900 text-slate-900 dark:border-b-slate-100 dark:text-slate-100"
                          : "text-black/30 hover:text-black/60 dark:text-white/40 dark:hover:text-white/75"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="pt-5">
                  <p className="mb-4 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    {RANK_TABS.find((t) => t.id === rankSource)?.description}
                  </p>

                  <label
                    htmlFor="counselling-rank"
                    className="mb-2 block text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    {RANK_SOURCE_LABELS[rankSource]}
                  </label>
                  <input
                    id="counselling-rank"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={rankInput}
                    onChange={(e) => setRankInput(e.target.value.replace(/\D/g, ""))}
                    placeholder="e.g. 4500"
                    className="w-full rounded-xl border border-slate-200 bg-[#f8fbff] px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-500"
                  />
                  {!rankValid && rankInput.length > 0 && (
                    <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                      Enter a valid rank greater than 0.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                <Button
                  variant="themeButtonOutline"
                  size="sm"
                  onClick={() => setStep("exam")}
                  className="!rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                >
                  Back
                </Button>
                <Button
                  variant="themeButton"
                  size="sm"
                  disabled={!rankValid}
                  onClick={handleShowResults}
                  className="inline-flex items-center justify-center gap-2 !rounded-full !border-black !bg-black !text-[#FAD53C] !text-sm transition-all duration-200 hover:!bg-black/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Show my colleges
                  <FaArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3 — Results */}
          {step === "results" && selectedExam && submittedRank != null && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Colleges you could get
                    </h2>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Preview based on {selectedExam.name} and{" "}
                      {RANK_SOURCE_LABELS[submittedSource].toLowerCase()}{" "}
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {submittedRank.toLocaleString("en-IN")}
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="themeButtonOutline"
                      size="sm"
                      onClick={() => setStep("rank")}
                      className="!rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                    >
                      Change rank
                    </Button>
                    <Button
                      variant="themeButtonOutline"
                      size="sm"
                      onClick={handleStartOver}
                      className="!rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                    >
                      Start over
                    </Button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {(["High", "Moderate", "Reach"] as const).map((tier) => {
                    const count = colleges.filter((c) => c.probability === tier).length;
                    return (
                      <div
                        key={tier}
                        className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2 text-center dark:border-slate-800 dark:bg-slate-800/50"
                      >
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{tier}</p>
                        <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                          {count}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {colleges.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    No matching colleges in preview data
                  </p>
                  <p className="mx-auto mt-2 max-w-md text-xs text-slate-500 dark:text-slate-400">
                    Try a different rank or exam. This is dummy data for layout preview only.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {colleges.map((college) => (
                    <CounsellingCollegeCard
                      key={college.id}
                      college={college}
                      userRank={submittedRank}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
