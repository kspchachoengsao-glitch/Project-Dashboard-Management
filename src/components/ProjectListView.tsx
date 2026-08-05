import React, { useState, useMemo } from 'react';
import { Project, User, Agency, StrategicIssue, KeyFlagshipProject, ProjectFilterCriteria } from '../types';
import {
  STATUS_THAI_MAP,
  exportProjectsToExcel,
  exportProjectsToCSV,
  printPDFReport
} from '../utils/exportUtils';
import {
  Plus,
  FileSpreadsheet,
  FileText,
  Search,
  Filter,
  Eye,
  Edit3,
  Trash2,
  RotateCcw,
  Building2,
  Printer,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertCircle
} from 'lucide-react';

interface ProjectListViewProps {
  projects: Project[];
  currentUser: User | null; // null = Guest
  agencies: Agency[];
  strategicIssues: StrategicIssue[];
  keyProjects: KeyFlagshipProject[];
  onOpenAddModal: () => void;
  onOpenEditModal: (p: Project) => void;
  onSelectProjectDetail: (p: Project) => void;
  onDeleteProject: (p: Project) => void;
}

export const ProjectListView: React.FC<ProjectListViewProps> = ({
  projects,
  currentUser,
  agencies,
  strategicIssues,
  keyProjects,
  onOpenAddModal,
  onOpenEditModal,
  onSelectProjectDetail,
  onDeleteProject,
}) => {
  // Role Helpers
  const isGuest = !currentUser;
  const isAdmin = currentUser?.role === 'admin';
  const isUser = currentUser?.role === 'user';

  // Filters
  const [filters, setFilters] = useState<ProjectFilterCriteria>({
    searchQuery: '',
    fiscalYear: 'all',
    agencyId: 'all',
    strategicIssueId: 'all',
    keyFlagshipProjectId: 'all',
    quarter: 'all',
    status: 'all',
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Delete modal state
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  // Filter Projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (
        filters.searchQuery &&
        !p.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) &&
        !p.code.toLowerCase().includes(filters.searchQuery.toLowerCase()) &&
        !p.responsiblePerson.toLowerCase().includes(filters.searchQuery.toLowerCase())
      ) {
        return false;
      }
      if (filters.fiscalYear !== 'all' && p.fiscalYear.toString() !== filters.fiscalYear) return false;
      if (filters.agencyId !== 'all' && p.agencyId !== filters.agencyId) return false;
      if (filters.strategicIssueId !== 'all' && p.strategicIssueId !== filters.strategicIssueId) return false;
      if (filters.keyFlagshipProjectId !== 'all' && p.keyFlagshipProjectId !== filters.keyFlagshipProjectId) return false;
      if (filters.quarter !== 'all' && p.quarter.toString() !== filters.quarter) return false;
      if (filters.status !== 'all' && p.status !== filters.status) return false;
      return true;
    });
  }, [projects, filters]);

  // Paginated Data
  const totalPages = Math.ceil(filteredProjects.length / pageSize) || 1;
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProjects.slice(start, start + pageSize);
  }, [filteredProjects, currentPage, pageSize]);

  // Check if current user can edit/delete a given project
  const canModifyProject = (p: Project): boolean => {
    if (isGuest) return false;
    if (isAdmin) return true;
    if (isUser) {
      // User can edit/delete own project (either created by them or belonging to their agency)
      return p.createdByUserId === currentUser.id || p.agencyId === currentUser.agencyId;
    }
    return false;
  };

  const resetFilters = () => {
    setFilters({
      searchQuery: '',
      fiscalYear: 'all',
      agencyId: 'all',
      strategicIssueId: 'all',
      keyFlagshipProjectId: 'all',
      quarter: 'all',
      status: 'all',
    });
    setCurrentPage(1);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'in_progress':
        return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'delayed':
        return 'bg-amber-100 text-amber-800 border-amber-300 font-bold';
      case 'not_started':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'cancelled':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header Bar & Actions */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-700" />
            รายการโครงการและระบบติดตามความก้าวหน้า
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            พบทั้งหมด {filteredProjects.length} โครงการ ({projects.length} โครงการในระบบทั้งหมด)
          </p>
        </div>

        {/* Export & Add Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* PDF Export - Available to ALL (Guest, User, Admin) */}
          <button
            onClick={() => printPDFReport('printable-table-area')}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="พิมพ์รายงาน PDF"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Export PDF</span>
          </button>

          {/* Excel & CSV Exports - User and Admin ONLY */}
          {!isGuest && (
            <>
              <button
                onClick={() => exportProjectsToExcel(filteredProjects)}
                className="px-3 py-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="ส่งออกเป็นไฟล์ Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Export Excel</span>
              </button>

              <button
                onClick={() => exportProjectsToCSV(filteredProjects)}
                className="px-3 py-2 rounded-xl border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-800 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="ส่งออกเป็นไฟล์ CSV"
              >
                <FileText className="w-4 h-4 text-sky-600" />
                <span>Export CSV</span>
              </button>
            </>
          )}

          {/* Add Project Button - User and Admin ONLY */}
          {!isGuest && (
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>➕ เพิ่มโครงการใหม่</span>
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <Filter className="w-4 h-4 text-amber-700" />
            ตัวกรองและค้นหาโครงการ
          </div>
          <button
            onClick={resetFilters}
            className="text-xs text-amber-800 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            ล้างตัวกรอง
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <input
              type="text"
              placeholder="ค้นหาชื่อโครงการ, รหัส, ผู้รับผิดชอบ..."
              value={filters.searchQuery}
              onChange={e => {
                setFilters({ ...filters, searchQuery: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          {/* Agency */}
          <div>
            <select
              value={filters.agencyId}
              onChange={e => {
                setFilters({ ...filters, agencyId: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full py-2 px-2.5 text-xs rounded-xl border border-slate-300 bg-white"
            >
              <option value="all">หน่วยงาน: ทั้งหมด (14 แห่ง)</option>
              {agencies.map(ag => (
                <option key={ag.id} value={ag.id}>{ag.shortName || ag.name}</option>
              ))}
            </select>
          </div>

          {/* Strategic Issue */}
          <div>
            <select
              value={filters.strategicIssueId}
              onChange={e => {
                setFilters({ ...filters, strategicIssueId: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full py-2 px-2.5 text-xs rounded-xl border border-slate-300 bg-white"
            >
              <option value="all">ประเด็นยุทธศาสตร์: ทั้งหมด (6 ประเด็น)</option>
              {strategicIssues.map(si => (
                <option key={si.id} value={si.id}>ยุทธศาสตร์ที่ {si.number}</option>
              ))}
            </select>
          </div>

          {/* Key Flagship Project */}
          <div className="lg:col-span-2">
            <select
              value={filters.keyFlagshipProjectId}
              onChange={e => {
                setFilters({ ...filters, keyFlagshipProjectId: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full py-2 px-2.5 text-xs rounded-xl border border-slate-300 bg-white"
            >
              <option value="all">โครงการสำคัญ: ทั้งหมด (7 กลุ่มโครงการ)</option>
              {keyProjects.map(kp => (
                <option key={kp.id} value={kp.id}>โครงการสำคัญกลุ่มที่ {kp.number}: {kp.title}</option>
              ))}
            </select>
          </div>

          {/* Quarter */}
          <div>
            <select
              value={filters.quarter}
              onChange={e => {
                setFilters({ ...filters, quarter: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full py-2 px-2.5 text-xs rounded-xl border border-slate-300 bg-white"
            >
              <option value="all">ไตรมาส: ทั้งหมด</option>
              <option value="1">ไตรมาส 1 (ต.ค. - ธ.ค.)</option>
              <option value="2">ไตรมาส 2 (ม.ค. - มี.ค.)</option>
              <option value="3">ไตรมาส 3 (เม.ย. - มิ.ย.)</option>
              <option value="4">ไตรมาส 4 (ก.ค. - ก.ย.)</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <select
              value={filters.status}
              onChange={e => {
                setFilters({ ...filters, status: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full py-2 px-2.5 text-xs rounded-xl border border-slate-300 bg-white"
            >
              <option value="all">สถานะ: ทั้งหมด</option>
              <option value="not_started">ยังไม่เริ่มดำเนินการ</option>
              <option value="in_progress">อยู่ระหว่างดำเนินการ</option>
              <option value="completed">ดำเนินการแล้วเสร็จ</option>
              <option value="delayed">ล่าช้ากว่าแผน</option>
              <option value="cancelled">ยกเลิก</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Wrapper (Printable area) */}
      <div id="printable-table-area" className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Printable Report Title Header */}
        <div className="p-4 bg-slate-900 text-white hidden print:block text-center border-b border-slate-800">
          <h2 className="text-lg font-bold">รายงานติดตามความก้าวหน้าโครงการ สำนักงานศึกษาธิการจังหวัดฉะเชิงเทรา</h2>
          <p className="text-xs text-slate-300 mt-1">ข้อมูล ณ วันที่ {new Date().toLocaleDateString('th-TH')}</p>
        </div>

        {/* Desktop Data Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-3 py-3 text-center w-12">ลำดับ</th>
                <th className="px-3 py-3 w-28">รหัสโครงการ</th>
                <th className="px-4 py-3 min-w-[220px]">ชื่อโครงการ / กลุ่มโครงการสำคัญ</th>
                <th className="px-3 py-3 min-w-[180px]">หน่วยงานรับผิดชอบ</th>
                <th className="px-3 py-3 text-center w-20">ไตรมาส</th>
                <th className="px-3 py-3 text-right w-28">งบอนุมัติ (บาท)</th>
                <th className="px-3 py-3 text-right w-28">เบิกจ่ายจริง</th>
                <th className="px-3 py-3 text-center w-28">ความก้าวหน้า</th>
                <th className="px-3 py-3 text-center w-32">สถานะ</th>
                <th className="px-3 py-3 text-center w-28 print:hidden">การกระทำ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedProjects.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    ไม่พบข้อมูลโครงการตามเงื่อนไขที่ค้นหา
                  </td>
                </tr>
              ) : (
                paginatedProjects.map((p, index) => {
                  const globalIdx = (currentPage - 1) * pageSize + index + 1;
                  const canEdit = canModifyProject(p);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-3 py-3.5 text-center font-mono font-semibold text-slate-500">
                        {globalIdx}
                      </td>

                      <td className="px-3 py-3.5 font-mono font-bold text-amber-900">
                        {p.code}
                      </td>

                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => onSelectProjectDetail(p)}
                          className="font-bold text-slate-900 hover:text-amber-800 text-left line-clamp-2 cursor-pointer"
                        >
                          {p.name}
                        </button>
                        <div className="text-[11px] text-amber-800/90 font-medium mt-0.5 line-clamp-1">
                          📌 {p.keyFlagshipProjectTitle}
                        </div>
                      </td>

                      <td className="px-3 py-3.5 text-slate-600 font-medium">
                        {p.agencyName}
                      </td>

                      <td className="px-3 py-3.5 text-center font-semibold text-slate-700">
                        ต.ม. {p.quarter}
                      </td>

                      <td className="px-3 py-3.5 text-right font-mono font-semibold text-slate-800">
                        {p.approvedBudget.toLocaleString('th-TH')}
                      </td>

                      <td className="px-3 py-3.5 text-right font-mono font-semibold text-amber-800">
                        {p.spentBudget.toLocaleString('th-TH')}
                      </td>

                      <td className="px-3 py-3.5">
                        <div className="flex flex-col items-center">
                          <span className="font-mono font-bold text-slate-800 text-[11px]">
                            {p.progressPercentage}%
                          </span>
                          <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                            <div
                              className="bg-teal-600 h-1.5 rounded-full"
                              style={{ width: `${p.progressPercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-3.5 text-center">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getStatusBadgeClass(
                            p.status
                          )}`}
                        >
                          {STATUS_THAI_MAP[p.status]}
                        </span>
                      </td>

                      {/* Row Action Icons per RBAC */}
                      <td className="px-3 py-3.5 text-center print:hidden">
                        <div className="flex items-center justify-center space-x-1">
                          {/* 👁 View Icon (Always visible to Guest, User, Admin) */}
                          <button
                            onClick={() => onSelectProjectDetail(p)}
                            title="ดูรายละเอียดโครงการ"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* ✏ Edit Icon (Only for Admin or Own Project for User) */}
                          {canEdit ? (
                            <button
                              onClick={() => onOpenEditModal(p)}
                              title="แก้ไขโครงการ"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-800 hover:bg-amber-50 transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          ) : null}

                          {/* 🗑 Delete Icon (Only for Admin or Own Project for User) */}
                          {canEdit ? (
                            <button
                              onClick={() => setDeletingProject(p)}
                              title="ลบโครงการ"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View Card Grid */}
        <div className="block md:hidden divide-y divide-slate-100">
          {paginatedProjects.map((p, idx) => {
            const canEdit = canModifyProject(p);
            return (
              <div key={p.id} className="p-4 space-y-2 hover:bg-slate-50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {p.code}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusBadgeClass(
                      p.status
                    )}`}
                  >
                    {STATUS_THAI_MAP[p.status]}
                  </span>
                </div>

                <h3
                  onClick={() => onSelectProjectDetail(p)}
                  className="text-sm font-bold text-slate-900 line-clamp-2 cursor-pointer hover:text-amber-800"
                >
                  {p.name}
                </h3>

                <p className="text-xs text-slate-500">{p.agencyName}</p>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                  <div>
                    <span className="text-slate-400">งบอนุมัติ: </span>
                    <strong className="text-slate-800">{p.approvedBudget.toLocaleString('th-TH')} ฿</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">ความก้าวหน้า: </span>
                    <strong className="text-teal-700">{p.progressPercentage}%</strong>
                  </div>
                </div>

                {/* Mobile Row Actions */}
                <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
                  <button
                    onClick={() => onSelectProjectDetail(p)}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg bg-sky-50 text-sky-700 flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" /> รายละเอียด
                  </button>
                  {canEdit && (
                    <button
                      onClick={() => onOpenEditModal(p)}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg bg-amber-50 text-amber-800 flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> แก้ไข
                    </button>
                  )}
                  {canEdit && (
                    <button
                      onClick={() => setDeletingProject(p)}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg bg-rose-50 text-rose-700 flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> ลบ
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination Controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 print:hidden">
          <div className="flex items-center gap-2">
            <span>แสดงแถวต่อหน้า:</span>
            <select
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="py-1 px-2 rounded-lg border border-slate-300 bg-white"
            >
              <option value={5}>5 แถว</option>
              <option value={10}>10 แถว</option>
              <option value={20}>20 แถว</option>
              <option value={50}>50 แถว</option>
            </select>
            <span className="text-slate-400">
              (หน้า {currentPage} จาก {totalPages})
            </span>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-300 disabled:opacity-40 hover:bg-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 bg-white font-bold rounded-lg border border-slate-300">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-300 disabled:opacity-40 hover:bg-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-rose-100">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-50 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">ยืนยันการลบโครงการ</h3>
                <p className="text-xs text-slate-500">การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
              </div>
            </div>

            <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
              ต้องการลบโครงการ <strong className="text-slate-900">{deletingProject.name}</strong> ({deletingProject.code}) ใช่หรือไม่?
            </p>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setDeletingProject(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  onDeleteProject(deletingProject);
                  setDeletingProject(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm cursor-pointer"
              >
                ลบโครงการนี้
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
