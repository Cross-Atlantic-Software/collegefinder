"use client";

import { Button, Select, Notification } from "../../../shared";
import { upsertCategoryAndReservation } from "@/api";
import type { CategoryAndReservationData } from "./types";
import { inputBase } from "./constants";
import { getAllStates } from "@/lib/data/indianStatesDistricts";

interface CategoryAndReservationTabProps {
  catResData: CategoryAndReservationData;
  setCatResData: (data: CategoryAndReservationData | ((prev: CategoryAndReservationData) => CategoryAndReservationData)) => void;
  categories: Array<{ value: string; label: string }>;
  validationErrors: Record<string, string>;
  error: string | null;
  success: boolean;
  saving: boolean;
  onStartSaving: () => void;
  onSuccess: () => void;
  onError: (error: string | null) => void;
}

const L = "shrink-0 text-xs font-semibold text-black/55 w-[105px] text-right";

export default function CategoryAndReservationTab({
  catResData,
  setCatResData,
  categories,
  validationErrors,
  error,
  success,
  saving,
  onStartSaving,
  onSuccess,
  onError,
}: CategoryAndReservationTabProps) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onStartSaving();
    onError(null);

    try {
      const response = await upsertCategoryAndReservation({
        category_id: catResData.category_id ? parseInt(catResData.category_id) : undefined,
        ews_status: catResData.ews_status,
        pwbd_status: catResData.pwbd_status,
        type_of_disability: catResData.type_of_disability || undefined,
        disability_percentage: catResData.disability_percentage ? parseFloat(catResData.disability_percentage) : undefined,
        udid_number: catResData.udid_number || undefined,
        minority_status: catResData.minority_status || undefined,
        ex_serviceman_defence_quota: catResData.ex_serviceman_defence_quota,
        kashmiri_migrant_regional_quota: catResData.kashmiri_migrant_regional_quota,
        state_domicile: catResData.state_domicile,
        home_state_for_quota: catResData.home_state_for_quota || undefined,
      });

      if (response.success) {
        onSuccess();
      } else {
        onError(response.message || "Failed to update category and reservation");
      }
    } catch (err: any) {
      console.error("Error saving category and reservation:", err);
      onError(err.message || "An error occurred while updating category and reservation");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-sm text-black">
      <div className="space-y-5">
        <h2 className="text-base font-semibold text-black">Category and Reservation</h2>

        {error && <Notification type="error" message={error} onClose={() => onError(null)} />}
        {success && (
          <Notification type="success" message="Category and Reservation updated successfully!" onClose={() => {}} autoClose duration={3000} />
        )}

        {/* Row 1: Category + Home State */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 pt-4 border-t border-black/5">
          <div className="flex items-center gap-2 min-w-0">
            <label className={L}>Category</label>
            <div className="flex-1 min-w-0">
              <Select
                options={categories}
                value={catResData.category_id}
                onChange={(value) => setCatResData({ ...catResData, category_id: value || "" })}
                placeholder="Select Category"
                error={validationErrors.category_id}
                isSearchable={true}
                isClearable={true}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <label className={L}>Home State</label>
            <div className="flex-1 min-w-0">
              <Select
                options={getAllStates().map((state) => ({ value: state, label: state }))}
                value={catResData.home_state_for_quota}
                onChange={(value) => setCatResData({ ...catResData, home_state_for_quota: value || "" })}
                placeholder="Home State for Quota"
                error={validationErrors.home_state_for_quota}
                isSearchable={true}
                isClearable={true}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <label className={L}>Minority Status</label>
            <div className="flex-1 min-w-0">
              <input
                type="text"
                placeholder="Minority status (if applicable)"
                value={catResData.minority_status}
                onChange={(e) => setCatResData({ ...catResData, minority_status: e.target.value })}
                className={`${inputBase} ${validationErrors.minority_status ? 'border-red-500' : ''}`}
              />
              {validationErrors.minority_status && <p className="mt-0.5 text-xs text-red-400">{validationErrors.minority_status}</p>}
            </div>
          </div>
        </div>

        {/* Row 2: Reservation checkboxes in a compact grid */}
        <div className="pt-4 border-t border-black/5">
          <div className="flex items-start gap-2 min-w-0">
            <label className={`${L} pt-1`}>Quotas</label>
            <div className="flex-1 min-w-0 grid grid-cols-2 gap-x-4 gap-y-2">
              {[
                { label: "EWS Status", field: "ews_status" as const },
                { label: "PwBD / PWD", field: "pwbd_status" as const },
                { label: "Ex-Serviceman / Defence", field: "ex_serviceman_defence_quota" as const },
                { label: "Kashmiri Migrant", field: "kashmiri_migrant_regional_quota" as const },
                { label: "State Domicile", field: "state_domicile" as const },
              ].map(({ label, field }) => (
                <label key={field} className="flex items-center gap-2 cursor-pointer text-xs text-black/70">
                  <input
                    type="checkbox"
                    checked={catResData[field]}
                    onChange={(e) => setCatResData({ ...catResData, [field]: e.target.checked })}
                    className="h-4 w-4 rounded border-black/20 accent-[#FAD53C]"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Row 3: PwBD details (conditional) */}
        {catResData.pwbd_status && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 pt-4 border-t border-[#FAD53C]/20 bg-[#fffdf0] rounded-xl p-3">
            <p className="sm:col-span-2 text-xs font-semibold text-amber-700">PwBD Details</p>
            <div className="flex items-center gap-2 min-w-0">
              <label className={L}>Disability Type</label>
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  placeholder="Type of disability"
                  value={catResData.type_of_disability}
                  onChange={(e) => setCatResData({ ...catResData, type_of_disability: e.target.value })}
                  className={`${inputBase} ${validationErrors.type_of_disability ? 'border-red-500' : ''}`}
                />
                {validationErrors.type_of_disability && <p className="mt-0.5 text-xs text-red-400">{validationErrors.type_of_disability}</p>}
              </div>
            </div>

            <div className="flex items-center gap-2 min-w-0">
              <label className={L}>Disability %</label>
              <div className="flex-1 min-w-0">
                <input
                  type="number"
                  placeholder="0.00"
                  min="0"
                  max="100"
                  step="0.01"
                  value={catResData.disability_percentage}
                  onChange={(e) => setCatResData({ ...catResData, disability_percentage: e.target.value })}
                  className={`${inputBase} ${validationErrors.disability_percentage ? 'border-red-500' : ''}`}
                />
                {validationErrors.disability_percentage && <p className="mt-0.5 text-xs text-red-400">{validationErrors.disability_percentage}</p>}
              </div>
            </div>

            <div className="flex items-center gap-2 min-w-0">
              <label className={L}>UDID Number</label>
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  placeholder="UDID number (if applicable)"
                  value={catResData.udid_number}
                  onChange={(e) => setCatResData({ ...catResData, udid_number: e.target.value })}
                  className={`${inputBase} ${validationErrors.udid_number ? 'border-red-500' : ''}`}
                />
                {validationErrors.udid_number && <p className="mt-0.5 text-xs text-red-400">{validationErrors.udid_number}</p>}
              </div>
            </div>
          </div>
        )}
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
          {saving ? "Saving..." : "Save Category and Reservation"}
        </Button>
      </div>
    </form>
  );
}
