import React, { useState, useMemo } from 'react';
import {
  Stethoscope,
  Plus,
  Search,
  Edit2,
  Trash2,
  Phone,
  Mail,
  Clock,
  MapPin,
  X,
  Save,
  CheckCircle2,
  AlertTriangle,
  Building
} from 'lucide-react';
import { Doctor, DoctorStatus } from '../types';

interface DoctorManagementProps {
  doctors: Doctor[];
  onAddDoctor: (doc: Omit<Doctor, 'id'>) => Promise<string>;
  onUpdateDoctor: (id: string, updates: Partial<Doctor>) => Promise<void>;
  onDeleteDoctor: (id: string) => Promise<void>;
}

export const DoctorManagement: React.FC<DoctorManagementProps> = ({
  doctors,
  onAddDoctor,
  onUpdateDoctor,
  onDeleteDoctor
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [deletingDoctor, setDeletingDoctor] = useState<Doctor | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // New doctor form
  const [newDoctor, setNewDoctor] = useState({
    doctorId: `DOC-${101 + doctors.length}`,
    name: '',
    specialization: 'Cardiology',
    qualification: 'MD, FACC',
    department: 'Cardiology & Vascular',
    phone: '',
    email: '',
    availability: 'Mon - Fri: 09:00 AM - 02:00 PM',
    roomNumber: 'OPD-102 (Wing B)',
    status: 'Active' as DoctorStatus
  });

  const specializations = [
    'Cardiology',
    'Neurology',
    'Pediatrics',
    'Orthopedics',
    'General Medicine',
    'Dermatology',
    'Oncology',
    'Gastroenterology',
    'Pulmonology',
    'Nephrology'
  ];

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      const matchesSearch =
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.doctorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.department.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSpec = selectedSpecialty === 'all' || doc.specialization === selectedSpecialty;

      return matchesSearch && matchesSpec;
    });
  }, [doctors, searchTerm, selectedSpecialty]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newDoctor.name.trim()) {
      setFormError('Doctor full name is required');
      return;
    }
    if (!newDoctor.phone.trim()) {
      setFormError('Phone number is required');
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddDoctor({
        doctorId: newDoctor.doctorId.trim(),
        name: newDoctor.name.trim(),
        specialization: newDoctor.specialization,
        qualification: newDoctor.qualification.trim(),
        department: newDoctor.department.trim(),
        phone: newDoctor.phone.trim(),
        email: newDoctor.email.trim(),
        availability: newDoctor.availability.trim(),
        roomNumber: newDoctor.roomNumber.trim(),
        status: newDoctor.status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      setIsAddModalOpen(false);
      setNewDoctor({
        doctorId: `DOC-${102 + doctors.length}`,
        name: '',
        specialization: 'Cardiology',
        qualification: 'MD',
        department: 'Cardiology & Vascular',
        phone: '',
        email: '',
        availability: 'Mon - Fri: 09:00 AM - 02:00 PM',
        roomNumber: 'OPD-105',
        status: 'Active'
      });
    } catch (err: any) {
      setFormError(err.message || 'Failed to save doctor to Firestore');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctor) return;
    setFormError(null);

    if (!editingDoctor.name.trim()) {
      setFormError('Doctor name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      await onUpdateDoctor(editingDoctor.id, editingDoctor);
      setEditingDoctor(null);
    } catch (err: any) {
      setFormError(err.message || 'Failed to update doctor record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingDoctor) return;
    try {
      setIsSubmitting(true);
      await onDeleteDoctor(deletingDoctor.id);
      setDeletingDoctor(null);
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-emerald-600" />
            <span>Hospital Physicians &amp; Consultants Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Displaying {filteredDoctors.length} doctors and clinical department specialists in Cloud Firestore
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg shadow-xs transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Physician</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by physician name, ID, or department..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">Specialty:</span>
          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Specialties</option>
            {specializations.map((spec) => (
              <option key={spec} value={spec}>
                {spec}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Doctor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDoctors.map((doc) => (
          <div
            key={doc.id}
            className="bg-white rounded-xl border border-slate-200 shadow-xs hover:border-emerald-200 hover:shadow-md transition p-5 space-y-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {doc.doctorId}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm mt-1.5">{doc.name}</h3>
                  <p className="text-xs text-emerald-600 font-medium">{doc.specialization}</p>
                  <p className="text-[11px] text-slate-400">{doc.qualification}</p>
                </div>
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                    doc.status === 'Active'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : doc.status === 'On Leave'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {doc.status}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{doc.department}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-[11px] font-medium text-slate-700">{doc.availability}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-[11px] text-slate-500">{doc.roomNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{doc.phone}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setEditingDoctor(doc)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50 rounded-lg border border-slate-200 transition"
              >
                <Edit2 className="w-3 h-3" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => setDeletingDoctor(doc)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-rose-700 bg-slate-50 hover:bg-rose-50 rounded-lg border border-slate-200 transition"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredDoctors.length === 0 && (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
          <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-800">No physicians found</p>
          <p className="text-xs text-slate-500 mt-1">Try adjusting the search query or click "Add New Physician"</p>
        </div>
      )}

      {/* ==================== ADD DOCTOR MODAL ==================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <form onSubmit={handleCreateSubmit}>
              <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-emerald-600" />
                  <span>Register New Hospital Physician</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                {formError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Doctor ID *</label>
                    <input
                      type="text"
                      required
                      value={newDoctor.doctorId}
                      onChange={(e) => setNewDoctor({ ...newDoctor, doctorId: e.target.value })}
                      className="w-full px-3 py-2 font-mono bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Status *</label>
                    <select
                      value={newDoctor.status}
                      onChange={(e) => setNewDoctor({ ...newDoctor, status: e.target.value as DoctorStatus })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    >
                      <option value="Active">Active on Duty</option>
                      <option value="On Leave">On Leave</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Doctor Full Title &amp; Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Catherine Brooks"
                    value={newDoctor.name}
                    onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Specialization *</label>
                    <select
                      value={newDoctor.specialization}
                      onChange={(e) =>
                        setNewDoctor({
                          ...newDoctor,
                          specialization: e.target.value,
                          department: `${e.target.value} Department`
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    >
                      {specializations.map((spec) => (
                        <option key={spec} value={spec}>
                          {spec}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Qualification *</label>
                    <input
                      type="text"
                      required
                      placeholder="MBBS, MD, FRCS"
                      value={newDoctor.qualification}
                      onChange={(e) => setNewDoctor({ ...newDoctor, qualification: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Contact Phone *</label>
                    <input
                      type="text"
                      required
                      placeholder="+1 (555) 789-0123"
                      value={newDoctor.phone}
                      onChange={(e) => setNewDoctor({ ...newDoctor, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      placeholder="doctor@apex-hospital.org"
                      value={newDoctor.email}
                      onChange={(e) => setNewDoctor({ ...newDoctor, email: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Availability Schedule *</label>
                    <input
                      type="text"
                      required
                      placeholder="Mon - Fri: 09:00 AM - 02:00 PM"
                      value={newDoctor.availability}
                      onChange={(e) => setNewDoctor({ ...newDoctor, availability: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">OPD Room Number</label>
                    <input
                      type="text"
                      placeholder="OPD-201 (Wing B)"
                      value={newDoctor.roomNumber}
                      onChange={(e) => setNewDoctor({ ...newDoctor, roomNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg shadow-xs transition disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Saving...' : 'Save Doctor'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== EDIT DOCTOR MODAL ==================== */}
      {editingDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <form onSubmit={handleEditSubmit}>
              <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Edit Physician Record</h3>
                  <p className="text-xs text-slate-500 font-mono">ID: {editingDoctor.doctorId}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingDoctor(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                {formError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
                    {formError}
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={editingDoctor.name}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Specialization</label>
                    <select
                      value={editingDoctor.specialization}
                      onChange={(e) => setEditingDoctor({ ...editingDoctor, specialization: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    >
                      {specializations.map((spec) => (
                        <option key={spec} value={spec}>
                          {spec}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Status</label>
                    <select
                      value={editingDoctor.status}
                      onChange={(e) =>
                        setEditingDoctor({ ...editingDoctor, status: e.target.value as DoctorStatus })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    >
                      <option value="Active">Active</option>
                      <option value="On Leave">On Leave</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Phone *</label>
                    <input
                      type="text"
                      required
                      value={editingDoctor.phone}
                      onChange={(e) => setEditingDoctor({ ...editingDoctor, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Availability</label>
                    <input
                      type="text"
                      value={editingDoctor.availability}
                      onChange={(e) => setEditingDoctor({ ...editingDoctor, availability: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Room / OPD Number</label>
                  <input
                    type="text"
                    value={editingDoctor.roomNumber}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, roomNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => setEditingDoctor(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Updating...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== DELETE MODAL ==================== */}
      {deletingDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Remove Physician</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete <strong className="text-slate-800">{deletingDoctor.name}</strong> (
                {deletingDoctor.doctorId}) from Cloud Firestore?
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingDoctor(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
