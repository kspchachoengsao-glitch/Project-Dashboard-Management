import React, { useState, useEffect } from 'react';
import { Project, User, Agency, StrategicIssue, KeyFlagshipProject, ProjectStatus } from '../types';
import { X, Save, AlertCircle, Building2, Target, Award, Calendar, Layers, FileText, CheckCircle2, DollarSign, UserCheck, Clock } from 'lucide-react';

interface ProjectFormModalProps {
  isOpen: boolean;
  projectToEdit: Project | null;
  currentUser: User;
  agencies: Agency[];
  strategicIssues: StrategicIssue[];
  keyProjects: KeyFlagshipProject[];
  onClose: () => void;
  onSave: (projectData: Partial<Project>) => void;
}

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  isOpen,
  projectToEdit,
  currentUser,
  agencies,
  strategicIssues,
  keyProjects,
  onClose,
  onSave,
}) => {
  const isEditing = !!projectToEdit;

  const [formData, setFormData] = useState<Partial<Project>>({
    code: '',
    name: '',
    agencyId: '',
    agencyName: '',
    strategicIssueId: '',
    strategicIssueTitle: '',
    keyFlagshipProjectId: '',
    keyFlagshipProjectTitle: '',
    goal: '',
    mainIndicator: '',
    quarter: 1,
    approvedBudget: 0,
    spentBudget: 0,
    progressPercentage: 0,
    status: 'not_started',
    fiscalYear: 2568,
    targetGroup: '',
    location: '',
    responsiblePerson: currentUser.name || '',
    contactPhone: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    objectives: '',
    quantitativeKPI: '',
    qualitativeKPI: '',
    outcomes: '',
    outputOutcome: '',
    issuesAndSolutions: '',
    createdByUserId: currentUser.id || 'usr-admin',
    createdByName: currentUser.name || '',
    createdAt: new Date().toISOString().split('T')[0],
  });

  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (projectToEdit) {
      setFormData({
        ...projectToEdit,
        goal: projectToEdit.goal || '',
        mainIndicator: projectToEdit.mainIndicator || '',
        objectives: projectToEdit.objectives || '',
        quantitativeKPI: projectToEdit.quantitativeKPI || '',
        qualitativeKPI: projectToEdit.qualitativeKPI || '',
        outcomes: projectToEdit.outcomes || projectToEdit.outputOutcome || '',
        createdByName: projectToEdit.createdByName || currentUser.name || '',
        createdAt: projectToEdit.createdAt ? projectToEdit.createdAt.substring(0, 10) : new Date().toISOString().split('T')[0],
      });
    } else {
      // Default auto code
      const autoCode = `PRJ-68-${Math.floor(100 + Math.random() * 900)}`;
      const defaultAgency = agencies.find(a => a.id === currentUser.agencyId) || agencies[0];
      const defaultStrat = strategicIssues[0];
      const defaultKeyProg = keyProjects[0];
      const todayStr = new Date().toISOString().split('T')[0];

      setFormData({
        code: autoCode,
        name: '',
        agencyId: defaultAgency?.id || '',
        agencyName: defaultAgency?.name || '',
        strategicIssueId: defaultStrat?.id || '',
        strategicIssueTitle: defaultStrat?.title || '',
        keyFlagshipProjectId: defaultKeyProg?.id || '',
        keyFlagshipProjectTitle: defaultKeyProg?.title || '',
        goal: '',
        mainIndicator: '',
        quarter: 1,
        approvedBudget: 500000,
        spentBudget: 0,
        progressPercentage: 0,
        status: 'not_started',
        fiscalYear: 2568,
        targetGroup: '',
        location: 'จังหวัดฉะเชิงเทรา',
        responsiblePerson: currentUser.name,
        contactPhone: '',
        startDate: '2026-01-01',
        endDate: '2026-03-31',
        objectives: '',
        quantitativeKPI: '',
        qualitativeKPI: '',
        outcomes: '',
        outputOutcome: '',
        issuesAndSolutions: '',
        createdByUserId: currentUser.id || 'usr-admin',
        createdByName: currentUser.name || 'เจ้าหน้าที่ผู้บันทึก',
        createdAt: todayStr,
      });
    }
    setErrorMsg('');
  }, [projectToEdit, isOpen, currentUser, agencies, strategicIssues, keyProjects]);

  if (!isOpen) return null;

  const handleAgencyChange = (agencyId: string) => {
    const ag = agencies.find(a => a.id === agencyId);
    setFormData(prev => ({
      ...prev,
      agencyId,
      agencyName: ag ? ag.name : ''
    }));
  };

  const handleStrategicChange = (stratId: string) => {
    const st = strategicIssues.find(s => s.id === stratId);
    setFormData(prev => ({
      ...prev,
      strategicIssueId: stratId,
      strategicIssueTitle: st ? st.title : ''
    }));
  };

  const handleKeyProjectChange = (keyProjectId: string) => {
    const kp = keyProjects.find(k => k.id === keyProjectId);
    setFormData(prev => ({
      ...prev,
      keyFlagshipProjectId: keyProjectId,
      keyFlagshipProjectTitle: kp ? kp.title : ''
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      setErrorMsg('กรุณากรอกชื่อโครงการ');
      return;
    }
    if (!formData.agencyId) {
      setErrorMsg('กรุณาเลือก 1. หน่วยงานที่รับผิดชอบ');
      return;
    }
    if (!formData.keyFlagshipProjectId) {
      setErrorMsg('กรุณาเลือก 3. โครงการสำคัญที่สอดคล้อง');
      return;
    }

    const outputMerged = formData.outcomes || formData.outputOutcome || '';

    onSave({
      ...formData,
      outputOutcome: outputMerged,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-800 via-amber-900 to-amber-950 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-700/60 rounded-xl border border-amber-500/30">
              <Building2 className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                {isEditing ? '✏️ แก้ไขข้อมูลโครงการ' : '➕ เพิ่มโครงการใหม่'}
              </h2>
              <p className="text-xs text-amber-200">
                ระบบบริหารและติดตามโครงการสำหรับหน่วยงานราชการและทางการศึกษา จังหวัดฉะเชิงเทรา
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-amber-200 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
          )}

          {/* Project Title & Code */}
          <div className="bg-amber-50/40 p-4 rounded-xl border border-amber-200/60 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-bold text-slate-800 mb-1">รหัสโครงการ</label>
                <input
                  type="text"
                  value={formData.code || ''}
                  onChange={e => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-amber-950 bg-white"
                  required
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block font-bold text-slate-800 mb-1">
                  ชื่อโครงการเต็ม <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="เช่น โครงการส่งเสริมทักษะอาชีพและนวัตกรรมเพื่อเยาวชนฉะเชิงเทรา..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-amber-500 bg-white text-slate-900"
                  required
                />
              </div>
            </div>
          </div>

          {/* Group A: 1. หน่วยงานที่รับผิดชอบ / 2. ประเด็นยุทธศาสตร์ / 3. โครงการสำคัญที่สอดคล้อง */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2 text-amber-900 border-b border-slate-200 pb-2">
              <Layers className="w-4 h-4 text-amber-700" />
              ส่วนที่ 1: การเชื่อมโยงยุทธศาสตร์และหน่วยงาน
            </h3>

            {/* 1. หน่วยงานที่รับผิดชอบ */}
            <div>
              <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-700" />
                1. หน่วยงานที่รับผิดชอบ <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.agencyId || ''}
                onChange={e => handleAgencyChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                required
              >
                <option value="">-- เลือกหน่วยงานที่รับผิดชอบ --</option>
                {agencies.map(ag => (
                  <option key={ag.id} value={ag.id}>{ag.name}</option>
                ))}
              </select>
            </div>

            {/* 2. ประเด็นยุทธศาสตร์ */}
            <div>
              <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-emerald-600" />
                2. ประเด็นยุทธศาสตร์
              </label>
              <select
                value={formData.strategicIssueId || ''}
                onChange={e => handleStrategicChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                required
              >
                {strategicIssues.map(si => (
                  <option key={si.id} value={si.id}>{si.title}</option>
                ))}
              </select>
            </div>

            {/* 3. โครงการสำคัญที่สอดคล้อง */}
            <div>
              <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-800" />
                3. โครงการสำคัญที่สอดคล้อง (Flagship Project) <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.keyFlagshipProjectId || ''}
                onChange={e => handleKeyProjectChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-amber-900"
                required
              >
                {keyProjects.map(kp => (
                  <option key={kp.id} value={kp.id}>{kp.number}. {kp.title}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Group B: 4. เป้าประสงค์ / 5. ตัวชี้วัด / 10. วัตถุประสงค์ / 11. ตัวชี้วัดเชิงปริมาณ / 12. ตัวชี้วัดเชิงคุณภาพ / 13. ผลลัพธ์ */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2 text-amber-900 border-b border-slate-200 pb-2">
              <FileText className="w-4 h-4 text-emerald-700" />
              ส่วนที่ 2: วัตถุประสงค์ เป้าประสงค์ ตัวชี้วัด และผลลัพธ์
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* 4. เป้าประสงค์ */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  4. เป้าประสงค์ (Goal)
                </label>
                <textarea
                  rows={2}
                  value={formData.goal || ''}
                  onChange={e => setFormData({ ...formData, goal: e.target.value })}
                  placeholder="ระบุเป้าประสงค์หลักของโครงการ..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              {/* 5. ตัวชี้วัด */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  5. ตัวชี้วัดโครงการ (KPI Indicator)
                </label>
                <textarea
                  rows={2}
                  value={formData.mainIndicator || ''}
                  onChange={e => setFormData({ ...formData, mainIndicator: e.target.value })}
                  placeholder="ระบุตัวชี้วัดความสำเร็จของโครงการ..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                />
              </div>
            </div>

            {/* 10. วัตถุประสงค์ของโครงการ */}
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                10. วัตถุประสงค์ของโครงการ
              </label>
              <textarea
                rows={2}
                value={formData.objectives || ''}
                onChange={e => setFormData({ ...formData, objectives: e.target.value })}
                placeholder="ข้อ 1. เพื่อ..., ข้อ 2. เพื่อ..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* 11. ตัวชี้วัดเชิงปริมาณ */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  11. ตัวชี้วัดเชิงปริมาณ (Quantitative KPI)
                </label>
                <textarea
                  rows={2}
                  value={formData.quantitativeKPI || ''}
                  onChange={e => setFormData({ ...formData, quantitativeKPI: e.target.value })}
                  placeholder="เช่น จำนวนผู้เข้ารับการอบรมไม่น้อยกว่า 500 คน..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              {/* 12. ตัวชี้วัดเชิงคุณภาพ */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  12. ตัวชี้วัดเชิงคุณภาพ (Qualitative KPI)
                </label>
                <textarea
                  rows={2}
                  value={formData.qualitativeKPI || ''}
                  onChange={e => setFormData({ ...formData, qualitativeKPI: e.target.value })}
                  placeholder="เช่น ร้อยละ 85 ของผู้เข้าร่วมนำความรู้ไปประยุกต์ใช้ได้จริง..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                />
              </div>
            </div>

            {/* 13. ผลลัพธ์ */}
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                13. ผลลัพธ์ (Outcomes / Expected Results)
              </label>
              <textarea
                rows={2}
                value={formData.outcomes || ''}
                onChange={e => setFormData({ ...formData, outcomes: e.target.value, outputOutcome: e.target.value })}
                placeholder="ระบุผลลัพธ์ที่เป็นรูปธรรมและคุณค่าที่เกิดขึ้น..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
              />
            </div>
          </div>

          {/* Group C: 6. งบประมาณ / 7. สถานะโครงการ / 8. วันเริ่มต้น / 9. วันสิ้นสุด */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2 text-amber-900 border-b border-slate-200 pb-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              ส่วนที่ 3: งบประมาณ ระยะเวลา และสถานะการดำเนินงาน
            </h3>

            {/* 6. งบประมาณ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-amber-50/60 p-3 rounded-xl border border-amber-200/80">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  6.1 งบประมาณที่ได้รับอนุมัติ (บาท)
                </label>
                <input
                  type="number"
                  min={0}
                  value={formData.approvedBudget || 0}
                  onChange={e => setFormData({ ...formData, approvedBudget: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  6.2 ยอดเงินเบิกจ่ายจริง (บาท)
                </label>
                <input
                  type="number"
                  min={0}
                  value={formData.spentBudget || 0}
                  onChange={e => setFormData({ ...formData, spentBudget: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono font-bold text-amber-900"
                />
              </div>
            </div>

            {/* 7. สถานะโครงการ & Progress % */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  7.1 สถานะโครงการ
                </label>
                <select
                  value={formData.status || 'not_started'}
                  onChange={e => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold"
                >
                  <option value="not_started">ยังไม่เริ่มดำเนินการ</option>
                  <option value="in_progress">อยู่ระหว่างดำเนินการ</option>
                  <option value="completed">ดำเนินการแล้วเสร็จ</option>
                  <option value="delayed">ล่าช้ากว่าแผน</option>
                  <option value="cancelled">ยกเลิก</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  7.2 ความก้าวหน้า (%): <span className="text-teal-700 font-extrabold">{formData.progressPercentage}%</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={formData.progressPercentage || 0}
                  onChange={e => setFormData({ ...formData, progressPercentage: Number(e.target.value) })}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600 mt-2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">ไตรมาส</label>
                <select
                  value={formData.quarter || 1}
                  onChange={e => setFormData({ ...formData, quarter: Number(e.target.value) as 1|2|3|4 })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  <option value={1}>ไตรมาส 1 (ต.ค. - ธ.ค.)</option>
                  <option value={2}>ไตรมาส 2 (ม.ค. - มี.ค.)</option>
                  <option value={3}>ไตรมาส 3 (เม.ย. - มิ.ย.)</option>
                  <option value={4}>ไตรมาส 4 (ก.ค. - ก.ย.)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">ปีงบประมาณ</label>
                <select
                  value={formData.fiscalYear || 2568}
                  onChange={e => setFormData({ ...formData, fiscalYear: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  <option value={2568}>2568</option>
                  <option value={2567}>2567</option>
                  <option value={2569}>2569</option>
                </select>
              </div>
            </div>

            {/* 8. วันเริ่มต้น & 9. วันสิ้นสุด */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-700" />
                  8. วันเริ่มต้นโครงการ
                </label>
                <input
                  type="date"
                  value={formData.startDate || ''}
                  onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-700" />
                  9. วันสิ้นสุดโครงการ
                </label>
                <input
                  type="date"
                  value={formData.endDate || ''}
                  onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                  required
                />
              </div>
            </div>
          </div>

          {/* Group D: 14. บันทึกโดย / 15. วันที่บันทึก & รายละเอียดการประสานงาน */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2 text-amber-900 border-b border-slate-200 pb-2">
              <UserCheck className="w-4 h-4 text-sky-700" />
              ส่วนที่ 4: ข้อมูลพื้นที่ ผู้รับผิดชอบ และผู้บันทึกข้อมูล
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-800 mb-1">กลุ่มเป้าหมาย / ผู้รับผลประโยชน์</label>
                <input
                  type="text"
                  value={formData.targetGroup || ''}
                  onChange={e => setFormData({ ...formData, targetGroup: e.target.value })}
                  placeholder="เช่น ครูและนักเรียน 500 คน..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-800 mb-1">พื้นที่ดำเนินการ</label>
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  placeholder="เช่น อำเภอเมืองฉะเชิงเทรา..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-800 mb-1">ผู้รับผิดชอบโครงการ</label>
                <input
                  type="text"
                  value={formData.responsiblePerson || ''}
                  onChange={e => setFormData({ ...formData, responsiblePerson: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium bg-white"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-800 mb-1">เบอร์โทรศัพท์ติดต่อ</label>
                <input
                  type="text"
                  value={formData.contactPhone || ''}
                  onChange={e => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="เช่น 038-511-xxx"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">ปัญหา/อุปสรรค และแนวทางแก้ไข</label>
              <textarea
                rows={2}
                value={formData.issuesAndSolutions || ''}
                onChange={e => setFormData({ ...formData, issuesAndSolutions: e.target.value })}
                placeholder="ระบุข้อจำกัดหรือปัญหาการดำเนินงาน (ถ้ามี)..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
              />
            </div>

            {/* 14. บันทึกโดย & 15. วันที่บันทึก */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-100 p-3 rounded-xl border border-slate-300/80">
              <div>
                <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-slate-600" />
                  14. บันทึกโดย <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.createdByName || ''}
                  onChange={e => setFormData({ ...formData, createdByName: e.target.value })}
                  placeholder="ชื่อ-นามสกุล ผู้บันทึกข้อมูล..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-600" />
                  15. วันที่บันทึก <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.createdAt || ''}
                  onChange={e => setFormData({ ...formData, createdAt: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-900"
                  required
                />
              </div>
            </div>
          </div>

          {/* Buttons Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              บันทึกข้อมูลโครงการ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

