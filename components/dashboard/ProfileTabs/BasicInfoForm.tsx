"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

import { BiCheck } from "react-icons/bi";
import { CiCircleInfo } from "react-icons/ci";
import { IoLocationSharp } from "react-icons/io5";
import { FaUser } from "react-icons/fa6";

import { Button, DateOfBirthPicker, PhoneInput, Select, SelectOption, Notification } from "../../shared";
import { useToast } from "../../shared";
import { getBasicInfo, updateBasicInfo, uploadProfilePhoto, deleteProfilePhoto, getGovernmentIdentification, upsertGovernmentIdentification, getCategoryAndReservation, upsertCategoryAndReservation, getOtherPersonalDetails, upsertOtherPersonalDetails, getUserAddress, upsertUserAddress } from "@/api";
import { getAllCategories } from "@/api/public/categories";
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
    phone_number: "",
    profile_photo: "",
    nationality: "",
    marital_status: "",
    father_full_name: "",
    mother_full_name: "",
    guardian_name: "",
    alternate_mobile_number: "",
  });

  const [govIdData, setGovIdData] = useState({
    aadhar_number: "",
    alternative_id_type: "",
    alternative_id_number: "",
    place_of_issue: "",
  });

  const [catResData, setCatResData] = useState({
    category_id: "",
    ews_status: false,
    pwbd_status: false,
    type_of_disability: "",
    disability_percentage: "",
    udid_number: "",
    minority_status: "",
    ex_serviceman_defence_quota: false,
    kashmiri_migrant_regional_quota: false,
  });

  const [categories, setCategories] = useState<Array<{ value: string; label: string }>>([]);

  const [otherPersonalDetails, setOtherPersonalDetails] = useState({
    religion: "",
    mother_tongue: "",
    annual_family_income: "",
    occupation_of_father: "",
    occupation_of_mother: "",
  });

  const [addressData, setAddressData] = useState({
    correspondence_address_line1: "",
    correspondence_address_line2: "",
    city_town_village: "",
    district: "",
    state: "",
    country: "India",
    pincode: "",
    permanent_address_same_as_correspondence: true,
    permanent_address: "",
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
            phone_number: response.data.phone_number ?? "",
            profile_photo: response.data.profile_photo ?? "",
            nationality: response.data.nationality ?? "",
            marital_status: response.data.marital_status ?? "",
            father_full_name: response.data.father_full_name ?? "",
            mother_full_name: response.data.mother_full_name ?? "",
            guardian_name: response.data.guardian_name ?? "",
            alternate_mobile_number: response.data.alternate_mobile_number ?? "",
          };
          
          setFormData(formDataToSet);
          setProfilePhotoPreview(response.data.profile_photo || null);
          setEmail(response.data.email || "");
          setEmailVerified(response.data.email_verified || false);
          setPhoneNumber(response.data.phone_number || "");

          // Fetch government identification
          try {
            const govIdResponse = await getGovernmentIdentification();
            if (govIdResponse.success && govIdResponse.data) {
              setGovIdData({
                aadhar_number: govIdResponse.data.aadhar_number || "",
                alternative_id_type: govIdResponse.data.alternative_id_type || "",
                alternative_id_number: govIdResponse.data.alternative_id_number || "",
                place_of_issue: govIdResponse.data.place_of_issue || "",
              });
            }
          } catch (err) {
            console.error("Error fetching government identification:", err);
          }

          // Fetch category and reservation
          try {
            const catResResponse = await getCategoryAndReservation();
            if (catResResponse.success && catResResponse.data) {
              setCatResData({
                category_id: catResResponse.data.category_id?.toString() || "",
                ews_status: catResResponse.data.ews_status || false,
                pwbd_status: catResResponse.data.pwbd_status || false,
                type_of_disability: catResResponse.data.type_of_disability || "",
                disability_percentage: catResResponse.data.disability_percentage?.toString() || "",
                udid_number: catResResponse.data.udid_number || "",
                minority_status: catResResponse.data.minority_status || "",
                ex_serviceman_defence_quota: catResResponse.data.ex_serviceman_defence_quota || false,
                kashmiri_migrant_regional_quota: catResResponse.data.kashmiri_migrant_regional_quota || false,
              });
            }
          } catch (err) {
            console.error("Error fetching category and reservation:", err);
          }

          // Fetch categories for dropdown
          try {
            const categoriesResponse = await getAllCategories();
            if (categoriesResponse.success && categoriesResponse.data) {
              const categoryOptions = categoriesResponse.data.categories.map((cat: { id: number; name: string }) => ({
                value: cat.id.toString(),
                label: cat.name,
              }));
              setCategories(categoryOptions);
            }
          } catch (err) {
            console.error("Error fetching categories:", err);
          }

          // Fetch other personal details
          try {
            const otherDetailsResponse = await getOtherPersonalDetails();
            if (otherDetailsResponse.success && otherDetailsResponse.data) {
              setOtherPersonalDetails({
                religion: otherDetailsResponse.data.religion || "",
                mother_tongue: otherDetailsResponse.data.mother_tongue || "",
                annual_family_income: otherDetailsResponse.data.annual_family_income?.toString() || "",
                occupation_of_father: otherDetailsResponse.data.occupation_of_father || "",
                occupation_of_mother: otherDetailsResponse.data.occupation_of_mother || "",
              });
            }
          } catch (err) {
            console.error("Error fetching other personal details:", err);
          }

          // Fetch address
          try {
            const addressResponse = await getUserAddress();
            if (addressResponse.success && addressResponse.data) {
              setAddressData({
                correspondence_address_line1: addressResponse.data.correspondence_address_line1 || "",
                correspondence_address_line2: addressResponse.data.correspondence_address_line2 || "",
                city_town_village: addressResponse.data.city_town_village || "",
                district: addressResponse.data.district || "",
                state: addressResponse.data.state || "",
                country: addressResponse.data.country || "India",
                pincode: addressResponse.data.pincode || "",
                permanent_address_same_as_correspondence: addressResponse.data.permanent_address_same_as_correspondence ?? true,
                permanent_address: addressResponse.data.permanent_address || "",
              });
            }
          } catch (err) {
            console.error("Error fetching address:", err);
          }
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
        nationality?: string;
        marital_status?: string;
        father_full_name?: string;
        mother_full_name?: string;
        guardian_name?: string;
        alternate_mobile_number?: string;
      } = {};
      
      // Always include name - send it explicitly like first_name
      if (formData.name !== undefined) {
        updateData.name = formData.name || undefined; // Convert empty string to undefined
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
        
        // Save government identification
        try {
          await upsertGovernmentIdentification({
            aadhar_number: govIdData.aadhar_number || undefined,
            alternative_id_type: govIdData.alternative_id_type as 'Passport' | 'PAN' | 'Voter ID' | 'School ID' | undefined,
            alternative_id_number: govIdData.alternative_id_number || undefined,
            place_of_issue: govIdData.place_of_issue || undefined,
          });
        } catch (err) {
          console.error("Error saving government identification:", err);
          // Don't fail the whole form if gov ID save fails
        }

        // Save category and reservation
        try {
          await upsertCategoryAndReservation({
            category_id: catResData.category_id ? parseInt(catResData.category_id) : undefined,
            ews_status: catResData.ews_status,
            pwbd_status: catResData.pwbd_status,
            type_of_disability: catResData.type_of_disability || undefined,
            disability_percentage: catResData.disability_percentage ? parseFloat(catResData.disability_percentage) : undefined,
            udid_number: catResData.udid_number || undefined,
            minority_status: catResData.minority_status || undefined,
            ex_serviceman_defence_quota: catResData.ex_serviceman_defence_quota,
            kashmiri_migrant_regional_quota: catResData.kashmiri_migrant_regional_quota,
          });
        } catch (err) {
          console.error("Error saving category and reservation:", err);
          // Don't fail the whole form if category and reservation save fails
        }

        // Save other personal details
        try {
          await upsertOtherPersonalDetails({
            religion: otherPersonalDetails.religion as any || undefined,
            mother_tongue: otherPersonalDetails.mother_tongue || undefined,
            annual_family_income: otherPersonalDetails.annual_family_income ? parseFloat(otherPersonalDetails.annual_family_income) : undefined,
            occupation_of_father: otherPersonalDetails.occupation_of_father || undefined,
            occupation_of_mother: otherPersonalDetails.occupation_of_mother || undefined,
          });
        } catch (err) {
          console.error("Error saving other personal details:", err);
          // Don't fail the whole form if other personal details save fails
        }

        // Save address
        try {
          await upsertUserAddress({
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
        } catch (err) {
          console.error("Error saving address:", err);
          // Don't fail the whole form if address save fails
        }
        
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


  const handleEmailVerified = async (newEmail: string) => {
    // Refresh basic info to get updated email and email_verified status
    try {
      const response = await getBasicInfo();
      if (response.success && response.data) {
        setEmail(response.data.email || "");
        setEmailVerified(response.data.email_verified || false);
        showSuccess("Email verified successfully!");
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
            Core Identity
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
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  emailVerified 
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
                      onClick={() => setShowEmailModal(true)}
                      className="rounded-md bg-pink-600 px-6 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow transition hover:bg-pink-700"
                    >
                      Verify Now
                    </button>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowEmailModal(true)}
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
        </div>

        {/* Government Identification Section */}
        <div className="space-y-5 rounded-md bg-white/5 p-6">
          <h2 className="text-base font-semibold text-pink sm:text-lg">
            Government Identification
          </h2>

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

          {/* Alternative ID Type */}
          <div className="space-y-2">
            <label className="flex items-center gap-1 text-sm font-medium text-slate-300">
              Alternative ID Type
            </label>
            <Select
              options={[
                { value: "Passport", label: "Passport" },
                { value: "PAN", label: "PAN" },
                { value: "Voter ID", label: "Voter ID" },
                { value: "School ID", label: "School ID" },
              ]}
              value={govIdData.alternative_id_type}
              onChange={(value) => setGovIdData({ ...govIdData, alternative_id_type: value || "" })}
              placeholder="Select Alternative ID Type"
              error={validationErrors.alternative_id_type}
              isSearchable={false}
              isClearable={true}
            />
          </div>

          {/* Alternative ID Number */}
          <div className="space-y-2">
            <label className="flex items-center gap-1 text-sm font-medium text-slate-300">
              Alternative ID Number
            </label>
            <input
              type="text"
              placeholder="Enter alternative ID number"
              value={govIdData.alternative_id_number}
              onChange={(e) => setGovIdData({ ...govIdData, alternative_id_number: e.target.value })}
              className={`${inputBase} ${validationErrors.alternative_id_number ? 'border-red-500' : ''}`}
            />
            {validationErrors.alternative_id_number && (
              <p className="text-xs text-red-400">{validationErrors.alternative_id_number}</p>
            )}
          </div>

          {/* Place of Issue */}
          <div className="space-y-2">
            <label className="flex items-center gap-1 text-sm font-medium text-slate-300">
              Place of Issue
            </label>
            <input
              type="text"
              placeholder="Enter place of issue"
              value={govIdData.place_of_issue}
              onChange={(e) => setGovIdData({ ...govIdData, place_of_issue: e.target.value })}
              className={`${inputBase} ${validationErrors.place_of_issue ? 'border-red-500' : ''}`}
            />
            {validationErrors.place_of_issue && (
              <p className="text-xs text-red-400">{validationErrors.place_of_issue}</p>
            )}
          </div>
        </div>

        {/* Category and Reservation Section */}
        <div className="space-y-5 rounded-md bg-white/5 p-6">
          <h2 className="text-base font-semibold text-pink sm:text-lg">
            Category and Reservation
          </h2>

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
        </div>

        {/* Other Personal Information Section */}
        <div className="space-y-5 rounded-md bg-white/5 p-6">
          <h2 className="text-base font-semibold text-pink sm:text-lg">
            Other Personal Information
          </h2>

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

        {/* Address Section */}
        <div className="space-y-5 rounded-md bg-white/5 p-6">
          <h2 className="text-base font-semibold text-pink sm:text-lg">
            Address
          </h2>

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
        email={email || null}
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onVerified={handleEmailVerified}
      />
    </>
  );
}
