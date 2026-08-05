import React, { useState } from 'react';
import { User } from '../types';
import { StorageService } from '../services/storage';
import { Lock, ShieldCheck, UserCheck, ShieldAlert, X, Eye, EyeOff, KeyRound } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const allUsers = StorageService.getUsers();
    const found = allUsers.find(
      u => u.username.toLowerCase() === username.trim().toLowerCase()
    );

    if (!found) {
      setErrorMsg('ไม่พบชื่อผู้ใช้นี้ในระบบ');
      return;
    }

    if (!found.enabled) {
      setErrorMsg('บัญชีผู้ใช้นี้ถูกปิดการใช้งาน กรุณาติดต่อผู้ดูแลระบบ');
      return;
    }

    // Record login audit log
    StorageService.addAuditLog({
      userId: found.id,
      userName: found.name,
      userRole: found.role,
      agencyName: found.agencyName,
      action: 'LOGIN',
      details: `เข้าสู่ระบบสำเร็จในบทบาท ${found.role.toUpperCase()}`,
      ipAddress: '127.0.0.1'
    });

    onLoginSuccess(found);
    onClose();
  };

  const handleQuickRoleLogin = (role: 'admin' | 'officer1' | 'officer2') => {
    const allUsers = StorageService.getUsers();
    let targetUsername = 'admin';
    if (role === 'officer1') targetUsername = 'officer_spao1';
    if (role === 'officer2') targetUsername = 'officer_vec';

    const found = allUsers.find(u => u.username === targetUsername) || allUsers[0];

    StorageService.addAuditLog({
      userId: found.id,
      userName: found.name,
      userRole: found.role,
      agencyName: found.agencyName,
      action: 'LOGIN',
      details: `เข้าสู่ระบบด่วน (Quick Demo Login) ในบทบาท ${found.role.toUpperCase()}`,
      ipAddress: '127.0.0.1'
    });

    onLoginSuccess(found);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-800 via-amber-900 to-amber-950 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-amber-200 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-700/60 rounded-xl border border-amber-500/30">
              <Lock className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold">เข้าสู่ระบบ (System Authentication)</h2>
              <p className="text-xs text-amber-200 mt-0.5">
                สำนักงานศึกษาธิการจังหวัดฉะเชิงเทรา • ระบบบริหารและติดตามโครงการ
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Quick Demo Login Preset Buttons */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              ⚡ เลือกเข้าสู่ระบบด่วนเพื่อทดสอบสิทธิ์ (Quick Demo Access)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickRoleLogin('admin')}
                className="p-3 text-left rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100/80 transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-900">1. Admin (ผู้ดูแลระบบ)</span>
                  <ShieldCheck className="w-4 h-4 text-rose-600" />
                </div>
                <p className="text-[11px] text-rose-700 mt-1">สิทธิ์สูงสุด: แก้ไข/ลบ ได้ทุกโครงการ, จัดการผู้ใช้, Master Lists, Audit Log</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickRoleLogin('officer1')}
                className="p-3 text-left rounded-xl border border-sky-200 bg-sky-50/70 hover:bg-sky-100/80 transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-900">2. User (สพป.1)</span>
                  <UserCheck className="w-4 h-4 text-sky-600" />
                </div>
                <p className="text-[11px] text-sky-700 mt-1">เพิ่มโครงการ, แก้ไข/ลบโครงการตนเอง, ส่งออก Excel/CSV/PDF</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickRoleLogin('officer2')}
                className="p-3 text-left rounded-xl border border-amber-200 bg-amber-50/70 hover:bg-amber-100/80 transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900">3. User (อาชีวศึกษา)</span>
                  <UserCheck className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-[11px] text-amber-800 mt-1">ทดสอบจัดการโครงการต่างหน่วยงาน (เพื่อทดสอบ RBAC)</p>
              </button>
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-xs font-semibold text-slate-400">หรือ กรอกชื่อผู้ใช้และรหัสผ่าน</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleCustomLogin} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ชื่อผู้ใช้งาน (Username)
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="เช่น admin, officer_spao1"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                รหัสผ่าน (Password)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium cursor-pointer"
              >
                เข้าใช้งานแบบ Guest (ดูอย่างเดียว)
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                เข้าสู่ระบบ
              </button>
            </div>
          </form>

          {/* RBAC Rules Info */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
            <p className="font-bold text-slate-800">📌 สรุปสิทธิ์ตามบทบาทการเข้าถึง (RBAC):</p>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600">
              <li><strong className="text-slate-700">Guest:</strong> ดู Dashboard, รายละเอียดโครงการ, ค้นหา, กรองข้อมูล, Export PDF (ห้ามเพิ่ม/แก้ไข/ลบ)</li>
              <li><strong className="text-sky-700">User:</strong> สิทธิ์ Guest + เพิ่มโครงการ + แก้ไข/ลบโครงการเฉพาะของหน่วยงานตนเอง + Export Excel/CSV</li>
              <li><strong className="text-rose-700">Admin:</strong> สิทธิ์เต็ม + แก้ไข/ลบได้ทุกโครงการ + จัดการผู้ใช้ + จัดการ Master Lists + ดู Audit Log</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
