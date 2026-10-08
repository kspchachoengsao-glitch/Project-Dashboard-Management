import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Project, AuditLogEntry } from '../types';
import { FileStorageService } from '../services/fileStorage';

export const STATUS_THAI_MAP: Record<string, string> = {
  not_started: 'ยังไม่เริ่มดำเนินการ',
  in_progress: 'อยู่ระหว่างดำเนินการ',
  completed: 'ดำเนินการแล้วเสร็จ',
  delayed: 'ล่าช้ากว่าแผน',
  cancelled: 'ยกเลิกโครงการ',
};

// --- 1. EXCEL EXPORT ---
export function exportProjectsToExcel(projects: Project[], filename = 'รายงานติดตามโครงการ_ฉะเชิงเทรา.xlsx') {
  const data = projects.map((p, index) => ({
    'ลำดับ': index + 1,
    'รหัสโครงการ': p.code,
    'ชื่อโครงการ': p.name,
    '1. หน่วยงานที่รับผิดชอบ': p.agencyName,
    '2. ประเด็นยุทธศาสตร์': p.strategicIssueTitle,
    '3. โครงการสำคัญที่สอดคล้อง': p.keyFlagshipProjectTitle,
    '4. วัตถุประสงค์ของโครงการ': p.objectives || '-',
    '5. เป้าหมายโครงการ (Goal)': p.goal || '-',
    '6.1 ตัวชี้วัดโครงการ เชิงปริมาณ': p.quantitativeKPI || '-',
    '6.2 ตัวชี้วัดโครงการ เชิงคุณภาพ': p.qualitativeKPI || '-',
    '7. ผลการดำเนินงานโครงการ/กิจกรรม': p.projectPerformance || p.outputOutcome || p.outcomes || '-',
    '8.1 ผลการดำเนินงานตามตัวชี้วัด เชิงปริมาณ': p.kpiResultQuantitative || '-',
    '8.2 ผลการดำเนินงานตามตัวชี้วัด เชิงคุณภาพ': p.kpiResultQualitative || '-',
    'ผลสัมฤทธิ์ตามเป้าหมาย': p.targetAchievement === 'achieved' ? 'บรรลุผลตามเป้าหมาย' : p.targetAchievement === 'not_achieved' ? 'ไม่บรรลุผลตามเป้าหมาย' : '-',
    '9.1 งบประมาณอนุมัติ (บาท)': p.approvedBudget,
    '9.2 งบเบิกจ่ายจริง (บาท)': p.spentBudget,
    '10. สถานะโครงการ': STATUS_THAI_MAP[p.status] || p.status,
    'ความก้าวหน้า (%)': p.progressPercentage,
    'ไตรมาส': `ไตรมาส ${p.quarter}`,
    'ปีงบประมาณ': p.fiscalYear,
    '11. วันเริ่มต้น': p.startDate,
    '12. วันสิ้นสุด': p.endDate,
    'ประโยชน์ที่สาธารณชนได้รับ': p.targetGroup || '-',
    'พื้นที่ดำเนินการ': p.location || '-',
    'ผู้รับผิดชอบโครงการ': p.responsiblePerson,
    'เบอร์ติดต่อ': p.contactPhone || '-',
    '13. บันทึกโดย': p.createdByName,
    '14. วันที่บันทึก': p.createdAt ? p.createdAt.substring(0, 10) : '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set column widths
  const colWidths = [
    { wch: 6 },  // ลำดับ
    { wch: 35 }, // หน่วยงาน
    { wch: 35 }, // ยุทธศาสตร์
    { wch: 35 }, // โครงการสำคัญ
    { wch: 14 }, // รหัส
    { wch: 45 }, // ชื่อ
    { wch: 30 }, // เป้าประสงค์
    { wch: 30 }, // ตัวชี้วัด
    { wch: 18 }, // งบอนุมัติ
    { wch: 18 }, // งบเบิกจ่าย
    { wch: 20 }, // สถานะ
    { wch: 15 }, // %
    { wch: 14 }, // วันเริ่ม
    { wch: 14 }, // วันสิ้นสุด
    { wch: 35 }, // วัตถุประสงค์
    { wch: 25 }, // เชิงปริมาณ
    { wch: 25 }, // เชิงคุณภาพ
    { wch: 35 }, // ผลลัพธ์
    { wch: 20 }, // ผู้รับผิดชอบ
    { wch: 15 }, // เบอร์
    { wch: 20 }, // บันทึกโดย
    { wch: 15 }, // วันที่บันทึก
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'รายงานโครงการ');
  XLSX.writeFile(workbook, filename);
}

// --- 2. CSV EXPORT (With UTF-8 BOM for Thai support) ---
export function exportProjectsToCSV(projects: Project[], filename = 'รายงานติดตามโครงการ_ฉะเชิงเทรา.csv') {
  const headers = [
    'ลำดับ',
    'รหัสโครงการ',
    'ชื่อโครงการ',
    'หน่วยงานที่รับผิดชอบ',
    'ประเด็นยุทธศาสตร์',
    'กลุ่มโครงการสำคัญ',
    'ไตรมาส',
    'ปีงบประมาณ',
    'งบอนุมัติ(บาท)',
    'งบเบิกจ่าย(บาท)',
    'ความก้าวหน้า(%)',
    'สถานะ',
    'ผู้รับผิดชอบ',
    'เบอร์ติดต่อ'
  ];

  const rows = projects.map((p, idx) => [
    idx + 1,
    `"${p.code}"`,
    `"${p.name.replace(/"/g, '""')}"`,
    `"${p.agencyName.replace(/"/g, '""')}"`,
    `"${p.strategicIssueTitle.replace(/"/g, '""')}"`,
    `"${p.keyFlagshipProjectTitle.replace(/"/g, '""')}"`,
    `"ไตรมาส ${p.quarter}"`,
    p.fiscalYear,
    p.approvedBudget,
    p.spentBudget,
    p.progressPercentage,
    `"${STATUS_THAI_MAP[p.status] || p.status}"`,
    `"${p.responsiblePerson}"`,
    `"${p.contactPhone || '-'}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// --- 3. AUDIT LOG EXCEL EXPORT ---
export function exportAuditLogsToExcel(logs: AuditLogEntry[], filename = 'ประวัติการใช้งานระบบ_AuditLog.xlsx') {
  const data = logs.map((log, idx) => ({
    'ลำดับ': idx + 1,
    'วัน-เวลา': log.timestamp,
    'ผู้ดำเนินการ': log.userName,
    'บทบาท': log.userRole.toUpperCase(),
    'หน่วยงาน': log.agencyName,
    'การกระทำ (Action)': log.action,
    'รายละเอียด': log.details,
    'IP Address': log.ipAddress || '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit Log');
  XLSX.writeFile(workbook, filename);
}

import logoImg from '../assets/images/province_logo_1784882847695.jpg';

// Helper to trigger printing via invisible iframe (100% reliable across all browsers & iframe contexts, avoiding popup blocker issues)
function printHtmlContent(htmlContent: string) {
  // Remove any existing print iframes
  const oldIframe = document.getElementById('temp-print-frame');
  if (oldIframe) {
    oldIframe.remove();
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'temp-print-frame';
  // Position seamlessly in document flow so focus/print works reliably in Chrome without offscreen blocking
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '1px';
  iframe.style.height = '1px';
  iframe.style.opacity = '0.01';
  iframe.style.border = 'none';
  iframe.style.pointerEvents = 'none';
  iframe.style.zIndex = '-9999';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) {
    window.print();
    return;
  }

  doc.open();
  doc.write(htmlContent);
  doc.close();

  const printWindow = iframe.contentWindow;
  if (!printWindow) {
    window.print();
    return;
  }

  // Allow images, styles, and web fonts to render before invoking print
  setTimeout(() => {
    try {
      printWindow.focus();
      printWindow.print();
    } catch (e) {
      console.warn('Error invoking print on iframe, fallback to window.print:', e);
      window.print();
    } finally {
      setTimeout(() => {
        const frameToRemove = document.getElementById('temp-print-frame');
        if (frameToRemove && frameToRemove.parentNode) {
          frameToRemove.parentNode.removeChild(frameToRemove);
        }
      }, 3000);
    }
  }, 400);
}

// Format date to Thai Buddhist Era string
function formatThaiDate(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = d.getDate();
    const months = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    const month = months[d.getMonth()];
    const year = d.getFullYear() + 543;
    return `${day} ${month} พ.ศ. ${year}`;
  } catch {
    return dateStr;
  }
}

// --- 4. PRINT SINGLE PROJECT REPORT (สวยงามและกระดาษเป็นแนวตั้ง) ---
export async function printSingleProjectReport(project: Project) {
  if (!project) return;

  const spentPercent = project.approvedBudget > 0
    ? ((project.spentBudget / project.approvedBudget) * 100).toFixed(1)
    : '0';

  const todayThai = formatThaiDate(new Date().toISOString());

  // Resolve any photo thumbnails/originals before printing so photos always display
  const resolvedPhotos = await Promise.all(
    (project.photos || []).map(async (photo) => {
      let src = photo.thumbnailUrl || photo.originalDataUrl || '';
      if (!src && photo.id) {
        try {
          src = (await FileStorageService.getPhotoThumbnailUrl(photo.id)) ||
                (await FileStorageService.getPhotoOriginalDataUrl(photo.id)) || '';
        } catch {
          // ignore
        }
      }
      return { ...photo, resolvedSrc: src };
    })
  );

  // Target achievement display
  let achievementBadgeHtml = '';
  if (project.targetAchievement === 'achieved') {
    achievementBadgeHtml = `
      <div class="achievement-box achieved">
        <span class="badge-icon">✓</span>
        <strong>บรรลุผลตามเป้าหมายของโครงการ</strong> (เป้าหมายและตัวชี้วัดสำเร็จตามเกณฑ์ที่กำหนด)
      </div>
    `;
  } else if (project.targetAchievement === 'not_achieved') {
    achievementBadgeHtml = `
      <div class="achievement-box not-achieved">
        <span class="badge-icon">✕</span>
        <strong>ไม่บรรลุผลตามเป้าหมายของโครงการ</strong> (อยู่ระหว่างเร่งรัดและปรับปรุงแนวทางแก้ไข)
      </div>
    `;
  } else {
    achievementBadgeHtml = `
      <div class="achievement-box unassessed">
        <span class="badge-icon">-</span>
        <strong>ยังไม่ได้ประเมินผลสัมฤทธิ์ตามเป้าหมายโครงการ</strong>
      </div>
    `;
  }

  // Photos Gallery HTML
  let photosHtml = '';
  if (resolvedPhotos.length > 0) {
    const photoItems = resolvedPhotos.map((photo, idx) => {
      const src = photo.resolvedSrc || photo.thumbnailUrl || photo.originalDataUrl || '';
      return `
        <div class="photo-card">
          <div class="photo-img-wrapper">
            ${src ? `<img src="${src}" alt="${photo.name}" />` : '<div class="no-img">ไม่มีภาพตัวอย่าง</div>'}
          </div>
          <div class="photo-caption">ภาพที่ ${idx + 1}: ${photo.name}</div>
        </div>
      `;
    }).join('');

    photosHtml = `
      <div class="report-section page-break-inside-avoid">
        <div class="section-title">9. ภาพถ่ายประกอบการดำเนินงานโครงการ (${resolvedPhotos.length} รูป)</div>
        <div class="photos-grid">
          ${photoItems}
        </div>
      </div>
    `;
  }

  // Attached PDF file indicator
  let pdfAttachmentHtml = '';
  if (project.pdfFile) {
    const sizeKb = (project.pdfFile.size / 1024).toFixed(1);
    pdfAttachmentHtml = `
      <div class="report-section page-break-inside-avoid">
        <div class="section-title">10. เอกสารแนบโครงการ</div>
        <div class="pdf-info-box">
          📄 <strong>เอกสาร:</strong> ${project.pdfFile.name} (ขนาดประมาณ ${sizeKb} KB)
        </div>
      </div>
    `;
  }

  const html = `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <title>รายงานผลการดำเนินงานโครงการ - ${project.code}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
        
        @page {
          size: portrait;
          size: A4 portrait;
          margin: 10mm 15mm 10mm 15mm;
        }

        @media print {
          @page {
            size: portrait;
            size: A4 portrait;
            margin: 10mm 15mm 10mm 15mm;
          }

          html, body {
            width: 210mm !important;
            max-width: 210mm !important;
            margin: 0 auto !important;
            padding: 0 !important;
            background: #ffffff !important;
          }

          .report-container {
            width: 100% !important;
            max-width: 180mm !important;
            margin: 0 auto !important;
          }
        }

        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        html {
          width: 210mm;
          margin: 0 auto;
        }

        body {
          font-family: 'Sarabun', 'TH Sarabun PSK', sans-serif;
          font-size: 13px;
          line-height: 1.45;
          color: #0f172a;
          background: #ffffff;
          margin: 0 auto;
          padding: 0;
          width: 210mm;
          max-width: 210mm;
        }

        .report-container {
          width: 180mm;
          max-width: 180mm;
          margin: 0 auto;
        }

        /* Official Header */
        .header-section {
          text-align: center;
          border-bottom: 2px solid #0f172a;
          padding-bottom: 12px;
          margin-bottom: 16px;
        }

        .emblem-wrapper {
          display: flex;
          justify-content: center;
          margin-bottom: 6px;
        }

        .emblem-img {
          height: 60px;
          width: 60px;
          object-fit: contain;
        }

        .header-title-main {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 4px 0;
        }

        .header-title-sub {
          font-size: 14px;
          font-weight: 600;
          color: #334155;
          margin: 0 0 2px 0;
        }

        .header-meta {
          margin-top: 8px;
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #475569;
          background: #f8fafc;
          padding: 6px 12px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
        }

        /* Sections */
        .report-section {
          margin-bottom: 14px;
        }

        .section-title {
          font-size: 13.5px;
          font-weight: 700;
          color: #78350f;
          background: #fef3c7;
          border-left: 4px solid #b45309;
          padding: 5px 10px;
          margin-bottom: 8px;
          border-radius: 0 4px 4px 0;
        }

        /* General Info Table */
        .info-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 8px;
          font-size: 13px;
        }

        .info-table td {
          padding: 6px 8px;
          border: 1px solid #cbd5e1;
          vertical-align: top;
        }

        .info-table .label {
          width: 25%;
          background: #f8fafc;
          font-weight: 600;
          color: #334155;
        }

        .info-table .value {
          width: 75%;
          color: #0f172a;
        }

        /* KPI & Content Boxes */
        .content-box {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 8px 12px;
          margin-bottom: 8px;
          font-size: 13px;
          line-height: 1.55;
        }

        .content-box strong {
          color: #1e293b;
        }

        .kpi-grid {
          display: table;
          width: 100%;
          table-layout: fixed;
          margin-bottom: 8px;
        }

        .kpi-col {
          display: table-cell;
          width: 50%;
          padding: 6px 10px;
          border: 1px solid #cbd5e1;
          background: #f8fafc;
          vertical-align: top;
        }

        .kpi-col:first-child {
          border-right: none;
        }

        .kpi-col strong {
          font-size: 12px;
          color: #0369a1;
          display: block;
          margin-bottom: 4px;
        }

        /* Target Achievement Box */
        .achievement-box {
          padding: 10px 14px;
          border-radius: 6px;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 4px;
        }

        .achievement-box.achieved {
          background: #ecfdf5;
          border: 1.5px solid #059669;
          color: #065f46;
        }

        .achievement-box.not-achieved {
          background: #fff1f2;
          border: 1.5px solid #e11d48;
          color: #9f1239;
        }

        .achievement-box.unassessed {
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          color: #475569;
        }

        .badge-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: currentColor;
          color: #ffffff;
          font-weight: bold;
          font-size: 12px;
        }

        /* Budget & Progress Table */
        .metrics-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 6px;
          font-size: 13px;
          text-align: center;
        }

        .metrics-table th, .metrics-table td {
          border: 1px solid #cbd5e1;
          padding: 6px 8px;
        }

        .metrics-table th {
          background: #f1f5f9;
          font-weight: 600;
          color: #334155;
        }

        .metrics-table td {
          font-weight: 600;
        }

        .progress-bar-bg {
          background: #e2e8f0;
          height: 8px;
          border-radius: 4px;
          overflow: hidden;
          margin-top: 4px;
        }

        .progress-bar-fill {
          background: #0d9488;
          height: 100%;
        }

        /* Photos Grid */
        .photos-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          width: 100%;
          max-width: 180mm;
          margin-top: 6px;
        }

        .photo-card {
          width: calc(50% - 5px);
          box-sizing: border-box;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 6px;
          background: #ffffff;
          text-align: center;
          page-break-inside: avoid;
        }

        .photo-img-wrapper {
          width: 100%;
          height: 150px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8fafc;
          border-radius: 4px;
        }

        .photo-img-wrapper img {
          max-width: 100%;
          max-height: 150px;
          object-fit: cover;
        }

        .photo-caption {
          font-size: 11px;
          color: #475569;
          margin-top: 4px;
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .pdf-info-box {
          background: #fdf2f8;
          border: 1px solid #fbcfe8;
          padding: 8px 12px;
          border-radius: 6px;
          color: #831843;
          font-size: 12.5px;
        }

        /* Signatures Block */
        .signature-section {
          margin-top: 24px;
          page-break-inside: avoid;
        }

        .signature-table {
          width: 100%;
          border-collapse: collapse;
        }

        .signature-table td {
          width: 50%;
          text-align: center;
          padding: 10px 20px;
          vertical-align: top;
          font-size: 13px;
        }

        .sign-line {
          margin-top: 40px;
          border-bottom: 1px dotted #475569;
          width: 75%;
          margin-left: auto;
          margin-right: auto;
          margin-bottom: 6px;
        }

        .page-break-inside-avoid {
          page-break-inside: avoid;
        }
      </style>
    </head>
    <body>
      <div class="report-container">
        <!-- 1. Header -->
        <div class="header-section">
          <div class="emblem-wrapper">
            <img src="${logoImg}" alt="ตราสำนักงานศึกษาธิการจังหวัดฉะเชิงเทรา" class="emblem-img" />
          </div>
          <div class="header-title-main">แบบรายงานติดตามและประเมินผลการดำเนินงานโครงการ</div>
          <div class="header-title-sub">ตามแผนพัฒนาการศึกษาและแผนปฏิบัติการด้านการศึกษา ประจำปีงบประมาณ พ.ศ. ${project.fiscalYear}</div>
          <div class="header-title-sub">สำนักงานศึกษาธิการจังหวัดฉะเชิงเทรา</div>
          
          <div class="header-meta">
            <span><strong>รหัสโครงการ:</strong> ${project.code}</span>
            <span><strong>ไตรมาสที่:</strong> ${project.quarter}</span>
            <span><strong>วันที่พิมพ์รายงาน:</strong> ${todayThai}</span>
          </div>
        </div>

        <!-- 2. ข้อมูลทั่วไปของโครงการ -->
        <div class="report-section page-break-inside-avoid">
          <div class="section-title">1. ข้อมูลทั่วไปของโครงการ</div>
          <table class="info-table">
            <tr>
              <td class="label">ชื่อโครงการ</td>
              <td class="value"><strong>${project.name}</strong></td>
            </tr>
            <tr>
              <td class="label">หน่วยงานที่รับผิดชอบ</td>
              <td class="value">${project.agencyName}</td>
            </tr>
            <tr>
              <td class="label">ประเด็นยุทธศาสตร์</td>
              <td class="value">${project.strategicIssueTitle}</td>
            </tr>
            <tr>
              <td class="label">โครงการสำคัญที่สอดคล้อง</td>
              <td class="value"><strong>${project.keyFlagshipProjectTitle}</strong></td>
            </tr>
            <tr>
              <td class="label">ระยะเวลาดำเนินการ</td>
              <td class="value">${project.startDate} ถึง ${project.endDate}</td>
            </tr>
          </table>
        </div>

        <!-- 3. วัตถุประสงค์และเป้าหมายโครงการ -->
        <div class="report-section page-break-inside-avoid">
          <div class="section-title">2. วัตถุประสงค์และเป้าหมายโครงการ</div>
          <div class="content-box">
            <strong>4. วัตถุประสงค์ของโครงการ:</strong>
            <p style="margin: 4px 0 0 0; white-space: pre-line;">${project.objectives || 'ไม่ได้ระบุวัตถุประสงค์'}</p>
          </div>
          <div class="content-box">
            <strong>5. เป้าหมายโครงการ (Goal):</strong>
            <p style="margin: 4px 0 0 0; white-space: pre-line;">${project.goal || 'ไม่ได้ระบุเป้าหมาย'}</p>
          </div>
        </div>

        <!-- 4. ตัวชี้วัดโครงการ (KPIs) -->
        <div class="report-section page-break-inside-avoid">
          <div class="section-title">3. ตัวชี้วัดโครงการ (KPI Indicators)</div>
          <div class="kpi-grid">
            <div class="kpi-col">
              <strong>6.1 ตัวชี้วัดเชิงปริมาณ (Quantitative KPI):</strong>
              <div>${project.quantitativeKPI || '-'}</div>
            </div>
            <div class="kpi-col">
              <strong>6.2 ตัวชี้วัดเชิงคุณภาพ (Qualitative KPI):</strong>
              <div>${project.qualitativeKPI || '-'}</div>
            </div>
          </div>
        </div>

        <!-- 5. ผลการดำเนินงานโครงการ และ ผลตามตัวชี้วัด -->
        <div class="report-section page-break-inside-avoid">
          <div class="section-title">4. ผลการดำเนินงานโครงการ</div>
          <div class="content-box">
            <strong>7. ผลการดำเนินงานโครงการ/กิจกรรม:</strong>
            <p style="margin: 4px 0 0 0; white-space: pre-line;">${project.projectPerformance || project.outputOutcome || project.outcomes || 'ไม่ได้ระบุผลการดำเนินงาน'}</p>
          </div>
          <div class="kpi-grid">
            <div class="kpi-col">
              <strong style="color: #047857;">8.1 ผลการดำเนินงานตามตัวชี้วัด เชิงปริมาณ:</strong>
              <div>${project.kpiResultQuantitative || '-'}</div>
            </div>
            <div class="kpi-col">
              <strong style="color: #047857;">8.2 ผลการดำเนินงานตามตัวชี้วัด เชิงคุณภาพ:</strong>
              <div>${project.kpiResultQualitative || '-'}</div>
            </div>
          </div>
        </div>

        <!-- 6. การประเมินผลสัมฤทธิ์ตามเป้าหมายโครงการ -->
        <div class="report-section page-break-inside-avoid">
          <div class="section-title">5. การประเมินผลสัมฤทธิ์ตามเป้าหมายโครงการ</div>
          ${achievementBadgeHtml}
        </div>

        <!-- 7. งบประมาณและความก้าวหน้า -->
        <div class="report-section page-break-inside-avoid">
          <div class="section-title">6. ข้อมูลงบประมาณและความก้าวหน้าโครงการ</div>
          <table class="metrics-table">
            <thead>
              <tr>
                <th>9.1 งบประมาณอนุมัติ</th>
                <th>9.2 เบิกจ่ายจริง</th>
                <th>ร้อยละการเบิกจ่าย</th>
                <th>ความก้าวหน้า</th>
                <th>10. สถานะโครงการ</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>฿${project.approvedBudget.toLocaleString('th-TH')}</td>
                <td style="color: #b45309;">฿${project.spentBudget.toLocaleString('th-TH')}</td>
                <td>${spentPercent}%</td>
                <td>
                  ${project.progressPercentage}%
                  <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width: ${Math.min(100, Math.max(0, project.progressPercentage))}%;"></div>
                  </div>
                </td>
                <td>
                  <span style="color: #0f766e; font-weight: 700;">${STATUS_THAI_MAP[project.status] || project.status}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 8. ปัญหา/อุปสรรค และแนวทางการแก้ไข -->
        <div class="report-section page-break-inside-avoid">
          <div class="section-title">7. ปัญหา/อุปสรรค และแนวทางการแก้ไข</div>
          <div class="content-box" style="background: #fffbeb; border-color: #fde68a;">
            <p style="margin: 0; color: #78350f; white-space: pre-line;">${project.issuesAndSolutions || 'ไม่มีปัญหาและอุปสรรคในการดำเนินงาน'}</p>
          </div>
        </div>

        <!-- 9. ประโยชน์ที่สาธารณชนได้รับ และ พื้นที่ดำเนินการ -->
        <div class="report-section page-break-inside-avoid">
          <div class="section-title">8. ประโยชน์ที่สาธารณชนได้รับ และ พื้นที่ดำเนินการ</div>
          <table class="info-table">
            <tr>
              <td class="label">ประโยชน์ที่สาธารณชนได้รับ</td>
              <td class="value">${project.targetGroup || '-'}</td>
            </tr>
            <tr>
              <td class="label">พื้นที่ดำเนินการ</td>
              <td class="value">${project.location || '-'}</td>
            </tr>
            <tr>
              <td class="label">ผู้รับผิดชอบโครงการ</td>
              <td class="value">${project.responsiblePerson} (โทรศัพท์: ${project.contactPhone || '-'})</td>
            </tr>
            <tr>
              <td class="label">ผู้บันทึกข้อมูล</td>
              <td class="value">${project.createdByName || '-'} (บันทึกเมื่อ: ${project.createdAt?.substring(0, 10) || '-'})</td>
            </tr>
          </table>
        </div>

        <!-- 10. รูปถ่ายโครงการ -->
        ${photosHtml}

        <!-- 11. เอกสารแนบ -->
        ${pdfAttachmentHtml}

        <!-- 12. ส่วนลงนามรับรองรายงาน (Signatures) -->
        <div class="signature-section">
          <table class="signature-table">
            <tr>
              <td>
                <div>ลงชื่อ ................................................................</div>
                <div class="sign-line"></div>
                <div>( ${project.responsiblePerson || '................................................................'} )</div>
                <div style="margin-top: 4px; color: #475569;">ผู้รับผิดชอบโครงการ / ผู้รายงาน</div>
                <div style="margin-top: 4px; color: #64748b; font-size: 12px;">วันที่ ........ / ........ / ................</div>
              </td>
              <td>
                <div>ลงชื่อ ................................................................</div>
                <div class="sign-line"></div>
                <div>( ................................................................ )</div>
                <div style="margin-top: 4px; color: #475569;">หัวหน้าหน่วยงาน / ผู้รับรองรายงาน</div>
                <div style="margin-top: 4px; color: #64748b; font-size: 12px;">วันที่ ........ / ........ / ................</div>
              </td>
            </tr>
          </table>
        </div>
      </div>
    </body>
    </html>
  `;

  printHtmlContent(html);
}

// --- 5. PRINT PROJECTS LIST REPORT (A4 Portrait แนวตั้ง สวยงาม เป็นทางการ) ---
export function printProjectsListReport(projects: Project[], customTitle?: string) {
  if (!projects || projects.length === 0) {
    return;
  }

  const reportTitle = customTitle || 'แบบรายงานติดตามความก้าวหน้าโครงการตามแผนพัฒนาการศึกษาและแผนปฏิบัติการด้านการศึกษา';
  const todayThai = formatThaiDate(new Date().toISOString());

  // Calculate totals
  const totalProjects = projects.length;
  const totalApproved = projects.reduce((sum, p) => sum + (p.approvedBudget || 0), 0);
  const totalSpent = projects.reduce((sum, p) => sum + (p.spentBudget || 0), 0);
  const spentPercent = totalApproved > 0 ? ((totalSpent / totalApproved) * 100).toFixed(1) : '0';
  const avgProgress = totalProjects > 0 ? (projects.reduce((sum, p) => sum + (p.progressPercentage || 0), 0) / totalProjects).toFixed(1) : '0';

  const rowsHtml = projects.map((p, idx) => {
    const pSpentPercent = p.approvedBudget > 0 ? ((p.spentBudget / p.approvedBudget) * 100).toFixed(1) : '0';
    let statusClass = 'status-default';
    if (p.status === 'completed') statusClass = 'status-completed';
    else if (p.status === 'in_progress') statusClass = 'status-in-progress';
    else if (p.status === 'delayed') statusClass = 'status-delayed';

    let achieveText = '-';
    let achieveClass = '';
    if (p.targetAchievement === 'achieved') {
      achieveText = '✓ บรรลุเป้าหมาย';
      achieveClass = 'text-achieved';
    } else if (p.targetAchievement === 'not_achieved') {
      achieveText = '✕ ไม่บรรลุเป้าหมาย';
      achieveClass = 'text-not-achieved';
    }

    return `
      <tr>
        <td class="text-center font-mono">${idx + 1}</td>
        <td class="font-mono font-bold" style="color: #78350f;">${p.code}</td>
        <td>
          <div class="project-name">${p.name}</div>
          <div class="project-flagship">📌 ${p.keyFlagshipProjectTitle || '-'}</div>
        </td>
        <td>${p.agencyName || '-'}</td>
        <td class="text-right">฿${(p.approvedBudget || 0).toLocaleString('th-TH')}</td>
        <td class="text-right">฿${(p.spentBudget || 0).toLocaleString('th-TH')} <span class="sub-percent">(${pSpentPercent}%)</span></td>
        <td class="text-center font-bold">${p.progressPercentage || 0}%</td>
        <td class="text-center"><span class="status-badge ${statusClass}">${STATUS_THAI_MAP[p.status] || p.status}</span></td>
        <td class="text-center ${achieveClass}">${achieveText}</td>
      </tr>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <title>${reportTitle}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');

        @page {
          size: portrait;
          size: A4 portrait;
          margin: 10mm 8mm 10mm 8mm;
        }

        @media print {
          @page {
            size: portrait;
            size: A4 portrait;
            margin: 10mm 8mm 10mm 8mm;
          }

          html, body {
            width: 210mm !important;
            max-width: 210mm !important;
            margin: 0 auto !important;
            padding: 0 !important;
            background: #ffffff !important;
          }
        }

        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        html {
          width: 210mm;
          margin: 0 auto;
        }

        body {
          font-family: 'Sarabun', 'TH Sarabun PSK', sans-serif;
          font-size: 11px;
          line-height: 1.4;
          color: #0f172a;
          background: #ffffff;
          margin: 0 auto;
          padding: 0;
          width: 210mm;
          max-width: 210mm;
        }

        .header-print {
          text-align: center;
          border-bottom: 2px solid #0f172a;
          padding-bottom: 8px;
          margin-bottom: 10px;
        }

        .emblem-img {
          height: 48px;
          width: 48px;
          object-fit: contain;
          margin-bottom: 3px;
        }

        .header-title-main {
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 2px 0;
        }

        .header-title-sub {
          font-size: 12px;
          font-weight: 600;
          color: #334155;
          margin: 0 0 2px 0;
        }

        .meta-bar {
          display: flex;
          justify-content: space-between;
          font-size: 10.5px;
          color: #475569;
          margin-top: 6px;
          background: #f8fafc;
          padding: 4px 10px;
          border-radius: 4px;
          border: 1px solid #e2e8f0;
        }

        /* Summary Stat Cards */
        .summary-grid {
          display: table;
          width: 100%;
          table-layout: fixed;
          margin-bottom: 10px;
          border-spacing: 6px 0;
        }

        .summary-card {
          display: table-cell;
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 5px;
          padding: 6px 8px;
          text-align: center;
        }

        .summary-label {
          font-size: 9.5px;
          color: #64748b;
          margin-bottom: 2px;
        }

        .summary-value {
          font-size: 12.5px;
          font-weight: 700;
          color: #0f172a;
        }

        /* Table */
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10.5px;
          margin-top: 4px;
        }

        thead {
          display: table-header-group;
        }

        tr {
          page-break-inside: avoid;
        }

        th, td {
          border: 1px solid #94a3b8;
          padding: 4px 5px;
          vertical-align: top;
        }

        th {
          background-color: #f1f5f9;
          font-weight: 700;
          color: #1e293b;
          text-align: center;
          font-size: 10.5px;
        }

        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-mono { font-family: ui-monospace, monospace; }
        .font-bold { font-weight: 700; }

        .project-name {
          font-weight: 600;
          color: #0f172a;
          line-height: 1.3;
        }

        .project-flagship {
          font-size: 9.5px;
          color: #78350f;
          margin-top: 2px;
        }

        .sub-percent {
          font-size: 9.5px;
          color: #64748b;
        }

        .status-badge {
          display: inline-block;
          padding: 1px 4px;
          border-radius: 3px;
          font-size: 9.5px;
          font-weight: 600;
        }

        .status-completed { background: #dcfce7; color: #166534; }
        .status-in-progress { background: #e0f2fe; color: #0369a1; }
        .status-delayed { background: #fef3c7; color: #92400e; }
        .status-default { background: #f1f5f9; color: #475569; }

        .text-achieved { color: #047857; font-weight: 700; font-size: 10px; }
        .text-not-achieved { color: #b91c1c; font-weight: 700; font-size: 10px; }

        /* Signatures block */
        .footer-signatures {
          margin-top: 20px;
          display: table;
          width: 100%;
          page-break-inside: avoid;
        }

        .sign-col {
          display: table-cell;
          width: 50%;
          text-align: center;
          padding: 8px 15px;
          font-size: 11px;
        }

        .sign-dotted {
          border-bottom: 1px dotted #475569;
          width: 70%;
          margin: 30px auto 5px auto;
        }
      </style>
    </head>
    <body>
      <div class="header-print">
        <img src="${logoImg}" alt="ตราสำนักงานศึกษาธิการจังหวัดฉะเชิงเทรา" class="emblem-img" />
        <div class="header-title-main">${reportTitle}</div>
        <div class="header-title-sub">สำนักงานศึกษาธิการจังหวัดฉะเชิงเทรา</div>
        <div class="meta-bar">
          <span><strong>จำนวนโครงการ:</strong> ${totalProjects} โครงการ</span>
          <span><strong>วันที่พิมพ์รายงาน:</strong> ${todayThai}</span>
          <span><strong>การจัดวางหน้ากระดาษ:</strong> A4 แนวตั้ง (Portrait)</span>
        </div>
      </div>

      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-label">จำนวนโครงการ</div>
          <div class="summary-value">${totalProjects} โครงการ</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">งบประมาณอนุมัติรวม</div>
          <div class="summary-value">฿${totalApproved.toLocaleString('th-TH')}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">งบประมาณเบิกจ่ายรวม</div>
          <div class="summary-value" style="color: #b45309;">฿${totalSpent.toLocaleString('th-TH')}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">ร้อยละการเบิกจ่าย</div>
          <div class="summary-value" style="color: #0f766e;">${spentPercent}%</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">ความก้าวหน้าเฉลี่ย</div>
          <div class="summary-value" style="color: #2563eb;">${avgProgress}%</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 4%;">ลำดับ</th>
            <th style="width: 11%;">รหัสโครงการ</th>
            <th style="width: 32%;">ชื่อโครงการ / โครงการสำคัญที่สอดคล้อง</th>
            <th style="width: 17%;">หน่วยงานรับผิดชอบ</th>
            <th style="width: 11%;">งบอนุมัติ</th>
            <th style="width: 11%;">เบิกจ่ายจริง</th>
            <th style="width: 6%;">ก้าวหน้า</th>
            <th style="width: 10%;">สถานะ</th>
            <th style="width: 8%;">ผลสัมฤทธิ์</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div class="footer-signatures">
        <div class="sign-col">
          <div>ลงชื่อ ................................................................</div>
          <div class="sign-dotted"></div>
          <div>( ................................................................ )</div>
          <div style="color: #475569; font-size: 10px; margin-top: 2px;">ผู้จัดทำรายงาน / เจ้าหน้าที่ผู้รับผิดชอบ</div>
          <div style="color: #64748b; font-size: 9.5px; margin-top: 2px;">วันที่ ........ / ........ / ................</div>
        </div>
        <div class="sign-col">
          <div>ลงชื่อ ................................................................</div>
          <div class="sign-dotted"></div>
          <div>( ................................................................ )</div>
          <div style="color: #475569; font-size: 10px; margin-top: 2px;">หัวหน้าหน่วยงาน / ผู้เห็นชอบรายงาน</div>
          <div style="color: #64748b; font-size: 9.5px; margin-top: 2px;">วันที่ ........ / ........ / ................</div>
        </div>
      </div>
    </body>
    </html>
  `;

  printHtmlContent(html);
}

// --- 6. PRINT GENERAL REPORT / TABLE ASSISTANT (A4 Portrait แนวตั้ง สวยงาม) ---
export function printPDFReport(elementId = 'printable-report-area', reportTitle = 'รายงานติดตามความก้าวหน้าโครงการ สำนักงานศึกษาธิการจังหวัดฉะเชิงเทรา') {
  const elem = document.getElementById(elementId);
  if (!elem) {
    window.print();
    return;
  }

  // Clone element to sanitize for print
  const clone = elem.cloneNode(true) as HTMLElement;

  // Remove interactive elements
  clone.querySelectorAll('button, input, select, .print\\:hidden, [role="button"]').forEach(node => {
    node.remove();
  });

  const todayThai = formatThaiDate(new Date().toISOString());

  const html = `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <title>${reportTitle}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
        
        @page {
          size: portrait;
          size: A4 portrait;
          margin: 10mm 12mm 10mm 12mm;
        }

        @media print {
          @page {
            size: portrait;
            size: A4 portrait;
            margin: 10mm 12mm 10mm 12mm;
          }

          html, body {
            width: 210mm !important;
            max-width: 210mm !important;
            margin: 0 auto !important;
            padding: 0 !important;
            background: #ffffff !important;
          }
        }

        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        html {
          width: 210mm;
          margin: 0 auto;
        }

        body {
          font-family: 'Sarabun', 'TH Sarabun PSK', sans-serif;
          font-size: 12px;
          line-height: 1.45;
          color: #0f172a;
          background: #ffffff;
          padding: 0;
          margin: 0 auto;
          width: 210mm;
          max-width: 210mm;
        }

        .header-print {
          text-align: center;
          border-bottom: 2px solid #0f172a;
          padding-bottom: 10px;
          margin-bottom: 14px;
        }

        .header-print img {
          height: 52px;
          width: 52px;
          object-fit: contain;
          margin-bottom: 4px;
        }

        .header-print h1 {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          margin: 2px 0;
        }

        .header-print h2 {
          font-size: 13px;
          font-weight: 600;
          color: #334155;
          margin: 2px 0;
        }

        .meta-bar {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #475569;
          margin-top: 6px;
          background: #f8fafc;
          padding: 4px 8px;
          border-radius: 4px;
          border: 1px solid #e2e8f0;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8px;
          font-size: 11.5px;
        }

        thead {
          display: table-header-group;
        }

        tr {
          page-break-inside: avoid;
        }

        th, td {
          border: 1px solid #cbd5e1;
          padding: 5px 6px;
          text-align: left;
          vertical-align: middle;
        }

        th {
          background-color: #f1f5f9;
          font-weight: 600;
          color: #1e293b;
        }

        .text-right { text-align: right; }
        .text-center { text-align: center; }

        /* General card and badge print styles */
        .badge {
          display: inline-block;
          padding: 1px 5px;
          border-radius: 3px;
          font-size: 10px;
          font-weight: 600;
        }

        .badge-success { background: #dcfce7; color: #166534; }
        .badge-warning { background: #fef3c7; color: #92400e; }
        .badge-info { background: #e0f2fe; color: #075985; }

        .footer-sign {
          margin-top: 24px;
          display: table;
          width: 100%;
          page-break-inside: avoid;
        }

        .sign-col {
          display: table-cell;
          width: 50%;
          text-align: center;
          padding: 10px 15px;
          font-size: 12px;
        }

        .sign-dotted {
          border-bottom: 1px dotted #475569;
          width: 70%;
          margin: 35px auto 6px auto;
        }
      </style>
    </head>
    <body>
      <div class="header-print">
        <img src="${logoImg}" alt="ตราสำนักงานศึกษาธิการจังหวัดฉะเชิงเทรา" />
        <h1>${reportTitle}</h1>
        <h2>สำนักงานศึกษาธิการจังหวัดฉะเชิงเทรา</h2>
        <div class="meta-bar">
          <span>รายงานข้อมูลตามแผนพัฒนาการศึกษาและแผนปฏิบัติการด้านการศึกษา</span>
          <span>ข้อมูล ณ วันที่: ${todayThai}</span>
        </div>
      </div>

      <div class="report-body">
        ${clone.innerHTML}
      </div>

      <div class="footer-sign">
        <div class="sign-col">
          <div>ลงชื่อ ................................................................</div>
          <div class="sign-dotted"></div>
          <div>( ................................................................ )</div>
          <div style="color: #64748b; font-size: 11px; margin-top: 2px;">ผู้จัดทำรายงาน</div>
        </div>
        <div class="sign-col">
          <div>ลงชื่อ ................................................................</div>
          <div class="sign-dotted"></div>
          <div>( ................................................................ )</div>
          <div style="color: #64748b; font-size: 11px; margin-top: 2px;">หัวหน้าหน่วยงาน / ผู้เห็นชอบ</div>
        </div>
      </div>
    </body>
    </html>
  `;

  printHtmlContent(html);
}

