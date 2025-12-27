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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-5 rounded-md bg-white/5 p-6">
        <h2 className="text-base font-semibold text-pink sm:text-lg">
          Government Identification
        </h2>

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
          <label className="flex items-center gap-1 text-sm font-medium text-slate-300">
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
          <label className="flex items-center gap-1 text-sm font-medium text-slate-300">
            APAAR ID <span className="text-pink">*</span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowApaarInfo(!showApaarInfo)}
                className="text-pink hover:text-pink/80 transition"
                onMouseEnter={() => setShowApaarInfo(true)}
                onMouseLeave={() => setShowApaarInfo(false)}
              >
                <CiCircleInfo className="h-4 w-4" />
              </button>
              {showApaarInfo && (
                <div className="absolute left-0 top-6 z-10 w-64 rounded-md bg-slate-800 border border-slate-700 p-3 text-xs text-slate-200 shadow-lg">
                  <p className="font-semibold text-pink mb-1">APAAR ID</p>
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
          className="w-full flex-1 rounded-full"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Government Identification"}
        </Button>
      </div>
    </form>
  );
}
