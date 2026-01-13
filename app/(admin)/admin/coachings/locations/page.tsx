'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import {
  getAllCoachingLocations,
  getLocationsByCoachingId,
  createCoachingLocation,
  updateCoachingLocation,
  deleteCoachingLocation,
  CoachingLocation
} from '@/api/admin/coaching-locations';
import { getAllCoachings, Coaching } from '@/api/admin/coachings';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiEye, FiMapPin } from 'react-icons/fi';
import { ConfirmationModal, useToast, Select } from '@/components/shared';
import { getAllStates, getDistrictsForState } from '@/lib/data/indianStatesDistricts';

export default function CoachingLocationsPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [locations, setLocations] = useState<CoachingLocation[]>([]);
  const [allLocations, setAllLocations] = useState<CoachingLocation[]>([]);
  const [coachings, setCoachings] = useState<Coaching[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<CoachingLocation | null>(null);
  const [viewingLocation, setViewingLocation] = useState<CoachingLocation | null>(null);
  const [formData, setFormData] = useState({
    coaching_id: '',
    branch_title: '',
    address: '',
    state: '',
    city: '',
    google_map_url: '',
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);

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
      const filtered = allLocations.filter(location =>
        location.branch_title.toLowerCase().includes(searchLower) ||
        location.coaching_name?.toLowerCase().includes(searchLower) ||
        location.city.toLowerCase().includes(searchLower) ||
        location.state.toLowerCase().includes(searchLower)
      );
      setLocations(filtered);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, allLocations]);

  // Update available districts when state changes
  useEffect(() => {
    if (formData.state) {
      const districts = getDistrictsForState(formData.state);
      setAvailableDistricts(districts);
      // Clear city if it's not in the new state's districts
      if (formData.city && !districts.includes(formData.city)) {
        setFormData(prev => ({ ...prev, city: '' }));
      }
    } else {
      setAvailableDistricts([]);
    }
  }, [formData.state]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [locationsRes, coachingsRes] = await Promise.all([
        getAllCoachingLocations(),
        getAllCoachings(),
      ]);

      if (locationsRes.success && locationsRes.data) {
        setAllLocations(locationsRes.data.locations);
        setLocations(locationsRes.data.locations);
      }
      if (coachingsRes.success && coachingsRes.data) {
        setCoachings(coachingsRes.data.coachings);
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.coaching_id || !formData.branch_title.trim() || !formData.address.trim() ||
        !formData.state.trim() || !formData.city.trim()) {
      setError('All fields except Google Maps URL are required');
      return;
    }

    try {
      setIsSubmitting(true);
      const locationData = {
        coaching_id: parseInt(formData.coaching_id),
        branch_title: formData.branch_title,
        address: formData.address,
        state: formData.state,
        city: formData.city,
        google_map_url: formData.google_map_url || undefined,
      };

      let response;
      if (editingLocation) {
        response = await updateCoachingLocation(editingLocation.id, locationData);
      } else {
        response = await createCoachingLocation(locationData);
      }

      if (response.success) {
        showSuccess(editingLocation ? 'Location updated successfully' : 'Location created successfully');
        setShowModal(false);
        resetForm();
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
    } finally {
      setIsSubmitting(false);
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
      const response = await deleteCoachingLocation(deletingId);
      if (response.success) {
        showSuccess('Location deleted successfully');
        setShowDeleteConfirm(false);
        setDeletingId(null);
        fetchData();
      } else {
        const errorMsg = response.message || 'Failed to delete location';
        setError(errorMsg);
        showError(errorMsg);
        setShowDeleteConfirm(false);
        setDeletingId(null);
      }
    } catch (err: any) {
      const errorMsg = 'An error occurred while deleting location';
      setError(errorMsg);
      showError(errorMsg);
      console.error('Error deleting location:', err);
      setShowDeleteConfirm(false);
      setDeletingId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (location: CoachingLocation) => {
    setEditingLocation(location);
    setFormData({
      coaching_id: location.coaching_id.toString(),
      branch_title: location.branch_title,
      address: location.address,
      state: location.state,
      city: location.city,
      google_map_url: location.google_map_url || '',
    });
    // Set available districts for the selected state
    const districts = getDistrictsForState(location.state);
    setAvailableDistricts(districts);
    setShowModal(true);
  };

  const handleView = (location: CoachingLocation) => {
    setViewingLocation(location);
  };

  const handleCreate = () => {
    setEditingLocation(null);
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      coaching_id: '',
      branch_title: '',
      address: '',
      state: '',
      city: '',
      google_map_url: '',
    });
    setAvailableDistricts([]);
    setError(null);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingLocation(null);
    setViewingLocation(null);
    resetForm();
  };

  if (error && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.replace('/admin/login')}
            className="text-pink hover:underline"
          >
            Go to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 p-4 overflow-auto">
          <div className="mb-3">
            <h1 className="text-xl font-bold text-gray-900 mb-1">Coaching Locations Manager</h1>
            <p className="text-sm text-gray-600">Manage coaching center branch locations.</p>
          </div>

          {/* Controls */}
          <div className="mb-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-xs font-medium text-gray-700">All locations</span>
                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                  {allLocations.length}
                </span>
              </button>
              <div className="relative">
                <FiSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by branch, coaching, district..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none w-64 transition-all duration-200"
                />
              </div>
            </div>
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-darkGradient text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              <FiPlus className="h-4 w-4" />
              Add Location
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* Locations Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-gray-500">Loading locations...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">COACHING</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">BRANCH TITLE</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">STATE</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">DISTRICT</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">ADDRESS</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {locations.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-4 text-center text-sm text-gray-500">
                          {locations.length < allLocations.length ? 'No locations found matching your search' : 'No locations found'}
                        </td>
                      </tr>
                    ) : (
                      locations.map((location) => (
                        <tr key={location.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-2">
                            <span className="text-sm font-medium text-gray-900">{location.coaching_name || `Coaching ${location.coaching_id}`}</span>
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-sm text-gray-700">{location.branch_title}</span>
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-sm text-gray-700">{location.state}</span>
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-sm text-gray-700">{location.city}</span>
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-sm text-gray-700 line-clamp-2 max-w-xs">{location.address}</span>
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleView(location)}
                                className="p-2 text-green-600 hover:text-green-800 transition-colors"
                                title="View"
                              >
                                <FiEye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleEdit(location)}
                                className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                                title="Edit"
                              >
                                <FiEdit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(location.id)}
                                className="p-2 text-red-600 hover:text-red-800 transition-colors"
                                title="Delete"
                              >
                                <FiTrash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Location Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-darkGradient text-white px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                {editingLocation ? 'Edit Location' : 'Create Location'}
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
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Coaching <span className="text-pink">*</span>
                  </label>
                  <Select
                    value={formData.coaching_id}
                    onChange={(value) => setFormData({ ...formData, coaching_id: value || '' })}
                    options={coachings?.map(c => ({ value: c.id.toString(), label: c.name })) || []}
                    placeholder="Select coaching center"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Branch Title <span className="text-pink">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.branch_title}
                    onChange={(e) => setFormData({ ...formData, branch_title: e.target.value })}
                    required
                    placeholder="e.g., Main Branch, South Campus"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      State <span className="text-pink">*</span>
                    </label>
                    <Select
                      value={formData.state}
                      onChange={(value) => setFormData({ ...formData, state: value || '' })}
                      options={getAllStates().map(state => ({ value: state, label: state }))}
                      placeholder="Select state"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      District <span className="text-pink">*</span>
                    </label>
                    <Select
                      value={formData.city}
                      onChange={(value) => setFormData({ ...formData, city: value || '' })}
                      options={availableDistricts.map(district => ({ value: district, label: district }))}
                      placeholder={formData.state ? "Select district" : "Select state first"}
                      disabled={!formData.state}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Address <span className="text-pink">*</span>
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                    placeholder="Complete address of the branch"
                    rows={3}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Google Maps URL
                  </label>
                  <input
                    type="url"
                    value={formData.google_map_url}
                    onChange={(e) => setFormData({ ...formData, google_map_url: e.target.value })}
                    placeholder="https://maps.google.com/..."
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Optional: Link to Google Maps location</p>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-darkGradient rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingLocation ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingLocation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-darkGradient text-white px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Location Details</h2>
              <button
                onClick={() => setViewingLocation(null)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 overflow-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Coaching</label>
                  <p className="text-sm text-gray-900">{viewingLocation.coaching_name || `Coaching ${viewingLocation.coaching_id}`}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Branch Title</label>
                  <p className="text-sm text-gray-900">{viewingLocation.branch_title}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">State</label>
                    <p className="text-sm text-gray-900">{viewingLocation.state}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                    <p className="text-sm text-gray-900">{viewingLocation.city}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{viewingLocation.address}</p>
                </div>
                {viewingLocation.google_map_url && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Google Maps</label>
                    <a
                      href={viewingLocation.google_map_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-pink hover:underline"
                    >
                      View on Google Maps
                    </a>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Created</label>
                    <p className="text-sm text-gray-900">
                      {new Date(viewingLocation.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Updated</label>
                    <p className="text-sm text-gray-900">
                      {new Date(viewingLocation.updated_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
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
    </div>
  );
}
