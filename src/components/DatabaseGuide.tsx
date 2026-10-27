import React, { useState } from 'react';
import {
  Database,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Download,
  Terminal,
  Layers,
  Copy,
  Check,
  RefreshCw,
  FolderTree
} from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';
import { Patient, Doctor, Appointment } from '../types';

interface DatabaseGuideProps {
  patientsCount: number;
  doctorsCount: number;
  appointmentsCount: number;
  onSeedData: () => Promise<void>;
  isSeeding: boolean;
  isOnline: boolean;
  onCheckConnection: () => Promise<void>;
}

export const DatabaseGuide: React.FC<DatabaseGuideProps> = ({
  patientsCount,
  doctorsCount,
  appointmentsCount,
  onSeedData,
  isSeeding,
  isOnline,
  onCheckConnection
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const consoleUrl = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/databases/${firebaseConfig.firestoreDatabaseId}/data`;

  const handleCopyConsoleLink = () => {
    navigator.clipboard.writeText(consoleUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleTestPing = async () => {
    setIsChecking(true);
    try {
      await onCheckConnection();
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Persistent Storage Active
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
            Cloud Firestore Architecture &amp; Verification Guide
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real cloud persistence powered by Google Cloud Firestore with Attribute-Based Access Control security rules.
          </p>
        </div>

        <button
          onClick={handleTestPing}
          disabled={isChecking}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
          <span>{isChecking ? 'Pinging Server...' : 'Test Connection'}</span>
        </button>
      </div>

      {/* Cloud Configuration Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Firebase Project ID</span>
          <p className="font-mono text-sm font-bold text-slate-900 mt-1 truncate">{firebaseConfig.projectId}</p>
          <span className="inline-block mt-2 text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium border border-blue-200">
            Google Cloud Platform
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Firestore Database ID</span>
          <p className="font-mono text-xs font-bold text-slate-900 mt-1 truncate" title={firebaseConfig.firestoreDatabaseId}>
            {firebaseConfig.firestoreDatabaseId}
          </p>
          <span className="inline-block mt-2 text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-medium border border-emerald-200">
            Enterprise Firestore
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live Document Counts</span>
          <div className="flex items-center gap-4 mt-1 text-xs font-semibold text-slate-700">
            <span>Patients: <strong className="text-blue-600">{patientsCount}</strong></span>
            <span>Doctors: <strong className="text-emerald-600">{doctorsCount}</strong></span>
            <span>Appointments: <strong className="text-amber-600">{appointmentsCount}</strong></span>
          </div>
          <span className="inline-block mt-2 text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-medium border border-purple-200">
            Real-Time Sync
          </span>
        </div>
      </div>

      {/* How to Inspect Saved Records in Firebase Console */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            <span>How to Inspect Saved Records in Firebase Console</span>
          </h2>
          <button
            onClick={handleCopyConsoleLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 transition"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Copied Link' : 'Copy Console Link'}</span>
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Every patient admission, doctor update, and appointment created in this application is permanently saved to
          Google Cloud Firestore. You can inspect, query, or audit the raw JSON documents directly through the Firebase Web Console:
        </p>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 break-all select-all">
          {consoleUrl}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs pt-1">
          <div className="p-3 rounded-lg border border-slate-100 bg-white">
            <span className="font-bold text-blue-700 block mb-1">Step 1: Open Console</span>
            <p className="text-[11px] text-slate-500">
              Sign into the Google account associated with project <code className="font-mono">{firebaseConfig.projectId}</code>.
            </p>
          </div>
          <div className="p-3 rounded-lg border border-slate-100 bg-white">
            <span className="font-bold text-blue-700 block mb-1">Step 2: Firestore Database</span>
            <p className="text-[11px] text-slate-500">
              Select Build &rarr; Firestore Database and switch to database <code className="font-mono text-[10px]">{firebaseConfig.firestoreDatabaseId}</code>.
            </p>
          </div>
          <div className="p-3 rounded-lg border border-slate-100 bg-white">
            <span className="font-bold text-blue-700 block mb-1">Step 3: Browse Collections</span>
            <p className="text-[11px] text-slate-500">
              Click on <code className="font-mono text-blue-600">/patients</code>, <code className="font-mono text-emerald-600">/doctors</code>, or <code className="font-mono text-amber-600">/appointments</code>.
            </p>
          </div>
          <div className="p-3 rounded-lg border border-slate-100 bg-white">
            <span className="font-bold text-blue-700 block mb-1">Step 4: Real-time Inspection</span>
            <p className="text-[11px] text-slate-500">
              Observe documents updated live when modifications occur in the web interface!
            </p>
          </div>
        </div>
      </div>

      {/* Database Seeder Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Fictional Clinic Sample Data Seeder</span>
          </div>
          <p className="text-xs text-blue-700 max-w-xl leading-relaxed">
            Populates 4 standardized clinical patient profiles with diverse blood groups, 4 physician specialists across
            departments, and 3 outpatient consultations with complete clinical notes.
          </p>
        </div>
        <button
          onClick={onSeedData}
          disabled={isSeeding}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition shrink-0 disabled:opacity-50"
        >
          {isSeeding ? 'Writing to Firestore...' : 'Seed Sample Clinic Records'}
        </button>
      </div>

      {/* Security Rules & Permissions */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <h2 className="text-base font-bold text-slate-900">Firestore ABAC Security Architecture</h2>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          The database is protected by deployed security rules enforcing default-deny, authentication verification,
          and schema boundary validation on all write operations:
        </p>

        <div className="bg-slate-900 p-4 rounded-xl font-mono text-xs text-slate-300 overflow-x-auto space-y-1">
          <div className="text-slate-500">// Deployed firestore.rules</div>
          <div>rules_version = '2';</div>
          <div>service cloud.firestore &#123;</div>
          <div className="pl-4">match /databases/&#123;database&#125;/documents &#123;</div>
          <div className="pl-8 text-amber-300">// 1. Global default-deny catch-all</div>
          <div className="pl-8">match /&#123;document=**&#125; &#123; allow read, write: if false; &#125;</div>
          <div className="pl-8 text-amber-300">// 2. Authorized hospital staff only</div>
          <div className="pl-8">match /patients/&#123;patientDocId&#125; &#123;</div>
          <div className="pl-12">allow read: if isSignedIn();</div>
          <div className="pl-12">allow create, update: if isSignedIn() &amp;&amp; request.resource.data.fullName.size() &gt; 0;</div>
          <div className="pl-12">allow delete: if isSignedIn();</div>
          <div className="pl-8">&#125;</div>
          <div className="pl-4">&#125;</div>
          <div>&#125;</div>
        </div>
      </div>
    </div>
  );
};
