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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-5 rounded-md bg-white/5 p-6">
        <h2 className="text-base font-semibold text-pink sm:text-lg">
          Category and Reservation
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
            message="Category and Reservation updated successfully!"
            onClose={() => {}}
            autoClose={true}
            duration={3000}
          />
        )}

        {/* Category */}
        <div className="space-y-2">
          <label className="flex items-center gap-1 text-sm font-medium text-slate-300">
            Category
          </label>
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

        {/* EWS Status */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <input
              type="checkbox"
              checked={catResData.ews_status}
              onChange={(e) => setCatResData({ ...catResData, ews_status: e.target.checked })}
              className="h-4 w-4 rounded border-white/20 bg-white/5 text-pink focus:ring-pink"
            />
            EWS Status
          </label>
        </div>

        {/* PwBD/PWD Status */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <input
              type="checkbox"
              checked={catResData.pwbd_status}
              onChange={(e) => setCatResData({ ...catResData, pwbd_status: e.target.checked })}
              className="h-4 w-4 rounded border-white/20 bg-white/5 text-pink focus:ring-pink"
            />
            PwBD/PWD Status
          </label>
        </div>

        {/* Type of Disability (if applicable) */}
        {catResData.pwbd_status && (
          <>
            <div className="space-y-2">
              <label className="flex items-center gap-1 text-sm font-medium text-slate-300">
                Type of Disability <span className="text-xs text-slate-400">(if applicable)</span>
              </label>
              <input
                type="text"
                placeholder="Enter type of disability"
                value={catResData.type_of_disability}
                onChange={(e) => setCatResData({ ...catResData, type_of_disability: e.target.value })}
                className={`${inputBase} ${validationErrors.type_of_disability ? 'border-red-500' : ''}`}
              />
              {validationErrors.type_of_disability && (
                <p className="text-xs text-red-400">{validationErrors.type_of_disability}</p>
              )}
            </div>

            {/* Disability Percentage */}
            <div className="space-y-2">
              <label className="flex items-center gap-1 text-sm font-medium text-slate-300">
                Disability Percentage
              </label>
              <input
                type="number"
                placeholder="Enter disability percentage (0-100)"
                min="0"
                max="100"
                step="0.01"
                value={catResData.disability_percentage}
                onChange={(e) => setCatResData({ ...catResData, disability_percentage: e.target.value })}
                className={`${inputBase} ${validationErrors.disability_percentage ? 'border-red-500' : ''}`}
              />
              {validationErrors.disability_percentage && (
                <p className="text-xs text-red-400">{validationErrors.disability_percentage}</p>
              )}
            </div>

            {/* UDID Number (if applicable) */}
            <div className="space-y-2">
              <label className="flex items-center gap-1 text-sm font-medium text-slate-300">
                UDID Number <span className="text-xs text-slate-400">(if applicable)</span>
              </label>
              <input
                type="text"
                placeholder="Enter UDID number"
                value={catResData.udid_number}
                onChange={(e) => setCatResData({ ...catResData, udid_number: e.target.value })}
                className={`${inputBase} ${validationErrors.udid_number ? 'border-red-500' : ''}`}
              />
              {validationErrors.udid_number && (
                <p className="text-xs text-red-400">{validationErrors.udid_number}</p>
              )}
            </div>
          </>
        )}

        {/* Minority Status */}
        <div className="space-y-2">
          <label className="flex items-center gap-1 text-sm font-medium text-slate-300">
            Minority Status <span className="text-xs text-slate-400">(where applicable)</span>
          </label>
          <input
            type="text"
            placeholder="Enter minority status"
            value={catResData.minority_status}
            onChange={(e) => setCatResData({ ...catResData, minority_status: e.target.value })}
            className={`${inputBase} ${validationErrors.minority_status ? 'border-red-500' : ''}`}
          />
          {validationErrors.minority_status && (
            <p className="text-xs text-red-400">{validationErrors.minority_status}</p>
          )}
        </div>

        {/* Ex-serviceman/Defence-quota */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <input
              type="checkbox"
              checked={catResData.ex_serviceman_defence_quota}
              onChange={(e) => setCatResData({ ...catResData, ex_serviceman_defence_quota: e.target.checked })}
              className="h-4 w-4 rounded border-white/20 bg-white/5 text-pink focus:ring-pink"
            />
            Ex-serviceman/Defence-quota
          </label>
        </div>

        {/* Kashmiri-migrant/Regional-quota */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <input
              type="checkbox"
              checked={catResData.kashmiri_migrant_regional_quota}
              onChange={(e) => setCatResData({ ...catResData, kashmiri_migrant_regional_quota: e.target.checked })}
              className="h-4 w-4 rounded border-white/20 bg-white/5 text-pink focus:ring-pink"
            />
            Kashmiri-migrant/Regional-quota
          </label>
        </div>

        {/* State Domicile */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <input
              type="checkbox"
              checked={catResData.state_domicile}
              onChange={(e) => setCatResData({ ...catResData, state_domicile: e.target.checked })}
              className="h-4 w-4 rounded border-white/20 bg-white/5 text-pink focus:ring-pink"
            />
            State Domicile
          </label>
        </div>

        {/* Home State for Quota */}
        <div className="space-y-2">
          <label className="flex items-center gap-1 text-sm font-medium text-slate-300">
            Home State for Quota
          </label>
          <Select
            options={getAllStates().map((state) => ({
              value: state,
              label: state,
            }))}
            value={catResData.home_state_for_quota}
            onChange={(value) => setCatResData({ ...catResData, home_state_for_quota: value || "" })}
            placeholder="Select Home State"
            error={validationErrors.home_state_for_quota}
            isSearchable={true}
            isClearable={true}
          />
          {validationErrors.home_state_for_quota && (
            <p className="text-xs text-red-400">{validationErrors.home_state_for_quota}</p>
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
          {saving ? "Saving..." : "Save Category and Reservation"}
        </Button>
      </div>
    </form>
  );
}

