import React, { useState } from 'react';
import {
  UserPlus,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { Patient, Gender, BloodGroup } from '../types';

interface PatientFormProps {
  existingPatientsCount: number;
  onSubmit: (patient: Omit<Patient, 'id'>) => Promise<string>;
  onSuccessNavigate: () => void;
}

export const PatientForm: React.FC<PatientFormProps> = ({
  existingPatientsCount,
  onSubmit,
  onSuccessNavigate
}) => {
  // Generate a clean next Patient ID
  const generateInitialId = () => {
    const nextNum = existingPatientsCount + 1;
    const padded = String(nextNum).padStart(3, '0');
    return `PAT-2026-${padded}`;
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    patientId: generateInitialId(),
    fullName: '',
    age: '',
    gender: 'Male' as Gender,
    bloodGroup: 'O+' as BloodGroup,
    phone: '',
    email: '',
    address: '',
    medicalHistory: '',
    allergies: '',
    emergencyContact: '',
    registrationDate: todayStr
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Validation function
  const validate = () => {
    const errs: Record<string, string> = {};

    // Patient ID pattern: PAT-YYYY-NNN
    if (!formData.patientId.trim()) {
      errs.patientId = 'Patient ID is required';
    } else if (!/^PAT-\d{4}-\d{3,4}$/.test(formData.patientId.trim())) {
      errs.patientId = 'Format must be PAT-YYYY-NNN (e.g. PAT-2026-005)';
    }

    // Full name
    if (!formData.fullName.trim()) {
      errs.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      errs.fullName = 'Name must be at least 2 characters';
    }

    // Age
    const ageNum = parseInt(formData.age, 10);
    if (!formData.age) {
      errs.age = 'Age is required';
    } else if (isNaN(ageNum) || ageNum < 0 || ageNum > 130) {
      errs.age = 'Age must be a valid number between 0 and 130';
    }

    // Phone
    if (!formData.phone.trim()) {
      errs.phone = 'Contact phone number is required';
    } else if (formData.phone.trim().length < 7) {
      errs.phone = 'Phone number is too short';
    }

    // Email
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Please provide a valid email address';
    }

    // Address
    if (!formData.address.trim()) {
      errs.address = 'Residential address is required';
    }

    // Registration Date
    if (!formData.registrationDate) {
      errs.registrationDate = 'Registration date is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);

    if (!validate()) {
      return;
    }

    try {
      setIsSubmitting(true);
      const newPatient: Omit<Patient, 'id'> = {
        patientId: formData.patientId.trim().toUpperCase(),
        fullName: formData.fullName.trim(),
        age: parseInt(formData.age, 10),
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        medicalHistory: formData.medicalHistory.trim() || 'No prior medical conditions documented.',
        allergies: formData.allergies.trim() || 'None reported.',
        emergencyContact: formData.emergencyContact.trim(),
        registrationDate: formData.registrationDate,
        registeredBy: 'Hospital Reception Staff',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await onSubmit(newPatient);
      setSuccessMessage(`Patient record for "${formData.fullName}" (${newPatient.patientId}) saved successfully to Cloud Firestore!`);

      // Reset for next entry
      const nextNum = existingPatientsCount + 2;
      setFormData({
        patientId: `PAT-2026-${String(nextNum).padStart(3, '0')}`,
        fullName: '',
        age: '',
        gender: 'Male',
        bloodGroup: 'O+',
        phone: '',
        email: '',
        address: '',
        medicalHistory: '',
        allergies: '',
        emergencyContact: '',
        registrationDate: todayStr
      });
      setErrors({});
    } catch (err: any) {
      setErrors({ form: err.message || 'Error writing record to Firestore' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      patientId: generateInitialId(),
      fullName: '',
      age: '',
      gender: 'Male',
      bloodGroup: 'O+',
      phone: '',
      email: '',
      address: '',
      medicalHistory: '',
      allergies: '',
      emergencyContact: '',
      registrationDate: todayStr
    });
    setErrors({});
    setSuccessMessage(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            <span>New Patient Clinical Admission Form</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Register outpatient or inpatient records into persistent Cloud Firestore database with instant XML schema compatibility.
          </p>
        </div>
        <button
          onClick={onSuccessNavigate}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200"
        >
          <span>View Patient Directory</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start justify-between gap-3 text-emerald-800 shadow-xs">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold">Registration Successful</p>
              <p className="text-xs text-emerald-700 mt-0.5">{successMessage}</p>
            </div>
          </div>
          <button
            onClick={onSuccessNavigate}
            className="px-3 py-1.5 bg-emerald-600 text-white font-semibold text-xs rounded-lg hover:bg-emerald-700 transition shrink-0"
          >
            Open Directory
          </button>
        </div>
      )}

      {/* Global Form Error */}
      {errors.form && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errors.form}</span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 sm:p-8 space-y-6">
          {/* Section 1: Identification & Demographics */}
          <div>
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                1
              </span>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Demographics &amp; Hospital ID
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Patient ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Patient ID * <span className="text-[10px] text-slate-400">(XSD Pattern)</span>
                </label>
                <input
                  type="text"
                  value={formData.patientId}
                  onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                  placeholder="PAT-2026-001"
                  className={`w-full px-3 py-2 text-xs font-mono bg-slate-50 border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                    errors.patientId ? 'border-rose-400 bg-rose-50' : 'border-slate-200'
                  }`}
                />
                {errors.patientId && <p className="text-[10px] text-rose-600 mt-1 font-medium">{errors.patientId}</p>}
              </div>

              {/* Full Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Jonathan R. Doe"
                  className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                    errors.fullName ? 'border-rose-400 bg-rose-50' : 'border-slate-200'
                  }`}
                />
                {errors.fullName && <p className="text-[10px] text-rose-600 mt-1 font-medium">{errors.fullName}</p>}
              </div>

              {/* Age */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Age (Years) *</label>
                <input
                  type="number"
                  min="0"
                  max="130"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  placeholder="e.g. 34"
                  className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                    errors.age ? 'border-rose-400 bg-rose-50' : 'border-slate-200'
                  }`}
                />
                {errors.age && <p className="text-[10px] text-rose-600 mt-1 font-medium">{errors.age}</p>}
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Gender *</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Blood Group */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Group *</label>
                <select
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value as BloodGroup })}
                  className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'].map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>

              {/* Registration Date */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Admission / Registration Date *</label>
                <input
                  type="date"
                  value={formData.registrationDate}
                  onChange={(e) => setFormData({ ...formData, registrationDate: e.target.value })}
                  className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.registrationDate ? 'border-rose-400' : 'border-slate-200'
                  }`}
                />
                {errors.registrationDate && (
                  <p className="text-[10px] text-rose-600 mt-1 font-medium">{errors.registrationDate}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Contact Information */}
          <div>
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                2
              </span>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Contact &amp; Residence</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone *</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 234-5678"
                  className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                    errors.phone ? 'border-rose-400 bg-rose-50' : 'border-slate-200'
                  }`}
                />
                {errors.phone && <p className="text-[10px] text-rose-600 mt-1 font-medium">{errors.phone}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="patient@example.com"
                  className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? 'border-rose-400 bg-rose-50' : 'border-slate-200'
                  }`}
                />
                {errors.email && <p className="text-[10px] text-rose-600 mt-1 font-medium">{errors.email}</p>}
              </div>

              {/* Emergency Contact */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact (Name &amp; Phone)</label>
                <input
                  type="text"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  placeholder="Jane Doe (Spouse) +1 555-987-6543"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Address */}
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Address *</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="House / Flat No, Street, City, State, ZIP code"
                  className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                    errors.address ? 'border-rose-400 bg-rose-50' : 'border-slate-200'
                  }`}
                />
                {errors.address && <p className="text-[10px] text-rose-600 mt-1 font-medium">{errors.address}</p>}
              </div>
            </div>
          </div>

          {/* Section 3: Clinical History & Allergies */}
          <div>
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                3
              </span>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Clinical History &amp; Drug Allergies
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Past Medical History &amp; Chronic Illnesses</label>
                <textarea
                  rows={3}
                  value={formData.medicalHistory}
                  onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                  placeholder="e.g. Hypertension, Diabetes Type 2, Asthma, previous surgeries..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
                <p className="text-[10px] text-slate-400 mt-1">Stored in Cloud Firestore and exported to XML &lt;MedicalHistory&gt;</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Known Drug &amp; Food Allergies <span className="text-rose-500 font-bold">(Critical)</span>
                </label>
                <textarea
                  rows={3}
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  placeholder="e.g. Penicillin, Sulfa drugs, Aspirin, Latex, Peanuts..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
                <p className="text-[10px] text-slate-400 mt-1">Exported to XML &lt;Allergies&gt; and highlighted in red on reports</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Fields</span>
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Writing to Firestore...' : 'Admit & Save Patient Record'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
