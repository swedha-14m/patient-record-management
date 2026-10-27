import React from 'react';
import {
  Users,
  Stethoscope,
  CalendarCheck,
  FileCode2,
  UserPlus,
  PlusCircle,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  Database,
  ArrowRight,
  TrendingUp,
  Activity,
  Heart,
  Sparkles
} from 'lucide-react';
import { Patient, Doctor, Appointment } from '../types';
import { DemographicsCharts } from './DemographicsCharts';

interface DashboardProps {
  patients: Patient[];
  doctors: Doctor[];
  appointments: Appointment[];
  onNavigate: (tab: string) => void;
  onSeedData: () => Promise<void>;
  isSeeding: boolean;
  onQuickStatusChange: (id: string, status: Appointment['status']) => Promise<void>;
}

export const Dashboard: React.FC<DashboardProps> = ({
  patients,
  doctors,
  appointments,
  onNavigate,
  onSeedData,
  isSeeding,
  onQuickStatusChange
}) => {
  const activeDoctors = doctors.filter(d => d.status === 'Active').length;
  const scheduledAppointments = appointments.filter(a => a.status === 'Scheduled').length;
  const completedAppointments = appointments.filter(a => a.status === 'Completed').length;

  const bloodGroupCounts: Record<string, number> = {};
  patients.forEach(p => {
    bloodGroupCounts[p.bloodGroup] = (bloodGroupCounts[p.bloodGroup] || 0) + 1;
  });

  const recentAppointments = [...appointments]
    .sort((a, b) => new Date(b.createdAt || b.appointmentDate).getTime() - new Date(a.createdAt || a.appointmentDate).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome & Overview Header */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-xs font-semibold text-blue-100 border border-white/20">
              <Activity className="w-3.5 h-3.5 text-blue-200" />
              <span>Apex Health Information Management System</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Clinical Administration Dashboard</h1>
            <p className="text-sm text-blue-100 max-w-2xl leading-relaxed">
              Unified portal for electronic patient health records, attending physician rosters, outpatient scheduling,
              and academic W3C XML / XSD validation &amp; XSLT report transformations.
            </p>
          </div>

          {/* Quick seeded data banner if 0 patients */}
          {patients.length === 0 && (
            <div className="bg-white/15 backdrop-blur-md p-4 rounded-xl border border-white/30 text-xs space-y-2.5 max-w-xs shrink-0">
              <div className="flex items-center gap-2 font-semibold text-amber-200">
                <Sparkles className="w-4 h-4" />
                <span>Quick-Start Demonstration</span>
              </div>
              <p className="text-blue-50">
                Database is currently empty. Populate fictional clinic records to test all CRUD &amp; XML features.
              </p>
              <button
                onClick={onSeedData}
                disabled={isSeeding}
                className="w-full py-2 px-3 bg-white text-blue-700 font-semibold rounded-lg hover:bg-blue-50 transition shadow-xs disabled:opacity-50 text-center"
              >
                {isSeeding ? 'Writing to Firestore...' : 'Seed Sample Clinic Data'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Patients */}
        <div
          onClick={() => onNavigate('patients')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Patients</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 tracking-tight">{patients.length}</span>
            <span className="text-xs text-slate-500">Admitted</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-blue-600 font-medium">
            <span>View directory</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
          </div>
        </div>

        {/* Total Doctors */}
        <div
          onClick={() => onNavigate('doctors')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Physicians</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition">
              <Stethoscope className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 tracking-tight">{doctors.length}</span>
            <span className="text-xs text-emerald-600 font-medium">{activeDoctors} Active on Duty</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-600 font-medium">
            <span>Manage rosters</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
          </div>
        </div>

        {/* Scheduled Appointments */}
        <div
          onClick={() => onNavigate('appointments')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Appointments</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 tracking-tight">{appointments.length}</span>
            <span className="text-xs text-amber-600 font-medium">{scheduledAppointments} Pending</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-amber-600 font-medium">
            <span>View calendar</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
          </div>
        </div>

        {/* XML / XSD / XSLT Lab */}
        <div
          onClick={() => onNavigate('xml-lab')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">XML &amp; XSD Engine</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition">
              <FileCode2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-indigo-900 tracking-tight">W3C</span>
            <span className="text-xs text-indigo-600 font-medium">XSLT 1.0 Ready</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-600 font-medium">
            <span>Export &amp; transform</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
          </div>
        </div>
      </div>

      {/* Quick Action Hub */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span>Quick Actions</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => onNavigate('register')}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition text-slate-700 group"
          >
            <div className="p-2.5 rounded-lg bg-blue-100 text-blue-600 mb-2 group-hover:scale-110 transition">
              <UserPlus className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold">Admit Patient</span>
          </button>

          <button
            onClick={() => onNavigate('appointments')}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700 transition text-slate-700 group"
          >
            <div className="p-2.5 rounded-lg bg-amber-100 text-amber-600 mb-2 group-hover:scale-110 transition">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold">Book OPD</span>
          </button>

          <button
            onClick={() => onNavigate('doctors')}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition text-slate-700 group"
          >
            <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-600 mb-2 group-hover:scale-110 transition">
              <PlusCircle className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold">Add Doctor</span>
          </button>

          <button
            onClick={() => onNavigate('xml-lab')}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition text-slate-700 group"
          >
            <div className="p-2.5 rounded-lg bg-indigo-100 text-indigo-600 mb-2 group-hover:scale-110 transition">
              <Download className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold">Export XML</span>
          </button>

          <button
            onClick={() => onNavigate('db-guide')}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 transition text-slate-700 group"
          >
            <div className="p-2.5 rounded-lg bg-purple-100 text-purple-600 mb-2 group-hover:scale-110 transition">
              <Database className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold">Firestore Ops</span>
          </button>

          <button
            onClick={() => onNavigate('docs')}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-700 transition text-slate-700 group"
          >
            <div className="p-2.5 rounded-lg bg-teal-100 text-teal-600 mb-2 group-hover:scale-110 transition">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold">Project Report</span>
          </button>
        </div>
      </div>

      {/* Patient Demographics & Population Analytics Section */}
      <DemographicsCharts patients={patients} />

      {/* Main Grid: Recent Appointments & Blood Group Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Appointments (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 text-base">Recent Clinic Appointments</h2>
              <p className="text-xs text-slate-500">Live consultation queue from Firestore</p>
            </div>
            <button
              onClick={() => onNavigate('appointments')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>All Appointments</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-0 overflow-x-auto">
            {recentAppointments.length === 0 ? (
              <div className="text-center py-10 px-4 text-slate-500">
                <CalendarCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-medium">No appointments scheduled yet</p>
                <p className="text-xs text-slate-400 mt-1">Book an appointment or seed initial demo records</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">APT ID</th>
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4">Attending Doctor</th>
                    <th className="py-3 px-4">Date &amp; Time</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentAppointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 font-mono font-semibold text-blue-600">{apt.appointmentId}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{apt.patientName}</div>
                        <div className="text-[10px] text-slate-400">{apt.patientId}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{apt.doctorName}</div>
                        <div className="text-[10px] text-slate-400">{apt.department}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-800 font-medium">{apt.appointmentDate}</div>
                        <div className="text-[10px] text-slate-400">{apt.timeSlot}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            apt.status === 'Scheduled'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : apt.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : apt.status === 'In-Progress'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {apt.status === 'Completed' && <CheckCircle2 className="w-2.5 h-2.5" />}
                          {apt.status === 'Scheduled' && <Clock className="w-2.5 h-2.5" />}
                          {apt.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {apt.status === 'Scheduled' ? (
                          <button
                            onClick={() => onQuickStatusChange(apt.id, 'Completed')}
                            className="px-2.5 py-1 text-[11px] font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-md transition"
                          >
                            Mark Done
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Archived</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Sidebar Cards: Blood Inventory & Academic Tech Stack */}
        <div className="space-y-6">
          {/* Blood Group Distribution */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />
                <span>Patient Blood Group Roster</span>
              </h3>
              <span className="text-[10px] bg-rose-50 text-rose-700 font-semibold px-2 py-0.5 rounded-full border border-rose-200">
                {patients.length} Registered
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-1">
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((group) => {
                const count = bloodGroupCounts[group] || 0;
                return (
                  <div
                    key={group}
                    className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/70 text-center hover:bg-rose-50/50 hover:border-rose-200 transition"
                  >
                    <div className="text-xs font-bold text-slate-800">{group}</div>
                    <div className="text-lg font-extrabold text-rose-600 mt-0.5">{count}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Academic Web Tech Specification Card */}
          <div className="bg-slate-900 text-white p-5 rounded-xl shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                College Web Tech Architecture
              </span>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-400/30">
                Full-Stack
              </span>
            </div>
            <div className="text-xs space-y-2 text-slate-300">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Database:</span>
                <span className="font-medium text-emerald-400">Cloud Firestore (Real-Time)</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">XML Export:</span>
                <span className="font-medium text-blue-400">W3C Schema Compliant</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">XSD Validation:</span>
                <span className="font-medium text-amber-400">patients.xsd (Regex &amp; Enum)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">XSLT Stylesheet:</span>
                <span className="font-medium text-purple-400">patients.xsl (HTML Report)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
