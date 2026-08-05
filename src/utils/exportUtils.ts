import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Project, AuditLogEntry } from '../types';

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
    '1. หน่วยงานที่รับผิดชอบ': p.agencyName,
    '2. ประเด็นยุทธศาสตร์': p.strategicIssueTitle,
    '3. โครงการสำคัญที่สอดคล้อง': p.keyFlagshipProjectTitle,
    'รหัสโครงการ': p.code,
    'ชื่อโครงการ': p.name,
    '4. เป้าประสงค์': p.goal || '-',
    '5. ตัวชี้วัดโครงการ': p.mainIndicator || '-',
    '6. งบประมาณอนุมัติ (บาท)': p.approvedBudget,
    '6.1 งบเบิกจ่ายจริง (บาท)': p.spentBudget,
    '7. สถานะโครงการ': STATUS_THAI_MAP[p.status] || p.status,
    'ความก้าวหน้า (%)': p.progressPercentage,
    '8. วันเริ่มต้น': p.startDate,
    '9. วันสิ้นสุด': p.endDate,
    '10. วัตถุประสงค์ของโครงการ': p.objectives || '-',
    '11. ตัวชี้วัดเชิงปริมาณ': p.quantitativeKPI || '-',
    '12. ตัวชี้วัดเชิงคุณภาพ': p.qualitativeKPI || '-',
    '13. ผลลัพธ์': p.outcomes || p.outputOutcome || '-',
    'ผู้รับผิดชอบโครงการ': p.responsiblePerson,
    'เบอร์ติดต่อ': p.contactPhone || '-',
    '14. บันทึกโดย': p.createdByName,
    '15. วันที่บันทึก': p.createdAt ? p.createdAt.substring(0, 10) : '-',
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

// --- 4. PRINT / PDF EXPORT ASSISTANT ---
export function printPDFReport(elementId = 'printable-report-area') {
  const elem = document.getElementById(elementId);
  if (!elem) {
    window.print();
    return;
  }
  
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    window.print();
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <title>รายงานสรุปติดตามโครงการ - สำนักงานศึกษาธิการจังหวัดฉะเชิงเทรา</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap');
        body {
          font-family: 'Sarabun', 'TH Sarabun PSK', sans-serif;
          padding: 20px;
          color: #1e293b;
        }
        h1, h2, h3 { margin: 4px 0; }
        .header-box { text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
        th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
        th { background-color: #f1f5f9; font-weight: 600; }
        .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 11px; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        @media print {
          @page { size: A4 landscape; margin: 10mm; }
        }
      </style>
    </head>
    <body>
      ${elem.innerHTML}
      <script>
        window.onload = function() {
          window.print();
          setTimeout(() => window.close(), 500);
        }
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}
