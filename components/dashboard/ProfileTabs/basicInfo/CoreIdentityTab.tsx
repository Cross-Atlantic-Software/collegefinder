"use client";

import Image from "next/image";
import { useState } from "react";
import { CiCircleInfo } from "react-icons/ci";
import { FaUser, FaCopy } from "react-icons/fa6";

import { Button, DateOfBirthPicker, PhoneInput, Select, Notification } from "../../../shared";
import { useToast } from "../../../shared";
import { updateBasicInfo } from "@/api";
import type { CoreIdentityFormData } from "./types";
import { genderOptions, inputBase } from "./constants";

interface CoreIdentityTabProps {
  formData: CoreIdentityFormData;
  setFormData: (data: CoreIdentityFormData | ((prev: CoreIdentityFormData) => CoreIdentityFormData)) => void;
  email: string;
  emailVerified: boolean;
  userCode: string | null;
  validationErrors: Record<string, string>;
  error: string | null;
  success: boolean;
  saving: boolean;
  onStartSaving: () => void;
  onSuccess: () => void;
  onError: (error: string | null) => void;
  onValidationErrors: (errors: Record<string, string>) => void;
  onShowEmailModal: () => void;
  getCurrentLocation: () => Promise<{ latitude: number; longitude: number } | null>;
  automationPassword: string | null;
}

