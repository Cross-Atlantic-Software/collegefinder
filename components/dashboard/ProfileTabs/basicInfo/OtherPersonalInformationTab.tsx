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

const L = "shrink-0 text-xs font-semibold text-black/55 w-[105px] text-right";

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
    <form onSubmit={handleSubmit} className="space-y-5 text-sm text-black">
      <div className="space-y-5">
        <h2 className="text-base font-semibold text-black">Other Personal Information</h2>

        {error && <Notification type="error" message={error} onClose={() => onError(null)} />}
        {success && (
          <Notification type="success" message="Other Personal Information updated successfully!" onClose={() => {}} autoClose duration={3000} />
        )}

        {/* All 5 fields in 2-col grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 pt-4 border-t border-black/5">
          <div className="flex items-center gap-2 min-w-0">
            <label className={L}>Religion</label>
            <div className="flex-1 min-w-0">
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
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <label className={L}>Mother Tongue</label>
            <div className="flex-1 min-w-0">
              <input
                type="text"
                placeholder="Mother tongue"
                value={otherPersonalDetails.mother_tongue}
                onChange={(e) => setOtherPersonalDetails({ ...otherPersonalDetails, mother_tongue: e.target.value })}
                className={`${inputBase} ${validationErrors.mother_tongue ? 'border-red-500' : ''}`}
              />
              {validationErrors.mother_tongue && <p className="mt-0.5 text-xs text-red-400">{validationErrors.mother_tongue}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <label className={L}>Annual Income</label>
            <div className="flex-1 min-w-0">
              <input
                type="number"
                placeholder="Annual family income"
                min="0"
                step="0.01"
                value={otherPersonalDetails.annual_family_income}
                onChange={(e) => setOtherPersonalDetails({ ...otherPersonalDetails, annual_family_income: e.target.value })}
                className={`${inputBase} ${validationErrors.annual_family_income ? 'border-red-500' : ''}`}
              />
              {validationErrors.annual_family_income && <p className="mt-0.5 text-xs text-red-400">{validationErrors.annual_family_income}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <label className={L}>Father's Job</label>
            <div className="flex-1 min-w-0">
              <input
                type="text"
                placeholder="Father's occupation"
                value={otherPersonalDetails.occupation_of_father}
                onChange={(e) => setOtherPersonalDetails({ ...otherPersonalDetails, occupation_of_father: e.target.value })}
                className={`${inputBase} ${validationErrors.occupation_of_father ? 'border-red-500' : ''}`}
              />
              {validationErrors.occupation_of_father && <p className="mt-0.5 text-xs text-red-400">{validationErrors.occupation_of_father}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <label className={L}>Mother's Job</label>
            <div className="flex-1 min-w-0">
              <input
                type="text"
                placeholder="Mother's occupation"
                value={otherPersonalDetails.occupation_of_mother}
                onChange={(e) => setOtherPersonalDetails({ ...otherPersonalDetails, occupation_of_mother: e.target.value })}
                className={`${inputBase} ${validationErrors.occupation_of_mother ? 'border-red-500' : ''}`}
              />
              {validationErrors.occupation_of_mother && <p className="mt-0.5 text-xs text-red-400">{validationErrors.occupation_of_mother}</p>}
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
          {saving ? "Saving..." : "Save Other Personal Information"}
        </Button>
      </div>
    </form>
  );
}
