"use client";

import { useState, useEffect } from "react";
import { useToast } from "../../shared";
import {
  getBasicInfo,
  getGovernmentIdentification,
  getCategoryAndReservation,
  getOtherPersonalDetails,
  getUserAddress,
} from "@/api";
import { getAllCategories } from "@/api/public/categories";
import { EmailVerificationModal } from "./EmailVerificationModal";
import BasicInfoTabs from "./basicInfo/BasicInfoTabs";
import type {
  CoreIdentityFormData,
  GovernmentIdentificationData,
  CategoryAndReservationData,
  OtherPersonalDetailsData,
  AddressData,
} from "./basicInfo/types";

export default function BasicInfoForm() {
  const { showSuccess } = useToast();
  const [loading, setLoading] = useState(true);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const [formData, setFormData] = useState<CoreIdentityFormData>({
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

  const [govIdData, setGovIdData] = useState<GovernmentIdentificationData>({
    aadhar_number: "",
    apaar_id: "",
  });

  const [catResData, setCatResData] = useState<CategoryAndReservationData>({
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

  const [otherPersonalDetails, setOtherPersonalDetails] = useState<OtherPersonalDetailsData>({
    religion: "",
    mother_tongue: "",
    annual_family_income: "",
    occupation_of_father: "",
    occupation_of_mother: "",
  });

  const [addressData, setAddressData] = useState<AddressData>({
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
  const [email, setEmail] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await getBasicInfo();
        if (response.success && response.data) {
          // Format date_of_birth for DateOfBirthPicker (YYYY-MM-DD)
          let formattedDate = "";
          if (response.data.date_of_birth) {
            if (typeof response.data.date_of_birth === 'string' && /^\d{4}-\d{2}-\d{2}/.test(response.data.date_of_birth)) {
              formattedDate = response.data.date_of_birth.split('T')[0];
            } else {
              const date = new Date(response.data.date_of_birth);
              if (!isNaN(date.getTime())) {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, "0");
                const day = String(date.getDate()).padStart(2, "0");
                formattedDate = `${year}-${month}-${day}`;
              }
            }
          }

          const formDataToSet: CoreIdentityFormData = {
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

          // Fetch government identification
          try {
            const govIdResponse = await getGovernmentIdentification();
            if (govIdResponse.success && govIdResponse.data) {
              setGovIdData({
                aadhar_number: govIdResponse.data.aadhar_number || "",
                apaar_id: govIdResponse.data.apaar_id || "",
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

  const handleEmailVerified = async () => {
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
      <BasicInfoTabs
        formData={formData}
        setFormData={setFormData}
        profilePhotoPreview={profilePhotoPreview}
        setProfilePhotoPreview={setProfilePhotoPreview}
        email={email}
        emailVerified={emailVerified}
        getCurrentLocation={getCurrentLocation}
        onShowEmailModal={() => setShowEmailModal(true)}
        govIdData={govIdData}
        setGovIdData={setGovIdData}
        catResData={catResData}
        setCatResData={setCatResData}
        categories={categories}
        otherPersonalDetails={otherPersonalDetails}
        setOtherPersonalDetails={setOtherPersonalDetails}
        addressData={addressData}
        setAddressData={setAddressData}
      />

      <EmailVerificationModal
        email={email || null}
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onVerified={handleEmailVerified}
      />
    </>
  );
}
