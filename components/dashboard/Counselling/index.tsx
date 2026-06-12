"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { FaArrowRight, FaArrowLeft, FaSearch } from "react-icons/fa";
import { RoughNotation } from "react-rough-notation";
import Lottie, { LottieRefCurrentProps } from "lottie-react";
import eyeAnim    from "@/public/LottieiCONS/doodle-black-221-eye-hover-pinch.json";
import idCardAnim from "@/public/LottieiCONS/doodle-black-16-id-business-card-hover-pinch.json";
import folderAnim from "@/public/LottieiCONS/doodle-black-714-folder-user-hover-pinch.json";
import { Button } from "@/components/shared";
import CounsellingCollegeCard from "./CounsellingCollegeCard";
import {
  DUMMY_COUNSELLING_EXAMS,
  getDummyCollegesForRank,
  RANK_SOURCE_LABELS,
  type RankSource,
} from "./dummyData";

type Step = "welcome" | "exam" | "rank" | "loading" | "results";

const STEPPER_STEPS: { id: string; label: string }[] = [
  { id: "exam",    label: "Choose Exam"   },
  { id: "rank",    label: "Enter Rank"    },
  { id: "results", label: "Your Colleges" },
];

const RANK_OPTIONS: { id: RankSource; label: string; desc: string }[] = [
  { id: "actual",              label: "Actual AIR",     desc: "Official rank from result"  },
  { id: "unitracko",           label: "Unitracko Rank", desc: "Synced from your profile"   },
  { id: "unitracko_predictor", label: "UT Predictor",   desc: "AI predicted rank"          },
];

const STEP_LOTTIE: Record<string, object> = { exam: eyeAnim, rank: idCardAnim, results: folderAnim };

function DelayedLottie({ data, className }: { data: object; className?: string }) {
  const ref = useRef<LottieRefCurrentProps>(null);
  return (
    <Lottie lottieRef={ref} animationData={data} loop={false}
      onComplete={() => setTimeout(() => ref.current?.goToAndPlay(0, true), 1500)}
      className={className} />
  );
}

