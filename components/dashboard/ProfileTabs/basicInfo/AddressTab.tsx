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

const L = "shrink-0 text-xs font-semibold text-black/55 w-[90px] text-right";

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
    <form onSubmit={handleSubmit} className="space-y-5 text-sm text-black">
      <div className="space-y-5">
        <h2 className="text-base font-semibold text-black">Address</h2>

        {error && <Notification type="error" message={error} onClose={() => onError(null)} />}
        {success && (
          <Notification type="success" message="Address updated successfully!" onClose={() => {}} autoClose duration={3000} />
        )}

        {/* Correspondence Address Lines */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 pt-4 border-t border-black/5">
          <div className="flex items-center gap-2 min-w-0">
            <label className={L}>Address L1</label>
            <div className="flex-1 min-w-0">
              <input
                type="text"
                placeholder="Correspondence line 1"
                value={addressData.correspondence_address_line1}
                onChange={(e) => setAddressData({ ...addressData, correspondence_address_line1: e.target.value })}
                className={`${inputBase} ${validationErrors.correspondence_address_line1 ? 'border-red-500' : ''}`}
              />
              {validationErrors.correspondence_address_line1 && <p className="mt-0.5 text-xs text-red-400">{validationErrors.correspondence_address_line1}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <label className={L}>Address L2</label>
            <div className="flex-1 min-w-0">
              <input
                type="text"
                placeholder="Line 2 (optional)"
                value={addressData.correspondence_address_line2}
                onChange={(e) => setAddressData({ ...addressData, correspondence_address_line2: e.target.value })}
                className={`${inputBase} ${validationErrors.correspondence_address_line2 ? 'border-red-500' : ''}`}
              />
              {validationErrors.correspondence_address_line2 && <p className="mt-0.5 text-xs text-red-400">{validationErrors.correspondence_address_line2}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <label className={L}>City / Village</label>
            <div className="flex-1 min-w-0">
              <input
                type="text"
                placeholder="City / Town / Village"
                value={addressData.city_town_village}
                onChange={(e) => setAddressData({ ...addressData, city_town_village: e.target.value })}
                className={`${inputBase} ${validationErrors.city_town_village ? 'border-red-500' : ''}`}
              />
              {validationErrors.city_town_village && <p className="mt-0.5 text-xs text-red-400">{validationErrors.city_town_village}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <label className={`${L} flex items-center justify-end gap-1`}>
              State <IoLocationSharp className="h-3.5 w-3.5 text-black/40" />
            </label>
            <div className="flex-1 min-w-0">
              <Select
                options={getAllStates().map((state) => ({ value: state, label: state }))}
                value={addressData.state}
                onChange={(value) => setAddressData({ ...addressData, state: value || "", district: "" })}
                placeholder="Select State"
                error={validationErrors.state}
                isSearchable={true}
                isClearable={true}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <label className={`${L} flex items-center justify-end gap-1`}>
              District <IoLocationSharp className="h-3.5 w-3.5 text-black/40" />
            </label>
            <div className="flex-1 min-w-0">
              <Select
                options={addressData.state ? getDistrictsForState(addressData.state).map((d) => ({ value: d, label: d })) : []}
                value={addressData.district}
                onChange={(value) => setAddressData({ ...addressData, district: value || "" })}
                placeholder={addressData.state ? "Select District" : "Select state first"}
                error={validationErrors.district}
                disabled={!addressData.state}
                isSearchable={true}
                isClearable={true}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <label className={L}>Country</label>
            <div className="flex-1 min-w-0">
              <input
                type="text"
                placeholder="Country"
                value={addressData.country}
                onChange={(e) => setAddressData({ ...addressData, country: e.target.value })}
                className={`${inputBase} ${validationErrors.country ? 'border-red-500' : ''}`}
              />
              {validationErrors.country && <p className="mt-0.5 text-xs text-red-400">{validationErrors.country}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <label className={L}>Pincode</label>
            <div className="flex-1 min-w-0">
              <input
                type="text"
                placeholder="Pincode"
                value={addressData.pincode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setAddressData({ ...addressData, pincode: value });
                }}
                maxLength={10}
                className={`${inputBase} ${validationErrors.pincode ? 'border-red-500' : ''}`}
              />
              {validationErrors.pincode && <p className="mt-0.5 text-xs text-red-400">{validationErrors.pincode}</p>}
            </div>
          </div>
        </div>

        {/* Same-as toggle */}
        <div className="flex items-center gap-2 pt-4 border-t border-black/5">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-black/70">
            <input
              type="checkbox"
              checked={addressData.permanent_address_same_as_correspondence}
              onChange={(e) => setAddressData({ ...addressData, permanent_address_same_as_correspondence: e.target.checked })}
              className="h-4 w-4 rounded border-black/20 accent-[#FAD53C]"
            />
            Permanent address same as correspondence
          </label>
        </div>

        {/* Permanent Address textarea */}
        {!addressData.permanent_address_same_as_correspondence && (
          <div className="flex items-start gap-2 min-w-0">
            <label className={`${L} pt-2`}>Permanent Address</label>
            <div className="flex-1 min-w-0">
              <textarea
                placeholder="Enter permanent address (if different)"
                value={addressData.permanent_address}
                onChange={(e) => setAddressData({ ...addressData, permanent_address: e.target.value })}
                rows={3}
                className={`${inputBase} resize-none ${validationErrors.permanent_address ? 'border-red-500' : ''}`}
              />
              {validationErrors.permanent_address && <p className="mt-0.5 text-xs text-red-400">{validationErrors.permanent_address}</p>}
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
          {saving ? "Saving..." : "Save Address"}
        </Button>
      </div>
    </form>
  );
}
