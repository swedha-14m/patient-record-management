import React, { useState, useMemo } from 'react';
import {
  CalendarCheck,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  X,
  Save,
  Trash2,
  User,
  Stethoscope,
  Filter,
  Calendar,
  Building,
  RotateCcw
} from 'lucide-react';
import { Patient, Doctor, Appointment, AppointmentStatus, AppointmentPriority } from '../types';

interface AppointmentManagementProps {
  appointments: Appointment[];
  patients: Patient[];
  doctors: Doctor[];
  onAddAppointment: (apt: Omit<Appointment, 'id'>) => Promise<string>;
  onUpdateAppointment: (id: string, updates: Partial<Appointment>) => Promise<void>;
  onDeleteAppointment: (id: string) => Promise<void>;
  onNavigateToRegister: () => void;
}

export const AppointmentManagement: React.FC<AppointmentManagementProps> = ({
  appointments,
  patients,
  doctors,
  onAddAppointment,
  onUpdateAppointment,
  onDeleteAppointment,
  onNavigateToRegister
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [patientNameFilter, setPatientNameFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [quickDatePreset, setQuickDatePreset] = useState<'all' | 'today' | 'upcoming' | 'past'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [cancellingAppointment, setCancellingAppointment] = useState<Appointment | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [deletingAppointment, setDeletingAppointment] = useState<Appointment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // New Appointment Form
  const [newAppt, setNewAppt] = useState({
    appointmentId: `APT-2026-${String(appointments.length + 1).padStart(3, '0')}`,
    patientId: patients.length > 0 ? patients[0].patientId : '',
    doctorId: doctors.length > 0 ? doctors[0].doctorId : '',
    appointmentDate: new Date().toISOString().split('T')[0],
    timeSlot: '10:00 AM',
    reason: '',
    priority: 'Routine' as AppointmentPriority,
    status: 'Scheduled' as AppointmentStatus,
    notes: ''
  });

  const timeSlots = [
    '08:30 AM',
    '09:00 AM',
    '09:30 AM',
    '10:00 AM',
    '10:30 AM',
    '11:00 AM',
    '11:30 AM',
    '12:00 PM',
    '02:00 PM',
    '02:30 PM',
    '03:00 PM',
    '03:30 PM',
    '04:00 PM',
    '04:30 PM'
  ];

  const filteredAppointments = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];

    return appointments.filter((apt) => {
      // 1. General search term (matches doctor, reason, appointment ID)
      const matchesSearch =
        !searchTerm ||
        apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.appointmentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.reason.toLowerCase().includes(searchTerm.toLowerCase());

      // 2. Specific Patient Name filter
      const matchesPatientName =
        !patientNameFilter.trim() ||
        apt.patientName.toLowerCase().includes(patientNameFilter.toLowerCase().trim()) ||
        apt.patientId.toLowerCase().includes(patientNameFilter.toLowerCase().trim());

      // 3. Date filter (exact date or preset)
      let matchesDate = true;
      if (dateFilter) {
        matchesDate = apt.appointmentDate === dateFilter;
      } else if (quickDatePreset === 'today') {
        matchesDate = apt.appointmentDate === today;
      } else if (quickDatePreset === 'upcoming') {
        matchesDate = apt.appointmentDate >= today;
      } else if (quickDatePreset === 'past') {
        matchesDate = apt.appointmentDate < today;
      }

      // 4. Status filter
      const matchesStatus = statusFilter === 'all' || apt.status === statusFilter;

      return matchesSearch && matchesPatientName && matchesDate && matchesStatus;
    });
  }, [appointments, searchTerm, patientNameFilter, dateFilter, quickDatePreset, statusFilter]);

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newAppt.patientId) {
      setFormError('Please select a registered patient');
      return;
    }
    if (!newAppt.doctorId) {
      setFormError('Please select an attending doctor');
      return;
    }
    if (!newAppt.appointmentDate) {
      setFormError('Appointment date is required');
      return;
    }
    if (!newAppt.reason.trim()) {
      setFormError('Chief complaint or consultation reason is required');
      return;
    }

    const patient = patients.find((p) => p.patientId === newAppt.patientId);
    const doctor = doctors.find((d) => d.doctorId === newAppt.doctorId);

    try {
      setIsSubmitting(true);
      await onAddAppointment({
        appointmentId: newAppt.appointmentId.trim(),
        patientId: newAppt.patientId,
        patientName: patient ? patient.fullName : 'Selected Patient',
        doctorId: newAppt.doctorId,
        doctorName: doctor ? doctor.name : 'Selected Doctor',
        department: doctor ? doctor.department : 'General OPD',
        appointmentDate: newAppt.appointmentDate,
        timeSlot: newAppt.timeSlot,
        reason: newAppt.reason.trim(),
        priority: newAppt.priority,
        status: newAppt.status,
        notes: newAppt.notes.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      setIsBookModalOpen(false);
      setNewAppt({
        appointmentId: `APT-2026-${String(appointments.length + 2).padStart(3, '0')}`,
        patientId: patients.length > 0 ? patients[0].patientId : '',
        doctorId: doctors.length > 0 ? doctors[0].doctorId : '',
        appointmentDate: new Date().toISOString().split('T')[0],
        timeSlot: '10:00 AM',
        reason: '',
        priority: 'Routine',
        status: 'Scheduled',
        notes: ''
      });
    } catch (err: any) {
      setFormError(err.message || 'Failed to schedule appointment in Firestore');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (aptId: string, status: AppointmentStatus) => {
    try {
      await onUpdateAppointment(aptId, { status });
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const handleCancelSubmit = async () => {
    if (!cancellingAppointment) return;
    try {
      setIsSubmitting(true);
      await onUpdateAppointment(cancellingAppointment.id, {
        status: 'Cancelled',
        cancellationReason: cancellationReason || 'Cancelled by clinic administration'
      });
      setCancellingAppointment(null);
      setCancellationReason('');
    } catch (err: any) {
      alert(`Cancellation failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingAppointment) return;
    try {
      setIsSubmitting(true);
      await onDeleteAppointment(deletingAppointment.id);
      setDeletingAppointment(null);
    } catch (err: any) {
      alert(`Deletion failed: ${err.message}`);
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
            <CalendarCheck className="w-5 h-5 text-amber-600" />
            <span>Outpatient &amp; Specialist Appointment Scheduling</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Displaying {filteredAppointments.length} scheduled, completed, and in-progress consultations
          </p>
        </div>

        <button
          onClick={() => setIsBookModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-xs transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Book New Consultation</span>
        </button>
      </div>

      {/* Enhanced Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-3.5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Patient Name Filter */}
          <div className="relative md:col-span-4">
            <User className="w-4 h-4 text-blue-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={patientNameFilter}
              onChange={(e) => setPatientNameFilter(e.target.value)}
              placeholder="Filter by Patient Name or ID..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
            {patientNameFilter && (
              <button
                onClick={() => setPatientNameFilter('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                title="Clear patient name filter"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Appointment Date Filter */}
          <div className="relative md:col-span-3">
            <Calendar className="w-4 h-4 text-amber-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                if (e.target.value) setQuickDatePreset('all');
              }}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-700 transition"
              title="Filter by appointment date"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                title="Clear date filter"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* General Keyword Search (Doctor, Reason, ID) */}
          <div className="relative md:col-span-3">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Doctor, Reason, APT ID..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                title="Clear keyword search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Dropdown */}
          <div className="md:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="In-Progress">In-Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Date Presets and Quick Reset Toolbar */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Date Filter:
            </span>
            <button
              onClick={() => {
                setQuickDatePreset('all');
                setDateFilter('');
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                quickDatePreset === 'all' && !dateFilter
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Dates
            </button>
            <button
              onClick={() => {
                setQuickDatePreset('today');
                setDateFilter('');
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                quickDatePreset === 'today'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => {
                setQuickDatePreset('upcoming');
                setDateFilter('');
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                quickDatePreset === 'upcoming'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => {
                setQuickDatePreset('past');
                setDateFilter('');
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                quickDatePreset === 'past'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Past
            </button>
            {dateFilter && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 text-[11px] font-semibold border border-amber-200">
                <Calendar className="w-3 h-3" />
                <span>Date: {dateFilter}</span>
              </span>
            )}
          </div>

          {/* Active filters indicator & Reset button */}
          {(searchTerm || patientNameFilter || dateFilter || quickDatePreset !== 'all' || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setPatientNameFilter('');
                setDateFilter('');
                setQuickDatePreset('all');
                setStatusFilter('all');
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md border border-rose-200 transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset All Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-12 px-4">
              <CalendarCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-800">No Appointments Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                {searchTerm || patientNameFilter || dateFilter || quickDatePreset !== 'all' || statusFilter !== 'all'
                  ? 'No consultations match your active patient name, date, or status filter criteria.'
                  : 'No appointments on the clinical schedule yet. Click "Book New Consultation" to schedule one.'}
              </p>
              {(searchTerm || patientNameFilter || dateFilter || quickDatePreset !== 'all' || statusFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setPatientNameFilter('');
                    setDateFilter('');
                    setQuickDatePreset('all');
                    setStatusFilter('all');
                  }}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear All Active Filters</span>
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Appointment ID</th>
                  <th className="py-3.5 px-4 font-bold">Patient Details</th>
                  <th className="py-3.5 px-4 font-bold">Consulting Physician</th>
                  <th className="py-3.5 px-4 font-bold">Date &amp; Slot</th>
                  <th className="py-3.5 px-4 font-bold">Priority / Reason</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                  <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAppointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                      {apt.appointmentId}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{apt.patientName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{apt.patientId}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{apt.doctorName}</div>
                      <div className="text-[10px] text-slate-400">{apt.department}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{apt.appointmentDate}</div>
                      <div className="text-[10px] text-slate-500 font-semibold">{apt.timeSlot}</div>
                    </td>
                    <td className="py-3.5 px-4 max-w-[200px]">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span
                          className={`px-1.5 py-0.5 text-[9px] font-bold rounded uppercase ${
                            apt.priority === 'Urgent' || apt.priority === 'Emergency'
                              ? 'bg-rose-100 text-rose-700'
                              : apt.priority === 'Follow-up'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {apt.priority}
                        </span>
                      </div>
                      <div className="text-slate-700 text-xs truncate" title={apt.reason}>
                        {apt.reason}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          apt.status === 'Scheduled'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : apt.status === 'In-Progress'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : apt.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {apt.status === 'Completed' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {apt.status === 'Scheduled' && <Clock className="w-3 h-3 text-amber-600" />}
                        {apt.status === 'Cancelled' && <XCircle className="w-3 h-3 text-rose-600" />}
                        <span>{apt.status}</span>
                      </span>
                      {apt.cancellationReason && (
                        <div className="text-[10px] text-rose-600 italic mt-1 max-w-[150px] truncate" title={apt.cancellationReason}>
                          Reason: {apt.cancellationReason}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {apt.status === 'Scheduled' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(apt.id, 'In-Progress')}
                              className="px-2 py-1 text-[11px] font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 rounded border border-blue-200 transition"
                            >
                              Start
                            </button>
                            <button
                              onClick={() => handleStatusChange(apt.id, 'Completed')}
                              className="px-2 py-1 text-[11px] font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded border border-emerald-200 transition"
                            >
                              Complete
                            </button>
                            <button
                              onClick={() => setCancellingAppointment(apt)}
                              className="px-2 py-1 text-[11px] font-medium bg-rose-50 text-rose-700 hover:bg-rose-100 rounded border border-rose-200 transition"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {apt.status === 'In-Progress' && (
                          <button
                            onClick={() => handleStatusChange(apt.id, 'Completed')}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-600 text-white hover:bg-emerald-700 rounded transition"
                          >
                            Mark Complete
                          </button>
                        )}
                        <button
                          onClick={() => setDeletingAppointment(apt)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                          title="Delete from database"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* ==================== BOOK APPOINTMENT MODAL ==================== */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <form onSubmit={handleBookSubmit}>
              <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Book Clinical Consultation</h3>
                  <p className="text-xs text-slate-500 font-mono">ID: {newAppt.appointmentId}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
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

                {/* Patient selection */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">Select Registered Patient *</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsBookModalOpen(false);
                        onNavigateToRegister();
                      }}
                      className="text-[11px] text-blue-600 hover:underline"
                    >
                      + Register New
                    </button>
                  </div>
                  {patients.length === 0 ? (
                    <div className="p-3 bg-amber-50 text-amber-800 rounded-lg border border-amber-200">
                      No registered patients found. Please admit a patient first.
                    </div>
                  ) : (
                    <select
                      value={newAppt.patientId}
                      onChange={(e) => setNewAppt({ ...newAppt, patientId: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    >
                      {patients.map((p) => (
                        <option key={p.id} value={p.patientId}>
                          {p.patientId} — {p.fullName} ({p.age} yrs, {p.bloodGroup})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Doctor selection */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Attending Doctor *</label>
                  {doctors.length === 0 ? (
                    <div className="p-3 bg-amber-50 text-amber-800 rounded-lg border border-amber-200">
                      No physicians found. Please add a doctor in Doctor Management.
                    </div>
                  ) : (
                    <select
                      value={newAppt.doctorId}
                      onChange={(e) => setNewAppt({ ...newAppt, doctorId: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    >
                      {doctors.map((d) => (
                        <option key={d.id} value={d.doctorId}>
                          {d.doctorId} — {d.name} ({d.specialization})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Date & Time Slot */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Appointment Date *</label>
                    <input
                      type="date"
                      required
                      value={newAppt.appointmentDate}
                      onChange={(e) => setNewAppt({ ...newAppt, appointmentDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Time Slot *</label>
                    <select
                      value={newAppt.timeSlot}
                      onChange={(e) => setNewAppt({ ...newAppt, timeSlot: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                    >
                      {timeSlots.map((ts) => (
                        <option key={ts} value={ts}>
                          {ts}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority Tier *</label>
                  <select
                    value={newAppt.priority}
                    onChange={(e) => setNewAppt({ ...newAppt, priority: e.target.value as AppointmentPriority })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Routine">Routine General Consultation</option>
                    <option value="Follow-up">Post-treatment Follow-up</option>
                    <option value="Urgent">Urgent Specialty Care</option>
                    <option value="Emergency">Emergency Case</option>
                  </select>
                </div>

                {/* Chief reason */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Chief Clinical Complaint / Reason *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="e.g. Follow-up for chest tightness, fasting blood sugar check, medication refill..."
                    value={newAppt.reason}
                    onChange={(e) => setNewAppt({ ...newAppt, reason: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Internal Instructions / Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Patient requested ECG before seeing physician"
                    value={newAppt.notes}
                    onChange={(e) => setNewAppt({ ...newAppt, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || patients.length === 0 || doctors.length === 0}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-xs transition disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Scheduling...' : 'Confirm Appointment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== CANCELLATION REASON MODAL ==================== */}
      {cancellingAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Cancel Appointment {cancellingAppointment.appointmentId}</h3>
            <p className="text-xs text-slate-500">
              Please specify the reason for cancelling this consultation with {cancellingAppointment.doctorName}.
            </p>
            <textarea
              rows={3}
              placeholder="e.g. Patient rescheduled, doctor called into emergency surgery..."
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setCancellingAppointment(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Go Back
              </button>
              <button
                onClick={handleCancelSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
              >
                {isSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== DELETE MODAL ==================== */}
      {deletingAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Delete Appointment Record</h3>
              <p className="text-xs text-slate-500 mt-1">
                Permanently delete consultation <strong className="text-slate-800">{deletingAppointment.appointmentId}</strong>{' '}
                from Cloud Firestore?
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingAppointment(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
              >
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
