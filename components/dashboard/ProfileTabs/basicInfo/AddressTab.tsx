"use client";

import { Button, Select, Notification } from "../../../shared";
import { upsertUserAddress } from "@/api";
import { IoLocationSharp } from "react-icons/io5";
import { getAllStates, getDistrictsForState } from "@/lib/data/indianStatesDistricts";
import type { AddressData } from "./types";
import { inputBase } from "./constants";

interface AddressTabProps {
  addressData: AddressData;
  setAddressData: (data: AddressData | ((prev: AddressData) => AddressData)) => void;
  validationErrors: Record<string, string>;
  error: string | null;
  success: boolean;
  saving: boolean;
  onStartSaving: () => void;
  onSuccess: () => void;
  onError: (error: string | null) => void;
}

export default function AddressTab({
  addressData,
  setAddressData,
  validationErrors,
  error,
  success,
  saving,
  onStartSaving,
  onSuccess,
  onError,
}: AddressTabProps) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onStartSaving();
    onError(null);

    try {
      const response = await upsertUserAddress({
        correspondence_address_line1: addressData.correspondence_address_line1 || undefined,
        correspondence_address_line2: addressData.correspondence_address_line2 || undefined,
        city_town_village: addressData.city_town_village || undefined,
        district: addressData.district || undefined,
        state: addressData.state || undefined,
        country: addressData.country || undefined,
        pincode: addressData.pincode || undefined,
        permanent_address_same_as_correspondence: addressData.permanent_address_same_as_correspondence,
        permanent_address: addressData.permanent_address || undefined,
      });

      if (response.success) {
        onSuccess();
      } else {
        onError(response.message || "Failed to update address");
      }
    } catch (err: any) {
      console.error("Error saving address:", err);
      onError(err.message || "An error occurred while updating address");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-5 rounded-md bg-white/5 p-6">
        <h2 className="text-base font-semibold text-pink sm:text-lg">
          Address
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
            message="Address updated successfully!"
            onClose={() => {}}
            autoClose={true}
            duration={3000}
          />
        )}

        {/* Correspondence Address Line 1 */}
        <div className="space-y-2">
          <label className="flex items-center gap-1 text-sm font-medium text-slate-300">
            Correspondence Address Line 1
          </label>
          <input
            type="text"
            placeholder="Enter address line 1"
            value={addressData.correspondence_address_line1}
            onChange={(e) => setAddressData({ ...addressData, correspondence_address_line1: e.target.value })}
            className={`${inputBase} ${validationErrors.correspondence_address_line1 ? 'border-red-500' : ''}`}
          />
          {validationErrors.correspondence_address_line1 && (
            <p className="text-xs text-red-400">{validationErrors.correspondence_address_line1}</p>
          )}
        </div>

        {/* Correspondence Address Line 2 */}
        <div className="space-y-2">
          <label className="flex items-center gap-1 text-sm font-medium text-slate-300">
            Correspondence Address Line 2
          </label>
          <input
            type="text"
            placeholder="Enter address line 2 (optional)"
            value={addressData.correspondence_address_line2}
            onChange={(e) => setAddressData({ ...addressData, correspondence_address_line2: e.target.value })}
            className={`${inputBase} ${validationErrors.correspondence_address_line2 ? 'border-red-500' : ''}`}
          />
          {validationErrors.correspondence_address_line2 && (
            <p className="text-xs text-red-400">{validationErrors.correspondence_address_line2}</p>
          )}
        </div>

        {/* City / Town / Village */}
        <div className="space-y-2">
          <label className="flex items-center gap-1 text-sm font-medium text-slate-300">
            City / Town / Village
          </label>
          <input
            type="text"
            placeholder="Enter city, town, or village"
            value={addressData.city_town_village}
            onChange={(e) => setAddressData({ ...addressData, city_town_village: e.target.value })}
            className={`${inputBase} ${validationErrors.city_town_village ? 'border-red-500' : ''}`}
          />
          {validationErrors.city_town_village && (
            <p className="text-xs text-red-400">{validationErrors.city_town_village}</p>
          )}
        </div>

        {/* State & District */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
              State <IoLocationSharp className="h-4 w-4 text-pink" />
            </label>
            <Select
              options={getAllStates().map((state) => ({
                value: state,
                label: state,
              }))}
              value={addressData.state}
              onChange={(value) => {
                setAddressData({
                  ...addressData,
                  state: value || "",
                  district: "", // Reset district when state changes
                });
              }}
              placeholder="Select State"
              error={validationErrors.state}
              isSearchable={true}
              isClearable={true}
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
              District <IoLocationSharp className="h-4 w-4 text-pink" />
            </label>
            <Select
              options={
                addressData.state
                  ? getDistrictsForState(addressData.state).map((district) => ({
                      value: district,
                      label: district,
                    }))
                  : []
              }
              value={addressData.district}
              onChange={(value) => setAddressData({ ...addressData, district: value || "" })}
              placeholder={addressData.state ? "Select District" : "Select State first"}
              error={validationErrors.district}
              disabled={!addressData.state}
              isSearchable={true}
              isClearable={true}
            />
          </div>
        </div>

        {/* Country & Pincode */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="flex items-center gap-1 text-sm font-medium text-slate-300">
              Country
            </label>
            <input
              type="text"
              placeholder="Enter country"
              value={addressData.country}
              onChange={(e) => setAddressData({ ...addressData, country: e.target.value })}
              className={`${inputBase} ${validationErrors.country ? 'border-red-500' : ''}`}
            />
            {validationErrors.country && (
              <p className="text-xs text-red-400">{validationErrors.country}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-1 text-sm font-medium text-slate-300">
              Pincode
            </label>
            <input
              type="text"
              placeholder="Enter pincode"
              value={addressData.pincode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                setAddressData({ ...addressData, pincode: value });
              }}
              maxLength={10}
              className={`${inputBase} ${validationErrors.pincode ? 'border-red-500' : ''}`}
            />
            {validationErrors.pincode && (
              <p className="text-xs text-red-400">{validationErrors.pincode}</p>
            )}
          </div>
        </div>

        {/* Permanent Address Same as Correspondence */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <input
              type="checkbox"
              checked={addressData.permanent_address_same_as_correspondence}
              onChange={(e) => setAddressData({ ...addressData, permanent_address_same_as_correspondence: e.target.checked })}
              className="h-4 w-4 rounded border-white/20 bg-white/5 text-pink focus:ring-pink"
            />
            Permanent address same as correspondence
          </label>
        </div>

        {/* Permanent Address (if different) */}
        {!addressData.permanent_address_same_as_correspondence && (
          <div className="space-y-2">
            <label className="flex items-center gap-1 text-sm font-medium text-slate-300">
              Permanent Address <span className="text-xs text-slate-400">(if different)</span>
            </label>
            <textarea
              placeholder="Enter permanent address"
              value={addressData.permanent_address}
              onChange={(e) => setAddressData({ ...addressData, permanent_address: e.target.value })}
              rows={4}
              className={`${inputBase} ${validationErrors.permanent_address ? 'border-red-500' : ''}`}
            />
            {validationErrors.permanent_address && (
              <p className="text-xs text-red-400">{validationErrors.permanent_address}</p>
            )}
          </div>
        )}
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
          {saving ? "Saving..." : "Save Address"}
        </Button>
      </div>
    </form>
  );
}

