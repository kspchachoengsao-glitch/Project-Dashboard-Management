import React, { useState, useEffect } from 'react';
import { User } from '../types';
import {
  LayoutDashboard,
  FolderKanban,
  Award,
  BarChart3,
  Users,
  Settings2,
  FileText,
  Lock,
  LogOut,
  Menu,
  X,
  Building2,
  ShieldAlert
} from 'lucide-react';

interface HeaderProps {
  currentUser: User | null; // null = Guest
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenLogin: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onOpenLogin,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [thaiDateTime, setThaiDateTime] = useState('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const thaiYear = now.getFullYear() + 543;
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      };
      const formatted = now.toLocaleDateString('th-TH', options);
      setThaiDateTime(`${formatted} (พ.ศ. ${thaiYear})`);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const isGuest = !currentUser;
  const isAdmin = currentUser?.role === 'admin';

  const navItems = [
    { id: 'dashboard', label: 'ภาพรวมระบบ', icon: LayoutDashboard },
    { id: 'projects', label: 'ติดตามโครงการ', icon: FolderKanban },
    { id: 'flagship', label: '7 โครงการสำคัญ', icon: Award },
    { id: 'analytics', label: 'วิเคราะห์ข้อมูล', icon: BarChart3 },
  ];

  // Admin specific nav items
  if (isAdmin) {
    navItems.push(
      { id: 'users', label: 'จัดการผู้ใช้งาน', icon: Users },
      { id: 'master-lists', label: 'ข้อมูลหลัก', icon: Settings2 },
      { id: 'audit-logs', label: 'Audit Log', icon: FileText }
    );
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Top Thai Government Banner */}
      <div className="bg-gradient-to-r from-amber-800 via-amber-900 to-amber-950 text-amber-50 text-xs px-4 py-1.5 flex justify-between items-center border-b border-amber-700/50">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-medium tracking-wide">
            ระบบรายงานผลการดำเนินงานตามแผนพัฒนาการศึกษาจังหวัดฉะเชิงเทรา
          </span>
        </div>
        <div className="hidden sm:flex items-center space-x-4 text-amber-200 text-xs">
          <span>📍 จังหวัดฉะเชิงเทรา</span>
          <span>📅 {thaiDateTime}</span>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        {/* Left: Agency Title */}
        <div className="flex items-center space-x-3.5">
          <div>
            <h1 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 leading-tight">
              สำนักงานศึกษาธิการจังหวัดฉะเชิงเทรา
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium flex items-center gap-1.5 mt-0.5">
              <Building2 className="w-3.5 h-3.5 text-amber-700 inline" />
              กระทรวงศึกษาธิการ • ระบบบรายงานผลการดำเนินงาน
            </p>
          </div>
        </div>

        {/* Right: Auth / Role Control */}
        <div className="hidden md:flex items-center space-x-3">
          {isGuest ? (
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                <ShieldAlert className="w-3.5 h-3.5 mr-1 text-slate-500" />
                สถานะ: ผู้เยี่ยมชม (Guest Read-Only)
              </span>
              <button
                onClick={onOpenLogin}
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-amber-700 hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-600 shadow-xs transition-all cursor-pointer"
              >
                <Lock className="w-4 h-4 mr-1.5" />
                🔐 เข้าสู่ระบบ (Login)
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3 bg-slate-50 p-1.5 pl-3 rounded-xl border border-slate-200">
              <div className="text-right">
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {currentUser.name}
                </div>
                <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                  {currentUser.agencyName}
                </div>
              </div>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                  isAdmin
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : 'bg-sky-100 text-sky-800 border border-sky-200'
                }`}
              >
                {isAdmin ? 'ADMIN (ผู้ดูแลระบบ)' : 'USER (หน่วยงาน)'}
              </span>
              <button
                onClick={onLogout}
                title="ออกจากระบบ"
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex md:hidden items-center space-x-2">
          {isGuest ? (
            <button
              onClick={onOpenLogin}
              className="inline-flex items-center px-2.5 py-1.5 text-xs font-semibold rounded-md text-white bg-amber-700 hover:bg-amber-800"
            >
              <Lock className="w-3.5 h-3.5 mr-1" />
              Login
            </button>
          ) : (
            <button
              onClick={onLogout}
              className="p-1.5 text-slate-600 hover:text-rose-600"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar - Desktop */}
      <nav className="hidden md:block bg-slate-900 border-t border-slate-800 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-amber-400 text-amber-300 bg-slate-800/80 font-semibold'
                    : 'border-transparent text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 mr-2 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 text-slate-100 border-t border-slate-800 px-4 pt-2 pb-4 space-y-1">
          {currentUser && (
            <div className="p-3 mb-2 bg-slate-800 rounded-lg text-xs border border-slate-700">
              <div className="font-bold text-amber-300">{currentUser.name}</div>
              <div className="text-slate-300 mt-0.5">{currentUser.agencyName}</div>
              <div className="text-amber-400 font-semibold mt-1">
                สิทธิ์: {isAdmin ? 'ผู้ดูแลระบบ (Admin)' : 'เจ้าหน้าที่หน่วยงาน (User)'}
              </div>
            </div>
          )}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-amber-600 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 mr-3 text-amber-400" />
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
