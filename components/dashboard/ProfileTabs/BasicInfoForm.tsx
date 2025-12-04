"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { BiCheck } from "react-icons/bi";
import { CiCircleInfo } from "react-icons/ci";
import { IoLocationSharp } from "react-icons/io5";
import { FaUser } from "react-icons/fa6";

import { Button } from "../../shared";
import { getBasicInfo, updateBasicInfo } from "@/api";
import { EmailVerificationModal } from "./EmailVerificationModal";
import { indianStatesDistricts, getAllStates, getDistrictsForState } from "@/lib/data/indianStatesDistricts";

const genderOptions = [
  { label: "Male", icon: "/icons/male.png" },
  { label: "Female", icon: "/icons/female.png" },
  { label: "Prefer not to say", icon: "/icons/not-say.png" },
];

const inputBase =
  "w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 placeholder:text-slate-400 transition focus:outline-none focus:border-pink focus:bg-white/10";

export default function BasicInfoForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    gender: "Male",
    state: "",
    district: "",
    phone_number: "",
  });

  const [email, setEmail] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await getBasicInfo();
        if (response.success && response.data) {
          // Format date_of_birth for HTML date input (YYYY-MM-DD)
          let formattedDate = "";
          if (response.data.date_of_birth) {
            const date = new Date(response.data.date_of_birth);
            if (!isNaN(date.getTime())) {
              // Format as YYYY-MM-DD for HTML date input
              formattedDate = date.toISOString().split('T')[0];
            }
          }
          
          setFormData({
            first_name: response.data.first_name || "",
            last_name: response.data.last_name || "",
            date_of_birth: formattedDate,
            gender: response.data.gender || "Male",
            state: response.data.state || "",
            district: response.data.district || "",
            phone_number: response.data.phone_number || "",
          });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setValidationErrors({});
    setSuccess(false);

    try {
      const response = await updateBasicInfo({
        first_name: formData.first_name || undefined,
        last_name: formData.last_name || undefined,
        date_of_birth: formData.date_of_birth || undefined,
        gender: formData.gender || undefined,
        state: formData.state || undefined,
        district: formData.district || undefined,
        phone_number: formData.phone_number || undefined,
      });

      if (response.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        // Handle validation errors from backend
        if (response.errors && Array.isArray(response.errors)) {
          const errors: Record<string, string> = {};
          response.errors.forEach((err: any) => {
            if (err.param) {
              errors[err.param] = err.msg || err.message;
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

  const handleSkip = () => {
    // Just close the form or navigate away - user can come back later
    router.push("/dashboard");
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
            <div className="rounded-md bg-red-500/20 border border-red-500/50 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-md bg-emerald-500/20 border border-emerald-500/50 px-4 py-3 text-sm text-emerald-200">
              Profile updated successfully!
            </div>
          )}

          {/* Name */}
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
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                className={`${inputBase} ${validationErrors.date_of_birth ? 'border-red-500' : ''} [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:invert`}
                max={new Date().toISOString().split('T')[0]}
              />
              {validationErrors.date_of_birth && (
                <p className="text-xs text-red-400">{validationErrors.date_of_birth}</p>
              )}
              {formData.date_of_birth && (
                <p className="text-xs text-slate-400">
                  Selected: {new Date(formData.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                State <IoLocationSharp className="h-4 w-4 text-pink" />
              </label>
              <select
                value={formData.state}
                onChange={(e) => {
                  setFormData({ 
                    ...formData, 
                    state: e.target.value,
                    district: "" // Reset district when state changes
                  });
                }}
                className={`${inputBase} ${validationErrors.state ? 'border-red-500' : ''}`}
              >
                <option value="">Select State</option>
                {getAllStates().map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
              {validationErrors.state && (
                <p className="text-xs text-red-400">{validationErrors.state}</p>
              )}
            </div>
          </div>

          {/* District */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
              District <IoLocationSharp className="h-4 w-4 text-pink" />
            </label>
            <select
              value={formData.district}
              onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              disabled={!formData.state}
              className={`${inputBase} ${validationErrors.district ? 'border-red-500' : ''} ${!formData.state ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <option value="">{formData.state ? 'Select District' : 'Select State first'}</option>
              {formData.state && getDistrictsForState(formData.state).map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
            {validationErrors.district && (
              <p className="text-xs text-red-400">{validationErrors.district}</p>
            )}
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
          <input
            type="tel"
            placeholder="+1 (555) 123-4567"
            value={formData.phone_number}
            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
            className={`${inputBase} ${validationErrors.phone_number ? 'border-red-500' : ''}`}
          />
          {validationErrors.phone_number && (
            <p className="text-xs text-red-400">{validationErrors.phone_number}</p>
          )}
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

          <Button
            type="button"
            variant="LightGradient"
            size="md"
            className="w-full flex-1 rounded-full text-pink"
            onClick={handleSkip}
          >
            Skip for Now
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
