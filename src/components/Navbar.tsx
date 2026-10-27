import React from 'react';
import {
  Activity,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  FileCode2,
  Database,
  Building2,
  Menu,
  X
} from 'lucide-react';
import { User } from 'firebase/auth';

interface NavbarProps {
  currentUser: User | null;
  onLogout: () => void;
  onNavigate: (tab: string) => void;
  activeTab: string;
  isOnline: boolean;
  onToggleMobileMenu: () => void;
  isMobileMenuOpen: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  onNavigate,
  activeTab,
  isOnline,
  onToggleMobileMenu,
  isMobileMenuOpen
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleMobileMenu}
              className="md:hidden p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-3 cursor-pointer select-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-sm ring-2 ring-blue-100">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg tracking-tight text-slate-900">ApexCare PRMS</span>
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full border border-blue-200">
                    Clinical v2.4
                  </span>
                </div>
                <p className="text-xs text-slate-500 hidden sm:block">Patient Record Management &amp; XML Tech System</p>
              </div>
            </div>
          </div>

          {/* Quick Actions & Status */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Quick XML Lab Link */}
            <button
              onClick={() => onNavigate('xml-lab')}
              className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === 'xml-lab'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>XML / XSLT Lab</span>
            </button>

            {/* Firestore Status indicator */}
            <div
              onClick={() => onNavigate('db-guide')}
              className="cursor-pointer flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-600 hover:bg-slate-100 transition"
              title="Firebase Cloud Firestore Connected"
            >
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="hidden sm:inline font-medium">Firestore Live</span>
            </div>

            {/* User Profile / Auth State */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="hidden lg:flex items-center gap-2 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold">
                    {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'S'}
                  </div>
                  <div className="text-left text-xs leading-tight">
                    <div className="font-semibold text-slate-800 truncate max-w-[120px]">
                      {currentUser.displayName || 'Duty Officer'}
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" /> Authorized
                    </div>
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-red-700 bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-lg transition"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
};
