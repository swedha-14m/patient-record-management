import React, { useState } from 'react';
import {
  Activity,
  ShieldCheck,
  Lock,
  AlertCircle,
  Stethoscope,
  KeyRound,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

interface LoginModalProps {
  onGoogleSignIn: () => Promise<void>;
  onDemoStaffSignIn: (role: string) => Promise<void>;
  authError: string | null;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  onGoogleSignIn,
  onDemoStaffSignIn,
  authError
}) => {
  const [loadingType, setLoadingType] = useState<string | null>(null);

  const handleGoogleClick = async () => {
    setLoadingType('google');
    try {
      await onGoogleSignIn();
    } finally {
      setLoadingType(null);
    }
  };

  const handleDemoClick = async (role: string) => {
    setLoadingType(role);
    try {
      await onDemoStaffSignIn(role);
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Hospital Header Banner */}
        <div className="bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-700 p-8 text-white text-center relative overflow-hidden">
          <div className="absolute right-0 top-0 -mr-10 -mt-10 w-40 h-40 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md mx-auto flex items-center justify-center text-white ring-4 ring-white/20 mb-4 shadow-md">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">ApexCare Clinical PRMS</h1>
          <p className="text-xs text-blue-100 mt-1">
            Hospital Patient Record &amp; Medical Informatics System
          </p>
          <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-white/15 text-[11px] font-semibold text-blue-100 border border-white/20">
            <Lock className="w-3 h-3 text-blue-200" />
            <span>Authorized Clinical Personnel Only</span>
          </div>
        </div>

        {/* Login Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {authError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <div className="space-y-3">
            {/* Primary Google Login Button */}
            <button
              onClick={handleGoogleClick}
              disabled={loadingType !== null}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs shadow-xs hover:shadow-sm transition disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{loadingType === 'google' ? 'Authenticating with Google...' : 'Sign in with Google Account'}</span>
            </button>

            <div className="relative flex items-center justify-center py-2">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider absolute">
                or Quick Academic Staff Access
              </span>
            </div>

            {/* Quick Demo Access for Lab Evaluation */}
            <div className="space-y-2">
              <button
                onClick={() => handleDemoClick('admin')}
                disabled={loadingType !== null}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-900 transition text-left group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs">Medical Administrator Mode</div>
                    <div className="text-[10px] text-blue-700">Full CRUD, Doctor Management, &amp; XML Lab</div>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-blue-600 group-hover:translate-x-0.5 transition">
                  {loadingType === 'admin' ? 'Entering...' : 'Enter &rarr;'}
                </span>
              </button>

              <button
                onClick={() => handleDemoClick('doctor')}
                disabled={loadingType !== null}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 transition text-left group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    <Stethoscope className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs">Duty Physician / Registrar</div>
                    <div className="text-[10px] text-slate-500">Clinical OPD queue &amp; patient records</div>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-slate-500 group-hover:translate-x-0.5 transition">
                  {loadingType === 'doctor' ? 'Entering...' : 'Enter &rarr;'}
                </span>
              </button>
            </div>
          </div>

          {/* Privacy & Compliance Notice */}
          <div className="pt-4 border-t border-slate-100 text-center text-[10px] text-slate-400 space-y-1">
            <p>Protected by Google Cloud Firestore Attribute-Based Access Control</p>
            <p className="text-[9px] text-slate-400">
              Fictional healthcare demonstration environment &bull; Web Technology Project
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
