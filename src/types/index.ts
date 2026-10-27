export type Gender = 'Male' | 'Female' | 'Other';

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Unknown';

export interface Patient {
  id: string; // Firestore document ID
  patientId: string; // Formatted ID e.g. PAT-2026-001
  fullName: string;
  age: number;
  gender: Gender;
  bloodGroup: BloodGroup;
  phone: string;
  email: string;
  address: string;
  medicalHistory: string;
  allergies: string;
  emergencyContact: string;
  registrationDate: string; // YYYY-MM-DD
  registeredBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type PatientActivityAction = 
  | 'CREATED'
  | 'UPDATED'
  | 'DELETED'
  | 'CLINICAL_UPDATE'
  | 'CONTACT_UPDATE'
  | 'NOTE_ADDED';

export interface PatientActivityLog {
  id: string; // Firestore document ID
  patientDocId: string;
  patientId: string;
  action: PatientActivityAction;
  actorUid?: string;
  actorName: string;
  summary: string;
  changedFields?: string[];
  details?: string;
  timestamp: string; // ISO 8601 string
}

export type DoctorStatus = 'Active' | 'On Leave' | 'Inactive';

export interface Doctor {
  id: string; // Firestore document ID
  doctorId: string; // e.g. DOC-101
  name: string;
  specialization: string;
  qualification: string;
  department: string;
  phone: string;
  email: string;
  availability: string; // e.g. "Mon-Fri: 09:00 AM - 02:00 PM"
  roomNumber: string;
  status: DoctorStatus;
  createdAt: string;
  updatedAt: string;
}

export type AppointmentPriority = 'Routine' | 'Urgent' | 'Follow-up' | 'Emergency';
export type AppointmentStatus = 'Scheduled' | 'In-Progress' | 'Completed' | 'Cancelled';

export interface Appointment {
  id: string; // Firestore document ID
  appointmentId: string; // e.g. APT-2026-001
  patientId: string; // PAT-XXXX or patient doc id
  patientName: string;
  doctorId: string;
  doctorName: string;
  department: string;
  appointmentDate: string; // YYYY-MM-DD
  timeSlot: string; // e.g. 10:30 AM
  reason: string;
  priority: AppointmentPriority;
  status: AppointmentStatus;
  cancellationReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HospitalStaff {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  role: 'admin' | 'doctor' | 'nurse' | 'receptionist';
}

export interface ValidationErrorItem {
  element?: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface XMLValidationResult {
  isValid: boolean;
  patientCount: number;
  errors: ValidationErrorItem[];
  summary: string;
}
