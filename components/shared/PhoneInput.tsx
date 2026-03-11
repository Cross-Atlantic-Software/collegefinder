"use client";

import React, { useMemo } from "react";
import Select from "./Select";
import type { SelectOption } from "./Select";

interface CountryCode {
  code: string;
  dialCode: string;
  name: string;
}

const COUNTRY_CODES: CountryCode[] = [
  { code: "IN", dialCode: "+91", name: "India" },
  { code: "US", dialCode: "+1", name: "United States" },
  { code: "GB", dialCode: "+44", name: "United Kingdom" },
  { code: "CA", dialCode: "+1", name: "Canada" },
  { code: "AU", dialCode: "+61", name: "Australia" },
  { code: "DE", dialCode: "+49", name: "Germany" },
  { code: "FR", dialCode: "+33", name: "France" },
  { code: "IT", dialCode: "+39", name: "Italy" },
  { code: "ES", dialCode: "+34", name: "Spain" },
  { code: "NL", dialCode: "+31", name: "Netherlands" },
  { code: "BE", dialCode: "+32", name: "Belgium" },
  { code: "CH", dialCode: "+41", name: "Switzerland" },
  { code: "AT", dialCode: "+43", name: "Austria" },
  { code: "SE", dialCode: "+46", name: "Sweden" },
  { code: "NO", dialCode: "+47", name: "Norway" },
  { code: "DK", dialCode: "+45", name: "Denmark" },
  { code: "FI", dialCode: "+358", name: "Finland" },
  { code: "PL", dialCode: "+48", name: "Poland" },
  { code: "PT", dialCode: "+351", name: "Portugal" },
  { code: "GR", dialCode: "+30", name: "Greece" },
  { code: "IE", dialCode: "+353", name: "Ireland" },
  { code: "NZ", dialCode: "+64", name: "New Zealand" },
  { code: "SG", dialCode: "+65", name: "Singapore" },
  { code: "MY", dialCode: "+60", name: "Malaysia" },
  { code: "TH", dialCode: "+66", name: "Thailand" },
  { code: "PH", dialCode: "+63", name: "Philippines" },
  { code: "ID", dialCode: "+62", name: "Indonesia" },
  { code: "VN", dialCode: "+84", name: "Vietnam" },
  { code: "JP", dialCode: "+81", name: "Japan" },
  { code: "KR", dialCode: "+82", name: "South Korea" },
  { code: "CN", dialCode: "+86", name: "China" },
  { code: "HK", dialCode: "+852", name: "Hong Kong" },
  { code: "TW", dialCode: "+886", name: "Taiwan" },
  { code: "AE", dialCode: "+971", name: "UAE" },
  { code: "SA", dialCode: "+966", name: "Saudi Arabia" },
  { code: "IL", dialCode: "+972", name: "Israel" },
  { code: "TR", dialCode: "+90", name: "Turkey" },
  { code: "ZA", dialCode: "+27", name: "South Africa" },
  { code: "EG", dialCode: "+20", name: "Egypt" },
  { code: "NG", dialCode: "+234", name: "Nigeria" },
  { code: "KE", dialCode: "+254", name: "Kenya" },
  { code: "BR", dialCode: "+55", name: "Brazil" },
  { code: "MX", dialCode: "+52", name: "Mexico" },
  { code: "AR", dialCode: "+54", name: "Argentina" },
  { code: "CL", dialCode: "+56", name: "Chile" },
  { code: "CO", dialCode: "+57", name: "Colombia" },
  { code: "PE", dialCode: "+51", name: "Peru" },
  { code: "RU", dialCode: "+7", name: "Russia" },
  { code: "UA", dialCode: "+380", name: "Ukraine" },
];

interface PhoneInputProps {
  value?: string | null;
  onChange: (phoneNumber: string | null) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  defaultCountryCode?: string;
  className?: string;
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  error,
  disabled = false,
  placeholder = "Enter phone number",
  defaultCountryCode = "+91",
  className = "",
}) => {
  // Parse phone number to extract country code and number
  const parsedPhone = useMemo(() => {
    if (!value) {
      return { countryCode: defaultCountryCode, number: "" };
    }

    // Try to find matching country code
    for (const country of COUNTRY_CODES) {
      if (value.startsWith(country.dialCode)) {
        return {
          countryCode: country.dialCode,
          number: value.substring(country.dialCode.length).trim(),
        };
      }
    }

    // If no country code found, assume default
    return { countryCode: defaultCountryCode, number: value };
  }, [value, defaultCountryCode]);

  const countryCodeOptions: SelectOption[] = useMemo(() => {
    // Deduplicate by dial code - keep only first occurrence
    const seen = new Set<string>();
    const unique: SelectOption[] = [];
    
    for (const country of COUNTRY_CODES) {
      if (!seen.has(country.dialCode)) {
        seen.add(country.dialCode);
        unique.push({
          value: country.dialCode,
          label: country.dialCode, // Show only dial code
        });
      }
    }
    
    return unique;
  }, []);

  // Custom filter function to search by digits (without +)
  const filterCountryCode = (option: SelectOption, inputValue: string): boolean => {
    if (!inputValue) return true;
    
    // Remove + and spaces from input
    const cleanInput = inputValue.replace(/[+\s]/g, "");
    
    // Remove + from dial code for comparison
    const dialCodeDigits = option.value.replace(/[+\s]/g, "");
    
    // Check if dial code starts with the input digits
    return dialCodeDigits.startsWith(cleanInput);
  };

  const handleCountryCodeChange = (code: string | null) => {
    const newCode = code || defaultCountryCode;
    if (parsedPhone.number) {
      onChange(`${newCode} ${parsedPhone.number}`.trim());
    } else {
      onChange(null);
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const number = e.target.value.replace(/\D/g, ""); // Remove non-digits
    if (number) {
      onChange(`${parsedPhone.countryCode} ${number}`.trim());
    } else {
      onChange(null);
    }
  };

  const inputBaseClasses = `
    w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 
    text-sm text-slate-200 placeholder:text-slate-400 
    transition focus:outline-none focus:border-pink focus:bg-white/10
    ${error ? "border-red-500" : ""}
    ${disabled ? "opacity-50 cursor-not-allowed" : ""}
  `.trim().replace(/\s+/g, " ");

  return (
    <div className={`w-full space-y-2 ${className}`}>
      <div className="flex gap-2">
        {/* Country Code Selector */}
        <div className="w-40 flex-shrink-0">
          <Select
            options={countryCodeOptions}
            value={parsedPhone.countryCode}
            onChange={handleCountryCodeChange}
            placeholder="Code"
            error={error ? undefined : undefined}
            disabled={disabled}
            isSearchable={true}
            isClearable={false}
            filterOption={filterCountryCode}
          />
        </div>

        {/* Phone Number Input */}
        <div className="flex-1">
          <input
            type="tel"
            value={parsedPhone.number}
            onChange={handleNumberChange}
            placeholder={placeholder}
            disabled={disabled}
            className={inputBaseClasses}
            maxLength={15}
          />
        </div>
      </div>
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  );
};

export default PhoneInput;

