import { Agency, StrategicIssue, KeyFlagshipProject, User, Project, AuditLogEntry } from '../types';
import {
  INITIAL_AGENCIES,
  INITIAL_STRATEGIC_ISSUES,
  INITIAL_KEY_FLAGSHIP_PROJECTS,
  INITIAL_USERS,
  INITIAL_PROJECTS,
  INITIAL_AUDIT_LOGS
} from '../data/initialData';
import { db, doc, setDoc, getDocs, collection, onSnapshot } from '../lib/firebase';
import { FileStorageService } from './fileStorage';

const KEYS = {
  AGENCIES: 'system_agencies_v1',
  STRATEGIC_ISSUES: 'system_strategic_issues_v1',
  KEY_PROJECTS: 'system_key_projects_v1',
  USERS: 'system_users_v1',
  PROJECTS: 'system_projects_v1',
  AUDIT_LOGS: 'system_audit_logs_v1',
  CURRENT_USER: 'system_current_user_v1',
};

export type SyncStatus = 'connected' | 'syncing' | 'error' | 'offline';

let currentSyncStatus: SyncStatus = 'connected';
let syncStatusMessage = 'เชื่อมต่อฐานข้อมูลคลาวด์เรียบร้อย (บันทึกถาวร)';
const syncListeners: ((status: SyncStatus, message: string) => void)[] = [];

export function subscribeSyncStatus(listener: (status: SyncStatus, message: string) => void) {
  syncListeners.push(listener);
  listener(currentSyncStatus, syncStatusMessage);
  return () => {
    const idx = syncListeners.indexOf(listener);
    if (idx !== -1) syncListeners.splice(idx, 1);
  };
}

function updateSyncStatus(status: SyncStatus, message: string) {
  currentSyncStatus = status;
  syncStatusMessage = message;
  syncListeners.forEach(fn => fn(status, message));
}

export function getSyncStatus(): { status: SyncStatus; message: string } {
  return { status: currentSyncStatus, message: syncStatusMessage };
}

/**
 * Deep cleans an object/array to remove all `undefined` values before passing to Firestore.
 * Firestore strictly rejects documents containing `undefined` properties.
 */
export function cleanForFirestore<T>(data: T): T {
  if (data === undefined) return null as unknown as T;
  return JSON.parse(JSON.stringify(data, (key, value) => {
    return value === undefined ? null : value;
  }));
}

