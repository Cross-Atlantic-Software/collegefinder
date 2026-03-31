"use client";

import { useState } from "react";
import { Button, Notification } from "../../../shared";
import { upsertGovernmentIdentification } from "@/api";
import type { GovernmentIdentificationData } from "./types";
import { inputBase } from "./constants";
import { CiCircleInfo } from "react-icons/ci";

interface GovernmentIdentificationTabProps {
  govIdData: GovernmentIdentificationData;
  setGovIdData: (data: GovernmentIdentificationData | ((prev: GovernmentIdentificationData) => GovernmentIdentificationData)) => void;
  validationErrors: Record<string, string>;
  error: string | null;
  success: boolean;
  saving: boolean;
  onStartSaving: () => void;
  onSuccess: () => void;
  onError: (error: string | null) => void;
}

export default function GovernmentIdentificationTab({
  govIdData,
  setGovIdData,
  validationErrors,
  error,
  success,
  saving,
  onStartSaving,
  onSuccess,
  onError,
}: GovernmentIdentificationTabProps) {
  const [showApaarInfo, setShowApaarInfo] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onStartSaving();
    onError(null);

    try {
      const response = await upsertGovernmentIdentification({
        aadhar_number: govIdData.aadhar_number || undefined,
        apaar_id: govIdData.apaar_id || undefined,
      });

      if (response.success) {
        onSuccess();
      } else {
        if (response.errors && Array.isArray(response.errors)) {
          const errors: Record<string, string> = {};
          response.errors.forEach((err: { param?: string; msg?: string; message?: string }) => {
            if (err.param) {
              errors[err.param] = err.msg || err.message || '';
            }
          });
          onError(response.message || "Failed to update government identification");
        } else {
          onError(response.message || "Failed to update government identification");
        }
      }
    } catch (err: any) {
      console.error("Error saving government identification:", err);
      onError(err.message || "An error occurred while updating government identification");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-sm text-black">
      <div className="space-y-5">
        <h2 className="text-base font-semibold text-black">Government Identification</h2>

        {error && <Notification type="error" message={error} onClose={() => onError(null)} />}
        {success && (
          <Notification type="success" message="Government Identification updated successfully!" onClose={() => {}} autoClose duration={3000} />
        )}

        {/* 2-col grid: Aadhar + APAAR side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 pt-4 border-t border-black/5">
          {/* Aadhar Number */}
          <div className="flex items-center gap-2 min-w-0">
            <label className="shrink-0 text-xs font-semibold text-black/55 w-[90px] text-right">
              Aadhar No.
            </label>
            <div className="flex-1 min-w-0">
              <input
                type="text"
                placeholder="12-digit Aadhar"
                value={govIdData.aadhar_number}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 12);
                  setGovIdData({ ...govIdData, aadhar_number: value });
                }}
                maxLength={12}
                className={`${inputBase} ${validationErrors.aadhar_number ? 'border-red-500' : ''}`}
              />
              {validationErrors.aadhar_number && (
                <p className="mt-0.5 text-xs text-red-400">{validationErrors.aadhar_number}</p>
              )}
            </div>
          </div>

          {/* APAAR ID */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="shrink-0 w-[90px] flex items-center justify-end gap-1">
              <label className="text-xs font-semibold text-black/55 text-right">APAAR ID *</label>
              <div className="relative">
                <button
                  type="button"
                  onMouseEnter={() => setShowApaarInfo(true)}
                  onMouseLeave={() => setShowApaarInfo(false)}
                  onClick={() => setShowApaarInfo(!showApaarInfo)}
                  className="text-black/40 hover:text-black transition"
                >
                  <CiCircleInfo className="h-3.5 w-3.5" />
                </button>
                {showApaarInfo && (
                  <div className="absolute right-0 top-5 z-50 w-60 rounded-xl border border-[#dceeff] bg-white p-3 text-xs text-black/70 shadow-lg">
                    <p className="mb-1 font-semibold text-black">APAAR ID</p>
                    <p>APAAR (Automated Permanent Academic Account Registry) is a unique 12-digit student ID used in India&apos;s education system.</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <input
                type="text"
                placeholder="12-digit APAAR ID"
                value={govIdData.apaar_id}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 12);
                  setGovIdData({ ...govIdData, apaar_id: value });
                }}
                maxLength={12}
                required
                className={`${inputBase} ${validationErrors.apaar_id ? 'border-red-500' : ''}`}
              />
              {validationErrors.apaar_id && (
                <p className="mt-0.5 text-xs text-red-400">{validationErrors.apaar_id}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full flex-1 !rounded-full border border-black bg-black text-white hover:bg-neutral-900"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Government Identification"}
        </Button>
      </div>
    </form>
  );
}
