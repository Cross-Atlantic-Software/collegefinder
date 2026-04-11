// src/components/profile/ProfileTabs.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { User, GraduationCap, Target, Info, Pencil, Trash2, ChevronRight, ShieldCheck, FileText } from "lucide-react";
import { uploadProfilePhoto, deleteProfilePhoto } from "@/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "../../shared";

import BasicInfoForm from "./BasicInfoForm";
import AcademicsProfile from "./AcademicsProfile";
import CareerGoalsTab from "./CareerGoals";
import OtherInfoTab from "./OtherInfoTab";

type TabKey = "basic" | "academics" | "career" | "other";

const tabs: { key: TabKey; label: string; icon: ReactNode }[] = [
  { key: "basic", label: "Personal Details", icon: <User className="h-4 w-4" /> },
  { key: "academics", label: "Academics", icon: <GraduationCap className="h-4 w-4" /> },
  { key: "career", label: "Interests", icon: <Target className="h-4 w-4" /> },
  { key: "other", label: "Other Info", icon: <Info className="h-4 w-4" /> },
];

const tabMeta: Record<TabKey, { sideTitle: string; sideText: string; rowTitle: string; rowText: string }> = {
  basic: {
    sideTitle: "Profile Snapshot",
    sideText: "Keep your identity, contact, and address details complete for smoother counselling and application workflows.",
    rowTitle: "Completion Checklist",
    rowText: "Add mandatory fields, verify email, and keep profile details updated to avoid last-minute issues.",
  },
  academics: {
    sideTitle: "Academic Snapshot",
    sideText: "Boards, marks, stream, and subject-level details improve recommendations and exam matching quality.",
    rowTitle: "Academic Readiness",
    rowText: "Update latest marks, result status, and preferences so your dashboard predictions stay accurate.",
  },
  career: {
    sideTitle: "Interest Snapshot",
    sideText: "Selected interests directly influence recommended exams, colleges, and personalized guidance.",
    rowTitle: "Planning Notes",
    rowText: "Review target exams regularly and align interests with your preferred programs and long-term goals.",
  },
  other: {
    sideTitle: "Preference Snapshot",
    sideText: "Language, medium, and city/program preferences help prioritize application and counselling decisions.",
    rowTitle: "Preference Review",
    rowText: "Keep preferences realistic and updated before each major exam and counselling cycle.",
  },
};

