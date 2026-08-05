export type Role = 'guest' | 'user' | 'admin';

export type ProjectStatus = 'not_started' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';

export interface User {
  id: string;
  username: string;
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
  goal?: string;              // เป้าประสงค์
  mainIndicator?: string;     // ตัวชี้วัดหลัก
  quarter: 1 | 2 | 3 | 4;
  approvedBudget: number;     // งบประมาณอนุมัติ (บาท)
  spentBudget: number;        // งบประมาณเบิกจ่ายจริง (บาท)
  progressPercentage: number; // ความก้าวหน้า (0-100%)
  status: ProjectStatus;      // สถานะโครงการ
  fiscalYear: number;         // ปีงบประมาณ
  targetGroup: string;        // กลุ่มเป้าหมาย
  location: string;           // พื้นที่ดำเนินการ
  responsiblePerson: string;  // ผู้รับผิดชอบ
  contactPhone?: string;
  startDate: string;          // วันเริ่มต้น (YYYY-MM-DD)
  endDate: string;            // วันสิ้นสุด (YYYY-MM-DD)
  objectives?: string;        // วัตถุประสงค์ของโครงการ
  quantitativeKPI?: string;   // ตัวชี้วัดเชิงปริมาณ
  qualitativeKPI?: string;    // ตัวชี้วัดเชิงคุณภาพ
  outcomes?: string;          // ผลลัพธ์
  outputOutcome: string;      // ผลผลิต/ผลลัพธ์
  issuesAndSolutions?: string;// ปัญหาและอุปสรรค
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
  minBudget?: number;
  maxBudget?: number;
}
