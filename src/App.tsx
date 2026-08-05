import React, { useState, useEffect } from 'react';
import { User, Project, Agency, StrategicIssue, KeyFlagshipProject } from './types';
import { StorageService, initFirestoreListeners } from './services/storage';
import { Header } from './components/Header';
import { LoginModal } from './components/LoginModal';
import { DashboardView } from './components/DashboardView';
import { ProjectListView } from './components/ProjectListView';
import { FlagshipProjectsView } from './components/FlagshipProjectsView';
import { AnalyticsView } from './components/AnalyticsView';
import { UserManagementView } from './components/UserManagementView';
import { MasterListsView } from './components/MasterListsView';
import { AuditLogView } from './components/AuditLogView';
import { ProjectFormModal } from './components/ProjectFormModal';
import { ProjectDetailModal } from './components/ProjectDetailModal';

export default function App() {
  // Current user session: null = GUEST (Read-Only)
  const [currentUser, setCurrentUser] = useState<User | null>(StorageService.getCurrentUser());

  // Navigation state
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Master Data state
  const [agencies, setAgencies] = useState<Agency[]>(StorageService.getAgencies());
  const [strategicIssues, setStrategicIssues] = useState<StrategicIssue[]>(StorageService.getStrategicIssues());
  const [keyProjects, setKeyProjects] = useState<KeyFlagshipProject[]>(StorageService.getKeyProjects());
  const [projects, setProjects] = useState<Project[]>(StorageService.getProjects());

  // Modals state
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedProjectDetail, setSelectedProjectDetail] = useState<Project | null>(null);

  // Sync state from storage
  const refreshMasterData = () => {
    setAgencies(StorageService.getAgencies());
    setStrategicIssues(StorageService.getStrategicIssues());
    setKeyProjects(StorageService.getKeyProjects());
    setProjects(StorageService.getProjects());
  };

  useEffect(() => {
    refreshMasterData();
    // Initialize Firestore real-time synchronization
    initFirestoreListeners(() => {
      refreshMasterData();
    });
  }, []);

  // Login handler
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    StorageService.setCurrentUser(user);
  };

  // Logout handler
  const handleLogout = () => {
    if (currentUser) {
      StorageService.addAuditLog({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        agencyName: currentUser.agencyName,
        action: 'LOGOUT',
        details: 'ออกจากระบบสำเร็จ',
        ipAddress: '127.0.0.1'
      });
    }
    setCurrentUser(null);
    StorageService.setCurrentUser(null);
    setActiveTab('dashboard');
  };

  // Save Project (Add or Edit)
  const handleSaveProject = (formData: Partial<Project>) => {
    const currentProjects = StorageService.getProjects();

    if (editingProject) {
      // Edit existing
      const updatedList = currentProjects.map(p => {
        if (p.id === editingProject.id) {
          return {
            ...p,
            ...formData,
            updatedAt: new Date().toISOString(),
          } as Project;
        }
        return p;
      });

      StorageService.saveProjects(updatedList);

      if (currentUser) {
        StorageService.addAuditLog({
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.role,
          agencyName: currentUser.agencyName,
          action: 'EDIT_PROJECT',
          details: `แก้ไขข้อมูลโครงการ ${formData.code} (${formData.name})`,
          ipAddress: '127.0.0.1'
        });
      }
    } else {
      // Add new
      const newProject: Project = {
        id: `prj-${Date.now()}`,
        code: formData.code || `PRJ-68-${Math.floor(100 + Math.random() * 900)}`,
        name: formData.name || 'โครงการใหม่',
        agencyId: formData.agencyId || agencies[0]?.id || '',
        agencyName: formData.agencyName || agencies[0]?.name || '',
        strategicIssueId: formData.strategicIssueId || strategicIssues[0]?.id || '',
        strategicIssueTitle: formData.strategicIssueTitle || strategicIssues[0]?.title || '',
        keyFlagshipProjectId: formData.keyFlagshipProjectId || keyProjects[0]?.id || '',
        keyFlagshipProjectTitle: formData.keyFlagshipProjectTitle || keyProjects[0]?.title || '',
        goal: formData.goal || '',
        mainIndicator: formData.mainIndicator || '',
        quarter: formData.quarter || 1,
        approvedBudget: formData.approvedBudget || 0,
        spentBudget: formData.spentBudget || 0,
        progressPercentage: formData.progressPercentage || 0,
        status: formData.status || 'in_progress',
        fiscalYear: formData.fiscalYear || 2568,
        targetGroup: formData.targetGroup || '',
        location: formData.location || 'จังหวัดฉะเชิงเทรา',
        responsiblePerson: formData.responsiblePerson || currentUser?.name || 'ผู้ดูแลระบบ',
        contactPhone: formData.contactPhone || '',
        startDate: formData.startDate || '2568-01-01',
        endDate: formData.endDate || '2568-03-31',
        objectives: formData.objectives || '',
        quantitativeKPI: formData.quantitativeKPI || '',
        qualitativeKPI: formData.qualitativeKPI || '',
        outcomes: formData.outcomes || '',
        outputOutcome: formData.outputOutcome || '',
        issuesAndSolutions: formData.issuesAndSolutions || '',
        pdfFile: formData.pdfFile,
        photos: formData.photos || [],
        createdByUserId: currentUser?.id || 'usr-guest',
        createdByName: currentUser?.name || 'ผู้ลงทะเบียน',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      StorageService.saveProjects([newProject, ...currentProjects]);

      if (currentUser) {
        StorageService.addAuditLog({
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.role,
          agencyName: currentUser.agencyName,
          action: 'ADD_PROJECT',
          details: `เพิ่มโครงการใหม่ ${newProject.code} (${newProject.name})`,
          ipAddress: '127.0.0.1'
        });
      }
    }

    refreshMasterData();
    setIsProjectFormOpen(false);
    setEditingProject(null);
  };

  // Delete Project handler
  const handleDeleteProject = (projectToDelete: Project) => {
    const currentProjects = StorageService.getProjects();
    const updated = currentProjects.filter(p => p.id !== projectToDelete.id);
    StorageService.saveProjects(updated);

    if (currentUser) {
      StorageService.addAuditLog({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        agencyName: currentUser.agencyName,
        action: 'DELETE_PROJECT',
        details: `ลบโครงการ ${projectToDelete.code} (${projectToDelete.name})`,
        ipAddress: '127.0.0.1'
      });
    }

    refreshMasterData();
  };

  return (
    <div className="min-h-screen bg-slate-100/70 font-sans text-slate-800 flex flex-col selection:bg-amber-200">
      {/* Sticky Government Header Navigation */}
      <Header
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            projects={projects}
            agencies={agencies}
            strategicIssues={strategicIssues}
            keyProjects={keyProjects}
            onSelectProject={p => setSelectedProjectDetail(p)}
            onNavigateToProjects={() => setActiveTab('projects')}
          />
        )}

        {activeTab === 'projects' && (
          <ProjectListView
            projects={projects}
            currentUser={currentUser}
            agencies={agencies}
            strategicIssues={strategicIssues}
            keyProjects={keyProjects}
            onOpenAddModal={() => {
              setEditingProject(null);
              setIsProjectFormOpen(true);
            }}
            onOpenEditModal={p => {
              setEditingProject(p);
              setIsProjectFormOpen(true);
            }}
            onSelectProjectDetail={p => setSelectedProjectDetail(p)}
            onDeleteProject={handleDeleteProject}
          />
        )}

        {activeTab === 'flagship' && (
          <FlagshipProjectsView
            keyProjects={keyProjects}
            projects={projects}
            onSelectProject={p => setSelectedProjectDetail(p)}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            projects={projects}
            agencies={agencies}
            strategicIssues={strategicIssues}
          />
        )}

        {/* Admin Views */}
        {activeTab === 'users' && currentUser?.role === 'admin' && (
          <UserManagementView
            currentUser={currentUser}
            agencies={agencies}
          />
        )}

        {activeTab === 'master-lists' && currentUser?.role === 'admin' && (
          <MasterListsView
            currentUser={currentUser}
            agencies={agencies}
            strategicIssues={strategicIssues}
            keyProjects={keyProjects}
            onRefreshData={refreshMasterData}
          />
        )}

        {activeTab === 'audit-logs' && currentUser?.role === 'admin' && (
          <AuditLogView currentUser={currentUser} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-6 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-2 text-center sm:text-left">
          <div>
            <p className="font-bold text-slate-200">
              สำนักงานศึกษาธิการจังหวัดฉะเชิงเทรา • สำนักงานปลัดกระทรวงศึกษาธิการ
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              ระบบบริหารจัดการและติดตามโครงการภาครัฐ (Project Dashboard Management System)
            </p>
          </div>
          <div className="text-[11px] text-slate-500">
            Enterprise Production Ready Version • พัฒนาเพื่อการบริหารสถิติและติดตามนโยบาย EEC
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Project Add/Edit Modal */}
      {isProjectFormOpen && currentUser && (
        <ProjectFormModal
          isOpen={isProjectFormOpen}
          projectToEdit={editingProject}
          currentUser={currentUser}
          agencies={agencies}
          strategicIssues={strategicIssues}
          keyProjects={keyProjects}
          onClose={() => {
            setIsProjectFormOpen(false);
            setEditingProject(null);
          }}
          onSave={handleSaveProject}
        />
      )}

      {/* Project Detail View Modal */}
      {selectedProjectDetail && (
        <ProjectDetailModal
          project={selectedProjectDetail}
          onClose={() => setSelectedProjectDetail(null)}
        />
      )}
    </div>
  );
}
