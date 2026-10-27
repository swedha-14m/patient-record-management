import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  FileCode2,
  AlertTriangle,
  X,
  Check,
  Download,
  Filter,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Heart,
  ShieldAlert,
  Save,
  Users,
  Printer,
  History
} from 'lucide-react';
import { Patient, Gender, BloodGroup } from '../types';
import { downloadFile, generatePatientsXML } from '../services/xmlUtils';
import { printPatientSummary } from '../services/printUtils';
import { ActivityLog } from './ActivityLog';

interface PatientListProps {
  patients: Patient[];
  onAddPatientClick: () => void;
  onUpdatePatient: (id: string, updates: Partial<Patient>) => Promise<void>;
  onDeletePatient: (id: string) => Promise<void>;
  onNavigateToXmlLab: () => void;
}

export const PatientList: React.FC<PatientListProps> = ({
  patients,
  onAddPatientClick,
  onUpdatePatient,
  onDeletePatient,
  onNavigateToXmlLab
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<string>('all');

  // Modals state
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
  const [showActivityLog, setShowActivityLog] = useState<boolean>(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [deletingPatient, setDeletingPatient] = useState<Patient | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Filtered patients
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const matchesSearch =
        p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.phone.includes(searchTerm) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesGender = selectedGender === 'all' || p.gender === selectedGender;
      const matchesBlood = selectedBloodGroup === 'all' || p.bloodGroup === selectedBloodGroup;

      return matchesSearch && matchesGender && matchesBlood;
    });
  }, [patients, searchTerm, selectedGender, selectedBloodGroup]);

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatient) return;
    setEditError(null);

    // Validation
    if (!editingPatient.fullName.trim()) {
      setEditError('Patient full name is required');
      return;
    }
    if (editingPatient.age < 0 || editingPatient.age > 130) {
      setEditError('Age must be between 0 and 130');
      return;
    }
    if (!editingPatient.phone.trim()) {
      setEditError('Phone number is required');
      return;
    }

    try {
      setIsSubmitting(true);
      await onUpdatePatient(editingPatient.id, editingPatient);
      setEditingPatient(null);
    } catch (err: any) {
      setEditError(err.message || 'Failed to update patient record');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Confirmation
  const handleDeleteConfirm = async () => {
    if (!deletingPatient) return;
    try {
      setIsSubmitting(true);
      await onDeletePatient(deletingPatient.id);
      setDeletingPatient(null);
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export single patient as XML
  const handleExportSingleXml = (patient: Patient) => {
    const xml = generatePatientsXML([patient]);
    downloadFile(xml, `${patient.patientId}-record.xml`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Quick Add */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Patient Record Management Directory</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Displaying {filteredPatients.length} of {patients.length} admitted patient profiles in Cloud Firestore
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onNavigateToXmlLab}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition"
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>XML Lab</span>
          </button>
          <button
            onClick={onAddPatientClick}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Patient</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Patient ID (e.g. PAT-2026-001), Name, Phone, or Email..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
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

        {/* Gender Filter */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">Gender:</span>
          <select
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Blood Group Filter */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">Blood:</span>
          <select
            value={selectedBloodGroup}
            onChange={(e) => setSelectedBloodGroup(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Blood Groups</option>
            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
              <option key={bg} value={bg}>
                {bg}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {filteredPatients.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-800">No Patient Records Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                {searchTerm || selectedGender !== 'all' || selectedBloodGroup !== 'all'
                  ? 'No records match your active search and filter criteria. Try clearing the filters.'
                  : 'Get started by registering a new patient or loading initial sample hospital records.'}
              </p>
              {(searchTerm || selectedGender !== 'all' || selectedBloodGroup !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedGender('all');
                    setSelectedBloodGroup('all');
                  }}
                  className="mt-3 text-xs font-semibold text-blue-600 hover:underline"
                >
                  Clear all search filters
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Patient ID</th>
                  <th className="py-3.5 px-4 font-bold">Full Name</th>
                  <th className="py-3.5 px-4 font-bold">Age / Gender</th>
                  <th className="py-3.5 px-4 font-bold">Blood Group</th>
                  <th className="py-3.5 px-4 font-bold">Contact Info</th>
                  <th className="py-3.5 px-4 font-bold">Registration Date</th>
                  <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-blue-50/40 transition">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                        {patient.patientId}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 text-sm">{patient.fullName}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[180px]">{patient.address}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{patient.age} yrs</div>
                      <span className="text-[10px] text-slate-500">{patient.gender}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        {patient.bloodGroup}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{patient.phone}</div>
                      <div className="text-[10px] text-slate-400">{patient.email}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {patient.registrationDate}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => {
                            setViewingPatient(patient);
                            setShowActivityLog(false);
                          }}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
                          title="View Complete Clinical Record"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setViewingPatient(patient);
                            setShowActivityLog(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition"
                          title="View Chronological Activity Log & Audit Trail"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => printPatientSummary(patient)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
                          title="Print Patient Summary (PDF)"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingPatient(patient)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition"
                          title="Edit Patient Record"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleExportSingleXml(patient)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition"
                          title="Export Single XML Record"
                        >
                          <FileCode2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingPatient(patient)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ==================== VIEW MODAL ==================== */}
      {viewingPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-700 to-indigo-700 text-white rounded-t-2xl">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono bg-white/20 text-white px-2 py-0.5 rounded text-xs font-bold">
                    {viewingPatient.patientId}
                  </span>
                  <span className="text-xs bg-rose-500/80 text-white px-2 py-0.5 rounded font-bold">
                    {viewingPatient.bloodGroup}
                  </span>
                </div>
                <h2 className="text-xl font-bold mt-1">{viewingPatient.fullName}</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowActivityLog(!showActivityLog)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    showActivityLog
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'bg-white/20 hover:bg-white/30 text-white'
                  }`}
                  title="Toggle between Patient Details and Chronological Activity Log"
                >
                  <History className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{showActivityLog ? 'Patient Details' : 'Activity Log'}</span>
                </button>
                <button
                  onClick={() => printPatientSummary(viewingPatient)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition"
                  title="Print clean PDF Patient Summary Report via window.print()"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Print Summary</span>
                </button>
                <button
                  onClick={() => setViewingPatient(null)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Sub-navigation Tabs: Details vs Activity Log */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 gap-2">
              <button
                onClick={() => setShowActivityLog(false)}
                className={`px-3.5 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
                  !showActivityLog
                    ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg -mb-px'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Clinical &amp; Demographic Details</span>
              </button>
              <button
                onClick={() => setShowActivityLog(true)}
                className={`px-3.5 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
                  showActivityLog
                    ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg -mb-px'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Activity Log &amp; Audit Trail</span>
              </button>
            </div>

            {/* Modal Body: Either Activity Log OR Patient Details */}
            {showActivityLog ? (
              <div className="p-6">
                <ActivityLog patient={viewingPatient} />
              </div>
            ) : (
              <div className="p-6 space-y-6 text-xs">
                {/* Demographics Card */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Age</span>
                    <p className="text-sm font-bold text-slate-800">{viewingPatient.age} years</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Gender</span>
                    <p className="text-sm font-bold text-slate-800">{viewingPatient.gender}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Registration Date</span>
                    <p className="text-sm font-bold text-slate-800">{viewingPatient.registrationDate}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Record Status</span>
                    <p className="text-sm font-bold text-emerald-600">Active Admitted</p>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-3">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Phone className="w-4 h-4 text-blue-600" />
                    <span>Contact &amp; Emergency Details</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-white border border-slate-200 rounded-lg">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Telephone / Mobile</span>
                      <p className="text-xs font-semibold text-slate-800 mt-0.5">{viewingPatient.phone}</p>
                    </div>
                    <div className="p-3 bg-white border border-slate-200 rounded-lg">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Email Address</span>
                      <p className="text-xs font-semibold text-slate-800 mt-0.5">{viewingPatient.email || 'None'}</p>
                    </div>
                    <div className="p-3 bg-white border border-slate-200 rounded-lg sm:col-span-2">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Residential Address</span>
                      <p className="text-xs font-semibold text-slate-800 mt-0.5">{viewingPatient.address}</p>
                    </div>
                    <div className="p-3 bg-rose-50/50 border border-rose-200 rounded-lg sm:col-span-2">
                      <span className="text-[10px] text-rose-700 font-semibold uppercase">Emergency Contact</span>
                      <p className="text-xs font-bold text-rose-900 mt-0.5">
                        {viewingPatient.emergencyContact || 'Not specified'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Clinical Details */}
                <div className="space-y-3">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-600" />
                    <span>Clinical History &amp; Allergies</span>
                  </h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Medical History</span>
                      <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                        {viewingPatient.medicalHistory || 'No prior medical conditions documented.'}
                      </p>
                    </div>
                    <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg">
                      <span className="text-[10px] text-amber-800 font-bold uppercase flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Known Allergies &amp; Drug Hypersensitivities</span>
                      </span>
                      <p className="text-xs font-semibold text-amber-900 mt-1">
                        {viewingPatient.allergies || 'None reported.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 rounded-b-2xl">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowActivityLog(!showActivityLog)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition ${
                    showActivityLog
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>{showActivityLog ? 'Back to Patient Details' : 'View Activity Log'}</span>
                </button>
                <button
                  onClick={() => printPatientSummary(viewingPatient)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-xs transition"
                  title="Generate clean, printer-friendly PDF report via window.print()"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Patient Summary</span>
                </button>
                <button
                  onClick={() => handleExportSingleXml(viewingPatient)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export XML</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingPatient(viewingPatient);
                    setViewingPatient(null);
                  }}
                  className="px-3 py-2 text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-lg transition"
                >
                  Edit Record
                </button>
                <button
                  onClick={() => setViewingPatient(null)}
                  className="px-4 py-2 text-xs font-semibold bg-slate-800 text-white hover:bg-slate-900 rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== EDIT MODAL ==================== */}
      {editingPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <form onSubmit={handleEditSubmit}>
              <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Edit Patient Record</h3>
                  <p className="text-xs text-slate-500 font-mono">ID: {editingPatient.patientId}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingPatient(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                {editError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{editError}</span>
                  </div>
                )}

                {/* Full Name */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editingPatient.fullName}
                    onChange={(e) => setEditingPatient({ ...editingPatient, fullName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white text-xs"
                  />
                </div>

                {/* Age & Gender & Blood */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Age *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={130}
                      value={editingPatient.age}
                      onChange={(e) => setEditingPatient({ ...editingPatient, age: parseInt(e.target.value, 10) || 0 })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Gender *</label>
                    <select
                      value={editingPatient.gender}
                      onChange={(e) => setEditingPatient({ ...editingPatient, gender: e.target.value as Gender })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Blood Group *</label>
                    <select
                      value={editingPatient.bloodGroup}
                      onChange={(e) => setEditingPatient({ ...editingPatient, bloodGroup: e.target.value as BloodGroup })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                    >
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'].map((bg) => (
                        <option key={bg} value={bg}>
                          {bg}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Phone & Email */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
                    <input
                      type="text"
                      required
                      value={editingPatient.phone}
                      onChange={(e) => setEditingPatient({ ...editingPatient, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={editingPatient.email}
                      onChange={(e) => setEditingPatient({ ...editingPatient, email: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Residential Address *</label>
                  <input
                    type="text"
                    required
                    value={editingPatient.address}
                    onChange={(e) => setEditingPatient({ ...editingPatient, address: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                {/* Medical History */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Medical History</label>
                  <textarea
                    rows={2}
                    value={editingPatient.medicalHistory}
                    onChange={(e) => setEditingPatient({ ...editingPatient, medicalHistory: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                {/* Allergies & Emergency Contact */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Known Allergies</label>
                    <input
                      type="text"
                      value={editingPatient.allergies}
                      onChange={(e) => setEditingPatient({ ...editingPatient, allergies: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Emergency Contact</label>
                    <input
                      type="text"
                      value={editingPatient.emergencyContact}
                      onChange={(e) => setEditingPatient({ ...editingPatient, emergencyContact: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => setEditingPatient(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition shadow-xs disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Updating...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== DELETE CONFIRMATION MODAL ==================== */}
      {deletingPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Confirm Record Deletion</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to permanently remove patient record{' '}
                <strong className="text-slate-800 font-mono">{deletingPatient.patientId}</strong> (
                {deletingPatient.fullName}) from Cloud Firestore?
              </p>
              <p className="text-[11px] text-rose-600 font-medium mt-2">
                This action is irreversible and will delete all associated patient history.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingPatient(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                Cancel, Keep Record
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? 'Deleting...' : 'Yes, Delete Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
