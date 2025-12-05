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

  // Custom styles to match the dark theme
  const customStyles: StylesConfig<SelectOption, false> = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      borderColor: error
        ? "#ef4444"
        : state.isFocused
        ? "#ec4899"
        : "rgba(255, 255, 255, 0.1)",
      borderWidth: "1px",
      borderRadius: "0.375rem",
      padding: "0.25rem 0",
      minHeight: "48px",
      boxShadow: state.isFocused
        ? "0 0 0 1px #ec4899"
        : "none",
      "&:hover": {
        borderColor: error ? "#ef4444" : "rgba(255, 255, 255, 0.2)",
      },
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "#94a3b8",
      fontSize: "0.875rem",
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "#e2e8f0",
      fontSize: "0.875rem",
    }),
    input: (provided) => ({
      ...provided,
      color: "#e2e8f0",
      fontSize: "0.875rem",
    }),
          menu: (provided) => ({
            ...provided,
            backgroundColor: "#1e293b",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "0.375rem",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)",
            zIndex: 9999,
            marginTop: "4px",
          }),
    menuList: (provided) => ({
      ...provided,
      padding: "4px",
      maxHeight: "300px",
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? "#ec4899"
        : state.isFocused
        ? "rgba(236, 72, 153, 0.2)"
        : "transparent",
      color: state.isSelected
        ? "#ffffff"
        : state.isFocused
        ? "#ec4899"
        : "#e2e8f0",
      fontSize: "0.875rem",
      padding: "0.75rem 1rem",
      cursor: "pointer",
      borderRadius: "0.25rem",
      margin: "2px 0",
      "&:active": {
        backgroundColor: "#ec4899",
        color: "#ffffff",
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
        color: "#ec4899",
      },
      transform: state.selectProps.menuIsOpen ? "rotate(180deg)" : "rotate(0deg)",
      transition: "transform 0.2s ease",
    }),
    clearIndicator: (provided) => ({
      ...provided,
      color: "#94a3b8",
      padding: "0 8px",
      "&:hover": {
        color: "#ec4899",
      },
    }),
    loadingIndicator: (provided) => ({
      ...provided,
      color: "#ec4899",
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
            primary: "#ec4899",
            primary25: "rgba(236, 72, 153, 0.2)",
            primary50: "rgba(236, 72, 153, 0.3)",
            primary75: "rgba(236, 72, 153, 0.4)",
            neutral0: "#1e293b",
            neutral5: "#334155",
            neutral10: "#475569",
            neutral20: "#64748b",
            neutral30: "#94a3b8",
            neutral40: "#cbd5e1",
            neutral50: "#e2e8f0",
            neutral60: "#f1f5f9",
            neutral70: "#f8fafc",
            neutral80: "#ffffff",
            neutral90: "#ffffff",
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

