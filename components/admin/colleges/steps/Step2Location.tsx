'use client';

import { CollegeFormData } from '../MultiStepCollegeForm';

interface Step2LocationProps {
  formData: CollegeFormData;
  setFormData: React.Dispatch<React.SetStateAction<CollegeFormData>>;
  isViewMode?: boolean;
}

export default function Step2Location({ formData, setFormData, isViewMode = false }: Step2LocationProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Details</h3>

      {/* State */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          State <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.state}
          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-transparent"
          required
          placeholder="Enter state"
          disabled={isViewMode}
          readOnly={isViewMode}
        />
      </div>

      {/* City */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          City <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.city}
          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-transparent"
          required
          placeholder="Enter city"
          disabled={isViewMode}
          readOnly={isViewMode}
        />
      </div>

      {/* Google Map URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Google Map URL</label>
        <input
          type="url"
          value={formData.google_map_url}
          onChange={(e) => setFormData({ ...formData, google_map_url: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-transparent"
          placeholder="https://maps.google.com/..."
          disabled={isViewMode}
          readOnly={isViewMode}
        />
      </div>
    </div>
  );
}

