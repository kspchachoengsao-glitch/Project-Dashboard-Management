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

const KEYS = {
  AGENCIES: 'system_agencies_v1',
  STRATEGIC_ISSUES: 'system_strategic_issues_v1',
  KEY_PROJECTS: 'system_key_projects_v1',
  USERS: 'system_users_v1',
  PROJECTS: 'system_projects_v1',
  AUDIT_LOGS: 'system_audit_logs_v1',
  CURRENT_USER: 'system_current_user_v1',
};

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

// Sync helper to Firestore
async function syncCollectionToFirestore(colName: string, items: any[]): Promise<void> {
  try {
    const docRef = doc(db, 'app_data', colName);
    await setDoc(docRef, { items, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.warn(`Firestore sync warning for ${colName}:`, err);
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
    { key: KEYS.PROJECTS, col: 'projects', fallback: INITIAL_PROJECTS },
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
            if (onDataUpdated) onDataUpdated();
          }
        } else {
          // Seed initial data to Firestore if empty
          const currentLocal = getItem(key, fallback);
          syncCollectionToFirestore(col, currentLocal);
        }
      }, (err) => {
        console.warn(`Firestore snapshot listener error for ${col}:`, err);
      });
    } catch (err) {
      console.warn(`Failed to attach snapshot listener for ${col}:`, err);
    }
  });
}

export const StorageService = {
  getAgencies(): Agency[] {
    return getItem<Agency[]>(KEYS.AGENCIES, INITIAL_AGENCIES);
  },
  saveAgencies(agencies: Agency[]): void {
    setItem(KEYS.AGENCIES, agencies);
    syncCollectionToFirestore('agencies', agencies);
  },

  getStrategicIssues(): StrategicIssue[] {
    return getItem<StrategicIssue[]>(KEYS.STRATEGIC_ISSUES, INITIAL_STRATEGIC_ISSUES);
  },
  saveStrategicIssues(issues: StrategicIssue[]): void {
    setItem(KEYS.STRATEGIC_ISSUES, issues);
    syncCollectionToFirestore('strategicIssues', issues);
  },

  getKeyProjects(): KeyFlagshipProject[] {
    return getItem<KeyFlagshipProject[]>(KEYS.KEY_PROJECTS, INITIAL_KEY_FLAGSHIP_PROJECTS);
  },
  saveKeyProjects(keyProjects: KeyFlagshipProject[]): void {
    setItem(KEYS.KEY_PROJECTS, keyProjects);
    syncCollectionToFirestore('keyProjects', keyProjects);
  },

  getUsers(): User[] {
    return getItem<User[]>(KEYS.USERS, INITIAL_USERS);
  },
  saveUsers(users: User[]): void {
    setItem(KEYS.USERS, users);
    syncCollectionToFirestore('users', users);
  },

  getProjects(): Project[] {
    return getItem<Project[]>(KEYS.PROJECTS, INITIAL_PROJECTS);
  },
  saveProjects(projects: Project[]): void {
    setItem(KEYS.PROJECTS, projects);
    syncCollectionToFirestore('projects', projects);
  },

  getAuditLogs(): AuditLogEntry[] {
    return getItem<AuditLogEntry[]>(KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  },
  addAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
    const logs = this.getAuditLogs();
    const newLog: AuditLogEntry = {
      ...entry,
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    const updated = [newLog, ...logs];
    setItem(KEYS.AUDIT_LOGS, updated);
    syncCollectionToFirestore('auditLogs', updated);
    return newLog;
  },

  getCurrentUser(): User | null {
    return getItem<User | null>(KEYS.CURRENT_USER, null); // Default is null = GUEST!
  },
  setCurrentUser(user: User | null): void {
    setItem(KEYS.CURRENT_USER, user);
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

