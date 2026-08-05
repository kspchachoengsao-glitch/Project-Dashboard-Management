import React, { useState } from 'react';
import { Project, ProjectPhoto } from '../types';
import { STATUS_THAI_MAP, printPDFReport } from '../utils/exportUtils';
import { formatFileSize } from '../utils/fileProcessingUtils';
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
  FileText,
  Download,
  ExternalLink,
  FileDown,
  Image as ImageIcon,
  Eye,
  Maximize2,
  ShieldCheck
} from 'lucide-react';

interface ProjectDetailModalProps {
  project: Project | null;
  onClose: () => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({ project, onClose }) => {
  const [selectedFullPhoto, setSelectedFullPhoto] = useState<ProjectPhoto | null>(null);
  const [showPdfViewer, setShowPdfViewer] = useState(false);

  if (!project) return null;

  const spentPercent = project.approvedBudget > 0
    ? ((project.spentBudget / project.approvedBudget) * 100).toFixed(1)
    : '0';

  const handleDownloadPdf = () => {
    if (!project.pdfFile?.dataUrl) return;
    const link = document.createElement('a');
    link.href = project.pdfFile.dataUrl;
    link.download = project.pdfFile.name || `${project.code}_เอกสารโครงการ.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
              className="text-slate-300 hover:text-white p-1 rounded-full hover:bg-white/10 cursor-pointer"
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

          {/* Section: Photos Gallery (Thumbnail-First Architecture) */}
          <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs text-sky-900">
                <ImageIcon className="w-4 h-4 text-sky-600" />
                รูปถ่ายภาพรวมโครงการ {project.photos && project.photos.length > 0 ? `(${project.photos.length} รูป)` : ''}
              </h4>
              <span className="text-[10px] text-slate-500 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-sky-600" />
                Thumbnail First (~25KB/รูป) • กดที่รูปดวงตาเพื่อดูไฟล์จริง WebP (1080p)
              </span>
            </div>

            {project.photos && project.photos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                {project.photos.map((photo, idx) => (
                  <div
                    key={photo.id || idx}
                    className="relative group bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:border-sky-400 transition-all cursor-pointer"
                    onClick={() => setSelectedFullPhoto(photo)}
                  >
                    <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
                      <img
                        src={photo.thumbnailUrl || photo.originalDataUrl}
                        alt={`รูปถ่าย ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-1.5">
                        <span className="p-1.5 rounded-full bg-white text-slate-900 shadow-md">
                          <Eye className="w-4 h-4" />
                        </span>
                        <span className="text-[10px] text-white font-bold bg-slate-900/80 px-2 py-0.5 rounded-full">
                          ดูรูปจริง WebP
                        </span>
                      </div>
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-slate-900/80 text-white text-[9px] font-bold">
                        รูปที่ {idx + 1}
                      </span>
                    </div>
                    <div className="p-2 text-[10px] space-y-0.5">
                      <div className="font-semibold text-slate-800 truncate">{photo.name}</div>
                      <div className="text-[9px] text-slate-500 flex items-center justify-between">
                        <span>ย่อ: {formatFileSize(photo.thumbnailSize)}</span>
                        <span className="text-emerald-700 font-mono">WebP</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-slate-500 bg-white rounded-xl border border-dashed border-slate-200">
                ยังไม่ได้แนบรูปถ่ายโครงการ (สามารถแนบรูปถ่ายสูงสุด 4 รูปได้ที่เมนูแก้ไขโครงการ)
              </div>
            )}
          </div>

          {/* Section: PDF Attached Document (Lazy On-demand Download) */}
          <div className="space-y-2 bg-rose-50/50 p-4 rounded-xl border border-rose-200">
            <div className="flex items-center justify-between border-b border-rose-200 pb-2">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs text-rose-900">
                <FileText className="w-4 h-4 text-rose-600" />
                เอกสารประกอบโครงการ (PDF)
              </h4>
              <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 font-mono font-medium">
                Cache-Control: public, max-age=31536000
              </span>
            </div>

            {project.pdfFile ? (
              <>
                <div className="bg-white p-3 rounded-xl border border-rose-200/80 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-rose-600 text-white rounded-xl shadow-xs shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <strong className="block font-bold text-slate-900 text-xs">{project.pdfFile.name}</strong>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        ขนาดไฟล์: <span className="font-bold text-rose-700">{formatFileSize(project.pdfFile.size)}</span> • ไม่โหลดอัตโนมัติเพื่อประหยัดแบนด์วิดท์
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => setShowPdfViewer(!showPdfViewer)}
                      className="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-800 hover:bg-rose-50 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {showPdfViewer ? 'ซ่อนตัวอย่าง PDF' : 'เปิดดู PDF ในหน้าเว็บ'}
                    </button>
                    <button
                      onClick={handleDownloadPdf}
                      className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <FileDown className="w-4 h-4" />
                      ดาวน์โหลด PDF
                    </button>
                  </div>
                </div>

                {/* On-demand PDF Viewer Frame */}
                {showPdfViewer && (
                  <div className="mt-3 bg-slate-900 p-2 rounded-xl border border-slate-700 shadow-inner">
                    <div className="flex items-center justify-between px-2 py-1 text-slate-300 text-[11px] mb-1">
                      <span>การแสดงผลเอกสาร PDF On-demand (Loaded manually)</span>
                      <button
                        onClick={() => setShowPdfViewer(false)}
                        className="text-slate-400 hover:text-white text-xs cursor-pointer"
                      >
                        ปิดตัวอย่าง
                      </button>
                    </div>
                    <iframe
                      src={project.pdfFile.dataUrl}
                      className="w-full h-96 rounded-lg bg-white"
                      title="PDF Viewer"
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="py-4 text-center text-xs text-slate-500 bg-white rounded-xl border border-dashed border-rose-200">
                ยังไม่ได้แนบไฟล์เอกสาร PDF โครงการ (สามารถแนบไฟล์ PDF ไม่เกิน 2 MB ได้ที่เมนูแก้ไขโครงการ)
              </div>
            )}
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

      {/* Lightbox Modal for Full-Size WebP Image (1080p) */}
      {selectedFullPhoto && (
        <div className="fixed inset-0 z-60 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative max-w-5xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col max-h-[95vh]">
            <div className="p-3 bg-slate-950 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <ImageIcon className="w-4 h-4 text-sky-400" />
                <span className="font-bold text-xs">{selectedFullPhoto.name}</span>
                <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded font-mono">
                  {selectedFullPhoto.width}x{selectedFullPhoto.height}px • {formatFileSize(selectedFullPhoto.originalSize)}
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 font-mono">
                  Cache-Control: public, max-age=31536000
                </span>
              </div>
              <button
                onClick={() => setSelectedFullPhoto(null)}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-black/80">
              <img
                src={selectedFullPhoto.originalDataUrl}
                alt={selectedFullPhoto.name}
                className="max-h-[80vh] w-auto object-contain rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