export default function CoreIdentityTab({
  formData,
  setFormData,
  email,
  emailVerified,
  userCode,
  validationErrors,
  error,
  success,
  saving,
  onStartSaving,
  onSuccess,
  onError,
  onValidationErrors,
  onShowEmailModal,
  getCurrentLocation,
  automationPassword,
}: CoreIdentityTabProps) {
  const { showSuccess, showError } = useToast();
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [copiedUserCode, setCopiedUserCode] = useState(false);

  const copyUserCode = async () => {
    if (userCode) {
      try {
        await navigator.clipboard.writeText(userCode);
        setCopiedUserCode(true);
        showSuccess("User code copied!");
        setTimeout(() => setCopiedUserCode(false), 2000);
      } catch {
        showError("Failed to copy user code");
      }
    }
  };

  const copyPassword = async () => {
    if (automationPassword) {
      try {
        await navigator.clipboard.writeText(automationPassword);
        setCopiedPassword(true);
        showSuccess("Password copied to clipboard!");
        setTimeout(() => setCopiedPassword(false), 2000);
      } catch {
        showError("Failed to copy password");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onStartSaving();
    onError(null);
    onValidationErrors({});

    try {
      const location = await getCurrentLocation();

      const updateData: {
        name?: string;
        first_name?: string;
        last_name?: string;
        date_of_birth?: string;
        gender?: string;
        phone_number?: string;
        latitude?: number;
        longitude?: number;
        nationality?: string;
        marital_status?: string;
        father_full_name?: string;
        mother_full_name?: string;
        guardian_name?: string;
        alternate_mobile_number?: string;
        referred_by_code?: string | null;
      } = {};

      if (formData.name !== undefined) {
        updateData.name = formData.name || undefined;
      }
      if (formData.first_name !== undefined) updateData.first_name = formData.first_name;
      if (formData.last_name) updateData.last_name = formData.last_name;
      if (formData.date_of_birth) updateData.date_of_birth = formData.date_of_birth;
      if (formData.gender) updateData.gender = formData.gender;
      if (formData.phone_number) updateData.phone_number = formData.phone_number;
      if (formData.nationality) updateData.nationality = formData.nationality;
      if (formData.marital_status) updateData.marital_status = formData.marital_status;
      if (formData.father_full_name) updateData.father_full_name = formData.father_full_name;
      if (formData.mother_full_name) updateData.mother_full_name = formData.mother_full_name;
      if (formData.guardian_name !== undefined) updateData.guardian_name = formData.guardian_name || undefined;
      if (formData.alternate_mobile_number !== undefined) updateData.alternate_mobile_number = formData.alternate_mobile_number || undefined;
      if (formData.referred_by_code !== undefined) {
        const t = formData.referred_by_code.trim();
        updateData.referred_by_code = t === "" ? null : t;
      }

      if (location) {
        updateData.latitude = location.latitude;
        updateData.longitude = location.longitude;
      }

      const response = await updateBasicInfo(updateData);

      if (response.success && response.data) {
        let formattedDate = "";
        if (response.data.date_of_birth) {
          if (typeof response.data.date_of_birth === 'string' && /^\d{4}-\d{2}-\d{2}/.test(response.data.date_of_birth)) {
            formattedDate = response.data.date_of_birth.split('T')[0];
          } else {
            const date = new Date(response.data.date_of_birth);
            if (!isNaN(date.getTime())) {
              formattedDate = date.toISOString().split('T')[0];
            }
          }
        }

        const updatedFormData: CoreIdentityFormData = {
          name: response.data.name || "",
          first_name: response.data.first_name || "",
          last_name: response.data.last_name || "",
          date_of_birth: formattedDate,
          gender: response.data.gender || "Male",
          phone_number: response.data.phone_number || "",
          profile_photo: response.data.profile_photo || "",
          nationality: response.data.nationality || "",
          marital_status: response.data.marital_status || "",
          father_full_name: response.data.father_full_name || "",
          mother_full_name: response.data.mother_full_name || "",
          guardian_name: response.data.guardian_name || "",
          alternate_mobile_number: response.data.alternate_mobile_number || "",
          referred_by_code: response.data.referred_by_code ?? "",
        };

        setFormData(updatedFormData);

        onSuccess();
        showSuccess("Core Identity updated successfully!");
      } else {
        if (response.errors && Array.isArray(response.errors)) {
          const errors: Record<string, string> = {};
          response.errors.forEach((err: { param?: string; msg?: string; message?: string }) => {
            if (err.param) {
              errors[err.param] = err.msg || err.message || '';
            }
          });
          onValidationErrors(errors);
        } else {
          onError(response.message || "Failed to update profile");
        }
      }
    } catch (err) {
      console.error("Error updating basic info:", err);
      onError("An error occurred while updating profile");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-sm text-black">
      <div className="space-y-5">
        <h2 className="text-base font-semibold text-black">Core Identity</h2>

        {error && (
          <Notification type="error" message={error} onClose={() => onError(null)} />
        )}
        {success && (
          <Notification type="success" message="Core Identity updated successfully!" onClose={() => {}} autoClose duration={3000} />
        )}

        {/* Public reference ID (assigned at registration; not editable) */}
        <div className="rounded-xl border border-black/10 bg-black/[0.02] px-3 py-3 space-y-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <label className="shrink-0 text-xs font-semibold text-black/55 w-[90px] text-right">User code</label>
            <div className="flex flex-1 min-w-0 items-center gap-2">
              <input
                type="text"
                readOnly
                aria-label="Your public user code"
                value={userCode || "—"}
                className={`${inputBase} flex-1 cursor-default font-mono text-sm tracking-wide`}
              />
              {userCode ? (
                <button
                  type="button"
                  onClick={copyUserCode}
                  className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-black/15 bg-white px-2.5 py-1.5 text-xs font-semibold text-black/80 hover:bg-black/5"
                  title="Copy user code"
                >
                  <FaCopy className="h-3 w-3" />
                  {copiedUserCode ? "Copied" : "Copy"}
                </button>
              ) : null}
            </div>
          </div>
          <p className="text-[10px] text-black/45 pl-0 sm:pl-[calc(90px+0.5rem)]">
            Format UT + 8 digits (e.g. UT12345678). Use for support or references; your internal account id stays private.
          </p>
        </div>

        {/* Code someone else gave you (not your Refer & Earn share code) */}
        <div className="rounded-xl border border-black/10 bg-black/[0.02] px-3 py-3 space-y-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <label className="shrink-0 text-xs font-semibold text-black/55 w-[90px] text-right">
              Used referral code
            </label>
            <div className="flex-1 min-w-0">
              <input
                type="text"
                placeholder="Optional — code you received from someone"
                value={formData.referred_by_code}
                onChange={(e) =>
                  setFormData({ ...formData, referred_by_code: e.target.value.toUpperCase() })
                }
                className={`${inputBase} font-mono text-sm tracking-wide uppercase ${validationErrors.referred_by_code ? "border-red-500" : ""}`}
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={32}
              />
              {validationErrors.referred_by_code && (
                <p className="mt-0.5 text-xs text-red-400">{validationErrors.referred_by_code}</p>
              )}
            </div>
          </div>
          <p className="text-[10px] text-black/45 pl-0 sm:pl-[calc(90px+0.5rem)]">
            If someone invited you, enter their referral code here. This is different from your own share code in Refer &amp; Earn.
            Clear the field to remove it.
          </p>
        </div>

        {/* Row 1: Name + DOB */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 pt-4 border-t border-black/5">
          <div className="flex items-center gap-2 min-w-0">
            <label className="shrink-0 text-xs font-semibold text-black/55 w-[90px] text-right">Full Name</label>
            <div className="flex-1 min-w-0">
              <input
                type="text"
                placeholder="Enter full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`${inputBase} ${validationErrors.name ? 'border-red-500' : ''}`}
              />
              {validationErrors.name && <p className="mt-0.5 text-xs text-red-400">{validationErrors.name}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <label className="shrink-0 text-xs font-semibold text-black/55 w-[90px] text-right">Date of Birth</label>
            <div className="flex-1 min-w-0">
              <DateOfBirthPicker
                value={formData.date_of_birth}
                onChange={(date) => setFormData({ ...formData, date_of_birth: date || "" })}
                error={validationErrors.date_of_birth}
                maxYear={new Date().getFullYear()}
              />
            </div>
          </div>
        </div>

        {/* Row 2: First Name + Last Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 pt-4 border-t border-black/5">
          <p className="sm:col-span-2 text-[11px] text-black/45 italic">First Name and Last Name must be as per 10th marksheet</p>
          <div className="flex items-center gap-2 min-w-0">
            <label className="shrink-0 text-xs font-semibold text-black/55 w-[90px] text-right">First Name *</label>
            <div className="flex-1 min-w-0">
              <input
                type="text"
                placeholder="First name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className={`${inputBase} ${validationErrors.first_name ? 'border-red-500' : ''}`}
                required
              />
              {validationErrors.first_name && <p className="mt-0.5 text-xs text-red-400">{validationErrors.first_name}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <label className="shrink-0 text-xs font-semibold text-black/55 w-[90px] text-right">Last Name</label>
            <div className="flex-1 min-w-0">
              <input
                type="text"
                placeholder="Last name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className={`${inputBase} ${validationErrors.last_name ? 'border-red-500' : ''}`}
              />
              {validationErrors.last_name && <p className="mt-0.5 text-xs text-red-400">{validationErrors.last_name}</p>}
            </div>
          </div>
        </div>

        {/* Row 3: Email (full-width) */}
        <div className="pt-4 border-t border-black/5">
          <div className="flex items-center gap-2 min-w-0">
            <label className="shrink-0 text-xs font-semibold text-black/55 w-[90px] text-right flex-col flex items-end gap-0.5">
              Email
              {email && (
                <span className={`text-[9px] font-bold uppercase rounded-full px-1.5 py-0.5 ${emailVerified ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>
                  {emailVerified ? "Verified" : "Unverified"}
                </span>
              )}
            </label>
            <div className="flex-1 min-w-0 flex items-center gap-2">
              {email ? (
                <>
                  <input
                    type="text"
                    value={email}
                    disabled
                    className={`${inputBase} flex-1 cursor-not-allowed opacity-60`}
                  />
                  {!emailVerified && (
                    <button
                      type="button"
                      onClick={onShowEmailModal}
                      className="shrink-0 rounded-full bg-black px-3 py-1.5 text-xs font-semibold text-[#FAD53C] transition hover:bg-[#111]"
                    >
                      Verify
                    </button>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  onClick={onShowEmailModal}
                  className="flex items-center gap-2 rounded-full bg-black px-4 py-2 text-xs font-semibold text-[#FAD53C] transition hover:bg-[#111]"
                >
                  <CiCircleInfo /> Add Email Address
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Row 4: Phone + Alternate Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 pt-4 border-t border-black/5">
          <div className="flex items-center gap-2 min-w-0">
            <label className="shrink-0 text-xs font-semibold text-black/55 w-[90px] text-right">Phone</label>
            <div className="flex-1 min-w-0">
              <PhoneInput
                value={formData.phone_number}
                onChange={(phone) => setFormData({ ...formData, phone_number: phone || "" })}
                error={validationErrors.phone_number}
                placeholder="Phone number"
                defaultCountryCode="+91"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <label className="shrink-0 text-xs font-semibold text-black/55 w-[90px] text-right">Alt. Phone</label>
            <div className="flex-1 min-w-0">
              <PhoneInput
                value={formData.alternate_mobile_number}
                onChange={(phone) => setFormData({ ...formData, alternate_mobile_number: phone || "" })}
                error={validationErrors.alternate_mobile_number}
                placeholder="Alternate number"
                defaultCountryCode="+91"
              />
            </div>
          </div>
        </div>

        {/* Row 5: Gender (full-width) */}
        <div className="pt-4 border-t border-black/5">
          <div className="flex items-start gap-2 min-w-0">
            <label className="shrink-0 text-xs font-semibold text-black/55 w-[90px] text-right pt-3">
              Gender <FaUser className="inline text-black/30 ml-0.5" />
            </label>
            <div className="flex-1 min-w-0">
              <div className="grid gap-2 grid-cols-3">
                {genderOptions.map((gender) => {
                  const isActive = formData.gender === gender.label;
                  return (
                    <button
                      key={gender.label}
                      type="button"
                      onClick={() => setFormData({ ...formData, gender: gender.label })}
                      className={`flex w-full items-center gap-2 rounded-xl border px-2 py-2 text-left transition ${isActive
                          ? "border-[#FAD53C] bg-[#FAD53C] text-black shadow"
                          : "border-[#dceeff] bg-[#eaf4ff] text-black/70 hover:border-[#FAD53C] hover:bg-[#FAD53C]/10"
                        }`}
                    >
                      <Image src={gender.icon} width={32} height={32} alt={gender.label} className="h-8 w-8 rounded-full" />
                      <span className="text-xs font-semibold truncate">{gender.label}</span>
                    </button>
                  );
                })}
              </div>
              {validationErrors.gender && <p className="mt-0.5 text-xs text-red-400">{validationErrors.gender}</p>}
            </div>
          </div>
        </div>

        {/* Row 6: Nationality + Marital Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 pt-4 border-t border-black/5">
          <div className="flex items-center gap-2 min-w-0">
            <label className="shrink-0 text-xs font-semibold text-black/55 w-[90px] text-right">Nationality</label>
            <div className="flex-1 min-w-0">
              <Select
                options={[{ value: "Indian", label: "Indian" }, { value: "Foreigner", label: "Foreigner" }]}
                value={formData.nationality}
                onChange={(value) => setFormData({ ...formData, nationality: value || "" })}
                placeholder="Select"
                error={validationErrors.nationality}
                isSearchable={false}
                isClearable={true}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <label className="shrink-0 text-xs font-semibold text-black/55 w-[90px] text-right">Marital Status</label>
            <div className="flex-1 min-w-0">
              <Select
                options={[
                  { value: "Single", label: "Single" },
                  { value: "Unmarried", label: "Unmarried" },
                  { value: "Divorced", label: "Divorced" },
                  { value: "Widowed", label: "Widowed" },
                  { value: "Separated", label: "Separated" },
                ]}
                value={formData.marital_status}
                onChange={(value) => setFormData({ ...formData, marital_status: value || "" })}
                placeholder="Select"
                error={validationErrors.marital_status}
                isSearchable={false}
                isClearable={true}
              />
            </div>
          </div>
        </div>

        {/* Row 7: Father + Mother + Guardian */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 pt-4 border-t border-black/5">
          <p className="sm:col-span-2 text-[11px] text-black/40 italic">As per 10th marksheet</p>
          <div className="flex items-center gap-2 min-w-0">
            <label className="shrink-0 text-xs font-semibold text-black/55 w-[90px] text-right">Father&apos;s Name</label>
            <div className="flex-1 min-w-0">
              <input
                type="text"
                placeholder="Father's full name"
                value={formData.father_full_name}
                onChange={(e) => setFormData({ ...formData, father_full_name: e.target.value })}
                className={`${inputBase} ${validationErrors.father_full_name ? 'border-red-500' : ''}`}
              />
              {validationErrors.father_full_name && <p className="mt-0.5 text-xs text-red-400">{validationErrors.father_full_name}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <label className="shrink-0 text-xs font-semibold text-black/55 w-[90px] text-right">Mother&apos;s Name</label>
            <div className="flex-1 min-w-0">
              <input
                type="text"
                placeholder="Mother's full name"
                value={formData.mother_full_name}
                onChange={(e) => setFormData({ ...formData, mother_full_name: e.target.value })}
                className={`${inputBase} ${validationErrors.mother_full_name ? 'border-red-500' : ''}`}
              />
              {validationErrors.mother_full_name && <p className="mt-0.5 text-xs text-red-400">{validationErrors.mother_full_name}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <label className="shrink-0 text-xs font-semibold text-black/55 w-[90px] text-right">Guardian</label>
            <div className="flex-1 min-w-0">
              <input
                type="text"
                placeholder="Guardian name (optional)"
                value={formData.guardian_name}
                onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
                className={`${inputBase} ${validationErrors.guardian_name ? 'border-red-500' : ''}`}
              />
              {validationErrors.guardian_name && <p className="mt-0.5 text-xs text-red-400">{validationErrors.guardian_name}</p>}
            </div>
          </div>
        </div>

        {/* Automation Password (Read-Only) */}
        {automationPassword && (
          <div className="space-y-2 rounded-xl border border-[#FAD53C]/30 bg-[#eaf4ff] p-3.5">
            <label className="flex items-center gap-2 text-sm font-semibold text-black">
              <CiCircleInfo className="text-lg" />
              Automation Password
            </label>
            <p className="text-xs text-black/50 mb-2">
              This is your auto-generated password used by the automation system to fill exam registration forms. It is NOT your login password.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={automationPassword}
                readOnly
                className={`${inputBase} flex-1 cursor-default font-mono text-sm`}
              />
              <button
                type="button"
                onClick={copyPassword}
                className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium transition ${
                    copiedPassword
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-[#FAD53C] text-black hover:bg-[#f0c935]"
                  }`}
              >
                <FaCopy className="text-sm" />
                {copiedPassword ? "Copied!" : "Copy"}
              </button>
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
          {saving ? "Saving..." : "Save Core Identity"}
        </Button>
      </div>
    </form>
  );
}