export default function ProfileTabs() {
  const { user, refreshUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>("basic");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.profile_photo || null);
  const photoFileInputRef = useRef<HTMLInputElement>(null);
  const tabRefs = useRef<Record<TabKey, HTMLButtonElement | null>>({
    basic: null,
    academics: null,
    career: null,
    other: null,
  });
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const updateIndicator = () => {
      const activeEl = tabRefs.current[activeTab];
      if (!activeEl) return;
      setIndicatorStyle({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
      });
    };

    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [activeTab]);

  useEffect(() => {
    setAvatarPreview(user?.profile_photo || null);
  }, [user?.profile_photo]);

  const handlePhotoUpload = async (file: File) => {
    try {
      setUploadingPhoto(true);
      const response = await uploadProfilePhoto(file);
      if (response.success && response.data?.profile_photo) {
        setAvatarPreview(response.data.profile_photo);
        await refreshUser();
        showSuccess("Profile photo updated successfully!");
      }
    } catch (err: any) {
      showError(err?.message || "Failed to update profile photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePhotoDelete = async () => {
    try {
      setUploadingPhoto(true);
      const response = await deleteProfilePhoto();
      if (response.success) {
        setAvatarPreview(null);
        await refreshUser();
        showSuccess("Profile photo removed successfully!");
      }
    } catch (err: any) {
      showError(err?.message || "Failed to remove profile photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const renderTabContent = (tab: TabKey) => {
    switch (tab) {
      case "basic":
        return <BasicInfoForm />;
      case "academics":
        return <AcademicsProfile />;
      case "career":
        return <CareerGoalsTab />;
      case "other":
        return <OtherInfoTab />;
      default:
        return null;
    }
  };

  const recommendedExamCards = [
    {
      exam: "JEE Main 2026",
      track: "Engineering",
      priority: "High",
      reason: "Best match for your PCM + target college preferences.",
      href: "/dashboard/exams/jee-main?from=profile-recommended",
    },
    {
      exam: "BITSAT 2026",
      track: "Engineering",
      priority: "Medium",
      reason: "Strong backup pathway with high shortlist overlap.",
      href: "/dashboard/exams/bitsat?from=profile-recommended",
    },
    {
      exam: "VITEEE 2026",
      track: "Engineering",
      priority: "Medium",
      reason: "Improves admission safety across private institute options.",
      href: "/dashboard/exams/viteee?from=profile-recommended",
    },
  ];

  const [activeExamIndex, setActiveExamIndex] = useState(0);

  const documentPreviewCards = [
    {
      name: "Aadhar Card",
      type: "ID Proof",
      status: "Verified",
      image: "https://images.unsplash.com/photo-1588693959825-ed0ef8bd8e19?q=80&w=240&auto=format&fit=crop",
      cta: "Preview",
    },
    {
      name: "10th Marksheet",
      type: "Academic",
      status: "Uploaded",
      image: "https://images.unsplash.com/photo-1544144433-d50aff500b91?q=80&w=240&auto=format&fit=crop",
      cta: "Open",
    },
    {
      name: "JEE Admit Card",
      type: "Exam",
      status: "Ready",
      image: "https://images.unsplash.com/photo-1606326608690-4e0281b1e588?q=80&w=240&auto=format&fit=crop",
      cta: "View",
    },
  ];

  return (
    <section className="bg-white dark:bg-slate-900">
      <header className="border-b border-slate-200 bg-white px-4 pt-2 pb-0 dark:border-slate-800 dark:bg-slate-900 md:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0 flex-1">
            <div>
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">Student Profile</p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Manage your details, academics, interests, and preferences.
              </p>
            </div>

            <div className="relative -mb-px mt-3 flex gap-1 overflow-x-auto">
              {tabs.map((t) => {
                const isActive = activeTab === t.key;
                return (
                  <button
                    key={t.key}
                    ref={(el) => {
                      tabRefs.current[t.key] = el;
                    }}
                    type="button"
                    onClick={() => setActiveTab(t.key)}
                    className={[
                      "flex min-w-max items-center gap-2 border-b-2 border-transparent px-4 py-2.5 text-sm font-medium transition-colors duration-300 ease-in-out",
                      isActive
                        ? "border-b-slate-900 text-slate-900 dark:border-b-slate-100 dark:text-slate-100"
                        : "text-black/30 hover:text-black/60 dark:text-white/40 dark:hover:text-white/75",
                    ].join(" ")}
                  >
                    {t.icon}
                    {t.label}
                  </button>
                );
              })}

              <span
                aria-hidden="true"
                className="pointer-events-none absolute bottom-0 h-0.5 bg-slate-900 transition-all duration-300 ease-in-out dark:bg-slate-100"
                style={{
                  left: indicatorStyle.left,
                  width: indicatorStyle.width,
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 sm:mt-1">
            <div className="group relative h-20 w-20 shrink-0">
              <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-[#FAD53C] bg-slate-100 dark:bg-slate-800">
                {avatarPreview ? (
                  <Image
                    src={avatarPreview}
                    alt="Profile photo"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <User className="h-8 w-8 text-slate-500 dark:text-slate-400" />
                  </div>
                )}
              </div>

              <label
                className="absolute -bottom-0.5 -right-0.5 inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-[#FAD53C] text-black shadow-md transition hover:brightness-95"
                title="Edit photo"
              >
                <input
                  ref={photoFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingPhoto}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      await handlePhotoUpload(file);
                      if (photoFileInputRef.current) {
                        photoFileInputRef.current.value = "";
                      }
                    }
                  }}
                />
                <Pencil className="h-3 w-3" />
              </label>

              {avatarPreview && (
                <button
                  type="button"
                  onClick={handlePhotoDelete}
                  disabled={uploadingPhoto}
                  className="absolute -top-0.5 -right-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-red-600 shadow-md opacity-0 transition-all duration-200 group-hover:opacity-100 group-focus-within:opacity-100 disabled:opacity-40"
                  title="Delete photo"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="bg-[#f8fbff] px-4 py-4 dark:bg-slate-950/40 md:px-6 md:py-6">
        <div
          key={activeTab}
          style={{ animation: "fade-in 220ms ease-out" }}
          className="space-y-4"
        >
          <div className="grid gap-4 xl:h-[calc(100vh-220px)] xl:grid-cols-5">
            <div className="min-w-0 overflow-y-auto rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900 md:p-5 xl:col-span-3">
              {renderTabContent(activeTab)}
            </div>

            <div className="min-w-0 overflow-hidden xl:col-span-2">
              <div className="grid h-full min-h-0 gap-3" style={{ gridTemplateRows: "auto 1fr" }}>

                {/* ── Recommended Exams ── sliding carousel */}
                <article className="min-w-0 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900 md:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Recommended Exams</h3>
                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        Based on your profile &amp; stream.
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setActiveExamIndex((i) => Math.max(0, i - 1))}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white ring-1 ring-slate-200 transition hover:ring-black disabled:opacity-30 dark:bg-slate-800 dark:ring-slate-700"
                        disabled={activeExamIndex === 0}
                        aria-label="Previous exam"
                      >
                        <ChevronRight className="h-3.5 w-3.5 rotate-180" />
                      </button>
                      <button
                        onClick={() => setActiveExamIndex((i) => Math.min(recommendedExamCards.length - 1, i + 1))}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white ring-1 ring-slate-200 transition hover:ring-black disabled:opacity-30 dark:bg-slate-800 dark:ring-slate-700"
                        disabled={activeExamIndex === recommendedExamCards.length - 1}
                        aria-label="Next exam"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-2.5 overflow-hidden rounded-xl">
                    <div
                      className="flex transition-transform duration-500 ease-out"
                      style={{ transform: `translateX(-${activeExamIndex * 100}%)` }}
                    >
                      {recommendedExamCards.map((item) => (
                        <div
                          key={item.exam}
                          className="w-full shrink-0 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-800/40"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[13px] font-semibold text-slate-900 dark:text-slate-100">{item.exam}</p>
                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                              item.priority === "High"
                                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                            }`}>
                              {item.priority}
                            </span>
                          </div>
                          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">{item.track}</p>
                          <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">{item.reason}</p>
                          <Link
                            href={item.href}
                            className="mt-2 inline-flex items-center gap-1 rounded-full bg-black px-3 py-1 text-[11px] font-semibold text-white transition hover:bg-neutral-800"
                          >
                            View Exam <ChevronRight className="h-3 w-3" />
                          </Link>
                        </div>
                      ))}
                    </div>

                    {/* Progress dots */}
                    <div className="mt-2 flex items-center justify-center gap-1.5">
                      {recommendedExamCards.map((item, idx) => (
                        <button
                          key={item.exam}
                          onClick={() => setActiveExamIndex(idx)}
                          aria-label={`Show exam ${idx + 1}`}
                          className={`relative h-1 overflow-hidden rounded-full transition-all ${
                            idx === activeExamIndex ? "w-8 bg-[#FAD53C]/30" : "w-1.5 bg-slate-200 dark:bg-slate-700"
                          }`}
                        >
                          {idx === activeExamIndex && (
                            <span className="absolute inset-y-0 left-0 w-full rounded-full bg-[#FAD53C]" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </article>

                {/* ── Document Vault ── horizontal scroll-snap card carousel */}
                <article className="min-w-0 flex flex-col overflow-hidden rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900 md:p-5">
                  <div className="flex items-center justify-between shrink-0">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Document Vault</h3>
                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        Tap a card to preview or open.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="shrink-0 rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-semibold text-slate-600 transition hover:border-black hover:bg-black hover:text-white dark:border-slate-700 dark:text-slate-300 dark:hover:border-white dark:hover:bg-white dark:hover:text-black"
                    >
                      + Upload
                    </button>
                  </div>

                  {/* Horizontal scroll-snap carousel — industry standard doc card layout */}
                  <div className="mt-3 flex-1 overflow-hidden">
                    <div
                      className="flex h-full gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                      style={{ scrollSnapType: "x mandatory" }}
                    >
                      {documentPreviewCards.map((doc) => (
                        <div
                          key={doc.name}
                          className="group shrink-0 w-[140px] flex flex-col overflow-hidden rounded-xl border border-slate-100 bg-slate-50 transition-all duration-200 hover:border-[#FAD53C] hover:shadow-md cursor-pointer dark:border-slate-800 dark:bg-slate-800/60"
                          style={{ scrollSnapAlign: "start" }}
                        >
                          {/* Large image preview — fills top 60% */}
                          <div className="relative w-full overflow-hidden bg-slate-200 dark:bg-slate-700" style={{ paddingBottom: "70%" }}>
                            <Image
                              src={doc.image}
                              alt={doc.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              unoptimized
                            />
                            {/* Status badge — top-right overlay */}
                            <span className={`absolute top-1.5 right-1.5 flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                              doc.status === "Verified"
                                ? "bg-emerald-500 text-white"
                                : doc.status === "Ready"
                                ? "bg-sky-500 text-white"
                                : "bg-amber-400 text-black"
                            }`}>
                              {doc.status === "Verified" && <ShieldCheck className="h-2.5 w-2.5" />}
                              {doc.status}
                            </span>
                            {/* Type chip — bottom-left */}
                            <span className="absolute bottom-1.5 left-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-semibold text-white backdrop-blur-sm">
                              {doc.type}
                            </span>
                          </div>

                          {/* Card footer */}
                          <div className="flex flex-1 flex-col justify-between px-2.5 py-2">
                            <p className="text-[12px] font-semibold leading-tight text-slate-900 line-clamp-2 dark:text-slate-100">
                              {doc.name}
                            </p>
                            <button
                              type="button"
                              className="mt-2 w-full rounded-full border border-black bg-transparent py-1 text-[10px] font-semibold text-black transition group-hover:bg-black group-hover:text-white dark:border-slate-400 dark:text-slate-200 dark:group-hover:border-white dark:group-hover:bg-white dark:group-hover:text-black"
                            >
                              {doc.cta}
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Add new document card */}
                      <div
                        className="shrink-0 w-[140px] flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-transparent transition hover:border-[#FAD53C] hover:bg-[#FAD53C]/5 cursor-pointer dark:border-slate-700"
                        style={{ scrollSnapAlign: "start" }}
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                          <FileText className="h-5 w-5 text-slate-400" />
                        </div>
                        <p className="text-[11px] font-semibold text-slate-400 text-center px-2">Add Document</p>
                      </div>
                    </div>
                  </div>
                </article>

              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
