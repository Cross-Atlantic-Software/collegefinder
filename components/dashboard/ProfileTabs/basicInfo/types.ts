export type BasicInfoTabKey = "core-identity" | "government-id" | "category-reservation" | "other-personal" | "address";

export interface CoreIdentityFormData {
  name: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  phone_number: string;
  profile_photo: string;
  nationality: string;
  marital_status: string;
  father_full_name: string;
  mother_full_name: string;
  guardian_name: string;
  alternate_mobile_number: string;
}

export interface GovernmentIdentificationData {
  aadhar_number: string;
  apaar_id: string;
}

export interface CategoryAndReservationData {
  category_id: string;
  ews_status: boolean;
  pwbd_status: boolean;
  type_of_disability: string;
  disability_percentage: string;
  udid_number: string;
  minority_status: string;
  ex_serviceman_defence_quota: boolean;
  kashmiri_migrant_regional_quota: boolean;
}

export interface OtherPersonalDetailsData {
  religion: string;
  mother_tongue: string;
  annual_family_income: string;
  occupation_of_father: string;
  occupation_of_mother: string;
}

export interface AddressData {
  correspondence_address_line1: string;
  correspondence_address_line2: string;
  city_town_village: string;
  district: string;
  state: string;
  country: string;
  pincode: string;
  permanent_address_same_as_correspondence: boolean;
  permanent_address: string;
}

