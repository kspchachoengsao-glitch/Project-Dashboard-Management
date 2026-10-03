import React, { useState, useEffect } from 'react';
import { Agency, StrategicIssue, KeyFlagshipProject, User } from '../types';
import { StorageService, subscribeSyncStatus, SyncStatus } from '../services/storage';
import { Settings2, Building2, Target, Award, Plus, Edit2, Trash2, Save, X, Database, Cloud, Download, Upload, RefreshCw, AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'agencies' | 'strategies' | 'flagships' | 'database'>('agencies');
  const [syncStatus, setSyncStatus] = useState<{ status: SyncStatus; message: string }>({
    status: 'connected',
    message: 'เชื่อมต่อฐานข้อมูลคลาวด์เรียบร้อย',
  });
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const unsub = subscribeSyncStatus((status, message) => {
      setSyncStatus({ status, message });
    });
    return () => unsub();
  }, []);

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

  // Database Management Actions
  const handleClearTestProjects = async () => {
    if (!confirm('ยืนยันการล้างโครงการตัวอย่างและโครงการทดสอบทั้งหมดออกจากระบบคลาวด์? (โครงการจริงจะไม่ถูกลบ)')) return;
    setIsProcessing(true);
    setActionMessage(null);
    try {
      const res = await StorageService.clearTestProjects();
      await StorageService.addAuditLog({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        agencyName: currentUser.agencyName,
        action: 'MASTER_DATA_UPDATE',
        details: `ล้างโครงการทดสอบจำนวน ${res.removedCount} โครงการออกจากฐานข้อมูลคลาวด์ สำเร็จ คงเหลือโครงการจริง ${res.remainingCount} โครงการ`,
        ipAddress: '127.0.0.1',
      });
      onRefreshData();
      setActionMessage({ type: 'success', text: `ล้างโครงการทดสอบสำเร็จ (${res.removedCount} รายการ) ข้อมูลบนคลาวด์ได้รับการอัปเดตถาวรแล้ว` });
    } catch (e: any) {
      setActionMessage({ type: 'error', text: e.message || 'เกิดข้อผิดพลาดในการล้างข้อมูล' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearAllProjects = async () => {
    if (!confirm('⚠️ คำเตือน: คุณต้องการลบโครงการทั้งหมดในระบบให้เป็น 0 ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้')) return;
    setIsProcessing(true);
    setActionMessage(null);
    try {
      await StorageService.clearAllProjects();
      await StorageService.addAuditLog({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        agencyName: currentUser.agencyName,
        action: 'MASTER_DATA_UPDATE',
        details: 'ลบโครงการทั้งหมดในระบบเพื่อเริ่มต้นบันทึกข้อมูลจริง',
        ipAddress: '127.0.0.1',
      });
      onRefreshData();
      setActionMessage({ type: 'success', text: 'ลบโครงการทั้งหมดเรียบร้อยแล้ว ฐานข้อมูลว่างเปล่าพร้อมสำหรับการเริ่มบันทึกข้อมูลจริง' });
    } catch (e: any) {
      setActionMessage({ type: 'error', text: e.message || 'เกิดข้อผิดพลาด' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleForceSync = async () => {
    setIsProcessing(true);
    setActionMessage(null);
    try {
      const ok = await StorageService.forceSyncAll();
      if (ok) {
        setActionMessage({ type: 'success', text: 'ซิงค์ข้อมูลทั้งหมดขึ้นฐานข้อมูล Cloud Firestore สำเร็จแล้ว (บันทึกถาวร)' });
      } else {
        setActionMessage({ type: 'error', text: 'การซิงค์บางส่วนไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต' });
      }
    } catch (e: any) {
      setActionMessage({ type: 'error', text: e.message || 'เกิดข้อผิดพลาดในการซิงค์' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportJSON = () => {
    const jsonStr = StorageService.exportAllDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project_dashboard_backup_${new Date().toISOString().substring(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setActionMessage({ type: 'success', text: 'ส่งออกไฟล์สำรองข้อมูล JSON สำเร็จ' });
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      setIsProcessing(true);
      setActionMessage(null);
      try {
        const result = await StorageService.importAllDataJSON(reader.result as string);
        if (result.success) {
          onRefreshData();
          setActionMessage({ type: 'success', text: result.message });
        } else {
          setActionMessage({ type: 'error', text: result.message });
        }
      } catch (err: any) {
        setActionMessage({ type: 'error', text: err.message || 'นำเข้าข้อมูลไม่สำเร็จ' });
      } finally {
        setIsProcessing(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
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

        <button
          onClick={() => setActiveTab('database')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeTab === 'database' ? 'bg-amber-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Database className="w-4 h-4" />
          จัดการฐานข้อมูล & ซิงค์คลาวด์
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

        {/* Database Management Tab */}
        {activeTab === 'database' && (
          <div className="space-y-6">
            {/* Status Alert Banner */}
            {actionMessage && (
              <div
                className={`p-4 rounded-xl flex items-center justify-between text-xs font-semibold ${
                  actionMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  {actionMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{actionMessage.text}</span>
                </div>
                <button
                  onClick={() => setActionMessage(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Cloud Firestore Status Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-100 text-amber-800 rounded-xl">
                    <Cloud className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      สถานะการจัดเก็บบน Cloud Firestore
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5"></span>
                        เชื่อมต่อคลาวด์ถาวร
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      ข้อมูลจะถูกบันทึกและซิงค์แบบเรียลไทม์ข้ามทุกอุปกรณ์ ปิดเครื่องหรือเปิดวันต่อมาข้อมูลไม่สูญหาย
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleForceSync}
                  disabled={isProcessing}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                  บังคับซิงค์คลาวด์เดี๋ยวนี้
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 text-xs">
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block">จำนวนโครงการทั้งหมด</span>
                  <strong className="text-base font-extrabold text-slate-900">
                    {StorageService.getProjects().length} โครงการ
                  </strong>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block">จำนวนหน่วยงาน</span>
                  <strong className="text-base font-extrabold text-slate-900">
                    {agencies.length} หน่วยงาน
                  </strong>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block">สถานะการบันทึก</span>
                  <strong className="text-base font-extrabold text-emerald-700 flex items-center gap-1 mt-0.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> บันทึกถาวร (Persistent)
                  </strong>
                </div>
              </div>
            </div>

            {/* Test Data Cleaning Section */}
            <div className="border border-amber-200 bg-amber-50/50 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h4>จัดการข้อมูลทดสอบ / โครงการตัวอย่าง (Clean Demo Data)</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                เมื่อนำโปรแกรมไปใช้งานจริงในหน่วยงาน สามารถลบโครงการตัวอย่างและโครงการทดสอบระบบ (รหัส PRJ-68-001 ถึง 007 และโครงการทดสอบ) เพื่อให้ฐานข้อมูลสะอาดพร้อมสำหรับการบันทึกโครงการจริงของแต่ละหน่วยงาน
              </p>
              <div className="flex flex-wrap gap-2.5 pt-2">
                <button
                  onClick={handleClearTestProjects}
                  disabled={isProcessing}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  ล้างเฉพาะโครงการทดสอบ/ตัวอย่าง (คงโครงการจริงไว้)
                </button>
                <button
                  onClick={handleClearAllProjects}
                  disabled={isProcessing}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-xs shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4 text-rose-500" />
                  ล้างโครงการทั้งหมดเป็น 0 (เริ่มกรอกข้อมูลใหม่ทั้งหมด)
                </button>
              </div>
            </div>

            {/* Backup & Restore Section */}
            <div className="border border-slate-200 bg-slate-50/70 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Database className="w-5 h-5 text-slate-600" />
                <h4>สำรองข้อมูลและกู้คืน (Backup & Restore JSON)</h4>
              </div>
              <p className="text-xs text-slate-500">
                ส่งออกข้อมูลทั้งหมด (โครงการ, หน่วยงาน, ยุทธศาสตร์, ผู้ใช้งาน) เก็บไว้เป็นไฟล์ JSON เพื่อความปลอดภัย หรือนำเข้าข้อมูลที่เคยสำรองไว้
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleExportJSON}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  <Download className="w-4 h-4 text-amber-300" />
                  ดาวน์โหลดไฟล์สำรองข้อมูล (Export JSON)
                </button>

                <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs shadow-2xs cursor-pointer">
                  <Upload className="w-4 h-4 text-slate-500" />
                  กู้คืนข้อมูลจากไฟล์ (Import JSON)
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportJSON}
                    className="hidden"
                  />
                </label>
              </div>
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
