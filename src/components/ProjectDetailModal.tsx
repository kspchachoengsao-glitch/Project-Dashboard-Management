import React from 'react';
import { Project } from '../types';
import { STATUS_THAI_MAP, printPDFReport } from '../utils/exportUtils';
import {
  X,
  Printer,
  Building2,
  Target,
  Award,
  Calendar,
  Coins,
  TrendingUp,
  MapPin,
  Users,
  Phone,
  FileCheck,
  AlertTriangle,
  Clock,
  UserCheck,
  CheckCircle2,
  Layers,
  FileText
} from 'lucide-react';

interface ProjectDetailModalProps {
  project: Project | null;
  onClose: () => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({ project, onClose }) => {
  if (!project) return null;

  const spentPercent = project.approvedBudget > 0
    ? ((project.spentBudget / project.approvedBudget) * 100).toFixed(1)
    : '0';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <span className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400/30 font-mono font-bold text-xs">
              {project.code}
            </span>
            <span className="text-xs text-slate-300">ปีงบประมาณ {project.fiscalYear}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => printPDFReport('single-project-print-area')}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" /> พิมพ์สรุป PDF
            </button>
            <button
              onClick={onClose}
              className="text-slate-300 hover:text-white p-1 rounded-full hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Printable Content */}
        <div id="single-project-print-area" className="p-4 sm:p-6 overflow-y-auto space-y-5 text-slate-800 text-xs">
          {/* Main Title & Agency */}
          <div className="border-b border-slate-200 pb-4">
            <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-700" />
              1. หน่วยงานที่รับผิดชอบ: {project.agencyName}
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
              {project.name}
            </h2>
          </div>

          {/* Key Strategic Alignments (1, 2, 3) */}
          <div className="space-y-2.5 bg-amber-50/70 p-4 rounded-xl border border-amber-200">
            <div className="flex items-start gap-2">
              <Target className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-slate-900 font-bold">2. ประเด็นยุทธศาสตร์:</strong>
                <p className="text-slate-800 mt-0.5 font-medium">{project.strategicIssueTitle}</p>
              </div>
            </div>

            <div className="flex items-start gap-2 border-t border-amber-200/60 pt-2.5">
              <Award className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-slate-900 font-bold">3. โครงการสำคัญที่สอดคล้อง (Flagship Project):</strong>
                <p className="text-amber-950 font-bold mt-0.5">{project.keyFlagshipProjectTitle}</p>
              </div>
            </div>
          </div>

          {/* Quick Metrics Grid (6, 7, 8, 9) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-[11px] text-slate-500 block font-medium">6.1 งบประมาณอนุมัติ</span>
              <strong className="text-sm font-bold text-slate-900">
                ฿{project.approvedBudget.toLocaleString('th-TH')}
              </strong>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 block font-medium">6.2 เบิกจ่ายจริง ({spentPercent}%)</span>
              <strong className="text-sm font-bold text-amber-800">
                ฿{project.spentBudget.toLocaleString('th-TH')}
              </strong>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 block font-medium">7. สถานะโครงการ</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs font-bold text-teal-700">{project.progressPercentage}%</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                  {STATUS_THAI_MAP[project.status]}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 block font-medium">8-9. ระยะเวลาดำเนินการ</span>
              <strong className="text-[11px] font-semibold text-slate-800 block mt-0.5">
                {project.startDate} ถึง {project.endDate}
              </strong>
            </div>
          </div>

          {/* Section: Objectives, Goals & KPIs (4, 5, 10, 11, 12, 13) */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs text-amber-900 border-b border-slate-200 pb-2">
              <FileText className="w-4 h-4 text-emerald-700" />
              เป้าประสงค์ ตัวชี้วัด และวัตถุประสงค์โครงการ
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <strong className="block text-slate-900 font-bold mb-1">4. เป้าประสงค์ (Goal):</strong>
                <p className="text-slate-700 leading-relaxed">{project.goal || 'ไม่ได้ระบุระบุรายละเอียด'}</p>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <strong className="block text-slate-900 font-bold mb-1">5. ตัวชี้วัดโครงการ (KPI):</strong>
                <p className="text-slate-700 leading-relaxed">{project.mainIndicator || 'ไม่ได้ระบุรายละเอียด'}</p>
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <strong className="block text-slate-900 font-bold mb-1">10. วัตถุประสงค์ของโครงการ:</strong>
              <p className="text-slate-700 leading-relaxed whitespace-pre-line">{project.objectives || 'ไม่ได้ระบุวัตถุประสงค์'}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <strong className="block text-slate-900 font-bold mb-1">11. ตัวชี้วัดเชิงปริมาณ:</strong>
                <p className="text-slate-700 leading-relaxed">{project.quantitativeKPI || 'ไม่ได้ระบุ'}</p>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <strong className="block text-slate-900 font-bold mb-1">12. ตัวชี้วัดเชิงคุณภาพ:</strong>
                <p className="text-slate-700 leading-relaxed">{project.qualitativeKPI || 'ไม่ได้ระบุ'}</p>
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <strong className="block text-slate-900 font-bold mb-1">13. ผลลัพธ์ (Outcomes):</strong>
              <p className="text-slate-700 leading-relaxed">{project.outcomes || project.outputOutcome || 'ไม่ได้ระบุ'}</p>
            </div>
          </div>

          {/* Location & Beneficiaries & Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-700">
                <Users className="w-4 h-4 text-slate-500" />
                <span><strong>กลุ่มเป้าหมาย:</strong> {project.targetGroup || '-'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <MapPin className="w-4 h-4 text-slate-500" />
                <span><strong>พื้นที่ดำเนินการ:</strong> {project.location || '-'}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-700">
                <UserCheck className="w-4 h-4 text-slate-500" />
                <span><strong>ผู้รับผิดชอบโครงการ:</strong> {project.responsiblePerson}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Phone className="w-4 h-4 text-slate-500" />
                <span><strong>เบอร์ติดต่อ:</strong> {project.contactPhone || '-'}</span>
              </div>
            </div>
          </div>

          {/* Issues & Mitigation */}
          {project.issuesAndSolutions && (
            <div className="space-y-2 border-t border-slate-200 pt-4">
              <h4 className="font-bold text-amber-900 flex items-center gap-1.5 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                ปัญหา/อุปสรรค และแนวทางการแก้ไข
              </h4>
              <p className="text-amber-950 bg-amber-50 p-3 rounded-xl border border-amber-200 leading-relaxed">
                {project.issuesAndSolutions}
              </p>
            </div>
          )}

          {/* Audit Timestamp Footer (14, 15) */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl">
            <span className="flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-slate-600" />
              <strong>14. บันทึกโดย:</strong> {project.createdByName}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-600" />
              <strong>15. วันที่บันทึก:</strong> {project.createdAt ? project.createdAt.substring(0, 10) : '-'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