// Helper for Safe LocalStorage
function getItem<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.warn(`Error reading localStorage key ${key}`, e);
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing to localStorage key ${key}`, e);
  }
}

// Sync helper to Firestore with full sanitization and error recovery
async function syncCollectionToFirestore(colName: string, items: any[]): Promise<boolean> {
  updateSyncStatus('syncing', `กำลังบันทึกข้อมูล ${colName} ไปยังคลาวด์...`);
  try {
    const cleanedItems = cleanForFirestore(items);
    const docRef = doc(db, 'app_data', colName);
    await setDoc(docRef, {
      items: cleanedItems,
      updatedAt: new Date().toISOString(),
      timestamp: Date.now(),
    });
    updateSyncStatus('connected', 'บันทึกข้อมูลลงฐานข้อมูลคลาวด์เรียบร้อยแล้ว');
    return true;
  } catch (err: any) {
    console.error(`Firestore sync error for ${colName}:`, err);
    updateSyncStatus('error', err?.message || 'เกิดข้อผิดพลาดในการบันทึกไปยังคลาวด์');
    return false;
  }
}

// Initialize Firestore Real-time Listeners
let isFirestoreInitialized = false;

export function initFirestoreListeners(onDataUpdated?: () => void) {
  if (isFirestoreInitialized) return;
  isFirestoreInitialized = true;

  const collections = [
    { key: KEYS.AGENCIES, col: 'agencies', fallback: INITIAL_AGENCIES },
    { key: KEYS.STRATEGIC_ISSUES, col: 'strategicIssues', fallback: INITIAL_STRATEGIC_ISSUES },
    { key: KEYS.KEY_PROJECTS, col: 'keyProjects', fallback: INITIAL_KEY_FLAGSHIP_PROJECTS },
    { key: KEYS.USERS, col: 'users', fallback: INITIAL_USERS },
    { key: KEYS.PROJECTS, col: 'projects', fallback: [] },
    { key: KEYS.AUDIT_LOGS, col: 'auditLogs', fallback: INITIAL_AUDIT_LOGS },
  ];

  collections.forEach(({ key, col, fallback }) => {
    try {
      const docRef = doc(db, 'app_data', col);
      onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (Array.isArray(data?.items)) {
            setItem(key, data.items);
            updateSyncStatus('connected', 'เชื่อมต่อฐานข้อมูลคลาวด์เรียบร้อย (บันทึกถาวร)');
            if (onDataUpdated) onDataUpdated();
          }
        } else {
          // Document doesn't exist yet on Firestore: seed clean initial data
          const currentLocal = getItem(key, fallback);
          syncCollectionToFirestore(col, currentLocal);
        }
      }, (err) => {
        console.warn(`Firestore snapshot listener error for ${col}:`, err);
        updateSyncStatus('error', 'การเชื่อมต่อฐานข้อมูลคลาวด์ขัดข้อง');
      });
    } catch (err) {
      console.warn(`Failed to attach snapshot listener for ${col}:`, err);
      updateSyncStatus('error', 'ระบบเครือข่ายขัดข้อง');
    }
  });
}

export const StorageService = {
  getAgencies(): Agency[] {
    return getItem<Agency[]>(KEYS.AGENCIES, INITIAL_AGENCIES);
  },
  async saveAgencies(agencies: Agency[]): Promise<boolean> {
    const cleaned = cleanForFirestore(agencies);
    setItem(KEYS.AGENCIES, cleaned);
    return await syncCollectionToFirestore('agencies', cleaned);
  },

  getStrategicIssues(): StrategicIssue[] {
    return getItem<StrategicIssue[]>(KEYS.STRATEGIC_ISSUES, INITIAL_STRATEGIC_ISSUES);
  },
  async saveStrategicIssues(issues: StrategicIssue[]): Promise<boolean> {
    const cleaned = cleanForFirestore(issues);
    setItem(KEYS.STRATEGIC_ISSUES, cleaned);
    return await syncCollectionToFirestore('strategicIssues', cleaned);
  },

  getKeyProjects(): KeyFlagshipProject[] {
    return getItem<KeyFlagshipProject[]>(KEYS.KEY_PROJECTS, INITIAL_KEY_FLAGSHIP_PROJECTS);
  },
  async saveKeyProjects(keyProjects: KeyFlagshipProject[]): Promise<boolean> {
    const cleaned = cleanForFirestore(keyProjects);
    setItem(KEYS.KEY_PROJECTS, cleaned);
    return await syncCollectionToFirestore('keyProjects', cleaned);
  },

  getUsers(): User[] {
    return getItem<User[]>(KEYS.USERS, INITIAL_USERS);
  },
  async saveUsers(users: User[]): Promise<boolean> {
    const cleaned = cleanForFirestore(users);
    setItem(KEYS.USERS, cleaned);
    return await syncCollectionToFirestore('users', cleaned);
  },

  _inMemoryProjects: [] as Project[],

  getProjects(): Project[] {
    const list = getItem<Project[]>(KEYS.PROJECTS, []);
    // Ensure any legacy demo projects with 'prj-2568-00' do not pollute the view
    let result = list;
    if (list.some(p => p.id.startsWith('prj-2568-00'))) {
      result = list.filter(p => !p.id.startsWith('prj-2568-00'));
      setItem(KEYS.PROJECTS, result);
    }
    // Merge any active in-memory dataUrls for files
    if (this._inMemoryProjects && this._inMemoryProjects.length > 0) {
      const memMap = new Map<string, Project>(this._inMemoryProjects.map((p: Project) => [p.id, p]));
      return result.map(p => {
        const mem = memMap.get(p.id);
        if (mem) {
          return {
            ...p,
            pdfFile: p.pdfFile ? { ...p.pdfFile, dataUrl: mem.pdfFile?.dataUrl || p.pdfFile.dataUrl } : undefined,
            photos: p.photos ? p.photos.map((ph, idx) => ({
              ...ph,
              originalDataUrl: mem.photos?.[idx]?.originalDataUrl || ph.originalDataUrl
            })) : []
          };
        }
        return p;
      });
    }
    return result;
  },
  async saveProjects(projects: Project[]): Promise<boolean> {
    // 1. Process and save any heavy binary files (PDF and high-res photos) to FileStorageService
    for (const project of projects) {
      if (project.pdfFile && project.pdfFile.dataUrl) {
        const fileId = await FileStorageService.savePdf(project.id, project.pdfFile);
        project.pdfFile.fileId = fileId;
      }
      if (project.photos && project.photos.length > 0) {
        await FileStorageService.savePhotos(project.id, project.photos);
      }
    }

    // Keep active in-memory copy
    this._inMemoryProjects = projects;

    // 2. Prepare lightweight stripped copy for app_data/projects in Firestore and LocalStorage
    // Stripping the heavy multi-megabyte dataUrl strings ensures Firestore 1 MiB document limit
    // and LocalStorage 5 MB quota are never exceeded.
    const lightweightProjects = projects.map(p => {
      const copy = { ...p };
      if (copy.pdfFile) {
        copy.pdfFile = {
          name: copy.pdfFile.name,
          size: copy.pdfFile.size,
          fileId: copy.pdfFile.fileId || `pdf_${copy.id}`,
          cacheControl: copy.pdfFile.cacheControl || 'public, max-age=31536000',
          uploadedAt: copy.pdfFile.uploadedAt || new Date().toISOString(),
        };
      }
      if (copy.photos && copy.photos.length > 0) {
        copy.photos = copy.photos.map(ph => ({
          id: ph.id,
          name: ph.name,
          originalSize: ph.originalSize,
          thumbnailUrl: ph.thumbnailUrl,
          thumbnailSize: ph.thumbnailSize,
          width: ph.width,
          height: ph.height,
          cacheControl: ph.cacheControl || 'public, max-age=31536000',
          uploadedAt: ph.uploadedAt || new Date().toISOString(),
        }));
      }
      return copy;
    });

    const cleaned = cleanForFirestore(lightweightProjects);
    setItem(KEYS.PROJECTS, cleaned);
    return await syncCollectionToFirestore('projects', cleaned);
  },

  async getPdfDataUrl(projectId: string, fileId?: string): Promise<string | null> {
    return await FileStorageService.getPdfDataUrl(projectId, fileId);
  },

  async getPhotoDataUrl(photoId: string): Promise<string | null> {
    return await FileStorageService.getPhotoOriginalDataUrl(photoId);
  },

  getAuditLogs(): AuditLogEntry[] {
    return getItem<AuditLogEntry[]>(KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  },
  async addAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<AuditLogEntry> {
    const logs = this.getAuditLogs();
    const newLog: AuditLogEntry = {
      ...entry,
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    const updated = [newLog, ...logs].slice(0, 300); // keep up to 300 logs
    const cleaned = cleanForFirestore(updated);
    setItem(KEYS.AUDIT_LOGS, cleaned);
    syncCollectionToFirestore('auditLogs', cleaned);
    return newLog;
  },

  getCurrentUser(): User | null {
    return getItem<User | null>(KEYS.CURRENT_USER, null); // Default is null = GUEST!
  },
  setCurrentUser(user: User | null): void {
    setItem(KEYS.CURRENT_USER, user);
  },

  /**
   * Clears out only the mock/demo test projects (e.g. prj-2568-001..007, prj-1788855465103)
   * while keeping any real projects added by the user.
   */
  async clearTestProjects(): Promise<{ removedCount: number; remainingCount: number }> {
    const currentProjects = this.getProjects();
    const remaining = currentProjects.filter(p => {
      const isDemoId = p.id.startsWith('prj-2568-00') || p.id === 'prj-1788855465103';
      const isTestWord = p.name.includes('โครงการทอสอบ') || p.name.includes('โครงการทดสอบ') || p.code === 'PRJ-68-569';
      return !isDemoId && !isTestWord;
    });
    const removedCount = currentProjects.length - remaining.length;
    await this.saveProjects(remaining);
    return { removedCount, remainingCount: remaining.length };
  },

  /**
   * Resets projects to completely empty array ([])
   */
  async clearAllProjects(): Promise<void> {
    await this.saveProjects([]);
  },

  /**
   * Force sync all local collections to Firestore immediately
   */
  async forceSyncAll(): Promise<boolean> {
    const p1 = await this.saveAgencies(this.getAgencies());
    const p2 = await this.saveStrategicIssues(this.getStrategicIssues());
    const p3 = await this.saveKeyProjects(this.getKeyProjects());
    const p4 = await this.saveUsers(this.getUsers());
    const p5 = await this.saveProjects(this.getProjects());
    return p1 && p2 && p3 && p4 && p5;
  },

  /**
   * Export all system data as a single JSON object for backup
   */
  exportAllDataJSON(): string {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      agencies: this.getAgencies(),
      strategicIssues: this.getStrategicIssues(),
      keyProjects: this.getKeyProjects(),
      users: this.getUsers(),
      projects: this.getProjects(),
      auditLogs: this.getAuditLogs(),
    };
    return JSON.stringify(backup, null, 2);
  },

  /**
   * Import all system data from a JSON object with validation and cloud sync
   */
  async importAllDataJSON(jsonStr: string): Promise<{ success: boolean; message: string }> {
    try {
      const data = JSON.parse(jsonStr);
      if (Array.isArray(data.agencies)) await this.saveAgencies(data.agencies);
      if (Array.isArray(data.strategicIssues)) await this.saveStrategicIssues(data.strategicIssues);
      if (Array.isArray(data.keyProjects)) await this.saveKeyProjects(data.keyProjects);
      if (Array.isArray(data.users)) await this.saveUsers(data.users);
      if (Array.isArray(data.projects)) await this.saveProjects(data.projects);
      return { success: true, message: 'นำเข้าข้อมูลและบันทึกลงคลาวด์เรียบร้อยแล้ว' };
    } catch (e: any) {
      return { success: false, message: e.message || 'ไฟล์ JSON รูปแบบไม่ถูกต้อง' };
    }
  },

  resetToDefault(): void {
    setItem(KEYS.AGENCIES, INITIAL_AGENCIES);
    setItem(KEYS.STRATEGIC_ISSUES, INITIAL_STRATEGIC_ISSUES);
    setItem(KEYS.KEY_PROJECTS, INITIAL_KEY_FLAGSHIP_PROJECTS);
    setItem(KEYS.USERS, INITIAL_USERS);
    setItem(KEYS.PROJECTS, INITIAL_PROJECTS);
    setItem(KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    setItem(KEYS.CURRENT_USER, null);

    syncCollectionToFirestore('agencies', INITIAL_AGENCIES);
    syncCollectionToFirestore('strategicIssues', INITIAL_STRATEGIC_ISSUES);
    syncCollectionToFirestore('keyProjects', INITIAL_KEY_FLAGSHIP_PROJECTS);
    syncCollectionToFirestore('users', INITIAL_USERS);
    syncCollectionToFirestore('projects', INITIAL_PROJECTS);
    syncCollectionToFirestore('auditLogs', INITIAL_AUDIT_LOGS);
  }
};
