import React, { useState, useEffect } from 'react';
import { Project, User, Agency, StrategicIssue, KeyFlagshipProject, ProjectStatus, ProjectPdfFile, ProjectPhoto } from '../types';
import { StorageService } from '../services/storage';
import { X, Save, AlertCircle, Building2, Target, Award, Calendar, Layers, FileText, CheckCircle2, DollarSign, UserCheck, Clock, FileUp, ImagePlus, Trash2, Eye, Loader2, ShieldCheck } from 'lucide-react';
import { validateAndProcessPdf, processPhotoWithThumbnail, formatFileSize, MAX_PDF_SIZE_BYTES } from '../utils/fileProcessingUtils';

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
    objectives: '',
    goal: '',
    quantitativeKPI: '',
    qualitativeKPI: '',
    projectPerformance: '',
    kpiResultQuantitative: '',
    kpiResultQualitative: '',
    targetAchievement: '',
    mainIndicator: '',
    quarter: 1,
    approvedBudget: 0,
    spentBudget: 0,
    progressPercentage: 0,
    status: 'not_started',
    fiscalYear: new Date().getFullYear() + 543,
    targetGroup: '',
    location: '',
    responsiblePerson: currentUser.name || '',
    contactPhone: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    outcomes: '',
    outputOutcome: '',
    issuesAndSolutions: '',
    createdByUserId: currentUser.id || 'usr-admin',
    createdByName: currentUser.name || '',
    createdAt: new Date().toISOString().split('T')[0],
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [isProcessingPhotos, setIsProcessingPhotos] = useState(false);

  // Dynamic available fiscal years strictly from existing projects + current Buddhist year
  const currentBuddhistYear = new Date().getFullYear() + 543;
  const suggestedFiscalYears = React.useMemo(() => {
    const existingYears = StorageService.getProjects()
      .map(p => Number(p.fiscalYear))
      .filter(n => !isNaN(n) && n > 0);
    const setYears = new Set<number>(existingYears);
    if (setYears.size === 0) {
      setYears.add(currentBuddhistYear);
    }
    return Array.from(setYears).sort((a, b) => b - a);
  }, [isOpen, currentBuddhistYear]);

  useEffect(() => {
    if (projectToEdit) {
      setFormData({
        ...projectToEdit,
        objectives: projectToEdit.objectives || '',
        goal: projectToEdit.goal || '',
        quantitativeKPI: projectToEdit.quantitativeKPI || '',
        qualitativeKPI: projectToEdit.qualitativeKPI || '',
        projectPerformance: projectToEdit.projectPerformance || projectToEdit.outputOutcome || projectToEdit.outcomes || '',
        kpiResultQuantitative: projectToEdit.kpiResultQuantitative || '',
        kpiResultQualitative: projectToEdit.kpiResultQualitative || '',
        targetAchievement: projectToEdit.targetAchievement || '',
        mainIndicator: projectToEdit.mainIndicator || '',
        targetGroup: projectToEdit.targetGroup || '',
        outcomes: projectToEdit.outcomes || projectToEdit.outputOutcome || '',
        pdfFile: projectToEdit.pdfFile,
        photos: projectToEdit.photos || [],
        createdByName: projectToEdit.createdByName || currentUser.name || '',
        createdAt: projectToEdit.createdAt ? projectToEdit.createdAt.substring(0, 10) : new Date().toISOString().split('T')[0],
      });
    } else {
      // Default auto code based on selected/current fiscal year
      const defaultFiscalYear = suggestedFiscalYears[0] || currentBuddhistYear;
      const shortYear = String(defaultFiscalYear).slice(-2);
      const autoCode = `PRJ-${shortYear}-${Math.floor(100 + Math.random() * 900)}`;
      const defaultAgency = agencies.find(a => a.id === currentUser.agencyId) || agencies[0];
      const defaultStrat = strategicIssues[0];
      const defaultKeyProg = keyProjects[0];
      const todayStr = new Date().toISOString().split('T')[0];
      const adYear = defaultFiscalYear - 543;

      setFormData({
        code: autoCode,
        name: '',
        agencyId: defaultAgency?.id || '',
        agencyName: defaultAgency?.name || '',
        strategicIssueId: defaultStrat?.id || '',
        strategicIssueTitle: defaultStrat?.title || '',
        keyFlagshipProjectId: defaultKeyProg?.id || '',
        keyFlagshipProjectTitle: defaultKeyProg?.title || '',
        objectives: '',
        goal: '',
        quantitativeKPI: '',
        qualitativeKPI: '',
        projectPerformance: '',
        kpiResultQuantitative: '',
        kpiResultQualitative: '',
        targetAchievement: '',
        mainIndicator: '',
        quarter: 1,
        approvedBudget: 500000,
        spentBudget: 0,
        progressPercentage: 0,
        status: 'not_started',
        fiscalYear: defaultFiscalYear,
        targetGroup: '',
        location: 'จังหวัดฉะเชิงเทรา',
        responsiblePerson: currentUser.name,
        contactPhone: '',
        startDate: `${adYear}-01-01`,
        endDate: `${adYear}-03-31`,
        outcomes: '',
        outputOutcome: '',
        issuesAndSolutions: '',
        pdfFile: undefined,
        photos: [],
        createdByUserId: currentUser.id || 'usr-admin',
        createdByName: currentUser.name || 'เจ้าหน้าที่ผู้บันทึก',
        createdAt: todayStr,
      });
    }
    setErrorMsg('');
  }, [projectToEdit, isOpen, currentUser, agencies, strategicIssues, keyProjects, suggestedFiscalYears, currentBuddhistYear]);

  if (!isOpen) return null;

  // Handle PDF file selection & validation
  const handlePdfChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    setIsProcessingPdf(true);

    try {
      const processedPdf = await validateAndProcessPdf(file);
      setFormData(prev => ({ ...prev, pdfFile: processedPdf }));
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์ PDF');
    } finally {
      setIsProcessingPdf(false);
      e.target.value = ''; // reset file input
    }
  };

  const handleRemovePdf = () => {
    setFormData(prev => ({ ...prev, pdfFile: undefined }));
  };

  // Handle Photos selection (Max 4 photos, auto webp compression & thumbnail generation)
  const handlePhotosChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    const currentPhotos = formData.photos || [];
    const remainingSlots = 4 - currentPhotos.length;

    if (remainingSlots <= 0) {
      setErrorMsg('โครงการนี้มีรูปถ่ายครบ 4 รูปแล้ว (ไม่สามารถเพิ่มเกิน 4 รูปได้)');
      return;
    }

    const filesToProcess = selectedFiles.slice(0, remainingSlots);
    if (selectedFiles.length > remainingSlots) {
      setErrorMsg(`สามารถเลือกเพิ่มได้อีกเพียง ${remainingSlots} รูปเท่านั้น (ถูกคัดเลือกเฉพาะ ${remainingSlots} รูปแรก)`);
    } else {
      setErrorMsg('');
    }

    setIsProcessingPhotos(true);

    try {
      const newPhotoPromises = filesToProcess.map(file => processPhotoWithThumbnail(file as File));
      const processedPhotos = await Promise.all(newPhotoPromises);

      setFormData(prev => ({
        ...prev,
        photos: [...(prev.photos || []), ...processedPhotos],
      }));
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการประมวลผลรูปภาพ');
    } finally {
      setIsProcessingPhotos(false);
      e.target.value = ''; // reset file input
    }
  };

  const handleRemovePhoto = (photoId: string) => {
    setFormData(prev => ({
      ...prev,
      photos: (prev.photos || []).filter(p => p.id !== photoId),
    }));
  };

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

    const outputMerged = formData.projectPerformance || formData.outcomes || formData.outputOutcome || '';

    onSave({
      ...formData,
      projectPerformance: outputMerged,
      outputOutcome: outputMerged,
      outcomes: outputMerged,
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

          {/* ส่วนที่ 2: วัตถุประสงค์ เป้าหมาย ตัวชี้วัด และผลการดำเนินงาน */}
          <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2 text-amber-900 border-b border-slate-200 pb-2">
              <FileText className="w-4 h-4 text-emerald-700" />
              ส่วนที่ 2: วัตถุประสงค์ เป้าหมาย ตัวชี้วัด และผลการดำเนินงาน
            </h3>

            {/* 4. วัตถุประสงค์ของโครงการ */}
            <div>
              <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-amber-700" />
                4. วัตถุประสงค์ของโครงการ
              </label>
              <textarea
                rows={2}
                value={formData.objectives || ''}
                onChange={e => setFormData({ ...formData, objectives: e.target.value })}
                placeholder="ระบุวัตถุประสงค์ของโครงการ เช่น 1. เพื่อ..., 2. เพื่อ..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
              />
            </div>

            {/* 5. เป้าหมายโครงการ (Goal) */}
            <div>
              <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-700" />
                5. เป้าหมายโครงการ (Goal)
              </label>
              <textarea
                rows={2}
                value={formData.goal || ''}
                onChange={e => setFormData({ ...formData, goal: e.target.value })}
                placeholder="ระบุเป้าหมายโครงการ (Goal) หรือความคาดหวังหลัก..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
              />
            </div>

            {/* 6. ตัวชี้วัดโครงการ (KPI Indicator) ข้อย่อย 6.1 เชิงปริมาณ และ 6.2 เชิงคุณภาพ */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 text-slate-900">
                <CheckCircle2 className="w-4 h-4 text-sky-600" />
                6. ตัวชี้วัดโครงการ (KPI Indicator)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 6.1 เชิงปริมาณ */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 text-xs">
                    6.1 เชิงปริมาณ (Quantitative KPI)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.quantitativeKPI || ''}
                    onChange={e => setFormData({ ...formData, quantitativeKPI: e.target.value })}
                    placeholder="เช่น จำนวนผู้เข้ารับการอบรมไม่น้อยกว่า 500 คน..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50/60 focus:bg-white text-xs"
                  />
                </div>
                {/* 6.2 เชิงคุณภาพ */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 text-xs">
                    6.2 เชิงคุณภาพ (Qualitative KPI)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.qualitativeKPI || ''}
                    onChange={e => setFormData({ ...formData, qualitativeKPI: e.target.value })}
                    placeholder="เช่น ร้อยละ 85 ของผู้เข้าร่วมนำความรู้ไปประยุกต์ใช้ได้จริง..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50/60 focus:bg-white text-xs"
                  />
                </div>
              </div>
            </div>

            {/* 7. ผลการดำเนินงานโครงการ/กิจกรรม */}
            <div>
              <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-teal-700" />
                7. ผลการดำเนินงานโครงการ/กิจกรรม
              </label>
              <textarea
                rows={2}
                value={formData.projectPerformance || formData.outputOutcome || formData.outcomes || ''}
                onChange={e => setFormData({
                  ...formData,
                  projectPerformance: e.target.value,
                  outputOutcome: e.target.value,
                  outcomes: e.target.value
                })}
                placeholder="ระบุผลการดำเนินงาน กิจกรรมที่ได้จัดขึ้น การมีส่วนร่วม และความคืบหน้าที่เกิดขึ้นจริง..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
              />
            </div>

            {/* 8. ผลการดำเนินงานตามตัวชี้วัด ข้อย่อย 8.1 เชิงปริมาณ 8.2 เชิงคุณภาพ */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 text-slate-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                8. ผลการดำเนินงานตามตัวชี้วัด
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 8.1 เชิงปริมาณ */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 text-xs">
                    8.1 เชิงปริมาณ
                  </label>
                  <textarea
                    rows={2}
                    value={formData.kpiResultQuantitative || ''}
                    onChange={e => setFormData({ ...formData, kpiResultQuantitative: e.target.value })}
                    placeholder="เช่น มีผู้เข้าร่วมจริง 520 คน (คิดเป็น 104% ของเป้าหมาย)..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50/60 focus:bg-white text-xs"
                  />
                </div>
                {/* 8.2 เชิงคุณภาพ */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 text-xs">
                    8.2 เชิงคุณภาพ
                  </label>
                  <textarea
                    rows={2}
                    value={formData.kpiResultQualitative || ''}
                    onChange={e => setFormData({ ...formData, kpiResultQualitative: e.target.value })}
                    placeholder="เช่น ผลการประเมินความพึงพอใจอยู่ในระดับดีมาก ร้อยละ 91.5..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50/60 focus:bg-white text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Group C: 9. งบประมาณ / 10. สถานะโครงการ / 11. วันเริ่มต้น / 12. วันสิ้นสุด */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2 text-amber-900 border-b border-slate-200 pb-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              ส่วนที่ 3: งบประมาณ ระยะเวลา และสถานะการดำเนินงาน
            </h3>

            {/* 9. งบประมาณ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-amber-50/60 p-3 rounded-xl border border-amber-200/80">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  9.1 งบประมาณที่ได้รับอนุมัติ (บาท)
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
                  9.2 ยอดเงินเบิกจ่ายจริง (บาท)
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

            {/* 10. สถานะโครงการ & Progress % */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  10.1 สถานะโครงการ
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
                  10.2 ความก้าวหน้า (%): <span className="text-teal-700 font-extrabold">{formData.progressPercentage}%</span>
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
                <label className="block font-bold text-slate-800 mb-1">
                  ปีงบประมาณ (พ.ศ.) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={2500}
                  max={2650}
                  list="fiscal-years-datalist"
                  value={formData.fiscalYear !== undefined ? formData.fiscalYear : (suggestedFiscalYears[0] || currentBuddhistYear)}
                  onChange={e => setFormData({ ...formData, fiscalYear: e.target.value === '' ? undefined : Number(e.target.value) })}
                  placeholder={`เช่น ${suggestedFiscalYears[0] || currentBuddhistYear}`}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
                  required
                />
                <datalist id="fiscal-years-datalist">
                  {suggestedFiscalYears.map(yr => (
                    <option key={yr} value={yr}>{yr}</option>
                  ))}
                </datalist>
              </div>
            </div>

            {/* 11. วันเริ่มต้น & 12. วันสิ้นสุด */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-700" />
                  11. วันเริ่มต้นโครงการ
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
                  12. วันสิ้นสุดโครงการ
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

          {/* Group D: ปัญหา/อุปสรรค, ประโยชน์ที่สาธารณชนได้รับ / 13. บันทึกโดย / 14. วันที่บันทึก */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2 text-amber-900 border-b border-slate-200 pb-2">
              <UserCheck className="w-4 h-4 text-sky-700" />
              ส่วนที่ 4: ข้อมูลพื้นที่ ผู้รับผิดชอบ และผู้บันทึกข้อมูล
            </h3>

            {/* ปัญหา/อุปสรรค และแนวทางแก้ไข (นำมาไว้ก่อนหน้า ประโยชน์ที่สาธารณชนได้รับ และ พื้นที่ดำเนินการ) */}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-800 mb-1">ประโยชน์ที่สาธารณชนได้รับ</label>
                <input
                  type="text"
                  value={formData.targetGroup || ''}
                  onChange={e => setFormData({ ...formData, targetGroup: e.target.value })}
                  placeholder="เช่น นักเรียนและชุมชนในจังหวัดฉะเชิงเทราได้รับโอกาสทางการศึกษา..."
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

            {/* 13. บันทึกโดย & 14. วันที่บันทึก */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-100 p-3 rounded-xl border border-slate-300/80">
              <div>
                <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-slate-600" />
                  13. บันทึกโดย <span className="text-rose-500">*</span>
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
                  14. วันที่บันทึก <span className="text-rose-500">*</span>
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

          {/* Group E: ส่วนที่ 5: ไฟล์แนบ PDF และรูปถ่ายโครงการ (สูงสุด 4 รูป) */}
          <div className="space-y-4 bg-amber-50/40 p-4 rounded-xl border border-amber-200/80">
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center justify-between border-b border-amber-200/80 pb-2">
              <span className="flex items-center gap-2 text-amber-950">
                <FileUp className="w-4 h-4 text-amber-700" />
                ส่วนที่ 5: เอกสารแนบ PDF และรูปถ่ายโครงการ (สูงสุด 4 รูป)
              </span>
              <span className="text-[11px] font-normal text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300/50 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-amber-700" />
                Optimized Client-side Compression & Cache Header Tagging
              </span>
            </h3>

            {/* 1. PDF File Upload */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-rose-600" />
                  1. ไฟล์เอกสารโครงการ PDF <span className="text-slate-400 font-normal">(ขนาดไม่เกิน 2 MB)</span>
                </label>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 font-mono">
                  Cache-Control: public, max-age=31536000
                </span>
              </div>

              {formData.pdfFile ? (
                <div className="flex items-center justify-between p-3 bg-rose-50/80 border border-rose-200 rounded-xl">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="p-2 bg-rose-600 text-white rounded-lg shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-slate-900 truncate text-xs">{formData.pdfFile.name}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                        <span className="font-semibold text-rose-700">{formatFileSize(formData.pdfFile.size)}</span>
                        <span>•</span>
                        <span className="text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          On-Demand Lazy Download Enabled
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemovePdf}
                    className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer shrink-0"
                    title="ลบไฟล์ PDF"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div>
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-rose-200 hover:border-rose-400 rounded-xl bg-rose-50/30 hover:bg-rose-50/60 transition-all cursor-pointer text-center group">
                    {isProcessingPdf ? (
                      <div className="flex items-center gap-2 text-amber-800 font-semibold py-2">
                        <Loader2 className="w-5 h-5 animate-spin text-amber-700" />
                        <span>กำลังตรวจสอบขนาดและประมวลผลไฟล์ PDF...</span>
                      </div>
                    ) : (
                      <>
                        <FileUp className="w-6 h-6 text-rose-500 mb-1 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-slate-800 text-xs">คลิกเพื่อเลือกไฟล์ PDF โครงการ</span>
                        <span className="text-[11px] text-slate-500 mt-0.5">
                          รองรับเฉพาะไฟล์ .pdf ไม่เกิน 2 MB (ระบบจะดาวน์โหลดตามความต้องการเพื่อประหยัดแบนด์วิดท์)
                        </span>
                      </>
                    )}
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handlePdfChange}
                      disabled={isProcessingPdf}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>

            {/* 2. Photo Uploads (Max 4 Photos) */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <ImagePlus className="w-4 h-4 text-sky-600" />
                    2. รูปถ่ายโครงการ (อัปโหลดสูงสุด 4 รูป)
                  </label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    ระบบจะ Resize ความกว้างไม่เกิน 1080px แปลงเป็น .webp (คุณภาพ 80%) พร้อมสร้าง Thumbnail ย่อขนาดเพื่อโหลดเร็ว
                  </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-300/60 shrink-0">
                  {formData.photos?.length || 0} / 4 รูป
                </span>
              </div>

              {/* Photos Preview Grid */}
              {formData.photos && formData.photos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {formData.photos.map((photo, idx) => (
                    <div key={photo.id || idx} className="relative group bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                      <div className="relative aspect-4/3 overflow-hidden bg-slate-200">
                        <img
                          src={photo.thumbnailUrl || photo.originalDataUrl}
                          alt={`รูปโครงการ ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-slate-900/80 text-white text-[10px] font-bold">
                          #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(photo.id)}
                          className="absolute top-1.5 right-1.5 p-1 bg-rose-600 text-white rounded-lg opacity-90 hover:opacity-100 hover:bg-rose-700 shadow-md transition-all cursor-pointer"
                          title="ลบรูปถ่าย"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="p-2 space-y-1 text-[10px] text-slate-600 bg-white">
                        <div className="flex items-center justify-between font-semibold text-slate-800">
                          <span className="truncate max-w-[90px]">{photo.name}</span>
                          <span className="text-emerald-700 bg-emerald-50 px-1 rounded font-mono">WebP</span>
                        </div>
                        <div className="text-[9px] text-slate-500 flex items-center justify-between">
                          <span>Thumb: {formatFileSize(photo.thumbnailSize)}</span>
                          <span>Full: {formatFileSize(photo.originalSize)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Drop Area */}
              {(formData.photos?.length || 0) < 4 && (
                <div>
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-sky-200 hover:border-sky-400 rounded-xl bg-sky-50/30 hover:bg-sky-50/60 transition-all cursor-pointer text-center group">
                    {isProcessingPhotos ? (
                      <div className="flex items-center gap-2 text-sky-800 font-semibold py-2">
                        <Loader2 className="w-5 h-5 animate-spin text-sky-600" />
                        <span>กำลังบีบอัดรูปภาพเป็น .webp (1080px) และสร้าง Thumbnail...</span>
                      </div>
                    ) : (
                      <>
                        <ImagePlus className="w-6 h-6 text-sky-600 mb-1 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-slate-800 text-xs">
                          เพิ่มรูปถ่ายโครงการ (เลือกเพิ่มได้อีก {4 - (formData.photos?.length || 0)} รูป)
                        </span>
                        <span className="text-[11px] text-slate-500 mt-0.5">
                          บีบอัด Client-side อัตโนมัติเป็น WebP เพื่อประหยัดพื้นที่และแบนด์วิดท์
                        </span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotosChange}
                      disabled={isProcessingPhotos}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* การประเมินผลสัมฤทธิ์ตามเป้าหมายโครงการ (นำมาไว้ก่อนปุ่มบันทึก) */}
          <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-300/80 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5 text-amber-950">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                การประเมินผลสัมฤทธิ์ตามเป้าหมายโครงการ
              </label>
              <span className="text-[11px] text-amber-800 font-medium bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-300/60">
                เลือกอย่างใดอย่างหนึ่ง
              </span>
            </div>
            <p className="text-[11px] text-slate-600">
              ทำเครื่องหมายในช่องเช็คบ็อกซ์เพื่อประเมินผลสรุปของโครงการตามเป้าหมายที่กำหนด
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs font-semibold">
              <label className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border cursor-pointer transition-all ${
                formData.targetAchievement === 'achieved'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}>
                <input
                  type="checkbox"
                  checked={formData.targetAchievement === 'achieved'}
                  onChange={() => setFormData({
                    ...formData,
                    targetAchievement: formData.targetAchievement === 'achieved' ? '' : 'achieved'
                  })}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                />
                <span className="text-emerald-800 font-bold">บรรลุผลตามเป้าหมาย</span>
              </label>

              <label className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border cursor-pointer transition-all ${
                formData.targetAchievement === 'not_achieved'
                  ? 'bg-rose-50 border-rose-500 text-rose-900 ring-2 ring-rose-500/20 shadow-xs'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}>
                <input
                  type="checkbox"
                  checked={formData.targetAchievement === 'not_achieved'}
                  onChange={() => setFormData({
                    ...formData,
                    targetAchievement: formData.targetAchievement === 'not_achieved' ? '' : 'not_achieved'
                  })}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 accent-rose-600 cursor-pointer"
                />
                <span className="text-rose-800 font-bold">ไม่บรรลุผลตามเป้าหมาย</span>
              </label>
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