/* ── shimmer skeleton ── */
function ShimmerGrid() {
  return (
    <div className="space-y-6 p-6" style={{ animation: "fade-in 300ms ease-out" }}>
      {/* summary shimmer */}
      <div className="rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="h-3 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[0,1,2].map(i => (
            <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-4 dark:border-slate-800 dark:bg-slate-800">
              <div className="mx-auto h-2 w-12 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              <div className="mx-auto mt-2 h-5 w-8 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            </div>
          ))}
        </div>
      </div>
      {/* card shimmer grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            style={{ animationDelay: `${i * 80}ms` }}>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-2 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              </div>
            </div>
            <div className="mt-3 h-1.5 w-full animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[0,1,2,3].map(j => (
                <div key={j} className="rounded-lg bg-slate-50 px-2.5 py-2 dark:bg-slate-800">
                  <div className="h-2 w-10 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="mt-1 h-3 w-14 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Counselling() {
  const [step, setStep]                       = useState<Step>("welcome");
  const [selectedExamId, setSelectedExamId]   = useState<string | null>(null);
  const [rankSource, setRankSource]           = useState<RankSource>("actual");
  const [rankInput, setRankInput]             = useState("");
  const [submittedRank, setSubmittedRank]     = useState<number | null>(null);
  const [submittedSource, setSubmittedSource] = useState<RankSource>("actual");
  const [scribbleOn, setScribbleOn]           = useState(false);

  const isWizard    = step === "welcome" || step === "exam" || step === "rank";
  const stepperIdx  = STEPPER_STEPS.findIndex((s) => s.id === step);
  const selectedExam = DUMMY_COUNSELLING_EXAMS.find((e) => e.id === selectedExamId);
  const parsedRank   = parseInt(rankInput.replace(/\D/g, ""), 10);
  const rankValid    = Number.isFinite(parsedRank) && parsedRank > 0;

  const colleges = useMemo(() => {
    if (!selectedExamId || submittedRank == null) return [];
    return getDummyCollegesForRank(selectedExamId, submittedRank);
  }, [selectedExamId, submittedRank]);

  useEffect(() => {
    setScribbleOn(false);
    const t = setTimeout(() => setScribbleOn(true), 420);
    return () => clearTimeout(t);
  }, [step]);

  const handleShowResults = () => {
    if (!rankValid || !selectedExamId) return;
    setSubmittedRank(parsedRank);
    setSubmittedSource(rankSource);
    setStep("loading");
    // Simulate loading then show results
    setTimeout(() => setStep("results"), 1800);
  };

  const handleStartOver = () => {
    setStep("welcome");
    setSelectedExamId(null);
    setRankInput("");
    setSubmittedRank(null);
    setRankSource("actual");
  };

  const stepHeading = step === "exam" ? "Pick your exam"
    : step === "rank" && selectedExam ? `Your rank for ${selectedExam.name}`
    : "";

  const currentLottie = STEP_LOTTIE[step] ?? null;

  /* ── RESULTS / LOADING: full-page layout (no card wrapper) ── */
  if (step === "loading" || step === "results") {
    return (
      <div className="flex min-h-[calc(100vh-64px)] w-full flex-col bg-[#F6F8FA] text-slate-900 dark:bg-slate-950 dark:text-slate-50">
        {/* header bar */}
        <header className="sticky top-0 z-30 flex flex-col items-start justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 md:px-6 md:py-4 lg:flex-row lg:items-center">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setStep("rank")} aria-label="Go back"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-90 dark:border-slate-700 dark:bg-slate-800">
              <FaArrowLeft className="h-3 w-3" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {selectedExam ? `Colleges for ${selectedExam.name}` : "College Results"}
              </h1>
              {submittedRank != null && (
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {RANK_SOURCE_LABELS[submittedSource]} · Rank {submittedRank.toLocaleString("en-IN")}
                </p>
              )}
            </div>
          </div>

          {/* metrics top bar */}
          {step === "results" && (
            <div className="flex w-full items-center justify-around lg:w-auto lg:justify-end">
              {(["High", "Moderate", "Reach"] as const).map((tier, idx) => {
                const count = colleges.filter((c) => c.probability === tier).length;
                return (
                  <div key={tier} className={`flex flex-col items-center px-4 sm:px-6 ${idx !== 2 ? 'border-r border-slate-200 dark:border-slate-700' : ''}`}>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{tier}</span>
                    <span className={`text-lg font-black leading-tight ${tier === 'High' ? 'text-[#b88900] dark:text-[#FAD53C]' : 'text-slate-900 dark:text-slate-100'}`}>
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </header>

        {/* body */}
        {step === "loading" ? (
          <ShimmerGrid />
        ) : (
          <div className="flex-1 bg-[#f8fbff] p-4 dark:bg-slate-950/40 md:p-6" style={{ animation: "fade-in 300ms ease-out" }}>

            {colleges.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl bg-white px-4 py-16 text-center shadow-sm dark:bg-slate-900">
                <FaSearch className="mb-3 h-8 w-8 text-slate-200" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No matching colleges</p>
                <p className="mt-1 text-xs text-slate-400">Try a different rank or exam.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {colleges.map((col, i) => (
                  <CounsellingCollegeCard key={col.id} college={col} userRank={submittedRank!} index={i} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* sticky bottom bar */}
        {step === "results" && (
          <div className="sticky bottom-0 mt-auto w-full z-30 border-t border-slate-200 bg-white px-4 py-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] dark:border-slate-800 dark:bg-slate-900 md:px-6 md:py-4">
            <div className="mx-auto flex w-full max-w-7xl justify-end">
              <Button variant="themeButton" size="sm" onClick={handleStartOver}
                className="inline-flex items-center gap-2 !rounded-full !border-black !bg-black px-5 !text-[#FAD53C] shadow-sm transition-all hover:!bg-black/90 active:scale-95">
                <FaSearch className="h-3 w-3" /> Search another
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ── WIZARD STEPS (welcome / exam / rank) — centered card, no scroll ── */
  return (
    <div className="flex w-full h-[calc(100vh-64px)] flex-col items-center justify-center bg-[#F6F8FA] dark:bg-slate-950 px-4 overflow-hidden">
      <div className="w-full max-w-[500px]">
        <article className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-900">

          {/* header with stepper (hidden on welcome) */}
          {step !== "welcome" && currentLottie && (
            <div className="border-b border-slate-100 px-5 pt-5 pb-4 dark:border-slate-800"
              style={{ animation: "fade-in 200ms ease-out" }}>
              <div className="flex items-center gap-3 mb-5">
                <button type="button" aria-label="Go back"
                  onClick={() => step === "exam" ? setStep("welcome") : setStep("exam")}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-90 dark:border-slate-700 dark:bg-slate-800">
                  <FaArrowLeft className="h-3 w-3" />
                </button>
                <DelayedLottie key={`hdr-${step}`} data={currentLottie} className="h-9 w-9 shrink-0" />
                <h1 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  <RoughNotation type="underline" show={scribbleOn} color="#f0c544"
                    strokeWidth={3} padding={2} animationDelay={450} animationDuration={750}>
                    {stepHeading}
                  </RoughNotation>
                </h1>
              </div>

              {/* stepper dots */}
              <div className="flex items-center">
                {STEPPER_STEPS.map((s, i) => {
                  const isDone = i < stepperIdx;
                  const isActive = i === stepperIdx;
                  return (
                    <div key={s.id} className="flex flex-1 items-center">
                      {i > 0 && <div className={`h-px flex-1 transition-all duration-500 ${isDone || isActive ? "bg-[#f0c544]" : "bg-slate-200 dark:bg-slate-700"}`} />}
                      <div className={[
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ring-2 transition-all duration-300",
                        isActive ? "bg-[#FAD53C] text-slate-900 ring-[#f0c544]"
                          : isDone ? "bg-[#FAD53C] text-slate-900 ring-black dark:ring-white"
                          : "bg-white text-slate-400 ring-slate-200 dark:bg-slate-800 dark:ring-slate-600",
                      ].join(" ")}>
                        {isDone ? (
                          <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3">
                            <path d="M3.5 8.5l3 3 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : i + 1}
                      </div>
                      {i < STEPPER_STEPS.length - 1 && <div className={`h-px flex-1 transition-all duration-500 ${isDone ? "bg-[#f0c544]" : "bg-slate-200 dark:bg-slate-700"}`} />}
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 flex">
                {STEPPER_STEPS.map((s, i) => (
                  <div key={s.id} className="flex flex-1 justify-center">
                    <span className={`text-[9px] font-semibold uppercase tracking-wider ${i === stepperIdx ? "text-slate-700 dark:text-slate-200" : i < stepperIdx ? "text-slate-400" : "text-slate-300 dark:text-slate-600"}`}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* body */}
          <div className="min-h-[280px]">
            <div key={step} className="p-5" style={{ animation: "fade-in 260ms cubic-bezier(0.4,0,0.2,1)" }}>

              {/* welcome */}
              {step === "welcome" && (
                <div className="flex flex-col items-center py-6 text-center space-y-6">
                  <DelayedLottie key="welcome" data={folderAnim} className="h-24 w-24" />
                  <div className="space-y-2">
                    <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      <RoughNotation type="underline" show={scribbleOn} color="#f0c544"
                        strokeWidth={3} padding={2} animationDelay={450} animationDuration={750}>
                        College Counselling
                      </RoughNotation>
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[280px] mx-auto leading-relaxed">
                      Choose your exam, enter your rank, and explore colleges you may get based on closing ranks.
                    </p>
                  </div>
                  <Button variant="themeButton" size="sm" onClick={() => setStep("exam")}
                    className="inline-flex items-center gap-2 !rounded-full !border-black !bg-black !text-white shadow-sm transition-all hover:!bg-black/90 active:scale-95 mt-2">
                    Get Started <FaArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {/* exam selection — radio cards */}
              {step === "exam" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-2">
                    {DUMMY_COUNSELLING_EXAMS.map((exam) => {
                      const sel = selectedExamId === exam.id;
                      return (
                        <button key={exam.id} type="button"
                          onClick={() => setSelectedExamId(sel ? null : exam.id)}
                          className={[
                            "group flex items-center gap-3 w-full rounded-xl border px-4 py-3 text-left transition-all duration-200",
                            sel ? "border-[#f0c544] bg-[#FAD53C]/10 ring-1 ring-[#f0c544]"
                              : "border-slate-100 bg-slate-50/60 hover:border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800/30",
                          ].join(" ")}>
                          <span className={["flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                            sel ? "border-[#f0c544] bg-[#FAD53C]" : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800",
                          ].join(" ")}>
                            {sel && <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3"><path d="M3.5 8.5l3 3 6-6" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                          </span>
                          <div className="min-w-0">
                            <p className={`text-sm font-medium ${sel ? "text-slate-900" : "text-slate-700"}`}>{exam.name}</p>
                            <p className="text-[10px] text-slate-400">{exam.code}</p>
                          </div>
                          {sel && <span className="ml-auto text-[10px] font-semibold text-[#b88900]">Selected</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* rank input */}
              {step === "rank" && (
                <div className="space-y-4">
                  <div>
                    <p className="mb-2 text-xs font-medium text-slate-500">How do you want to provide your rank?</p>
                    <div className="grid grid-cols-3 gap-2">
                      {RANK_OPTIONS.map((opt) => {
                        const a = rankSource === opt.id;
                        return (
                          <button key={opt.id} type="button" onClick={() => setRankSource(opt.id)}
                            className={["flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-center transition-all",
                              a ? "border-[#f0c544] bg-[#FAD53C]/10 ring-1 ring-[#f0c544]"
                                : "border-slate-100 bg-slate-50/60 hover:border-slate-200 dark:border-slate-800 dark:bg-slate-800/30",
                            ].join(" ")}>
                            <span className={`h-2.5 w-2.5 rounded-full border-2 ${a ? "border-[#f0c544] bg-[#FAD53C]" : "border-slate-300 bg-white dark:border-slate-600"}`} />
                            <span className={`text-xs font-medium ${a ? "text-slate-900" : "text-slate-600"}`}>{opt.label}</span>
                            <span className="text-[9px] leading-tight text-slate-400">{opt.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="counselling-rank" className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                      {RANK_SOURCE_LABELS[rankSource]}
                    </label>
                    <input id="counselling-rank" type="text" inputMode="numeric" pattern="[0-9]*"
                      value={rankInput} onChange={(e) => setRankInput(e.target.value.replace(/\D/g, ""))}
                      placeholder="e.g. 4500"
                      className="w-full rounded-xl border border-slate-200 bg-[#f8fbff] px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
                    {!rankValid && rankInput.length > 0 && (
                      <p className="mt-1.5 text-xs text-red-600">Enter a valid rank greater than 0.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* footer (only for exam / rank) */}
          {(step === "exam" || step === "rank") && (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 dark:border-slate-800">
              <p className="text-[11px] text-slate-400">Structure preview — real data coming soon.</p>
              {step === "exam" && (
                <Button variant="themeButton" size="sm" disabled={!selectedExamId} onClick={() => setStep("rank")}
                  className="inline-flex items-center gap-2 !rounded-full !border-black !bg-black !text-white shadow-sm transition-all hover:!bg-black/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50">
                  Continue <FaArrowRight className="h-3 w-3" />
                </Button>
              )}
              {step === "rank" && (
                <Button variant="themeButton" size="sm" disabled={!rankValid} onClick={handleShowResults}
                  className="inline-flex items-center gap-2 !rounded-full !border-black !bg-black !text-white shadow-sm transition-all hover:!bg-black/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50">
                  Show my colleges <FaArrowRight className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
