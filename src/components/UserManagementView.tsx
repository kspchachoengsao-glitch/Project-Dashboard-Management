import React, { useState } from 'react';
import { User, Agency, Role } from '../types';
import { StorageService } from '../services/storage';
import { Users, UserPlus, Shield, CheckCircle2, XCircle, KeyRound, Trash2, Edit2, X, Save } from 'lucide-react';

interface UserManagementViewProps {
  currentUser: User;
  agencies: Agency[];
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({ currentUser, agencies }) => {
  const [users, setUsers] = useState<User[]>(StorageService.getUsers());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    agencyId: agencies[0]?.id || '',
    role: 'user' as Role,
    position: '',
  });

  const [message, setMessage] = useState('');

  const refreshUsers = () => {
    setUsers(StorageService.getUsers());
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      name: '',
      email: '',
      agencyId: agencies[0]?.id || '',
      role: 'user',
      position: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setFormData({
      username: u.username,
      name: u.name,
      email: u.email,
      agencyId: u.agencyId,
      role: u.role,
      position: u.position || '',
    });
    setIsModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    const currentUsers = StorageService.getUsers();
    const agencyObj = agencies.find(a => a.id === formData.agencyId);

    if (editingUser) {
      // Update existing user
      const updated = currentUsers.map(u => {
        if (u.id === editingUser.id) {
          return {
            ...u,
            name: formData.name,
            email: formData.email,
            agencyId: formData.agencyId,
            agencyName: agencyObj ? agencyObj.name : u.agencyName,
            role: formData.role,
            position: formData.position,
          };
        }
        return u;
      });
      StorageService.saveUsers(updated);

      StorageService.addAuditLog({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        agencyName: currentUser.agencyName,
        action: 'USER_UPDATE',
        details: `แก้ไขข้อมูลผู้ใช้งาน ${editingUser.username} (${formData.name})`,
        ipAddress: '127.0.0.1'
      });
    } else {
      // Add new user
      const newUser: User = {
        id: `usr-${Date.now()}`,
        username: formData.username.trim(),
        name: formData.name.trim(),
        email: formData.email.trim(),
        agencyId: formData.agencyId,
        agencyName: agencyObj ? agencyObj.name : '',
        role: formData.role,
        position: formData.position.trim(),
        enabled: true,
        lastLogin: 'ยังไม่เคยเข้าสู่ระบบ',
      };
      StorageService.saveUsers([...currentUsers, newUser]);

      StorageService.addAuditLog({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        agencyName: currentUser.agencyName,
        action: 'USER_CREATE',
        details: `สร้างผู้ใช้งานใหม่ ${newUser.username} (${newUser.name}) บทบาท ${newUser.role.toUpperCase()}`,
        ipAddress: '127.0.0.1'
      });
    }

    refreshUsers();
    setIsModalOpen(false);
  };

  const handleToggleEnabled = (u: User) => {
    const updated = users.map(user => {
      if (user.id === u.id) {
        return { ...user, enabled: !user.enabled };
      }
      return user;
    });
    StorageService.saveUsers(updated);

    StorageService.addAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      agencyName: currentUser.agencyName,
      action: 'USER_TOGGLE',
      details: `${!u.enabled ? 'เปิด' : 'ปิด'}การใช้งานบัญชีผู้ใช้ ${u.username}`,
      ipAddress: '127.0.0.1'
    });

    refreshUsers();
  };

  const handleResetPassword = (u: User) => {
    StorageService.addAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      agencyName: currentUser.agencyName,
      action: 'RESET_PASSWORD',
      details: `รีเซ็ตรหัสผ่านสำหรับผู้ใช้งาน ${u.username}`,
      ipAddress: '127.0.0.1'
    });

    setMessage(`รีเซ็ตรหัสผ่านของผู้ใช้งาน ${u.name} เรียบร้อยแล้ว (รหัสผ่านเริ่มต้น: 123456)`);
    setTimeout(() => setMessage(''), 4000);
  };

  const handleDeleteUser = (u: User) => {
    if (u.id === currentUser.id) {
      alert('ไม่สามารถลบบัญชีของตนเองที่กำลังใช้งานอยู่ได้');
      return;
    }

    if (confirm(`ยืนยันลบผู้ใช้งาน ${u.name} (${u.username}) ใช่หรือไม่?`)) {
      const updated = users.filter(user => user.id !== u.id);
      StorageService.saveUsers(updated);

      StorageService.addAuditLog({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        agencyName: currentUser.agencyName,
        action: 'USER_DELETE',
        details: `ลบผู้ใช้งาน ${u.username} (${u.name}) ออกจากระบบ`,
        ipAddress: '127.0.0.1'
      });

      refreshUsers();
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-900 via-rose-950 to-slate-900 text-white p-6 rounded-2xl shadow-md border border-rose-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold flex items-center gap-2">
            <Users className="w-6 h-6 text-rose-300" />
            ระบบจัดการผู้ใช้งาน (User Management)
          </h2>
          <p className="text-xs text-rose-200 mt-1">
            สิทธิ์เฉพาะ Admin: จัดการบัญชีผู้ใช้ กำหนดบทบาท RBAC และสถานะการเข้าใช้งาน
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-white text-rose-900 hover:bg-rose-50 font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4 text-rose-700" />
          เพิ่มผู้ใช้งานใหม่
        </button>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold animate-in fade-in">
          {message}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700 uppercase">
              <tr>
                <th className="px-4 py-3">ชื่อผู้ใช้ / อีเมล</th>
                <th className="px-4 py-3">ชื่อ-นามสกุล / ตำแหน่ง</th>
                <th className="px-4 py-3">หน่วยงาน</th>
                <th className="px-3 py-3 text-center">บทบาท (RBAC)</th>
                <th className="px-3 py-3 text-center">สถานะ</th>
                <th className="px-3 py-3 text-center">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono">
                    <strong className="text-slate-900 block">{u.username}</strong>
                    <span className="text-[11px] text-slate-400">{u.email}</span>
                  </td>

                  <td className="px-4 py-3">
                    <span className="font-bold text-slate-900 block">{u.name}</span>
                    <span className="text-[11px] text-slate-500">{u.position || '-'}</span>
                  </td>

                  <td className="px-4 py-3 text-slate-600 font-medium">
                    {u.agencyName}
                  </td>

                  <td className="px-3 py-3 text-center">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${
                        u.role === 'admin'
                          ? 'bg-rose-100 text-rose-800 border-rose-200'
                          : u.role === 'user'
                          ? 'bg-sky-100 text-sky-800 border-sky-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {u.role.toUpperCase()}
                    </span>
                  </td>

                  <td className="px-3 py-3 text-center">
                    <button
                      onClick={() => handleToggleEnabled(u)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer ${
                        u.enabled
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {u.enabled ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {u.enabled ? 'ใช้งาน' : 'ระงับ'}
                    </button>
                  </td>

                  <td className="px-3 py-3 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <button
                        onClick={() => handleOpenEdit(u)}
                        title="แก้ไขบทบาท/ข้อมูล"
                        className="p-1.5 rounded text-slate-500 hover:text-amber-800 hover:bg-amber-50"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleResetPassword(u)}
                        title="รีเซ็ตรหัสผ่าน"
                        className="p-1.5 rounded text-slate-500 hover:text-sky-600 hover:bg-sky-50"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u)}
                        title="ลบผู้ใช้งาน"
                        className="p-1.5 rounded text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add/Edit User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingUser ? '✏️ แก้ไขผู้ใช้งาน' : '➕ เพิ่มผู้ใช้งานใหม่'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-5 space-y-4 text-xs text-slate-700">
              {!editingUser && (
                <div>
                  <label className="block font-bold mb-1">ชื่อผู้ใช้งาน (Username)</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                    required
                    placeholder="เช่น officer_chachoengsao"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold mb-1">ชื่อ-นามสกุล</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">อีเมล</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">หน่วยงานสังกัด</label>
                <select
                  value={formData.agencyId}
                  onChange={e => setFormData({ ...formData, agencyId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  {agencies.map(ag => (
                    <option key={ag.id} value={ag.id}>{ag.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">บทบาท (RBAC Role)</label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value as Role })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold"
                  >
                    <option value="user">User (เจ้าหน้าที่)</option>
                    <option value="admin">Admin (ผู้ดูแลระบบ)</option>
                    <option value="guest">Guest (ดูได้อย่างเดียว)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">ตำแหน่ง</label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={e => setFormData({ ...formData, position: e.target.value })}
                    placeholder="เช่น นักวิเคราะห์นโยบาย..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
