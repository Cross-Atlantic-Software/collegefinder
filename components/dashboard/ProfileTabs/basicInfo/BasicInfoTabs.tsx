"use client";

import { useState } from "react";
import type { BasicInfoTabKey } from "./types";
import CoreIdentityTab from "./CoreIdentityTab";
import GovernmentIdentificationTab from "./GovernmentIdentificationTab";
import CategoryAndReservationTab from "./CategoryAndReservationTab";
import OtherPersonalInformationTab from "./OtherPersonalInformationTab";
import AddressTab from "./AddressTab";
import type {
  CoreIdentityFormData,
  GovernmentIdentificationData,
  CategoryAndReservationData,
  OtherPersonalDetailsData,
  AddressData,
} from "./types";

interface BasicInfoTabsProps {
  // Core Identity
  formData: CoreIdentityFormData;
  setFormData: (data: CoreIdentityFormData | ((prev: CoreIdentityFormData) => CoreIdentityFormData)) => void;
  profilePhotoPreview: string | null;
  setProfilePhotoPreview: (preview: string | null) => void;
  email: string;
  emailVerified: boolean;
  getCurrentLocation: () => Promise<{ latitude: number; longitude: number } | null>;
  onShowEmailModal: () => void;

  // Government Identification
  govIdData: GovernmentIdentificationData;
  setGovIdData: (data: GovernmentIdentificationData | ((prev: GovernmentIdentificationData) => GovernmentIdentificationData)) => void;

  // Category and Reservation
  catResData: CategoryAndReservationData;
  setCatResData: (data: CategoryAndReservationData | ((prev: CategoryAndReservationData) => CategoryAndReservationData)) => void;
  categories: Array<{ value: string; label: string }>;

  // Other Personal Details
  otherPersonalDetails: OtherPersonalDetailsData;
  setOtherPersonalDetails: (data: OtherPersonalDetailsData | ((prev: OtherPersonalDetailsData) => OtherPersonalDetailsData)) => void;

  // Address
  addressData: AddressData;
  setAddressData: (data: AddressData | ((prev: AddressData) => AddressData)) => void;
}

export default function BasicInfoTabs({
  formData,
  setFormData,
  profilePhotoPreview,
  setProfilePhotoPreview,
  email,
  emailVerified,
  getCurrentLocation,
  onShowEmailModal,
  govIdData,
  setGovIdData,
  catResData,
  setCatResData,
  categories,
  otherPersonalDetails,
  setOtherPersonalDetails,
  addressData,
  setAddressData,
}: BasicInfoTabsProps) {
  const [activeTab, setActiveTab] = useState<BasicInfoTabKey>("core-identity");
  const [saving, setSaving] = useState<Record<string, boolean>>({
    "core-identity": false,
    "government-id": false,
    "category-reservation": false,
    "other-personal": false,
    "address": false,
  });
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<Record<string, boolean>>({
    "core-identity": false,
    "government-id": false,
    "category-reservation": false,
    "other-personal": false,
    "address": false,
  });

  const basicInfoTabs: { key: BasicInfoTabKey; label: string }[] = [
    { key: "core-identity", label: "Core Identity" },
    { key: "government-id", label: "Government Identification" },
    { key: "category-reservation", label: "Category and Reservation" },
    { key: "other-personal", label: "Other Personal Information" },
    { key: "address", label: "Address" },
  ];

  const handleStartSaving = (tabKey: BasicInfoTabKey) => {
    setSaving({ ...saving, [tabKey]: true });
    setError(null);
    setValidationErrors({});
    setSuccess({ ...success, [tabKey]: false });
  };

  const handleSuccess = (tabKey: BasicInfoTabKey) => {
    setSuccess({ ...success, [tabKey]: true });
    setTimeout(() => setSuccess({ ...success, [tabKey]: false }), 3000);
    setSaving({ ...saving, [tabKey]: false });
  };

  const handleError = (tabKey: BasicInfoTabKey, errorMessage: string | null) => {
    setError(errorMessage);
    setSaving({ ...saving, [tabKey]: false });
  };


  return (
    <>
      {/* Inner Tabs Bar */}
      <div className="mb-5 flex w-full flex-wrap rounded-md bg-white/10 text-sm font-medium text-slate-300">
        {basicInfoTabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center justify-center gap-2 whitespace-nowrap px-4 py-3 text-center transition ${
                isActive ? "bg-pink text-white" : "hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="space-y-6 rounded-md bg-white/10 p-6 text-sm text-slate-200 shadow-sm">
        {activeTab === "core-identity" && (
          <CoreIdentityTab
            formData={formData}
            setFormData={setFormData}
            profilePhotoPreview={profilePhotoPreview}
            setProfilePhotoPreview={setProfilePhotoPreview}
            email={email}
            emailVerified={emailVerified}
            validationErrors={validationErrors}
            error={error}
            success={success["core-identity"]}
            saving={saving["core-identity"]}
            onStartSaving={() => handleStartSaving("core-identity")}
            onSuccess={() => handleSuccess("core-identity")}
            onError={(err) => handleError("core-identity", err)}
            onValidationErrors={setValidationErrors}
            onShowEmailModal={onShowEmailModal}
            getCurrentLocation={getCurrentLocation}
          />
        )}

        {activeTab === "government-id" && (
          <GovernmentIdentificationTab
            govIdData={govIdData}
            setGovIdData={setGovIdData}
            validationErrors={validationErrors}
            error={error}
            success={success["government-id"]}
            saving={saving["government-id"]}
            onStartSaving={() => handleStartSaving("government-id")}
            onSuccess={() => handleSuccess("government-id")}
            onError={(err) => handleError("government-id", err)}
          />
        )}

        {activeTab === "category-reservation" && (
          <CategoryAndReservationTab
            catResData={catResData}
            setCatResData={setCatResData}
            categories={categories}
            validationErrors={validationErrors}
            error={error}
            success={success["category-reservation"]}
            saving={saving["category-reservation"]}
            onStartSaving={() => handleStartSaving("category-reservation")}
            onSuccess={() => handleSuccess("category-reservation")}
            onError={(err) => handleError("category-reservation", err)}
          />
        )}

        {activeTab === "other-personal" && (
          <OtherPersonalInformationTab
            otherPersonalDetails={otherPersonalDetails}
            setOtherPersonalDetails={setOtherPersonalDetails}
            validationErrors={validationErrors}
            error={error}
            success={success["other-personal"]}
            saving={saving["other-personal"]}
            onStartSaving={() => handleStartSaving("other-personal")}
            onSuccess={() => handleSuccess("other-personal")}
            onError={(err) => handleError("other-personal", err)}
          />
        )}

        {activeTab === "address" && (
          <AddressTab
            addressData={addressData}
            setAddressData={setAddressData}
            validationErrors={validationErrors}
            error={error}
            success={success["address"]}
            saving={saving["address"]}
            onStartSaving={() => handleStartSaving("address")}
            onSuccess={() => handleSuccess("address")}
            onError={(err) => handleError("address", err)}
          />
        )}
      </div>
    </>
  );
}

