"use client";

import { Button, Select, Notification } from "../../../shared";
import { upsertOtherPersonalDetails } from "@/api";
import type { OtherPersonalDetailsData } from "./types";
import { inputBase } from "./constants";

interface OtherPersonalInformationTabProps {
  otherPersonalDetails: OtherPersonalDetailsData;
  setOtherPersonalDetails: (data: OtherPersonalDetailsData | ((prev: OtherPersonalDetailsData) => OtherPersonalDetailsData)) => void;
  validationErrors: Record<string, string>;
  error: string | null;
  success: boolean;
  saving: boolean;
  onStartSaving: () => void;
  onSuccess: () => void;
  onError: (error: string | null) => void;
}

export default function OtherPersonalInformationTab({
  otherPersonalDetails,
  setOtherPersonalDetails,
  validationErrors,
  error,
  success,
  saving,
  onStartSaving,
  onSuccess,
  onError,
}: OtherPersonalInformationTabProps) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onStartSaving();
    onError(null);

    try {
      const response = await upsertOtherPersonalDetails({
        religion: otherPersonalDetails.religion as any || undefined,
        mother_tongue: otherPersonalDetails.mother_tongue || undefined,
        annual_family_income: otherPersonalDetails.annual_family_income ? parseFloat(otherPersonalDetails.annual_family_income) : undefined,
        occupation_of_father: otherPersonalDetails.occupation_of_father || undefined,
        occupation_of_mother: otherPersonalDetails.occupation_of_mother || undefined,
      });

      if (response.success) {
        onSuccess();
      } else {
        onError(response.message || "Failed to update other personal information");
      }
    } catch (err: any) {
      console.error("Error saving other personal details:", err);
      onError(err.message || "An error occurred while updating other personal information");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-5 rounded-md bg-white/5 p-6">
        <h2 className="text-base font-semibold text-pink sm:text-lg">
          Other Personal Information
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
            message="Other Personal Information updated successfully!"
            onClose={() => {}}
            autoClose={true}
            duration={3000}
          />
        )}

        {/* Religion */}
        <div className="space-y-2">
          <label className="flex items-center gap-1 text-sm font-medium text-slate-300">
            Religion
          </label>
          <Select
            options={[
              { value: "Hindu", label: "Hindu" },
              { value: "Muslim", label: "Muslim" },
              { value: "Christian", label: "Christian" },
              { value: "Sikh", label: "Sikh" },
              { value: "Buddhist", label: "Buddhist" },
              { value: "Jain", label: "Jain" },
              { value: "Jewish", label: "Jewish" },
              { value: "Parsi (Zoroastrian)", label: "Parsi (Zoroastrian)" },
              { value: "Other", label: "Other" },
              { value: "Prefer not to say", label: "Prefer not to say" },
            ]}
            value={otherPersonalDetails.religion}
            onChange={(value) => setOtherPersonalDetails({ ...otherPersonalDetails, religion: value || "" })}
            placeholder="Select Religion"
            error={validationErrors.religion}
            isSearchable={false}
            isClearable={true}
          />
        </div>

        {/* Mother Tongue */}
        <div className="space-y-2">
          <label className="flex items-center gap-1 text-sm font-medium text-slate-300">
            Mother Tongue
          </label>
          <input
            type="text"
            placeholder="Enter mother tongue"
            value={otherPersonalDetails.mother_tongue}
            onChange={(e) => setOtherPersonalDetails({ ...otherPersonalDetails, mother_tongue: e.target.value })}
            className={`${inputBase} ${validationErrors.mother_tongue ? 'border-red-500' : ''}`}
          />
          {validationErrors.mother_tongue && (
            <p className="text-xs text-red-400">{validationErrors.mother_tongue}</p>
          )}
        </div>

        {/* Annual Family Income */}
        <div className="space-y-2">
          <label className="flex items-center gap-1 text-sm font-medium text-slate-300">
            Annual Family Income
          </label>
          <input
            type="number"
            placeholder="Enter annual family income"
            min="0"
            step="0.01"
            value={otherPersonalDetails.annual_family_income}
            onChange={(e) => setOtherPersonalDetails({ ...otherPersonalDetails, annual_family_income: e.target.value })}
            className={`${inputBase} ${validationErrors.annual_family_income ? 'border-red-500' : ''}`}
          />
          {validationErrors.annual_family_income && (
            <p className="text-xs text-red-400">{validationErrors.annual_family_income}</p>
          )}
        </div>

        {/* Occupation of Father */}
        <div className="space-y-2">
          <label className="flex items-center gap-1 text-sm font-medium text-slate-300">
            Occupation of Father
          </label>
          <input
            type="text"
            placeholder="Enter father's occupation"
            value={otherPersonalDetails.occupation_of_father}
            onChange={(e) => setOtherPersonalDetails({ ...otherPersonalDetails, occupation_of_father: e.target.value })}
            className={`${inputBase} ${validationErrors.occupation_of_father ? 'border-red-500' : ''}`}
          />
          {validationErrors.occupation_of_father && (
            <p className="text-xs text-red-400">{validationErrors.occupation_of_father}</p>
          )}
        </div>

        {/* Occupation of Mother */}
        <div className="space-y-2">
          <label className="flex items-center gap-1 text-sm font-medium text-slate-300">
            Occupation of Mother
          </label>
          <input
            type="text"
            placeholder="Enter mother's occupation"
            value={otherPersonalDetails.occupation_of_mother}
            onChange={(e) => setOtherPersonalDetails({ ...otherPersonalDetails, occupation_of_mother: e.target.value })}
            className={`${inputBase} ${validationErrors.occupation_of_mother ? 'border-red-500' : ''}`}
          />
          {validationErrors.occupation_of_mother && (
            <p className="text-xs text-red-400">{validationErrors.occupation_of_mother}</p>
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
          {saving ? "Saving..." : "Save Other Personal Information"}
        </Button>
      </div>
    </form>
  );
}

