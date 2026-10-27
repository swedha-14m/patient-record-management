import React from 'react';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Stethoscope,
  CalendarCheck,
  FileCode2,
  Database,
  FileText,
  HelpCircle,
  Building,
  HeartPulse
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
  patientCount: number;
  doctorCount: number;
  appointmentCount: number;
  isMobileMenuOpen: boolean;
  onCloseMobileMenu: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onNavigate,
  patientCount,
  doctorCount,
  appointmentCount,
  isMobileMenuOpen,
  onCloseMobileMenu
}) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Clinical Dashboard',
      icon: LayoutDashboard,
      badge: null,
      description: 'System overview & metrics'
    },
    {
      id: 'patients',
      label: 'Patient Directory',
      icon: Users,
      badge: patientCount,
      description: 'View, search, edit & delete'
    },
    {
      id: 'register',
      label: 'Register Patient',
      icon: UserPlus,
      badge: null,
      description: 'Admit new patient record'
    },
    {
      id: 'doctors',
      label: 'Doctor Management',
      icon: Stethoscope,
      badge: doctorCount,
      description: 'Staff physicians & schedules'
    },
    {
      id: 'appointments',
      label: 'Appointments',
      icon: CalendarCheck,
      badge: appointmentCount,
      description: 'Consultation scheduling'
    },
    {
      id: 'xml-lab',
      label: 'XML / XSD / XSLT Lab',
      icon: FileCode2,
      badge: 'Core Lab',
      badgeColor: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      description: 'Export, validate & transform'
    },
    {
      id: 'db-guide',
      label: 'Cloud Firestore & Data',
      icon: Database,
      badge: null,
      description: 'Security & sample seeder'
    },
    {
      id: 'docs',
      label: 'Project Documentation',
      icon: FileText,
      badge: 'Academic',
      badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      description: 'Report, tests & architecture'
    }
  ];

  const handleItemClick = (id: string) => {
    onNavigate(id);
    onCloseMobileMenu();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={onCloseMobileMenu}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed md:sticky top-16 z-40 h-[calc(100vh-4rem)] w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full md:shadow-none'
        }`}
      >
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="mb-4 px-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Hospital Modules
            </span>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/20'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-blue-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-600'
                      }`}
                    />
                    <div className="truncate">
                      <div className="truncate leading-snug">{item.label}</div>
                      <div
                        className={`text-[10px] truncate ${
                          isActive ? 'text-blue-100' : 'text-slate-400'
                        }`}
                      >
                        {item.description}
                      </div>
                    </div>
                  </div>

                  {item.badge !== null && (
                    <span
                      className={`ml-2 px-2 py-0.5 text-[11px] font-semibold rounded-md border shrink-0 ${
                        isActive
                          ? 'bg-blue-500 text-white border-blue-400'
                          : item.badgeColor || 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Hospital Badge footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Building className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <p className="font-semibold text-slate-800">Apex General Hospital</p>
              <p className="text-[11px] text-slate-500">Dept. of Web Technology</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
