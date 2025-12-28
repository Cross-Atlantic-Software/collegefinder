'use client';

import { FiPlus, FiX, FiImage } from 'react-icons/fi';
import { CollegeFormData } from '../MultiStepCollegeForm';

interface Step3GalleryProps {
  formData: CollegeFormData;
  setFormData: React.Dispatch<React.SetStateAction<CollegeFormData>>;
  isViewMode?: boolean;
}

export default function Step3Gallery({ formData, setFormData, isViewMode = false }: Step3GalleryProps) {
  const handleAddImage = () => {
    setFormData({
      ...formData,
      galleryImages: [
        ...formData.galleryImages,
        {
          imageFile: null,
          imagePreview: null,
          caption: '',
          sort_order: formData.galleryImages.length,
        },
      ],
    });
  };

  const handleRemoveImage = (index: number) => {
    setFormData({
      ...formData,
      galleryImages: formData.galleryImages.filter((_, i) => i !== index),
    });
  };

  const handleImageChange = (index: number, file: File | null) => {
    const updatedImages = [...formData.galleryImages];
    updatedImages[index] = {
      ...updatedImages[index],
      imageFile: file,
      imagePreview: null,
    };

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updatedImages[index].imagePreview = reader.result as string;
        setFormData({
          ...formData,
          galleryImages: updatedImages,
        });
      };
      reader.readAsDataURL(file);
    } else {
      setFormData({
        ...formData,
        galleryImages: updatedImages,
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Gallery Images</h3>
        <button
          type="button"
          onClick={handleAddImage}
          className="flex items-center gap-2 px-3 py-1.5 bg-pink text-white rounded-lg hover:bg-pink/90 transition-colors text-sm"
        >
          <FiPlus className="h-4 w-4" />
          Add Image
        </button>
      </div>

      {formData.galleryImages.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FiImage className="h-12 w-12 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">No gallery images added yet. Click &quot;Add Image&quot; to add one.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {formData.galleryImages.map((image, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-4">
                {/* Image Preview */}
                <div className="flex-shrink-0">
                  {image.imagePreview ? (
                    <img
                      src={image.imagePreview}
                      alt={`Gallery ${index + 1}`}
                      className="w-24 h-24 object-cover rounded border border-gray-300"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gray-100 rounded border border-gray-300 flex items-center justify-center">
                      <FiImage className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Form Fields */}
                <div className="flex-1 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Image {index + 1}
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(index, e.target.files?.[0] || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-transparent text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Caption</label>
                    <input
                      type="text"
                      value={image.caption}
                      onChange={(e) => {
                        const updatedImages = [...formData.galleryImages];
                        updatedImages[index].caption = e.target.value;
                        setFormData({ ...formData, galleryImages: updatedImages });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-transparent"
                      placeholder="Enter image caption (optional)"
                      disabled={isViewMode}
                      readOnly={isViewMode}
                    />
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="flex-shrink-0 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-500 mt-4">
        Note: Gallery images are optional. You can skip this step or add images later.
      </p>
    </div>
  );
}

