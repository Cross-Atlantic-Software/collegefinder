'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import { 
  getAllCollegeLocations, 
  createCollegeLocation, 
  updateCollegeLocation, 
  deleteCollegeLocation,
  CollegeLocation 
} from '@/api/admin/college-locations';
import { getAllColleges, College } from '@/api/admin/colleges';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiMapPin } from 'react-icons/fi';
import { ConfirmationModal, useToast, Select } from '@/components/shared';

export default function CollegeLocationsPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [locations, setLocations] = useState<CollegeLocation[]>([]);
  const [allLocations, setAllLocations] = useState<CollegeLocation[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<CollegeLocation | null>(null);
  const [formData, setFormData] = useState({
    college_id: '',
    state: '',
    city: '',
    google_map_url: '',
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated');
    const adminToken = localStorage.getItem('admin_token');
    if (!isAuthenticated || !adminToken) {
      router.replace('/admin/login');
      return;
    }

    fetchData();
  }, [router]);

  useEffect(() => {
    if (allLocations.length === 0) {
      setLocations([]);
      return;
    }
    
    const timer = setTimeout(() => {
      if (!searchQuery.trim()) {
        setLocations(allLocations);
        return;
      }
      const searchLower = searchQuery.toLowerCase();
      const filtered = allLocations.filter(l =>
        l.college_name?.toLowerCase().includes(searchLower) ||
        l.state.toLowerCase().includes(searchLower) ||
        l.city.toLowerCase().includes(searchLower)
      );
      setLocations(filtered);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, allLocations]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [locationsResponse, collegesResponse] = await Promise.all([
        getAllCollegeLocations(),
        getAllColleges()
      ]);
      
      if (locationsResponse.success && locationsResponse.data) {
        setAllLocations(locationsResponse.data.locations);
        setLocations(locationsResponse.data.locations);
      }
      
      if (collegesResponse.success && collegesResponse.data) {
        setColleges(collegesResponse.data.colleges);
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      college_id: '',
      state: '',
      city: '',
      google_map_url: '',
    });
    setEditingLocation(null);
    setError(null);
  };

  const handleModalOpen = (location?: CollegeLocation) => {
    if (location) {
      setEditingLocation(location);
      setFormData({
        college_id: location.college_id.toString(),
        state: location.state,
        city: location.city,
        google_map_url: location.google_map_url || '',
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.college_id || !formData.state.trim() || !formData.city.trim()) {
      setError('College, State, and City are required');
      return;
    }

    try {
      const locationData: any = {
        college_id: parseInt(formData.college_id),
        state: formData.state.trim(),
        city: formData.city.trim(),
        google_map_url: formData.google_map_url.trim() || null,
      };

      let response;
      if (editingLocation) {
        response = await updateCollegeLocation(editingLocation.id, locationData);
      } else {
        response = await createCollegeLocation(locationData);
      }

      if (response.success) {
        showSuccess(`Location ${editingLocation ? 'updated' : 'created'} successfully`);
        handleModalClose();
        fetchData();
      } else {
        const errorMsg = response.message || `Failed to ${editingLocation ? 'update' : 'create'} location`;
        setError(errorMsg);
        showError(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = `An error occurred while ${editingLocation ? 'updating' : 'creating'} location`;
      setError(errorMsg);
      showError(errorMsg);
      console.error('Error saving location:', err);
    }
  };

  const handleDeleteClick = (id: number) => {
    setDeletingId(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;

    try {
      setIsDeleting(true);
      const response = await deleteCollegeLocation(deletingId);
      if (response.success) {
        showSuccess('Location deleted successfully');
        setShowDeleteConfirm(false);
        setDeletingId(null);
        fetchData();
      } else {
        showError(response.message || 'Failed to delete location');
      }
    } catch (err: any) {
      showError(err.message || 'An error occurred while deleting location');
      console.error('Error deleting location:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">College Locations</h1>
                <p className="text-gray-600">Manage college location information</p>
              </div>
              <button
                onClick={() => handleModalOpen()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-pink text-white rounded-lg hover:bg-pink/90 transition-colors text-sm font-medium"
              >
                <FiPlus className="h-4 w-4" />
                Add Location
              </button>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by college name, state, or city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-transparent"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            {/* Loading State */}
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink"></div>
                <p className="mt-2 text-gray-600">Loading locations...</p>
              </div>
            ) : locations.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <FiMapPin className="mx-auto text-gray-400" size={48} />
                <p className="mt-4 text-gray-600">No college locations found</p>
              </div>
            ) : (
              /* Table */
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          College
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          State
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          City
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Google Map URL
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created At
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {locations.map((location) => (
                        <tr key={location.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {location.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {location.college_name || `College ID: ${location.college_id}`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {location.state}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {location.city}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {location.google_map_url ? (
                              <a
                                href={location.google_map_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-pink hover:underline truncate block max-w-xs"
                              >
                                {location.google_map_url}
                              </a>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(location.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleModalOpen(location)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Edit"
                              >
                                <FiEdit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(location.id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Delete"
                              >
                                <FiTrash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Create/Edit Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-darkGradient text-white px-4 py-3 flex items-center justify-between">
                  <h2 className="text-lg font-bold">
                    {editingLocation ? 'Edit Location' : 'Add Location'}
                  </h2>
                  <button
                    onClick={handleModalClose}
                    className="text-white hover:text-gray-200 transition-colors"
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-4">
                  <div className="space-y-4">
                    {/* College (Required) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        College <span className="text-red-500">*</span>
                      </label>
                      <Select
                        value={formData.college_id}
                        onChange={(value) => setFormData({ ...formData, college_id: value || '' })}
                        options={colleges?.map(c => ({ value: c.id.toString(), label: c.name })) || []}
                        placeholder="Select college"
                      />
                    </div>

                    {/* State (Required) */}
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
                      />
                    </div>

                    {/* City (Required) */}
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
                      />
                    </div>

                    {/* Error Message */}
                    {error && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="mt-6 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={handleModalClose}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-pink text-white rounded-lg hover:bg-pink/90 transition-colors"
                    >
                      {editingLocation ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          <ConfirmationModal
            isOpen={showDeleteConfirm}
            onClose={() => {
              setShowDeleteConfirm(false);
              setDeletingId(null);
            }}
            onConfirm={handleDeleteConfirm}
            title="Delete Location"
            message="Are you sure you want to delete this location? This action cannot be undone."
            confirmText="Delete"
            cancelText="Cancel"
            isLoading={isDeleting}
            confirmButtonStyle="danger"
          />
        </main>
      </div>
    </div>
  );
}
