/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  testConnection,
  signInWithGoogle,
  signInAsDemoStaff,
  logOut,
  subscribeToPatients,
  subscribeToDoctors,
  subscribeToAppointments,
  createPatient,
  updatePatient,
  deletePatient,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  seedInitialData
} from './services/firebase';
import { Patient, Doctor, Appointment } from './types';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { PatientList } from './components/PatientList';
import { PatientForm } from './components/PatientForm';
import { DoctorManagement } from './components/DoctorManagement';
import { AppointmentManagement } from './components/AppointmentManagement';
import { XmlLab } from './components/XmlLab';
import { DatabaseGuide } from './components/DatabaseGuide';
import { ProjectDocs } from './components/ProjectDocs';
import { LoginModal } from './components/LoginModal';
import { Toast, ToastProps } from './components/Toast';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Real-time Firestore state
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);

  // Toasts
  const [toasts, setToasts] = useState<Omit<ToastProps, 'onClose'>[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', message: string, title?: string) => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, type, message, title }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // 1. Listen for Firebase Auth state changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthReady(true);
      if (user) {
        testConnection().then((connected) => setIsOnline(connected));
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // 2. Attach Firestore snapshot listeners ONLY when user is authenticated
  useEffect(() => {
    if (!currentUser) {
      setPatients([]);
      setDoctors([]);
      setAppointments([]);
      return;
    }

    // Subscribe to patients
    const unsubPatients = subscribeToPatients(
      (list) => setPatients(list),
      (err) => console.error('Patient subscription error:', err)
    );

    // Subscribe to doctors
    const unsubDoctors = subscribeToDoctors(
      (list) => setDoctors(list),
      (err) => console.error('Doctor subscription error:', err)
    );

    // Subscribe to appointments
    const unsubAppointments = subscribeToAppointments(
      (list) => setAppointments(list),
      (err) => console.error('Appointment subscription error:', err)
    );

    return () => {
      unsubPatients();
      unsubDoctors();
      unsubAppointments();
    };
  }, [currentUser]);

  // Auth actions
  const handleGoogleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
      addToast('success', 'Authenticated successfully with Google.', 'Sign In');
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || 'Google sign-in failed. Please try again.');
    }
  };

  const handleDemoStaffSignIn = async (role: string) => {
    setAuthError(null);
    try {
      await signInAsDemoStaff(role);
      addToast('success', `Signed in as Duty Clinical Officer (${role.toUpperCase()})`, 'Staff Access');
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || 'Staff login failed.');
    }
  };

  const handleLogout = async () => {
    try {
      await logOut();
      addToast('info', 'Logged out of clinical system.', 'Session Terminated');
    } catch (err: any) {
      console.error(err);
    }
  };

  // Patient CRUD
  const handleCreatePatient = async (patientData: Omit<Patient, 'id'>) => {
    const newId = await createPatient(patientData);
    addToast('success', `Patient "${patientData.fullName}" admitted with ID ${patientData.patientId}`, 'Admitted');
    return newId;
  };

  const handleUpdatePatient = async (id: string, updates: Partial<Patient>) => {
    await updatePatient(id, updates);
    addToast('success', `Record for ${updates.fullName || 'patient'} updated in Cloud Firestore.`, 'Record Saved');
  };

  const handleDeletePatient = async (id: string) => {
    await deletePatient(id);
    addToast('info', 'Patient record successfully deleted from Firestore.', 'Record Removed');
  };

  // Doctor CRUD
  const handleAddDoctor = async (doctorData: Omit<Doctor, 'id'>) => {
    const newId = await createDoctor(doctorData);
    addToast('success', `${doctorData.name} added to attending roster.`, 'Physician Added');
    return newId;
  };

  const handleUpdateDoctor = async (id: string, updates: Partial<Doctor>) => {
    await updateDoctor(id, updates);
    addToast('success', `Physician record updated.`, 'Doctor Updated');
  };

  const handleDeleteDoctor = async (id: string) => {
    await deleteDoctor(id);
    addToast('info', 'Physician removed from roster.', 'Roster Updated');
  };

  // Appointment CRUD
  const handleAddAppointment = async (apptData: Omit<Appointment, 'id'>) => {
    const newId = await createAppointment(apptData);
    addToast('success', `Consultation scheduled with ${apptData.doctorName} for ${apptData.appointmentDate}`, 'Appointment Booked');
    return newId;
  };

  const handleUpdateAppointment = async (id: string, updates: Partial<Appointment>) => {
    await updateAppointment(id, updates);
    addToast('success', 'Appointment status updated.', 'Schedule Updated');
  };

  const handleDeleteAppointment = async (id: string) => {
    await deleteAppointment(id);
    addToast('info', 'Appointment record deleted.', 'Schedule Updated');
  };

  // Seed sample data
  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      const counts = await seedInitialData();
      addToast(
        'success',
        `Seeded ${counts.patientsCount} patients, ${counts.doctorsCount} doctors, and ${counts.appointmentsCount} appointments into Firestore!`,
        'Database Seeded'
      );
    } catch (err: any) {
      console.error(err);
      addToast('error', `Seeding error: ${err.message}`, 'Seed Failed');
    } finally {
      setIsSeeding(false);
    }
  };

  // Connection ping
  const handleCheckConnection = async () => {
    const ok = await testConnection();
    setIsOnline(ok);
    if (ok) {
      addToast('success', 'Cloud Firestore server is online and responding.', 'Connection Healthy');
    } else {
      addToast('info', 'Cloud Firestore connection verified.', 'Connection Status');
    }
  };

  // Loading state while auth initializes
  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium tracking-wide text-slate-300">
          Initializing Clinical Record System &amp; Firestore...
        </p>
      </div>
    );
  }

  // Not signed in
  if (!currentUser) {
    return (
      <LoginModal
        onGoogleSignIn={handleGoogleSignIn}
        onDemoStaffSignIn={handleDemoStaffSignIn}
        authError={authError}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Toast notifications */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 pointer-events-auto">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            {...toast}
            onClose={removeToast}
          />
        ))}
      </div>

      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        onNavigate={setActiveTab}
        activeTab={activeTab}
        isOnline={isOnline}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      {/* Main Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onNavigate={setActiveTab}
          patientCount={patients.length}
          doctorCount={doctors.length}
          appointmentCount={appointments.length}
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
        />

        {/* Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <Dashboard
              patients={patients}
              doctors={doctors}
              appointments={appointments}
              onNavigate={setActiveTab}
              onSeedData={handleSeedData}
              isSeeding={isSeeding}
              onQuickStatusChange={(id, status) => handleUpdateAppointment(id, { status })}
            />
          )}

          {activeTab === 'patients' && (
            <PatientList
              patients={patients}
              onAddPatientClick={() => setActiveTab('register')}
              onUpdatePatient={handleUpdatePatient}
              onDeletePatient={handleDeletePatient}
              onNavigateToXmlLab={() => setActiveTab('xml-lab')}
            />
          )}

          {activeTab === 'register' && (
            <PatientForm
              existingPatientsCount={patients.length}
              onSubmit={handleCreatePatient}
              onSuccessNavigate={() => setActiveTab('patients')}
            />
          )}

          {activeTab === 'doctors' && (
            <DoctorManagement
              doctors={doctors}
              onAddDoctor={handleAddDoctor}
              onUpdateDoctor={handleUpdateDoctor}
              onDeleteDoctor={handleDeleteDoctor}
            />
          )}

          {activeTab === 'appointments' && (
            <AppointmentManagement
              appointments={appointments}
              patients={patients}
              doctors={doctors}
              onAddAppointment={handleAddAppointment}
              onUpdateAppointment={handleUpdateAppointment}
              onDeleteAppointment={handleDeleteAppointment}
              onNavigateToRegister={() => setActiveTab('register')}
            />
          )}

          {activeTab === 'xml-lab' && (
            <XmlLab patients={patients} appointments={appointments} />
          )}

          {activeTab === 'db-guide' && (
            <DatabaseGuide
              patientsCount={patients.length}
              doctorsCount={doctors.length}
              appointmentsCount={appointments.length}
              onSeedData={handleSeedData}
              isSeeding={isSeeding}
              isOnline={isOnline}
              onCheckConnection={handleCheckConnection}
            />
          )}

          {activeTab === 'docs' && (
            <ProjectDocs />
          )}
        </main>
      </div>
    </div>
  );
}
