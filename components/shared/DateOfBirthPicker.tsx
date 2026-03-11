"use client";

import React, { useMemo, useState, useEffect } from "react";
import Select from "./Select";
import type { SelectOption } from "./Select";

interface DateOfBirthPickerProps {
  value?: string | null;
  onChange: (date: string | null) => void;
  error?: string;
  disabled?: boolean;
  maxYear?: number;
  minYear?: number;
  className?: string;
}

const MONTHS: SelectOption[] = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const DateOfBirthPicker: React.FC<DateOfBirthPickerProps> = ({
  value,
  onChange,
  error,
  disabled = false,
  maxYear,
  minYear,
  className = "",
}) => {
  const currentYear = new Date().getFullYear();
  const defaultMaxYear = maxYear || currentYear;
  const defaultMinYear = minYear || 1900;

  // Local state to track partial selections
  const [localDate, setLocalDate] = useState<{
    day: string | null;
    month: string | null;
    year: string | null;
  }>({ day: null, month: null, year: null });

  // Sync local state when value prop changes from external source
  useEffect(() => {
    if (value) {
      const dateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (dateMatch) {
        const [, year, month, day] = dateMatch;
        setLocalDate({ day, month, year });
      }
    } else if (value === null) {
      setLocalDate({ day: null, month: null, year: null });
    }
  }, [value]);

  // Generate year options
  const yearOptions: SelectOption[] = useMemo(() => {
    const years: SelectOption[] = [];
    for (let year = defaultMaxYear; year >= defaultMinYear; year--) {
      years.push({ value: String(year), label: String(year) });
    }
    return years;
  }, [defaultMaxYear, defaultMinYear]);

  // Parse the date value (YYYY-MM-DD format)
  // Parse directly from string to avoid timezone issues
  const parsedDate = useMemo(() => {
    // Use local state if available, otherwise parse from value
    if (localDate.day || localDate.month || localDate.year) {
      return localDate;
    }

    if (!value) return { day: null, month: null, year: null };
    
    try {
      // If value is already in YYYY-MM-DD format, parse directly
      const dateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (dateMatch) {
        const [, year, month, day] = dateMatch;
        return { day, month, year };
      }
      
      // Fallback to Date parsing if format is different
      const date = new Date(value);
      if (isNaN(date.getTime())) return { day: null, month: null, year: null };
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      
      return { day, month, year: String(year) };
    } catch {
      return { day: null, month: null, year: null };
    }
  }, [value, localDate]);

  // Generate day options based on selected month and year
  const dayOptions: SelectOption[] = useMemo(() => {
    if (!parsedDate.month || !parsedDate.year) {
      // If no month/year selected, show all days 1-31
      return Array.from({ length: 31 }, (_, i) => ({
        value: String(i + 1).padStart(2, "0"),
        label: String(i + 1),
      }));
    }

    const month = parseInt(parsedDate.month);
    const year = parseInt(parsedDate.year);
    const daysInMonth = new Date(year, month, 0).getDate();

    return Array.from({ length: daysInMonth }, (_, i) => ({
      value: String(i + 1).padStart(2, "0"),
      label: String(i + 1),
    }));
  }, [parsedDate.month, parsedDate.year]);

  const handleDayChange = (day: string | null) => {
    const newDay = day || null;
    const updatedDate = { ...parsedDate, day: newDay };
    setLocalDate(updatedDate);
    updateDate(updatedDate.day, updatedDate.month, updatedDate.year);
  };

  const handleMonthChange = (month: string | null) => {
    const newMonth = month || null;
    // Validate day when month changes (e.g., Feb 30 -> Feb 28/29)
    let validDay = parsedDate.day;
    if (newMonth && parsedDate.year && parsedDate.day) {
      const year = parseInt(parsedDate.year);
      const monthNum = parseInt(newMonth);
      const daysInMonth = new Date(year, monthNum, 0).getDate();
      const dayNum = parseInt(parsedDate.day);
      if (dayNum > daysInMonth) {
        validDay = String(daysInMonth).padStart(2, "0");
      }
    }
    const updatedDate = { ...parsedDate, month: newMonth, day: validDay };
    setLocalDate(updatedDate);
    updateDate(updatedDate.day, updatedDate.month, updatedDate.year);
  };

  const handleYearChange = (year: string | null) => {
    const newYear = year || null;
    // Validate day when year changes (e.g., Feb 29 in non-leap year)
    let validDay = parsedDate.day;
    if (newYear && parsedDate.month && parsedDate.day) {
      const yearNum = parseInt(newYear);
      const monthNum = parseInt(parsedDate.month);
      const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
      const dayNum = parseInt(parsedDate.day);
      if (dayNum > daysInMonth) {
        validDay = String(daysInMonth).padStart(2, "0");
      }
    }
    const updatedDate = { ...parsedDate, year: newYear, day: validDay };
    setLocalDate(updatedDate);
    updateDate(updatedDate.day, updatedDate.month, updatedDate.year);
  };

  const updateDate = (day: string | null, month: string | null, year: string | null) => {
    if (day && month && year) {
      // Format as YYYY-MM-DD for backend compatibility
      const formattedDate = `${year}-${month}-${day}`;
      onChange(formattedDate);
    } else {
      // Don't clear the value - keep partial selections visible
      // Only send null if explicitly clearing all fields
      if (!day && !month && !year) {
        onChange(null);
        setLocalDate({ day: null, month: null, year: null });
      }
    }
  };

  return (
    <div className={`w-full space-y-2 ${className}`}>
      <div className="grid grid-cols-3 gap-3">
        {/* Day Dropdown */}
        <Select
          options={dayOptions}
          value={parsedDate.day}
          onChange={handleDayChange}
          placeholder="Day"
          disabled={disabled}
          isSearchable={false}
          isClearable={false}
        />

        {/* Month Dropdown */}
        <Select
          options={MONTHS}
          value={parsedDate.month}
          onChange={handleMonthChange}
          placeholder="Month"
          disabled={disabled}
          isSearchable={false}
          isClearable={false}
        />

        {/* Year Dropdown */}
        <Select
          options={yearOptions}
          value={parsedDate.year}
          onChange={handleYearChange}
          placeholder="Year"
          disabled={disabled}
          isSearchable={true}
          isClearable={false}
        />
      </div>
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
      {value && !error && (
        <p className="text-xs text-slate-400">
          Selected: {new Date(value).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      )}
    </div>
  );
};

export default DateOfBirthPicker;

