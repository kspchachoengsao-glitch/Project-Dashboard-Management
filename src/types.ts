export type Role = 'guest' | 'user' | 'admin';

export type ProjectStatus = 'not_started' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  email: string;
  role: Role;
  agencyId: string;
  agencyName: string;
  position?: string;
  enabled: boolean;
  lastLogin?: string;
  avatarUrl?: string;
}

export interface Agency {
  id: string;
  code: string;
  name: string;
  shortName?: string;
  order: number;
  enabled: boolean;
}

export interface StrategicIssue {
  id: string;
  number: number;
  title: string;
  description?: string;
  enabled: boolean;
}

export interface KeyFlagshipProject {
  id: string;
  number: number;
  title: string;
  description?: string;
  enabled: boolean;
}

export interface QuarterInfo {
  id: string;
  quarterNumber: 1 | 2 | 3 | 4;
  title: string;
  monthsText: string;
}

export interface ProjectPdfFile {
  name: string;
  size: number; // in bytes
  dataUrl: string;
  cacheControl: string; // "public, max-age=31536000"
  uploadedAt: string;
}

export interface ProjectPhoto {
  id: string;
  name: string;
  originalDataUrl: string; // WebP compressed <= 1080px, 80% quality
  originalSize: number;
  thumbnailUrl: string; // WebP thumbnail <= 250px, 70% quality (~20-50 KB)
  thumbnailSize: number;
  width: number;
  height: number;
  cacheControl: string; // "public, max-age=31536000"
  uploadedAt: string;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  agencyId: string;
  agencyName: string;
  strategicIssueId: string;
  strategicIssueTitle: string;
  keyFlagshipProjectId: string;
  keyFlagshipProjectTitle: string;
  goal?: string;              // 5. เป้าหมายโครงการ (Goal)
  mainIndicator?: string;     // ตัวชี้วัดหลัก (เดิม)
  quarter: 1 | 2 | 3 | 4;
  approvedBudget: number;     // งบประมาณอนุมัติ (บาท)
  spentBudget: number;        // งบประมาณเบิกจ่ายจริง (บาท)
  progressPercentage: number; // ความก้าวหน้า (0-100%)
  status: ProjectStatus;      // สถานะโครงการ
  fiscalYear: number;         // ปีงบประมาณ
  targetGroup: string;        // ประโยชน์ที่สาธารณชนได้รับ
  location: string;           // พื้นที่ดำเนินการ
  responsiblePerson: string;  // ผู้รับผิดชอบ
  contactPhone?: string;
  startDate: string;          // วันเริ่มต้น (YYYY-MM-DD)
  endDate: string;            // วันสิ้นสุด (YYYY-MM-DD)
  objectives?: string;        // 4. วัตถุประสงค์ของโครงการ
  quantitativeKPI?: string;   // 6.1 ตัวชี้วัดโครงการ เชิงปริมาณ (Quantitative KPI)
  qualitativeKPI?: string;    // 6.2 ตัวชี้วัดโครงการ เชิงคุณภาพ (Qualitative KPI)
  projectPerformance?: string;// 7. ผลการดำเนินงานโครงการ/กิจกรรม
  kpiResultQuantitative?: string; // 8.1 ผลการดำเนินงานตามตัวชี้วัด เชิงปริมาณ
  kpiResultQualitative?: string;  // 8.2 ผลการดำเนินงานตามตัวชี้วัด เชิงคุณภาพ
  targetAchievement?: 'achieved' | 'not_achieved' | ''; // การประเมินเป้าหมาย (บรรลุผลตามเป้าหมาย / ไม่บรรลุผลตามเป้าหมาย)
  outcomes?: string;          // ผลลัพธ์
  outputOutcome: string;      // ผลผลิต/ผลลัพธ์
  issuesAndSolutions?: string;// ปัญหาและอุปสรรค
  pdfFile?: ProjectPdfFile;   // ไฟล์ PDF (ไม่เกิน 2MB)
  photos?: ProjectPhoto[];    // รูปถ่ายโครงการสูงสุด 4 รูป
  createdByUserId: string;
  createdByName: string;      // บันทึกโดย
  createdAt: string;          // วันที่บันทึก
  updatedAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: Role;
  agencyName: string;
  action: 'LOGIN' | 'LOGOUT' | 'ADD_PROJECT' | 'EDIT_PROJECT' | 'DELETE_PROJECT' | 'USER_CREATE' | 'USER_UPDATE' | 'USER_TOGGLE' | 'USER_DELETE' | 'RESET_PASSWORD' | 'MASTER_DATA_UPDATE' | 'EXPORT_DATA';
  details: string;
  ipAddress?: string;
}

export interface ProjectFilterCriteria {
  searchQuery: string;
  fiscalYear: string; // 'all' or '2568' etc.
  agencyId: string;
  strategicIssueId: string;
  keyFlagshipProjectId: string;
  quarter: string; // 'all' or '1','2','3','4'
  status: string; // 'all' or ProjectStatus
  targetAchievement?: string; // 'all' | 'achieved' | 'not_achieved' | 'unassessed'
  minBudget?: number;
  maxBudget?: number;
}
