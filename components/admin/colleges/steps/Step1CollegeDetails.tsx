'use client';

import { CollegeFormData } from '../MultiStepCollegeForm';

interface Step1CollegeDetailsProps {
  formData: CollegeFormData;
  setFormData: React.Dispatch<React.SetStateAction<CollegeFormData>>;
  isViewMode?: boolean;
}

export default function Step1CollegeDetails({ formData, setFormData, isViewMode = false }: Step1CollegeDetailsProps) {
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({
        ...formData,
        logoFile: file,
        logo_url: '',
      });
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          logoPreview: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">College Details</h3>

      {/* Name (Required) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-transparent"
          required
          placeholder="Enter college name"
          disabled={isViewMode}
          readOnly={isViewMode}
        />
      </div>

      {/* Ranking */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Ranking</label>
        <input
          type="number"
          value={formData.ranking || ''}
          onChange={(e) => setFormData({ ...formData, ranking: e.target.value ? parseInt(e.target.value) : null })}
          min="1"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-transparent"
          placeholder="e.g., 1, 2, 3"
          disabled={isViewMode}
          readOnly={isViewMode}
        />
      </div>

      {/* Logo Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleLogoChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-transparent"
          disabled={isViewMode}
        />
        {formData.logoPreview && (
          <div className="mt-2">
            <img
              src={formData.logoPreview}
              alt="Logo preview"
              className="h-24 w-24 object-contain border border-gray-300 rounded"
            />
          </div>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-transparent"
          placeholder="Enter college description..."
          disabled={isViewMode}
          readOnly={isViewMode}
        />
      </div>
    </div>
  );
}

