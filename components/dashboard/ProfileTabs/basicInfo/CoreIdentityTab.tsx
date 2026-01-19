"use client";

import { useState } from "react";
import Image from "next/image";
import { CiCircleInfo } from "react-icons/ci";
import { FaUser, FaCopy } from "react-icons/fa6";

import { Button, DateOfBirthPicker, PhoneInput, Select, Notification } from "../../../shared";
import { useToast } from "../../../shared";
import { updateBasicInfo, uploadProfilePhoto, deleteProfilePhoto } from "@/api";
import { EmailVerificationModal } from "../EmailVerificationModal";
import { useAuth } from "@/contexts/AuthContext";
import type { CoreIdentityFormData } from "./types";
import { genderOptions, inputBase } from "./constants";

interface CoreIdentityTabProps {
  formData: CoreIdentityFormData;
  setFormData: (data: CoreIdentityFormData | ((prev: CoreIdentityFormData) => CoreIdentityFormData)) => void;
  profilePhotoPreview: string | null;
  setProfilePhotoPreview: (preview: string | null) => void;
  email: string;
  emailVerified: boolean;
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
  profilePhotoPreview,
  setProfilePhotoPreview,
  email,
  emailVerified,
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
  const { refreshUser } = useAuth();
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

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
        };

        setFormData(updatedFormData);
        setProfilePhotoPreview(response.data.profile_photo || null);

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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-5 rounded-md bg-white/5 p-6">
        <h2 className="text-base font-semibold text-pink sm:text-lg">
          Core Identity
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
            message="Core Identity updated successfully!"
            onClose={() => { }}
            autoClose={true}
            duration={3000}
          />
        )}

        {/* Profile Photo */}
        <div className="space-y-2">
          <label className="flex items-center gap-1 text-sm font-medium text-slate-300">
            Profile Photo
          </label>
          <div className="flex items-center gap-4">
            <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-white/20">
              {profilePhotoPreview ? (
                <Image
                  src={profilePhotoPreview}
                  alt="Profile"
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-white/5">
                  <FaUser className="h-8 w-8 text-slate-400" />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        setUploadingPhoto(true);
                        const response = await uploadProfilePhoto(file);
                        if (response.success && response.data) {
                          setProfilePhotoPreview(response.data.profile_photo);
                          setFormData({ ...formData, profile_photo: response.data.profile_photo });
                          await refreshUser();
                          showSuccess("Profile photo uploaded successfully!");
                        }
                      } catch (err: any) {
                        showError(err.message || "Failed to upload profile photo");
                      } finally {
                        setUploadingPhoto(false);
                      }
                    }
                  }}
                  disabled={uploadingPhoto}
                />
                <span className="inline-block rounded-md bg-pink px-4 py-2 text-sm font-medium text-white transition hover:bg-pink/90">
                  {uploadingPhoto ? "Uploading..." : profilePhotoPreview ? "Change Photo" : "Upload Photo"}
                </span>
              </label>
              {profilePhotoPreview && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setUploadingPhoto(true);
                      const response = await deleteProfilePhoto();
                      if (response.success) {
                        setProfilePhotoPreview(null);
                        setFormData({ ...formData, profile_photo: "" });
                        await refreshUser();
                        showSuccess("Profile photo removed successfully!");
                      }
                    } catch (err: any) {
                      showError(err.message || "Failed to remove profile photo");
                    } finally {
                      setUploadingPhoto(false);
                    }
                  }}
                  disabled={uploadingPhoto}
                  className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                >
                  {uploadingPhoto ? "Removing..." : "Remove Photo"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Name */}
        <div className="space-y-2">
          <label className="flex items-center gap-1 text-sm font-medium text-slate-300">
            Name
          </label>
          <input
            type="text"
            placeholder="Enter your name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={`${inputBase} ${validationErrors.name ? 'border-red-500' : ''}`}
          />
          {validationErrors.name && (
            <p className="text-xs text-red-400">{validationErrors.name}</p>
          )}
        </div>

        {/* First Name & Last Name */}
        <p className="text-xs text-pink italic">First Name and Last Name must be as per 10th marksheet</p>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="flex items-center gap-1 text-sm font-medium text-slate-300">
              First Name <span className="text-pink">*</span>
            </label>
            <input
              type="text"
              placeholder="First name"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              className={`${inputBase} ${validationErrors.first_name ? 'border-red-500' : ''}`}
              required
            />
            {validationErrors.first_name && (
              <p className="text-xs text-red-400">{validationErrors.first_name}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-1 text-sm font-medium text-slate-300">
              Last Name
            </label>
            <input
              type="text"
              placeholder="Last name"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              className={`${inputBase} ${validationErrors.last_name ? 'border-red-500' : ''}`}
            />
            {validationErrors.last_name && (
              <p className="text-xs text-red-400">{validationErrors.last_name}</p>
            )}
          </div>
        </div>

        {/* Date of Birth */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
            Date of Birth
          </label>
          <DateOfBirthPicker
            value={formData.date_of_birth}
            onChange={(date) => setFormData({ ...formData, date_of_birth: date || "" })}
            error={validationErrors.date_of_birth}
            maxYear={new Date().getFullYear()}
          />
        </div>

        {/* Email */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-slate-300">Email</p>
            {email ? (
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${emailVerified
                  ? "bg-emerald-100/20 text-emerald-300"
                  : "bg-amber-100/20 text-amber-300"
                }`}>
                <CiCircleInfo className="text-xs" />
                {emailVerified ? "Verified" : "Unverified"}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-slate-100/20 text-slate-300">
                <CiCircleInfo className="text-xs" />
                Not Added
              </span>
            )}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {email ? (
              <>
                <input
                  type="text"
                  value={email}
                  disabled
                  className={`${inputBase} flex-1 cursor-not-allowed opacity-50`}
                />
                {!emailVerified && (
                  <button
                    type="button"
                    onClick={onShowEmailModal}
                    className="rounded-md bg-pink-600 px-6 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow transition hover:bg-pink-700"
                  >
                    Verify Now
                  </button>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={onShowEmailModal}
                className="rounded-md bg-pink px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-pink/90 flex items-center gap-2"
              >
                <CiCircleInfo className="text-lg" />
                Add Email Address
              </button>
            )}
          </div>
          {!email && (
            <p className="text-xs text-slate-400">
              Add your email to receive important updates and recover your account
            </p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <label className="flex items-center gap-1 text-sm font-medium text-slate-300">
            Phone Number
          </label>
          <PhoneInput
            value={formData.phone_number}
            onChange={(phone) => setFormData({ ...formData, phone_number: phone || "" })}
            error={validationErrors.phone_number}
            placeholder="Enter phone number"
            defaultCountryCode="+91"
          />
        </div>

        {/* Alternate Mobile Number */}
        <div className="space-y-2">
          <label className="flex items-center gap-1 text-sm font-medium text-slate-300">
            Alternate Mobile Number
          </label>
          <PhoneInput
            value={formData.alternate_mobile_number}
            onChange={(phone) => setFormData({ ...formData, alternate_mobile_number: phone || "" })}
            error={validationErrors.alternate_mobile_number}
            placeholder="Enter alternate mobile number"
            defaultCountryCode="+91"
          />
        </div>

        {/* Gender */}
        <div className="space-y-3">
          <p className="flex items-center gap-2 text-sm font-medium text-slate-300">
            Gender <FaUser className="text-pink" />
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            {genderOptions.map((gender) => {
              const isActive = formData.gender === gender.label;

              return (
                <button
                  key={gender.label}
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: gender.label })}
                  className={`flex w-full items-center gap-3 rounded-md border px-4 py-3 text-left transition ${isActive
                      ? "border-transparent bg-pink text-white shadow"
                      : "border-white/10 bg-white/5 text-slate-200 hover:border-pink hover:bg-white/10"
                    }`}
                >
                  <Image
                    src={gender.icon}
                    width={42}
                    height={42}
                    alt={gender.label}
                    className="h-10 w-10 rounded-full"
                  />
                  <span className="text-sm font-semibold">{gender.label}</span>
                </button>
              );
            })}
          </div>
          {validationErrors.gender && (
            <p className="text-xs text-red-400">{validationErrors.gender}</p>
          )}
        </div>

        {/* Nationality */}
        <div className="space-y-2">
          <label className="flex items-center gap-1 text-sm font-medium text-slate-300">
            Nationality
          </label>
          <Select
            options={[
              { value: "Indian", label: "Indian" },
              { value: "Foreigner", label: "Foreigner" },
            ]}
            value={formData.nationality}
            onChange={(value) => setFormData({ ...formData, nationality: value || "" })}
            placeholder="Select Nationality"
            error={validationErrors.nationality}
            isSearchable={false}
            isClearable={true}
          />
        </div>

        {/* Marital Status */}
        <div className="space-y-2">
          <label className="flex items-center gap-1 text-sm font-medium text-slate-300">
            Marital Status
          </label>
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
            placeholder="Select Marital Status"
            error={validationErrors.marital_status}
            isSearchable={false}
            isClearable={true}
          />
        </div>

        {/* Father's Full Name */}
        <div className="space-y-2">
          <label className="flex items-center gap-1 text-sm font-medium text-slate-300">
            Father&apos;s Full Name <span className="text-xs text-pink italic">(As per 10th marksheet)</span>
          </label>
          <input
            type="text"
            placeholder="Enter father's full name"
            value={formData.father_full_name}
            onChange={(e) => setFormData({ ...formData, father_full_name: e.target.value })}
            className={`${inputBase} ${validationErrors.father_full_name ? 'border-red-500' : ''}`}
          />
          {validationErrors.father_full_name && (
            <p className="text-xs text-red-400">{validationErrors.father_full_name}</p>
          )}
        </div>

        {/* Mother's Full Name */}
        <div className="space-y-2">
          <label className="flex items-center gap-1 text-sm font-medium text-slate-300">
            Mother&apos;s Full Name <span className="text-xs text-pink italic">(As per 10th marksheet)</span>
          </label>
          <input
            type="text"
            placeholder="Enter mother's full name"
            value={formData.mother_full_name}
            onChange={(e) => setFormData({ ...formData, mother_full_name: e.target.value })}
            className={`${inputBase} ${validationErrors.mother_full_name ? 'border-red-500' : ''}`}
          />
          {validationErrors.mother_full_name && (
            <p className="text-xs text-red-400">{validationErrors.mother_full_name}</p>
          )}
        </div>

        {/* Guardian Name (Optional) */}
        <div className="space-y-2">
          <label className="flex items-center gap-1 text-sm font-medium text-slate-300">
            Guardian Name <span className="text-xs text-slate-400">(if applicable)</span>
          </label>
          <input
            type="text"
            placeholder="Enter guardian name (optional)"
            value={formData.guardian_name}
            onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
            className={`${inputBase} ${validationErrors.guardian_name ? 'border-red-500' : ''}`}
          />
          {validationErrors.guardian_name && (
            <p className="text-xs text-red-400">{validationErrors.guardian_name}</p>
          )}
        </div>

        {/* Automation Password (Read-Only) */}
        {automationPassword && (
          <div className="space-y-2 rounded-md border border-pink/30 bg-pink/5 p-4">
            <label className="flex items-center gap-2 text-sm font-medium text-pink">
              <CiCircleInfo className="text-lg" />
              Automation Password
            </label>
            <p className="text-xs text-slate-400 mb-2">
              This is your auto-generated password used by the automation system to fill exam registration forms. It is NOT your login password.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={automationPassword}
                readOnly
                className={`${inputBase} flex-1 cursor-default bg-white/5 font-mono text-sm`}
              />
              <button
                type="button"
                onClick={copyPassword}
                className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${copiedPassword
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-pink/20 text-pink hover:bg-pink/30"
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
      <div className="flex flex-col gap-4 sm:flex-row">
        <Button
          type="submit"
          variant="DarkGradient"
          size="md"
          className="w-full flex-1 rounded-full"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Core Identity"}
        </Button>
      </div>
    </form>
  );
}

