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
  email: string;
  emailVerified: boolean;
  userCode: string | null;
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

  // Automation
  automationPassword: string | null;
}

export default function BasicInfoTabs({
  formData,
  setFormData,
  email,
  emailVerified,
  userCode,
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
  automationPassword,
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
    { key: "government-id", label: "Government ID" },
    { key: "category-reservation", label: "Category & Reservation" },
    { key: "other-personal", label: "Other Details" },
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
      {/* Inner sub-tab bar */}
      <div className="mb-4 flex w-full gap-1 overflow-x-auto scrollbar-hide rounded-xl bg-slate-100 p-1">
        {basicInfoTabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={[
                "flex items-center whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium tracking-wide transition-all duration-200",
                isActive
                  ? "bg-white text-black shadow-sm"
                  : "text-black/55 hover:bg-white/70 hover:text-black",
              ].join(" ")}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content — no surrounding card */}
      <div>
        {activeTab === "core-identity" && (
          <CoreIdentityTab
            formData={formData}
            setFormData={setFormData}
            email={email}
            emailVerified={emailVerified}
            userCode={userCode}
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
            automationPassword={automationPassword}
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
