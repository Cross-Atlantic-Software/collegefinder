// src/components/profile/ProfileTabs.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { User, GraduationCap, Target, Info, Pencil, Trash2, ChevronRight, ShieldCheck, KeyRound } from "lucide-react";
import { uploadProfilePhoto, deleteProfilePhoto } from "@/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "../../shared";
import {
  calculateDocumentVaultCompletion,
  getFileExtension,
  isImageDocumentUrl,
  listUploadedDocuments,
} from "@/lib/documentVault";
import { useDocumentVaultQuery } from "@/lib/dashboardSidebarQueries";

import BasicInfoForm from "./BasicInfoForm";
import AcademicsProfile from "./AcademicsProfile";
import CareerGoalsTab from "./CareerGoals";
import OtherInfoTab from "./OtherInfoTab";
import ResetPasswordTab from "./ResetPasswordTab";

type TabKey = "basic" | "academics" | "career" | "other" | "password";

const tabs: { key: TabKey; label: string; icon: ReactNode }[] = [
  { key: "basic", label: "Personal Details", icon: <User className="h-4 w-4" /> },
  { key: "academics", label: "Academics", icon: <GraduationCap className="h-4 w-4" /> },
  { key: "career", label: "Interests", icon: <Target className="h-4 w-4" /> },
  { key: "other", label: "Other Info", icon: <Info className="h-4 w-4" /> },
  { key: "password", label: "Reset password", icon: <KeyRound className="h-4 w-4" /> },
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
  password: {
    sideTitle: "Account security",
    sideText: "Use a unique password you do not reuse on other sites. Update it periodically if you suspect it may be known.",
    rowTitle: "Password hygiene",
    rowText: "After changing your password, stay signed in on this device or sign in again on others with the new password.",
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
    password: null,
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
      case "password":
        return <ResetPasswordTab />;
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
  const { data: documentVault, isLoading: documentVaultLoading } = useDocumentVaultQuery();
  const uploadedDocuments = useMemo(
    () => listUploadedDocuments(documentVault ?? undefined),
    [documentVault],
  );
  const documentVaultCompletion = useMemo(
    () => calculateDocumentVaultCompletion(documentVault ?? undefined),
    [documentVault],
  );
  const [viewingDocument, setViewingDocument] = useState<{ url: string; label: string } | null>(null);

  const openDocumentVaultTab = () => {
    setActiveTab("academics");
    window.setTimeout(() => {
      document.getElementById("document-vault-section")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 150);
  };

  return (
    <>
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
          <div className="mx-auto grid w-full max-w-6xl gap-5 xl:h-[calc(100vh-220px)] xl:grid-cols-[1fr_280px]">
            <div className="min-w-0 overflow-y-auto rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900 md:p-5">
              {renderTabContent(activeTab)}
            </div>

            <aside className="min-w-0 overflow-hidden xl:sticky xl:top-6 xl:self-start">
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

                <article className="flex min-w-0 flex-col overflow-hidden rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900 md:p-5">
                  <div className="flex shrink-0 items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Document Vault</h3>
                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        {documentVaultLoading
                          ? "Loading documents…"
                          : `${documentVaultCompletion.completedFields} of ${documentVaultCompletion.totalFields} uploaded (${documentVaultCompletion.percentage}%)`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={openDocumentVaultTab}
                      className="shrink-0 rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-semibold text-slate-600 transition hover:border-black hover:bg-black hover:text-white dark:border-slate-700 dark:text-slate-300 dark:hover:border-white dark:hover:bg-white dark:hover:text-black"
                    >
                      + Upload
                    </button>
                  </div>

                  <div className="mt-3 flex-1 overflow-hidden">
                    {documentVaultLoading ? (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="shimmer-skeleton h-28 rounded-xl" />
                        <div className="shimmer-skeleton h-28 rounded-xl" />
                      </div>
                    ) : uploadedDocuments.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center dark:border-slate-700 dark:bg-slate-800/40">
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                          No documents uploaded yet.
                        </p>
                        <button
                          type="button"
                          onClick={openDocumentVaultTab}
                          className="mt-3 rounded-full border border-black px-3 py-1.5 text-[10px] font-semibold text-black transition hover:bg-black hover:text-white dark:border-slate-400 dark:text-slate-200 dark:hover:bg-white dark:hover:text-black"
                        >
                          Open Document Vault
                        </button>
                      </div>
                    ) : (
                      <div
                        className="flex h-full gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                        style={{ scrollSnapType: "x mandatory" }}
                      >
                        {uploadedDocuments.map((doc) => {
                          const isImage = isImageDocumentUrl(doc.url);
                          const fileType = isImage ? "Image" : getFileExtension(doc.url).toUpperCase() || "PDF";

                          return (
                            <div
                              key={doc.key}
                              className="group flex w-[140px] shrink-0 cursor-pointer flex-col overflow-hidden rounded-xl border border-slate-100 bg-slate-50 transition-all duration-200 hover:border-[#FAD53C] hover:shadow-md dark:border-slate-800 dark:bg-slate-800/60"
                              style={{ scrollSnapAlign: "start" }}
                            >
                              <div
                                className="relative w-full overflow-hidden bg-slate-200 dark:bg-slate-700"
                                style={{ paddingBottom: "70%" }}
                              >
                                {isImage ? (
                                  <Image
                                    src={doc.url}
                                    alt={doc.label}
                                    fill
                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                    unoptimized
                                  />
                                ) : (
                                  <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-[11px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                                    {fileType}
                                  </div>
                                )}
                                <span className="absolute right-1.5 top-1.5 flex items-center gap-0.5 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                                  <ShieldCheck className="h-2.5 w-2.5" />
                                  Uploaded
                                </span>
                                <span className="absolute bottom-1.5 left-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-semibold text-white backdrop-blur-sm">
                                  {fileType}
                                </span>
                              </div>

                              <div className="flex flex-1 flex-col justify-between px-2.5 py-2">
                                <p className="line-clamp-2 text-[12px] font-semibold leading-tight text-slate-900 dark:text-slate-100">
                                  {doc.label}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => setViewingDocument({ url: doc.url, label: doc.label })}
                                  className="mt-2 w-full rounded-full border border-black bg-transparent py-1 text-[10px] font-semibold text-black transition group-hover:bg-black group-hover:text-white dark:border-slate-400 dark:text-slate-200 dark:group-hover:border-white dark:group-hover:bg-white dark:group-hover:text-black"
                                >
                                  Preview
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </article>

              </div>
            </aside>

          </div>
        </div>
      </div>
    </section>
    {viewingDocument && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
        <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 dark:border-slate-700">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{viewingDocument.label}</h2>
            <button
              type="button"
              onClick={() => setViewingDocument(null)}
              className="text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              Close
            </button>
          </div>
          <div className="flex flex-1 items-center justify-center overflow-auto bg-slate-50 p-4 dark:bg-slate-800/40">
            {isImageDocumentUrl(viewingDocument.url) ? (
              <img
                src={viewingDocument.url}
                alt={viewingDocument.label}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <iframe
                src={viewingDocument.url}
                className="h-full min-h-[600px] w-full border-0"
                title={viewingDocument.label}
              />
            )}
          </div>
        </div>
      </div>
    )}
  </>
  );
}
