"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

import { BiCheck } from "react-icons/bi";
import { CiCircleInfo } from "react-icons/ci";
import { IoLocationSharp } from "react-icons/io5";
import { FaUser } from "react-icons/fa6";

import { Button, DateOfBirthPicker, PhoneInput, Select, SelectOption, Notification } from "../../shared";
import { useToast } from "../../shared";
import { getBasicInfo, updateBasicInfo, uploadProfilePhoto, deleteProfilePhoto } from "@/api";
import { EmailVerificationModal } from "./EmailVerificationModal";
import { indianStatesDistricts, getAllStates, getDistrictsForState } from "@/lib/data/indianStatesDistricts";
import { useAuth } from "@/contexts/AuthContext";

const genderOptions = [
  { label: "Male", icon: "/icons/male.png" },
  { label: "Female", icon: "/icons/female.png" },
  { label: "Prefer not to say", icon: "/icons/not-say.png" },
];

const inputBase =
  "w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 placeholder:text-slate-400 transition focus:outline-none focus:border-pink focus:bg-white/10";

export default function BasicInfoForm() {
  const { showSuccess, showError } = useToast();
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    first_name: "",
    last_name: "",
    date_of_birth: "",
    gender: "Male",
    state: "",
    district: "",
    phone_number: "",
    profile_photo: "",
  });
  
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [email, setEmail] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await getBasicInfo();
        if (response.success && response.data) {
          // Format date_of_birth for DateOfBirthPicker (YYYY-MM-DD)
          let formattedDate = "";
          if (response.data.date_of_birth) {
            // If already in YYYY-MM-DD format, use directly
            if (typeof response.data.date_of_birth === 'string' && /^\d{4}-\d{2}-\d{2}/.test(response.data.date_of_birth)) {
              formattedDate = response.data.date_of_birth.split('T')[0]; // Remove time part if present
            } else {
              // Parse date object and format as YYYY-MM-DD
              const date = new Date(response.data.date_of_birth);
              if (!isNaN(date.getTime())) {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, "0");
                const day = String(date.getDate()).padStart(2, "0");
                formattedDate = `${year}-${month}-${day}`;
              }
            }
          }
          
          const formDataToSet = {
            name: response.data.name ?? "",
            first_name: response.data.first_name ?? "",
            last_name: response.data.last_name ?? "",
            date_of_birth: formattedDate,
            gender: response.data.gender ?? "Male",
            state: response.data.state ?? "",
            district: response.data.district ?? "",
            phone_number: response.data.phone_number ?? "",
            profile_photo: response.data.profile_photo ?? "",
          };
          
          setFormData(formDataToSet);
          setProfilePhotoPreview(response.data.profile_photo || null);
          setEmail(response.data.email || "");
          setEmailVerified(response.data.email_verified || false);
          setPhoneNumber(response.data.phone_number || "");
        }
      } catch (err) {
        console.error("Error fetching basic info:", err);
        setError("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getCurrentLocation = (): Promise<{ latitude: number; longitude: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.warn("Geolocation is not supported by this browser");
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.warn("Error getting location:", error.message);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setValidationErrors({});
    setSuccess(false);

    try {
      // Get current location coordinates
      const location = await getCurrentLocation();
      
      // Prepare update data - include name even if empty string
      const updateData: {
        name?: string;
        first_name?: string;
        last_name?: string;
        date_of_birth?: string;
        gender?: string;
        state?: string;
        district?: string;
        phone_number?: string;
        latitude?: number;
        longitude?: number;
      } = {};
      
      // Always include name - send it explicitly like first_name
      if (formData.name !== undefined) {
        updateData.name = formData.name || undefined; // Convert empty string to undefined
      }
      if (formData.first_name !== undefined) updateData.first_name = formData.first_name;
      if (formData.last_name) updateData.last_name = formData.last_name;
      if (formData.date_of_birth) updateData.date_of_birth = formData.date_of_birth;
      if (formData.gender) updateData.gender = formData.gender;
      if (formData.state) updateData.state = formData.state;
      if (formData.district) updateData.district = formData.district;
      if (formData.phone_number) updateData.phone_number = formData.phone_number;
      
      if (location) {
        updateData.latitude = location.latitude;
        updateData.longitude = location.longitude;
      }
      
      const response = await updateBasicInfo(updateData);

      if (response.success && response.data) {
        // Update form data with the response to reflect saved values from database
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
        
        const updatedFormData = {
          name: response.data.name || "",
          first_name: response.data.first_name || "",
          last_name: response.data.last_name || "",
          date_of_birth: formattedDate,
          gender: response.data.gender || "Male",
          state: response.data.state || "",
          district: response.data.district || "",
          phone_number: response.data.phone_number || "",
          profile_photo: response.data.profile_photo || "",
        };
        
        setFormData(updatedFormData);
        setProfilePhotoPreview(response.data.profile_photo || null);
        
        setSuccess(true);
        showSuccess("Profile updated successfully!");
        setTimeout(() => setSuccess(false), 3000);
      } else {
        // Handle validation errors from backend
        if (response.errors && Array.isArray(response.errors)) {
          const errors: Record<string, string> = {};
          response.errors.forEach((err: { param?: string; msg?: string; message?: string }) => {
            if (err.param) {
              errors[err.param] = err.msg || err.message || '';
            }
          });
          setValidationErrors(errors);
        } else {
          setError(response.message || "Failed to update profile");
        }
      }
    } catch (err) {
      console.error("Error updating basic info:", err);
      setError("An error occurred while updating profile");
    } finally {
      setSaving(false);
    }
  };


  const handleEmailVerified = async () => {
    // Refresh basic info to get updated email_verified status
    try {
      const response = await getBasicInfo();
      if (response.success && response.data) {
        setEmailVerified(response.data.email_verified || false);
      }
    } catch (err) {
      console.error("Error refreshing basic info:", err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 rounded-md bg-white/10 p-6 text-sm text-slate-200 shadow-sm">
        <div className="flex items-center justify-center py-12">
          <div className="text-slate-300">Loading profile data...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 rounded-md bg-white/10 p-6 text-sm text-slate-200 shadow-sm">
        <div className="space-y-5 rounded-md bg-white/5 p-6">
          <h2 className="text-base font-semibold text-pink sm:text-lg">
            Basic Information
          </h2>

          {error && (
            <Notification
              type="error"
              message={error}
              onClose={() => setError(null)}
            />
          )}

          {success && (
            <Notification
              type="success"
              message="Profile updated successfully!"
              onClose={() => setSuccess(false)}
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
                            await refreshUser(); // Refresh user context to update Header and Sidebar
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
                          await refreshUser(); // Refresh user context to update Header and Sidebar
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

          {/* DOB & Location */}
          <div className="grid gap-5 sm:grid-cols-2">
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

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                Domicile State <IoLocationSharp className="h-4 w-4 text-pink" />
              </label>
              <Select
                options={getAllStates().map((state) => ({
                  value: state,
                  label: state,
                }))}
                value={formData.state}
                onChange={(value) => {
                  setFormData({
                    ...formData,
                    state: value || "",
                    district: "", // Reset district when state changes
                  });
                }}
                placeholder="Select Domicile State"
                error={validationErrors.state}
                isSearchable={true}
                isClearable={true}
              />
            </div>
          </div>

          {/* District */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
              District <IoLocationSharp className="h-4 w-4 text-pink" />
            </label>
            <Select
              options={
                formData.state
                  ? getDistrictsForState(formData.state).map((district) => ({
                      value: district,
                      label: district,
                    }))
                  : []
              }
              value={formData.district}
              onChange={(value) => setFormData({ ...formData, district: value || "" })}
              placeholder={formData.state ? "Select District" : "Select State first"}
              error={validationErrors.district}
              disabled={!formData.state}
              isSearchable={true}
              isClearable={true}
            />
          </div>

          {/* Email */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-slate-300">Email</p>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                emailVerified 
                  ? "bg-emerald-100/20 text-emerald-300" 
                  : "bg-amber-100/20 text-amber-300"
              }`}>
                <CiCircleInfo className="text-xs" />
                {emailVerified ? "Verified" : "Unverified"}
              </span>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="text"
                value={email}
                disabled
                className={`${inputBase} flex-1 cursor-not-allowed opacity-50`}
              />
              {!emailVerified && (
                <button
                  type="button"
                  onClick={() => setShowEmailModal(true)}
                  className="rounded-md bg-pink-600 px-6 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow transition hover:bg-pink-700"
                >
                  Verify Now
                </button>
              )}
            </div>
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
                    className={`flex w-full items-center gap-3 rounded-md border px-4 py-3 text-left transition ${
                      isActive
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
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <Button
            type="submit"
            variant="DarkGradient"
            size="md"
            className="w-full flex-1 rounded-full"
            disabled={saving}
          >
            {saving ? "Updating..." : "Update Details"}
          </Button>
        </div>
      </form>

      <EmailVerificationModal
        email={email}
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onVerified={handleEmailVerified}
      />
    </>
  );
}
