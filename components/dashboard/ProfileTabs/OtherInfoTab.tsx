"use client";

import { useState, useEffect } from "react";
import { Button, Select, Notification } from "../../shared";
import { getOtherInfo, updateOtherInfo } from "@/api/auth/profile/otherInfo";
import { getAllPrograms } from "@/api/public/programs";
import { getAllExamCities } from "@/api/public/exam-cities";

const inputBase = "w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 placeholder:text-slate-400 transition focus:outline-none focus:border-pink focus:bg-white/10";

const mediumOptions = [
  { value: "English", label: "English" },
  { value: "Hindi", label: "Hindi" },
  { value: "Regional", label: "Regional" },
];

export default function OtherInfoTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Form data
  const [medium, setMedium] = useState<string>("");
  const [language, setLanguage] = useState<string>("");
  const [programPreferences, setProgramPreferences] = useState<string[]>(["", "", ""]);
  const [examCityPreferences, setExamCityPreferences] = useState<string[]>(["", "", "", ""]);

  // Options
  const [programs, setPrograms] = useState<Array<{ value: string; label: string }>>([]);
  const [examCities, setExamCities] = useState<Array<{ value: string; label: string }>>([]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load programs and exam cities
      const [programsRes, examCitiesRes, otherInfoRes] = await Promise.all([
        getAllPrograms(),
        getAllExamCities(),
        getOtherInfo(),
      ]);

      if (programsRes.success && programsRes.data?.programs) {
        setPrograms(
          programsRes.data.programs
            .filter((p) => p.status)
            .map((p) => ({ value: p.id.toString(), label: p.name }))
        );
      }

      if (examCitiesRes.success && examCitiesRes.data?.examCities) {
        setExamCities(
          examCitiesRes.data.examCities
            .filter((c) => c.status)
            .map((c) => ({ value: c.id.toString(), label: c.name }))
        );
      }

      // Load existing other info
      if (otherInfoRes.success && otherInfoRes.data) {
        setMedium(otherInfoRes.data.medium || "");
        setLanguage(otherInfoRes.data.language || "");
        
        // Set program preferences (up to 3)
        if (otherInfoRes.data.program_ids && Array.isArray(otherInfoRes.data.program_ids)) {
          const programPrefs = [...otherInfoRes.data.program_ids];
          while (programPrefs.length < 3) programPrefs.push(0);
          setProgramPreferences(programPrefs.slice(0, 3).map((id) => (id && id > 0 ? id.toString() : "")));
        }

        // Set exam city preferences (up to 4)
        if (otherInfoRes.data.exam_city_ids && Array.isArray(otherInfoRes.data.exam_city_ids)) {
          const cityPrefs = [...otherInfoRes.data.exam_city_ids];
          while (cityPrefs.length < 4) cityPrefs.push(0);
          setExamCityPreferences(cityPrefs.slice(0, 4).map((id) => (id && id > 0 ? id.toString() : "")));
        }
      }
    } catch (err: unknown) {
      console.error("Error loading other info:", err);
      setError(err instanceof Error ? err.message : "Failed to load other info");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validate program preferences - no duplicates
    const selectedPrograms = programPreferences.filter((p) => p !== "");
    const uniquePrograms = new Set(selectedPrograms);
    if (selectedPrograms.length !== uniquePrograms.size) {
      errors.programPreferences = "Program preferences must be unique";
    }

    // Validate exam city preferences - no duplicates
    const selectedCities = examCityPreferences.filter((c) => c !== "");
    const uniqueCities = new Set(selectedCities);
    if (selectedCities.length !== uniqueCities.size) {
      errors.examCityPreferences = "Exam city preferences must be unique";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    setValidationErrors({});

    if (!validateForm()) {
      setSaving(false);
      return;
    }

    try {
      // Prepare program_ids array (filter out empty strings)
      const programIds = programPreferences
        .filter((p) => p !== "")
        .map((p) => parseInt(p, 10))
        .filter((id) => !isNaN(id));

      // Prepare exam_city_ids array (filter out empty strings)
      const examCityIds = examCityPreferences
        .filter((c) => c !== "")
        .map((c) => parseInt(c, 10))
        .filter((id) => !isNaN(id));

      const response = await updateOtherInfo({
        medium: medium || undefined,
        language: language || undefined,
        program_ids: programIds.length > 0 ? programIds : undefined,
        exam_city_ids: examCityIds.length > 0 ? examCityIds : undefined,
      });

      if (response.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(response.message || "Failed to update other info");
      }
    } catch (err: unknown) {
      console.error("Error saving other info:", err);
      setError(err instanceof Error ? err.message : "An error occurred while updating other info");
    } finally {
      setSaving(false);
    }
  };

  const handleProgramChange = (index: number, value: string | null) => {
    const newPreferences = [...programPreferences];
    newPreferences[index] = value || "";
    setProgramPreferences(newPreferences);
    // Clear validation error when user changes selection
    if (validationErrors.programPreferences) {
      setValidationErrors({ ...validationErrors, programPreferences: "" });
    }
  };

  const handleExamCityChange = (index: number, value: string | null) => {
    const newPreferences = [...examCityPreferences];
    newPreferences[index] = value || "";
    setExamCityPreferences(newPreferences);
    // Clear validation error when user changes selection
    if (validationErrors.examCityPreferences) {
      setValidationErrors({ ...validationErrors, examCityPreferences: "" });
    }
  };

  // Filter out already selected programs/cities from options
  const getAvailablePrograms = (currentIndex: number) => {
    const selectedIds = programPreferences
      .map((p, idx) => (idx !== currentIndex && p ? p : null))
      .filter((p) => p !== null);
    return programs.filter((p) => !selectedIds.includes(p.value));
  };

  const getAvailableExamCities = (currentIndex: number) => {
    const selectedIds = examCityPreferences
      .map((c, idx) => (idx !== currentIndex && c ? c : null))
      .filter((c) => c !== null);
    return examCities.filter((c) => !selectedIds.includes(c.value));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-300">Loading...</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-5 rounded-md bg-white/5 p-6">
        <h2 className="text-base font-semibold text-pink sm:text-lg">
          Other Information
        </h2>

        {error && (
          <Notification
            type="error"
            message={error}
            onClose={() => setError(null)}
          />
        )}

        {success && (
          <Notification
            type="success"
            message="Other information updated successfully!"
            onClose={() => {}}
            autoClose={true}
            duration={3000}
          />
        )}

        {/* Medium of Examination */}
        <div className="space-y-2">
          <label className="flex items-center gap-1 text-sm font-medium text-slate-300">
            Medium of Examination
          </label>
          <Select
            options={mediumOptions}
            value={medium}
            onChange={(value) => setMedium(value || "")}
            placeholder="Select Medium"
            error={validationErrors.medium}
            isSearchable={false}
            isClearable={true}
          />
        </div>

        {/* Language Preference */}
        <div className="space-y-2">
          <label className="flex items-center gap-1 text-sm font-medium text-slate-300">
            Language Preference
          </label>
          <input
            type="text"
            placeholder="Enter language preference"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className={`${inputBase} ${validationErrors.language ? 'border-red-500' : ''}`}
          />
          {validationErrors.language && (
            <p className="text-xs text-red-400">{validationErrors.language}</p>
          )}
        </div>

        {/* Course & Program Preference */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="flex items-center gap-1 text-sm font-medium text-slate-300">
              Course & Program Preference
            </label>
            {validationErrors.programPreferences && (
              <p className="text-xs text-red-400">{validationErrors.programPreferences}</p>
            )}
          </div>

          {[0, 1, 2].map((index) => (
            <div key={index} className="space-y-2">
              <label className="text-xs text-slate-400">
                Course Preference {index + 1}
              </label>
              <Select
                options={getAvailablePrograms(index)}
                value={programPreferences[index]}
                onChange={(value) => handleProgramChange(index, value)}
                placeholder={`Select Program ${index + 1}`}
                isSearchable={true}
                isClearable={true}
              />
            </div>
          ))}
        </div>

        {/* Exam City Preference */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="flex items-center gap-1 text-sm font-medium text-slate-300">
              Exam City Preference
            </label>
            {validationErrors.examCityPreferences && (
              <p className="text-xs text-red-400">{validationErrors.examCityPreferences}</p>
            )}
          </div>

          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="space-y-2">
              <label className="text-xs text-slate-400">
                Exam City Preference {index + 1}
              </label>
              <Select
                options={getAvailableExamCities(index)}
                value={examCityPreferences[index]}
                onChange={(value) => handleExamCityChange(index, value)}
                placeholder={`Select Exam City ${index + 1}`}
                isSearchable={true}
                isClearable={true}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <Button
          type="submit"
          variant="DarkGradient"
          size="md"
          className="w-full flex-1 rounded-full"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Other Information"}
        </Button>
      </div>
    </form>
  );
}
