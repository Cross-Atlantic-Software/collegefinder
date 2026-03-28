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
    <form onSubmit={handleSubmit} className="space-y-6 text-sm text-black">
      <div className="space-y-5">
        <h2 className="text-lg font-bold text-black">Government Identification</h2>

        {error && (
          <Notification
            type="error"
            message={error}
            onClose={() => onError(null)}
          />
        )}

        {success && (
          <Notification
            type="success"
            message="Government Identification updated successfully!"
            onClose={() => {}}
            autoClose={true}
            duration={3000}
          />
        )}

        {/* Aadhar Number */}
        <div className="space-y-2">
          <label className="flex items-center gap-1 text-sm font-medium text-black/70">
            Aadhar Number
          </label>
          <input
            type="text"
            placeholder="Enter 12-digit Aadhar number"
            value={govIdData.aadhar_number}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 12);
              setGovIdData({ ...govIdData, aadhar_number: value });
            }}
            maxLength={12}
            className={`${inputBase} ${validationErrors.aadhar_number ? 'border-red-500' : ''}`}
          />
          {validationErrors.aadhar_number && (
            <p className="text-xs text-red-400">{validationErrors.aadhar_number}</p>
          )}
        </div>

        {/* APAAR ID */}
        <div className="space-y-2">
          <label className="flex items-center gap-1 text-sm font-medium text-black/70">
            APAAR ID <span className="ml-1 text-xs bg-[#FAD53C] text-black rounded-full px-1.5 font-bold">*</span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowApaarInfo(!showApaarInfo)}
                className="text-black/40 hover:text-black transition"
                onMouseEnter={() => setShowApaarInfo(true)}
                onMouseLeave={() => setShowApaarInfo(false)}
              >
                <CiCircleInfo className="h-4 w-4" />
              </button>
              {showApaarInfo && (
                <div className="absolute left-0 top-6 z-10 w-64 rounded-xl bg-white border border-[#dceeff] p-3 text-xs text-black/70 shadow-lg">
                  <p className="font-semibold text-black mb-1">APAAR ID</p>
                  <p>
                    APAAR ID (Automated Permanent Academic Account Registry) is a unique 12-digit student identifier used in India&apos;s education system.
                  </p>
                </div>
              )}
            </div>
          </label>
          <input
            type="text"
            placeholder="Enter 12-digit APAAR ID"
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
            <p className="text-xs text-red-400">{validationErrors.apaar_id}</p>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <Button
          type="submit"
          variant="DarkGradient"
          size="md"
          className="w-full flex-1 rounded-full border border-black bg-black text-[#FAD53C] hover:bg-[#111]"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Government Identification"}
        </Button>
      </div>
    </form>
  );
}
