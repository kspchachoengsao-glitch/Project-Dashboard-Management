import React, { useState } from 'react';
import { Agency, StrategicIssue, KeyFlagshipProject, User } from '../types';
import { StorageService } from '../services/storage';
import { Settings2, Building2, Target, Award, Plus, Edit2, Trash2, Save, X } from 'lucide-react';

interface MasterListsViewProps {
  currentUser: User;
  agencies: Agency[];
  strategicIssues: StrategicIssue[];
  keyProjects: KeyFlagshipProject[];
  onRefreshData: () => void;
}

export const MasterListsView: React.FC<MasterListsViewProps> = ({
  currentUser,
  agencies,
  strategicIssues,
  keyProjects,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'agencies' | 'strategies' | 'flagships'>('agencies');

  // Edit / Add modal state
  const [modalType, setModalType] = useState<'agency' | 'strategy' | 'flagship' | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [itemTitle, setItemTitle] = useState('');
  const [itemCodeOrDesc, setItemCodeOrDesc] = useState('');

  const handleOpenAdd = (type: 'agency' | 'strategy' | 'flagship') => {
    setModalType(type);
    setEditingItem(null);
    setItemTitle('');
    setItemCodeOrDesc('');
  };

  const handleOpenEdit = (type: 'agency' | 'strategy' | 'flagship', item: any) => {
    setModalType(type);
    setEditingItem(item);
    setItemTitle(item.name || item.title);
    setItemCodeOrDesc(item.shortName || item.description || '');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemTitle.trim()) return;

    if (modalType === 'agency') {
      const current = StorageService.getAgencies();
      if (editingItem) {
        const updated = current.map(ag => ag.id === editingItem.id ? { ...ag, name: itemTitle, shortName: itemCodeOrDesc } : ag);
        StorageService.saveAgencies(updated);
      } else {
        const newAg: Agency = {
          id: `ag-${Date.now()}`,
          code: `AG-${current.length + 1}`,
          name: itemTitle.trim(),
          shortName: itemCodeOrDesc.trim() || itemTitle.trim(),
          order: current.length + 1,
          enabled: true,
        };
        StorageService.saveAgencies([...current, newAg]);
      }
    } else if (modalType === 'strategy') {
      const current = StorageService.getStrategicIssues();
      if (editingItem) {
        const updated = current.map(st => st.id === editingItem.id ? { ...st, title: itemTitle, description: itemCodeOrDesc } : st);
        StorageService.saveStrategicIssues(updated);
      } else {
        const newSt: StrategicIssue = {
          id: `strat-${Date.now()}`,
          number: current.length + 1,
          title: itemTitle.trim(),
          description: itemCodeOrDesc.trim(),
          enabled: true,
        };
        StorageService.saveStrategicIssues([...current, newSt]);
      }
    } else if (modalType === 'flagship') {
      const current = StorageService.getKeyProjects();
      if (editingItem) {
        const updated = current.map(kp => kp.id === editingItem.id ? { ...kp, title: itemTitle, description: itemCodeOrDesc } : kp);
        StorageService.saveKeyProjects(updated);
      } else {
        const newKp: KeyFlagshipProject = {
          id: `flag-${Date.now()}`,
          number: current.length + 1,
          title: itemTitle.trim(),
          description: itemCodeOrDesc.trim(),
          enabled: true,
        };
        StorageService.saveKeyProjects([...current, newKp]);
      }
    }

    StorageService.addAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      agencyName: currentUser.agencyName,
      action: 'MASTER_DATA_UPDATE',
      details: `อัปเดตข้อมูลหลักหมวด ${modalType?.toUpperCase()}: ${itemTitle}`,
      ipAddress: '127.0.0.1'
    });

    onRefreshData();
    setModalType(null);
  };

  const handleDelete = (type: 'agency' | 'strategy' | 'flagship', id: string, name: string) => {
    if (!confirm(`ยืนยันลบรายการ "${name}" ใช่หรือไม่?`)) return;

    if (type === 'agency') {
      const updated = StorageService.getAgencies().filter(ag => ag.id !== id);
      StorageService.saveAgencies(updated);
    } else if (type === 'strategy') {
      const updated = StorageService.getStrategicIssues().filter(st => st.id !== id);
      StorageService.saveStrategicIssues(updated);
    } else if (type === 'flagship') {
      const updated = StorageService.getKeyProjects().filter(kp => kp.id !== id);
      StorageService.saveKeyProjects(updated);
    }

    onRefreshData();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white p-6 rounded-2xl shadow-md border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold flex items-center gap-2">
            <Settings2 className="w-6 h-6 text-amber-400" />
            จัดการข้อมูลหลักระบบ (Master Lists Config)
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            เพิ่ม ลด แก้ไข รายชื่อ 14 หน่วยงาน, 6 ประเด็นยุทธศาสตร์ และ 7 กลุ่มโครงการสำคัญ
          </p>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-200 gap-2 bg-white p-2 rounded-2xl shadow-xs">
        <button
          onClick={() => setActiveTab('agencies')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeTab === 'agencies' ? 'bg-amber-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          หน่วยงาน (14 แห่ง)
        </button>

        <button
          onClick={() => setActiveTab('strategies')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeTab === 'strategies' ? 'bg-amber-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Target className="w-4 h-4" />
          ประเด็นยุทธศาสตร์ (6 ประเด็น)
        </button>

        <button
          onClick={() => setActiveTab('flagships')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeTab === 'flagships' ? 'bg-amber-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Award className="w-4 h-4" />
          โครงการสำคัญ (7 กลุ่ม)
        </button>
      </div>

      {/* Content per Tab */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        {/* Agencies Tab */}
        {activeTab === 'agencies' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900">รายชื่อ 14 หน่วยงานทางการศึกษาในจังหวัดฉะเชิงเทรา</h3>
              <button
                onClick={() => handleOpenAdd('agency')}
                className="px-3 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> เพิ่มหน่วยงาน
              </button>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {agencies.map((ag, idx) => (
                <div key={ag.id} className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-amber-900 w-6 text-center">{idx + 1}.</span>
                    <div>
                      <span className="font-bold text-slate-900 block">{ag.name}</span>
                      <span className="text-[11px] text-slate-400">ชื่อย่อ: {ag.shortName}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEdit('agency', ag)}
                      className="p-1.5 rounded text-slate-500 hover:text-amber-800 hover:bg-amber-50"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete('agency', ag.id, ag.name)}
                      className="p-1.5 rounded text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strategic Issues Tab */}
        {activeTab === 'strategies' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900">6 ประเด็นยุทธศาสตร์หลัก</h3>
              <button
                onClick={() => handleOpenAdd('strategy')}
                className="px-3 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> เพิ่มยุทธศาสตร์
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {strategicIssues.map((si, idx) => (
                <div key={si.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between gap-3">
                  <div>
                    <span className="font-bold text-amber-900 block">
                      ประเด็นยุทธศาสตร์ที่ {idx + 1}
                    </span>
                    <h4 className="font-bold text-slate-900 mt-0.5">{si.title}</h4>
                    {si.description && <p className="text-[11px] text-slate-500 mt-1">{si.description}</p>}
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => handleOpenEdit('strategy', si)}
                      className="p-1.5 rounded text-slate-500 hover:text-amber-800 hover:bg-white"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete('strategy', si.id, si.title)}
                      className="p-1.5 rounded text-slate-500 hover:text-rose-600 hover:bg-white"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Flagships Tab */}
        {activeTab === 'flagships' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900">7 กลุ่มโครงการสำคัญ</h3>
              <button
                onClick={() => handleOpenAdd('flagship')}
                className="px-3 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> เพิ่มโครงการสำคัญ
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {keyProjects.map((kp, idx) => (
                <div key={kp.id} className="p-3 bg-amber-50/50 rounded-xl border border-amber-200 flex items-start justify-between gap-3">
                  <div>
                    <span className="font-bold text-amber-900 block">
                      กลุ่มโครงการสำคัญที่ {idx + 1}
                    </span>
                    <h4 className="font-bold text-slate-900 mt-0.5">{kp.title}</h4>
                    {kp.description && <p className="text-[11px] text-slate-600 mt-1">{kp.description}</p>}
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => handleOpenEdit('flagship', kp)}
                      className="p-1.5 rounded text-slate-500 hover:text-amber-800 hover:bg-white"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete('flagship', kp.id, kp.title)}
                      className="p-1.5 rounded text-slate-500 hover:text-rose-600 hover:bg-white"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit/Add Modal */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-sm text-slate-900">
                {editingItem ? '✏️ แก้ไขรายการ' : '➕ เพิ่มรายการใหม่'}
              </h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">ชื่อรายการ / หัวข้อ</label>
                <input
                  type="text"
                  value={itemTitle}
                  onChange={e => setItemTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">
                  {modalType === 'agency' ? 'ชื่อย่อหน่วยงาน' : 'คำอธิบายเพิ่มเติม'}
                </label>
                <input
                  type="text"
                  value={itemCodeOrDesc}
                  onChange={e => setItemCodeOrDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2 border-t">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
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
