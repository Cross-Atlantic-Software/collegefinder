"use client";

import React from "react";
import SelectLib, { StylesConfig } from "react-select";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value?: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  isSearchable?: boolean;
  className?: string;
  isClearable?: boolean;
  filterOption?: (option: SelectOption, inputValue: string) => boolean;
}

const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select...",
  error,
  disabled = false,
  isSearchable = true,
  className = "",
  isClearable = false,
  filterOption,
}) => {
  const selectedOption = value
    ? options.find((option) => option.value === value) || null
    : null;

  const handleChange = (selected: SelectOption | null) => {
    onChange(selected ? selected.value : null);
  };

  // Custom styles - adapts to both dark and light themes
  const customStyles: StylesConfig<SelectOption, false> = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused ? "#ffffff" : "#f8fbff",
      borderColor: error
        ? "#ef4444"
        : state.isFocused
        ? "#FAD53C"
        : "rgba(0, 0, 0, 0.15)",
      borderWidth: "1px",
      borderRadius: "0.75rem",
      padding: "0.15rem 0",
      minHeight: "46px",
      boxShadow: state.isFocused
        ? "0 0 0 1px #FAD53C"
        : "none",
      "&:hover": {
        borderColor: error ? "#ef4444" : "#FAD53C",
      },
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "#9ca3af",
      fontSize: "0.875rem",
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "#111827",
      fontSize: "0.875rem",
      fontWeight: "500",
    }),
    input: (provided) => ({
      ...provided,
      color: "#111827",
      fontSize: "0.875rem",
    }),
          menu: (provided) => ({
            ...provided,
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "0.75rem",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            zIndex: 9999,
            marginTop: "4px",
            overflow: "hidden",
          }),
    menuList: (provided) => ({
      ...provided,
      padding: "4px",
      maxHeight: "300px",
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? "#FAD53C"
        : state.isFocused
        ? "rgba(250, 213, 60, 0.1)"
        : "transparent",
      color: state.isSelected
        ? "#000000"
        : state.isFocused
        ? "#000000"
        : "#111827",
      fontSize: "0.875rem",
      padding: "0.75rem 1rem",
      cursor: "pointer",
      borderRadius: "0.5rem",
      margin: "2px 0",
      fontWeight: state.isSelected ? "600" : "400",
      "&:active": {
        backgroundColor: "#FAD53C",
        color: "#000000",
      },
    }),
    indicatorSeparator: () => ({
      display: "none",
    }),
    dropdownIndicator: (provided, state) => ({
      ...provided,
      color: "#94a3b8",
      padding: "0 12px",
      "&:hover": {
        color: "#FAD53C",
      },
      transform: state.selectProps.menuIsOpen ? "rotate(180deg)" : "rotate(0deg)",
      transition: "transform 0.2s ease",
    }),
    clearIndicator: (provided) => ({
      ...provided,
      color: "#94a3b8",
      padding: "0 8px",
      "&:hover": {
        color: "#FAD53C",
      },
    }),
    loadingIndicator: (provided) => ({
      ...provided,
      color: "#341050",
    }),
  };

  return (
    <div className={`w-full ${className}`}>
      <SelectLib<SelectOption, false>
        options={options}
        value={selectedOption}
        onChange={handleChange}
        placeholder={placeholder}
        isDisabled={disabled}
        isSearchable={isSearchable}
        isClearable={isClearable}
        styles={customStyles}
        classNamePrefix="react-select"
        menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
        menuPosition="fixed"
        menuPlacement="bottom"
        filterOption={filterOption || undefined}
        theme={(theme) => ({
          ...theme,
          colors: {
            ...theme.colors,
            primary: "#341050",
            primary25: "rgba(52,16,80,0.08)",
            primary50: "rgba(52,16,80,0.14)",
            primary75: "rgba(52,16,80,0.22)",
            neutral0: "#ffffff",
            neutral5: "#f8fafc",
            neutral10: "#f1f5f9",
            neutral20: "#e2e8f0",
            neutral30: "#cbd5e1",
            neutral40: "#94a3b8",
            neutral50: "#64748b",
            neutral60: "#475569",
            neutral70: "#334155",
            neutral80: "#1e293b",
            neutral90: "#0f172a",
          },
        })}
      />
      {error && (
        <p className="mt-1 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
};

export default Select;

