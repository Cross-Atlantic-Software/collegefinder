'use client';

import React from 'react';
import SelectLib, { MultiValue, StylesConfig } from 'react-select';

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value?: string[] | null;
  onChange: (values: string[]) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  isSearchable?: boolean;
  className?: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  error,
  disabled = false,
  isSearchable = true,
  className = '',
}) => {
  const selectedOptions = value
    ? options.filter((option) => value.includes(option.value))
    : [];

  const handleChange = (selected: MultiValue<MultiSelectOption>) => {
    onChange(selected.map((option) => option.value));
  };

  const customStyles: StylesConfig<MultiSelectOption, true> = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: '#ffffff',
      borderColor: error ? '#ef4444' : state.isFocused ? '#ec4899' : '#d1d5db',
      boxShadow: state.isFocused && !error ? '0 0 0 1px #ec4899' : 'none',
      '&:hover': {
        borderColor: error ? '#ef4444' : '#ec4899',
      },
      minHeight: '38px',
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: '#fce7f3',
      borderRadius: '0.375rem',
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: '#9f1239',
      fontSize: '0.875rem',
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: '#9f1239',
      '&:hover': {
        backgroundColor: '#fbcfe8',
        color: '#be185d',
      },
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#9ca3af',
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 99999, // Higher z-index to appear above modal footers
    }),
    menuPortal: (provided) => ({
      ...provided,
      zIndex: 99999,
    }),
  };

  return (
    <div className={className}>
      <SelectLib<MultiSelectOption, true>
        isMulti
        options={options}
        value={selectedOptions}
        onChange={handleChange}
        placeholder={placeholder}
        isDisabled={disabled}
        isSearchable={isSearchable}
        styles={customStyles}
        classNamePrefix="react-select"
        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
        menuPosition="fixed"
      />
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};

export default MultiSelect;


