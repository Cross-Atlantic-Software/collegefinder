"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FiUpload, FiX, FiEye, FiTrash2, FiFile } from "react-icons/fi";
import { uploadDocument, deleteDocument } from "@/api/auth/profile";
import { getAllCategories } from "@/api/public/categories";
import type { Category } from "@/api/public/categories";
import {
  CATEGORY_CERT_MAP,
  DOCUMENT_VAULT_FIELDS,
  emptyDocumentVault,
  getFileExtension,
  isImageDocumentUrl,
  type DocumentVaultField,
  type DocumentVaultFieldKey,
  type DocumentVaultRecord,
} from "@/lib/documentVault";
import { validateDocumentUploadFile } from "@/lib/documentVaultValidation";
import {
  DOCUMENT_VAULT_KEY,
  PROFILE_COMPLETION_KEY,
  useDocumentVaultQuery,
} from "@/lib/dashboardSidebarQueries";
import { useToast } from "../../shared";

function getCategorySlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export default function DocumentVault() {
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();
  const { data: vaultData, isLoading: loading, refetch } = useDocumentVaultQuery();
  const [uploading, setUploading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [viewingDocument, setViewingDocument] = useState<{ url: string; label: string } | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [pwbdCertAnswer, setPwbdCertAnswer] = useState<"yes" | "no">("no");

  const documentVault: DocumentVaultRecord = vaultData ?? emptyDocumentVault();

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (documentVault?.pwbd_disability_certificate) {
      setPwbdCertAnswer("yes");
    }
  }, [documentVault?.pwbd_disability_certificate]);

  const fetchCategories = async () => {
    try {
      const response = await getAllCategories();
      if (response.success && response.data) {
        setCategories(response.data.categories);
      }
    } catch {
      // non-critical
    }
  };

  const refreshVaultQueries = async () => {
    await Promise.all([
      refetch(),
      queryClient.invalidateQueries({ queryKey: DOCUMENT_VAULT_KEY }),
      queryClient.invalidateQueries({ queryKey: PROFILE_COMPLETION_KEY }),
    ]);
  };

  const handleFileUpload = async (fieldName: DocumentVaultFieldKey, file: File) => {
    try {
      setUploading(fieldName);
      const response = await uploadDocument(file, fieldName);
      if (response.success) {
        showSuccess("Document uploaded successfully");
        await refreshVaultQueries();
      }
    } catch (error: unknown) {
      console.error("Error uploading document:", error);
      showError(error instanceof Error ? error.message : "Failed to upload document");
    } finally {
      setUploading(null);
    }
  };

  const handleFileDelete = async (
    fieldName: DocumentVaultFieldKey,
    options?: { skipConfirm?: boolean; pwbdAnswerAfterDelete?: "no" },
  ) => {
    if (!options?.skipConfirm && !confirm("Are you sure you want to delete this document?")) {
      return;
    }

    try {
      setDeleting(fieldName);
      const response = await deleteDocument(fieldName);
      if (response.success) {
        showSuccess("Document deleted successfully");
        await refreshVaultQueries();
        if (fieldName === "pwbd_disability_certificate") {
          setPwbdCertAnswer(options?.pwbdAnswerAfterDelete ?? "no");
        }
      }
    } catch (error: unknown) {
      console.error("Error deleting document:", error);
      showError(error instanceof Error ? error.message : "Failed to delete document");
    } finally {
      setDeleting(null);
    }
  };

  const handlePwbdCertNo = () => {
    const url = documentVault?.pwbd_disability_certificate;
    if (typeof url === "string" && url) {
      if (!confirm("This will remove your uploaded PwBD/Disability certificate. Continue?")) {
        return;
      }
      void handleFileDelete("pwbd_disability_certificate", {
        skipConfirm: true,
        pwbdAnswerAfterDelete: "no",
      });
      return;
    }
    setPwbdCertAnswer("no");
  };

  const handleFileChange = async (fieldName: DocumentVaultFieldKey, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file) return;

    const validationError = await validateDocumentUploadFile(file, fieldName);
    if (validationError) {
      showError(validationError);
      return;
    }

    await handleFileUpload(fieldName, file);
  };

  const renderDocumentField = (field: DocumentVaultField) => {
    const value = documentVault?.[field.key] || null;
    const isUploading = uploading === field.key;
    const isDeleting = deleting === field.key;
    const fileInputId = `file-${field.key}`;
    const valueString = typeof value === "string" ? value : null;

    return (
      <div key={field.key} className="space-y-2">
        <label className="block text-sm font-medium text-black/70">
          {field.label}
          {field.required && (
            <span className="ml-1 rounded-full bg-[#FAD53C] px-1.5 text-xs font-bold text-black">*</span>
          )}
        </label>

        {valueString ? (
          <div className="flex items-center gap-3 rounded-xl border border-[#dceeff] bg-[#eaf4ff] p-3">
            <div className="flex flex-1 items-center gap-2">
              <FiFile className="h-5 w-5 text-black/40" />
              <span className="text-sm text-black/60">
                {isImageDocumentUrl(valueString) ? "Image" : "PDF"} Document
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewingDocument({ url: valueString, label: field.label })}
                className="p-2 text-blue-400 transition-colors hover:text-blue-300"
                title="View"
              >
                <FiEye className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleFileDelete(field.key)}
                disabled={isDeleting}
                className="p-2 text-red-400 transition-colors hover:text-red-300 disabled:opacity-50"
                title="Delete"
              >
                <FiTrash2 className="h-4 w-4" />
              </button>
              <label
                htmlFor={fileInputId}
                className="cursor-pointer p-2 text-green-400 transition-colors hover:text-green-300"
                title="Replace"
              >
                <FiUpload className="h-4 w-4" />
                <input
                  type="file"
                  id={fileInputId}
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={(e) => handleFileChange(field.key, e)}
                  disabled={isUploading}
                />
              </label>
            </div>
          </div>
        ) : (
          <label
            htmlFor={fileInputId}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#dceeff] bg-[#eaf4ff] p-4 transition-colors hover:border-[#FAD53C] hover:bg-[#FAD53C]/10"
          >
            <FiUpload className="h-5 w-5 text-black/40" />
            <span className="text-sm text-black/50">
              {isUploading ? "Uploading..." : "Browse & Upload"}
            </span>
            <input
              type="file"
              id={fileInputId}
              className="hidden"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(e) => handleFileChange(field.key, e)}
              disabled={isUploading}
            />
          </label>
        )}
      </div>
    );
  };

  const getVisibleReservationKeys = (): DocumentVaultFieldKey[] => {
    const selectedCategory = categories.find((c) => String(c.id) === selectedCategoryId);
    const slug = selectedCategory ? getCategorySlug(selectedCategory.name) : null;
    return slug ? (CATEGORY_CERT_MAP[slug] ?? []) : [];
  };

  const groupedFields = DOCUMENT_VAULT_FIELDS.reduce(
    (acc, field) => {
      if (!acc[field.section]) {
        acc[field.section] = [];
      }
      acc[field.section].push(field);
      return acc;
    },
    {} as Record<string, DocumentVaultField[]>,
  );

  if (loading) {
    return (
      <div className="space-y-4 py-4">
        <div className="shimmer-skeleton h-6 w-48 rounded-md" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="shimmer-skeleton h-32 w-full rounded-xl" />
          <div className="shimmer-skeleton h-32 w-full rounded-xl" />
          <div className="shimmer-skeleton h-32 w-full rounded-xl" />
          <div className="shimmer-skeleton h-32 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        {Object.entries(groupedFields).map(([section, fields], idx) => {
          const isCategorySection = section === "Category and Reservation Documents (if applicable)";
          const isPwbdSection = section === "PwBD / Disability certificate (if applicable)";
          const visibleKeys = isCategorySection ? getVisibleReservationKeys() : null;
          const visibleFields = visibleKeys
            ? fields.filter((f) => visibleKeys.includes(f.key))
            : fields;
          const showPwbdUpload = isPwbdSection && pwbdCertAnswer === "yes";
          const showSectionGrid =
            (!isCategorySection || selectedCategoryId !== "") &&
            (!isPwbdSection || showPwbdUpload);

          return (
            <div key={section} className={idx > 0 ? "border-t border-black/8 pt-6" : ""}>
              <div className="mb-4">
                <h3 className="text-sm font-bold text-black">{section}</h3>
                <p className="mt-0.5 text-xs text-black/50">
                  {section === "Mandatory Uploads" && "These documents are required for all users."}
                  {section === "Identity & Academic Proof" &&
                    "Upload your academic and identity documents."}
                  {isCategorySection && "Select your category to see the relevant certificate uploads."}
                  {isPwbdSection && "Answer below if you need to upload this certificate."}
                  {section === "Additional Uploads (exam dependent)" &&
                    "Upload additional documents as required by specific exams."}
                </p>
              </div>

              {isCategorySection && (
                <div className="mb-5">
                  <label className="mb-1.5 block text-xs font-semibold text-black/60">
                    Your Category
                  </label>
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    className="w-full rounded-xl border border-black/10 bg-[#f5f9ff] px-3 py-2.5 text-sm text-black transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#FAD53C] sm:max-w-xs"
                  >
                    <option value="">Select your category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={String(cat.id)}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {selectedCategoryId === "" && (
                    <p className="mt-2 text-xs text-black/40">
                      Please select a category to see applicable certificate uploads.
                    </p>
                  )}
                </div>
              )}

              {isPwbdSection && (
                <div className="mb-5 rounded-xl border border-black/8 bg-[#f5f9ff] p-4">
                  <p className="mb-3 text-sm font-medium text-black/80">
                    Do you have a PwBD/Disability certificate to upload?
                  </p>
                  <div className="flex flex-wrap gap-6">
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-black/70">
                      <input
                        type="radio"
                        name="pwbd-cert-upload"
                        checked={pwbdCertAnswer === "yes"}
                        onChange={() => setPwbdCertAnswer("yes")}
                        className="h-4 w-4 accent-[#FAD53C]"
                      />
                      Yes
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-black/70">
                      <input
                        type="radio"
                        name="pwbd-cert-upload"
                        checked={pwbdCertAnswer === "no"}
                        onChange={handlePwbdCertNo}
                        className="h-4 w-4 accent-[#FAD53C]"
                      />
                      No
                    </label>
                  </div>
                  {pwbdCertAnswer === "no" && (
                    <p className="mt-3 text-xs text-black/40">
                      Select Yes only if you need to upload this certificate.
                    </p>
                  )}
                </div>
              )}

              {showSectionGrid && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {visibleFields.map(renderDocumentField)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {viewingDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-black px-5 py-3 text-[#FAD53C]">
              <h2 className="text-base font-bold">{viewingDocument.label}</h2>
              <button
                type="button"
                onClick={() => setViewingDocument(null)}
                className="text-[#FAD53C] transition-opacity hover:opacity-70"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-1 items-center justify-center overflow-auto bg-[#f5f9ff] p-4">
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
