import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Patient, Doctor, Appointment, PatientActivityLog } from '../types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
// CRITICAL: Must pass firestoreDatabaseId to getFirestore
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Connected to Cloud Firestore database successfully.');
    return true;
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore client is offline or initializing.');
    } else {
      console.log('Firestore connection checked:', error?.message || error);
    }
    return false;
  }
}

// Authentication methods
export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error('Google Sign-in failed:', error);
    throw error;
  }
}

export async function signInAsDemoStaff(role: string = 'admin'): Promise<User> {
  try {
    const cred = await signInAnonymously(auth);
    // Record staff in staff collection
    const staffDoc = doc(db, 'staff', cred.user.uid);
    await setDoc(staffDoc, {
      uid: cred.user.uid,
      email: 'staff.duty@hospital.org',
      displayName: `Duty Medical Officer (${role.toUpperCase()})`,
      role,
      createdAt: new Date().toISOString()
    }, { merge: true });
    return cred.user;
  } catch (error) {
    console.error('Demo staff login failed:', error);
    throw error;
  }
}

export async function logOut(): Promise<void> {
  await signOut(auth);
}

// ==================== PATIENTS CRUD ====================

export async function fetchPatients(): Promise<Patient[]> {
  const path = 'patients';
  try {
    const q = query(collection(db, path), orderBy('patientId', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Patient, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export function subscribeToPatients(
  callback: (patients: Patient[]) => void,
  onError?: (err: any) => void
): () => void {
  const path = 'patients';
  const q = query(collection(db, path), orderBy('patientId', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Patient, 'id'>) }));
      callback(list);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function createPatient(patientData: Omit<Patient, 'id'>): Promise<string> {
  const path = 'patients';
  try {
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(db, path), {
      ...patientData,
      createdAt: patientData.createdAt || now,
      updatedAt: now
    });

    // Record initial creation audit log
    const actor = auth.currentUser;
    const actorName = actor?.displayName || actor?.email || 'Duty Medical Officer (Staff)';
    await logPatientActivity(docRef.id, {
      patientDocId: docRef.id,
      patientId: patientData.patientId,
      action: 'CREATED',
      actorUid: actor?.uid || 'staff-admin',
      actorName,
      summary: `Initial admission and clinical profile registered for ${patientData.fullName} (${patientData.patientId})`,
      changedFields: ['patientId', 'fullName', 'age', 'gender', 'bloodGroup', 'phone', 'address'],
      timestamp: now
    }).catch(err => console.warn('Activity log write error:', err));

    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updatePatient(id: string, updates: Partial<Patient>): Promise<void> {
  const path = `patients/${id}`;
  try {
    const docRef = doc(db, 'patients', id);
    const prevSnap = await getDoc(docRef);
    const prevData = prevSnap.exists() ? (prevSnap.data() as Patient) : null;

    const { id: _, ...dataToUpdate } = updates;
    const now = new Date().toISOString();
    await updateDoc(docRef, {
      ...dataToUpdate,
      updatedAt: now
    });

    // Compute changed field list
    const changedFields: string[] = [];
    if (prevData) {
      for (const [key, val] of Object.entries(dataToUpdate)) {
        if ((prevData as any)[key] !== val && key !== 'updatedAt') {
          changedFields.push(key);
        }
      }
    } else {
      changedFields.push(...Object.keys(dataToUpdate).filter(k => k !== 'updatedAt'));
    }

    if (changedFields.length > 0) {
      const actor = auth.currentUser;
      const actorName = actor?.displayName || actor?.email || 'Duty Medical Officer (Staff)';

      let action: 'UPDATED' | 'CLINICAL_UPDATE' | 'CONTACT_UPDATE' = 'UPDATED';
      const isClinicalOnly = changedFields.every(f => ['medicalHistory', 'allergies'].includes(f));
      const isContactOnly = changedFields.every(f => ['phone', 'email', 'address', 'emergencyContact'].includes(f));
      if (isClinicalOnly) action = 'CLINICAL_UPDATE';
      else if (isContactOnly) action = 'CONTACT_UPDATE';

      const summary = `Modified ${changedFields.length} field(s): ${changedFields.join(', ')}`;
      const patientId = updates.patientId || prevData?.patientId || 'PATIENT';

      await logPatientActivity(id, {
        patientDocId: id,
        patientId,
        action,
        actorUid: actor?.uid || 'staff-admin',
        actorName,
        summary,
        changedFields,
        timestamp: now
      }).catch(err => console.warn('Activity log write error:', err));
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deletePatient(id: string): Promise<void> {
  const path = `patients/${id}`;
  try {
    await deleteDoc(doc(db, 'patients', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ==================== PATIENT ACTIVITY LOGS (AUDIT TRAIL) ====================

export async function logPatientActivity(
  patientDocId: string,
  logData: Omit<PatientActivityLog, 'id'>
): Promise<string> {
  const path = `patients/${patientDocId}/activityLogs`;
  try {
    const docRef = await addDoc(collection(db, 'patients', patientDocId, 'activityLogs'), {
      ...logData,
      timestamp: logData.timestamp || new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function fetchPatientActivityLogs(patientDocId: string): Promise<PatientActivityLog[]> {
  const path = `patients/${patientDocId}/activityLogs`;
  try {
    const q = query(
      collection(db, 'patients', patientDocId, 'activityLogs'),
      orderBy('timestamp', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<PatientActivityLog, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export function subscribeToPatientActivityLogs(
  patientDocId: string,
  callback: (logs: PatientActivityLog[]) => void,
  onError?: (err: any) => void
): () => void {
  const path = `patients/${patientDocId}/activityLogs`;
  const q = query(
    collection(db, 'patients', patientDocId, 'activityLogs'),
    orderBy('timestamp', 'desc')
  );
  return onSnapshot(
    q,
    (snap) => {
      const logs = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<PatientActivityLog, 'id'>) }));
      callback(logs);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function seedInitialPatientLogsIfEmpty(patient: Patient): Promise<void> {
  try {
    const existing = await fetchPatientActivityLogs(patient.id);
    if (existing.length === 0) {
      const actor = auth.currentUser;
      const staffName = actor?.displayName || 'Dr. Sarah Jenkins (Cardiology Lead)';
      const staffUid = actor?.uid || 'staff-system';

      // 1. Initial Admission event
      const admissionTime = patient.createdAt || new Date(Date.now() - 3 * 86400000).toISOString();
      await logPatientActivity(patient.id, {
        patientDocId: patient.id,
        patientId: patient.patientId,
        action: 'CREATED',
        actorUid: staffUid,
        actorName: staffName,
        summary: `Patient record registered and admitted to hospital registry`,
        changedFields: ['fullName', 'age', 'gender', 'bloodGroup', 'registrationDate'],
        timestamp: admissionTime
      });

      // 2. Clinical History assessment event
      const clinicalTime = patient.updatedAt && patient.updatedAt !== patient.createdAt
        ? patient.updatedAt
        : new Date(Date.now() - 1 * 86400000).toISOString();
      await logPatientActivity(patient.id, {
        patientDocId: patient.id,
        patientId: patient.patientId,
        action: 'CLINICAL_UPDATE',
        actorUid: staffUid,
        actorName: 'Clinical Intake Specialist',
        summary: `Verified medical history and documented allergy profiles: ${patient.allergies || 'None reported'}`,
        changedFields: ['medicalHistory', 'allergies', 'emergencyContact'],
        timestamp: clinicalTime
      });
    }
  } catch (err) {
    console.warn('Could not auto-seed initial activity log:', err);
  }
}

// ==================== DOCTORS CRUD ====================

export async function fetchDoctors(): Promise<Doctor[]> {
  const path = 'doctors';
  try {
    const q = query(collection(db, path), orderBy('name', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Doctor, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export function subscribeToDoctors(
  callback: (doctors: Doctor[]) => void,
  onError?: (err: any) => void
): () => void {
  const path = 'doctors';
  const q = query(collection(db, path), orderBy('name', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Doctor, 'id'>) }));
      callback(list);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function createDoctor(doctorData: Omit<Doctor, 'id'>): Promise<string> {
  const path = 'doctors';
  try {
    const docRef = await addDoc(collection(db, path), {
      ...doctorData,
      createdAt: doctorData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateDoctor(id: string, updates: Partial<Doctor>): Promise<void> {
  const path = `doctors/${id}`;
  try {
    const docRef = doc(db, 'doctors', id);
    const { id: _, ...dataToUpdate } = updates;
    await updateDoc(docRef, {
      ...dataToUpdate,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteDoctor(id: string): Promise<void> {
  const path = `doctors/${id}`;
  try {
    await deleteDoc(doc(db, 'doctors', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ==================== APPOINTMENTS CRUD ====================

export async function fetchAppointments(): Promise<Appointment[]> {
  const path = 'appointments';
  try {
    const q = query(collection(db, path), orderBy('appointmentDate', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Appointment, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export function subscribeToAppointments(
  callback: (appointments: Appointment[]) => void,
  onError?: (err: any) => void
): () => void {
  const path = 'appointments';
  const q = query(collection(db, path), orderBy('appointmentDate', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Appointment, 'id'>) }));
      callback(list);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function createAppointment(appData: Omit<Appointment, 'id'>): Promise<string> {
  const path = 'appointments';
  try {
    const docRef = await addDoc(collection(db, path), {
      ...appData,
      createdAt: appData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateAppointment(id: string, updates: Partial<Appointment>): Promise<void> {
  const path = `appointments/${id}`;
  try {
    const docRef = doc(db, 'appointments', id);
    const { id: _, ...dataToUpdate } = updates;
    await updateDoc(docRef, {
      ...dataToUpdate,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteAppointment(id: string): Promise<void> {
  const path = `appointments/${id}`;
  try {
    await deleteDoc(doc(db, 'appointments', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Initial seed helper for demo & evaluation
export async function seedInitialData(): Promise<{ patientsCount: number; doctorsCount: number; appointmentsCount: number }> {
  const sampleDoctors: Omit<Doctor, 'id'>[] = [
    {
      doctorId: 'DOC-101',
      name: 'Dr. Sarah Jenkins',
      specialization: 'Cardiology',
      qualification: 'MD, FACC (Harvard Medical)',
      department: 'Cardiology & Vascular',
      phone: '+1 (555) 789-1001',
      email: 's.jenkins@apex-hospital.org',
      availability: 'Mon - Thu: 09:00 AM - 02:00 PM',
      roomNumber: 'OPD-102 (Wing B)',
      status: 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      doctorId: 'DOC-102',
      name: 'Dr. Rajesh Nair',
      specialization: 'Neurology',
      qualification: 'MBBS, DM Neurology',
      department: 'Neurology & Stroke Unit',
      phone: '+1 (555) 789-1002',
      email: 'r.nair@apex-hospital.org',
      availability: 'Tue, Thu, Sat: 10:00 AM - 04:00 PM',
      roomNumber: 'OPD-204 (Wing C)',
      status: 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      doctorId: 'DOC-103',
      name: 'Dr. Emily Thornton',
      specialization: 'Pediatrics',
      qualification: 'MD Pediatrics, FAAP',
      department: 'Pediatrics & Neonatology',
      phone: '+1 (555) 789-1003',
      email: 'e.thornton@apex-hospital.org',
      availability: 'Mon - Fri: 08:30 AM - 01:30 PM',
      roomNumber: 'OPD-110 (Wing A)',
      status: 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      doctorId: 'DOC-104',
      name: 'Dr. Michael Vance',
      specialization: 'Orthopedics',
      qualification: 'MS Ortho, Joint Replacement Fellow',
      department: 'Orthopedics & Sports Medicine',
      phone: '+1 (555) 789-1004',
      email: 'm.vance@apex-hospital.org',
      availability: 'Wed, Fri: 11:00 AM - 05:00 PM',
      roomNumber: 'OPD-305 (Wing D)',
      status: 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const samplePatients: Omit<Patient, 'id'>[] = [
    {
      patientId: 'PAT-2026-001',
      fullName: 'Eleanor Vance',
      age: 42,
      gender: 'Female',
      bloodGroup: 'O+',
      phone: '+1 (555) 234-5678',
      email: 'eleanor.vance@example.com',
      address: '742 Evergreen Terrace, Springfield, IL',
      medicalHistory: 'Type 2 Diabetes mellitus for 5 years. Controlled on Metformin 500mg BID. Mild essential hypertension.',
      allergies: 'Penicillin, Shellfish',
      emergencyContact: 'Arthur Vance (Spouse) +1 555-234-9988',
      registrationDate: '2026-01-15',
      registeredBy: 'Admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      patientId: 'PAT-2026-002',
      fullName: 'Marcus Sterling',
      age: 58,
      gender: 'Male',
      bloodGroup: 'A-',
      phone: '+1 (555) 876-5432',
      email: 'marcus.sterling@example.org',
      address: '1204 Oakridge Blvd, Chicago, IL',
      medicalHistory: 'Coronary artery disease, status-post PTCA stent in LAD (2023). Regular cardiology follow-up required.',
      allergies: 'Sulfa antibiotics',
      emergencyContact: 'Clara Sterling (Wife) +1 555-876-0011',
      registrationDate: '2026-02-10',
      registeredBy: 'Admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      patientId: 'PAT-2026-003',
      fullName: 'Aria Chen',
      age: 29,
      gender: 'Female',
      bloodGroup: 'B+',
      phone: '+1 (555) 432-1098',
      email: 'aria.chen@example.edu',
      address: '315 Lakeview Avenue, Evanston, IL',
      medicalHistory: 'Chronic migraine headaches with visual aura. Seasonal allergic rhinitis.',
      allergies: 'Aspirin, Ibuprofen (NSAID hypersensitivity)',
      emergencyContact: 'David Chen (Brother) +1 555-432-9090',
      registrationDate: '2026-03-05',
      registeredBy: 'Admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      patientId: 'PAT-2026-004',
      fullName: 'Jameson Hayes',
      age: 65,
      gender: 'Male',
      bloodGroup: 'AB+',
      phone: '+1 (555) 654-9870',
      email: 'jameson.hayes@example.com',
      address: '88 Meadowbrook Lane, Naperville, IL',
      medicalHistory: 'Grade 3 osteoarthritis in right knee. Elevated LDL cholesterol under Atorvastatin management.',
      allergies: 'None reported',
      emergencyContact: 'Sarah Hayes (Daughter) +1 555-654-1234',
      registrationDate: '2026-04-18',
      registeredBy: 'Admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  // Insert doctors
  for (const docItem of sampleDoctors) {
    await addDoc(collection(db, 'doctors'), docItem);
  }

  // Insert patients
  for (const patItem of samplePatients) {
    await addDoc(collection(db, 'patients'), patItem);
  }

  const sampleAppointments: Omit<Appointment, 'id'>[] = [
    {
      appointmentId: 'APT-2026-001',
      patientId: 'PAT-2026-002',
      patientName: 'Marcus Sterling',
      doctorId: 'DOC-101',
      doctorName: 'Dr. Sarah Jenkins',
      department: 'Cardiology & Vascular',
      appointmentDate: '2026-10-28',
      timeSlot: '10:00 AM',
      reason: 'Bi-annual cardiology post-stent evaluation and stress ECG review.',
      priority: 'Routine',
      status: 'Scheduled',
      notes: 'Advised fasting lipid panel prior to appointment.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      appointmentId: 'APT-2026-002',
      patientId: 'PAT-2026-003',
      patientName: 'Aria Chen',
      doctorId: 'DOC-102',
      doctorName: 'Dr. Rajesh Nair',
      department: 'Neurology & Stroke Unit',
      appointmentDate: '2026-10-29',
      timeSlot: '11:30 AM',
      reason: 'Recurrent severe migraines resistant to standard triptan therapy.',
      priority: 'Urgent',
      status: 'Scheduled',
      notes: 'Patient asked to bring headache log from the past 3 months.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      appointmentId: 'APT-2026-003',
      patientId: 'PAT-2026-001',
      patientName: 'Eleanor Vance',
      doctorId: 'DOC-101',
      doctorName: 'Dr. Sarah Jenkins',
      department: 'Cardiology & Vascular',
      appointmentDate: '2026-10-25',
      timeSlot: '09:30 AM',
      reason: 'Blood pressure spike monitoring and anti-hypertensive dose adjustment.',
      priority: 'Follow-up',
      status: 'Completed',
      notes: 'BP stabilized at 124/82. Continued current regimen.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  for (const appItem of sampleAppointments) {
    await addDoc(collection(db, 'appointments'), appItem);
  }

  return {
    patientsCount: samplePatients.length,
    doctorsCount: sampleDoctors.length,
    appointmentsCount: sampleAppointments.length
  };
}
