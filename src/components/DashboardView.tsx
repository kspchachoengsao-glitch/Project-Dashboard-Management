import React, { useState, useMemo } from 'react';
import { Project, Agency, StrategicIssue, KeyFlagshipProject, ProjectFilterCriteria } from '../types';
import { STATUS_THAI_MAP, printPDFReport } from '../utils/exportUtils';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from 'recharts';
import {
  FolderKanban,
  Coins,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Printer,
  Filter,
  RotateCcw,
  Search,
  Award,
  Building2,
  Target
} from 'lucide-react';

interface DashboardViewProps {
  projects: Project[];
  agencies: Agency[];
  strategicIssues: StrategicIssue[];
  keyProjects: KeyFlagshipProject[];
  onSelectProject: (p: Project) => void;
  onNavigateToProjects: () => void;
}

const COLORS = ['#0284c7', '#0d9488', '#16a34a', '#eab308', '#dc2626', '#8b5cf6', '#ec4899'];

export const DashboardView: React.FC<DashboardViewProps> = ({
  projects,
  agencies,
  strategicIssues,
  keyProjects,
  onSelectProject,
  onNavigateToProjects,
}) => {
  // Filter States
  const [filters, setFilters] = useState<ProjectFilterCriteria>({
    searchQuery: '',
    fiscalYear: 'all',
    agencyId: 'all',
    strategicIssueId: 'all',
    keyFlagshipProjectId: 'all',
    quarter: 'all',
    status: 'all',
  });

  // Filtered Projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (filters.searchQuery && !p.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) && !p.code.toLowerCase().includes(filters.searchQuery.toLowerCase())) {
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

  // Overall Statistics
  const stats = useMemo(() => {
    const totalCount = filteredProjects.length;
    const totalApprovedBudget = filteredProjects.reduce((acc, p) => acc + p.approvedBudget, 0);
    const totalSpentBudget = filteredProjects.reduce((acc, p) => acc + p.spentBudget, 0);
    const spentPercentage = totalApprovedBudget > 0 ? (totalSpentBudget / totalApprovedBudget) * 100 : 0;
    
    const avgProgress = totalCount > 0 ? filteredProjects.reduce((acc, p) => acc + p.progressPercentage, 0) / totalCount : 0;
    
    const completedCount = filteredProjects.filter(p => p.status === 'completed').length;
    const inProgressCount = filteredProjects.filter(p => p.status === 'in_progress').length;
    const delayedCount = filteredProjects.filter(p => p.status === 'delayed').length;
    const notStartedCount = filteredProjects.filter(p => p.status === 'not_started').length;

    return {
      totalCount,
      totalApprovedBudget,
      totalSpentBudget,
      spentPercentage,
      avgProgress,
      completedCount,
      inProgressCount,
      delayedCount,
      notStartedCount
    };
  }, [filteredProjects]);

  // Chart Data 1: Budget by Agency (Top 8 or All)
  const agencyChartData = useMemo(() => {
    const map = new Map<string, { name: string; shortName: string; approved: number; spent: number }>();
    agencies.forEach(ag => {
      map.set(ag.id, { name: ag.name, shortName: ag.shortName || ag.name.substring(0, 15), approved: 0, spent: 0 });
    });

    filteredProjects.forEach(p => {
      const item = map.get(p.agencyId);
      if (item) {
        item.approved += p.approvedBudget / 1000000; // ในหน่วยล้านบาท
        item.spent += p.spentBudget / 1000000;
      }
    });

    return Array.from(map.values()).filter(item => item.approved > 0 || item.spent > 0);
  }, [agencies, filteredProjects]);

  // Chart Data 2: Status Distribution
  const statusPieData = useMemo(() => {
    const counts = {
      completed: 0,
      in_progress: 0,
      delayed: 0,
      not_started: 0,
      cancelled: 0,
    };
    filteredProjects.forEach(p => {
      if (counts[p.status] !== undefined) {
        counts[p.status]++;
      }
    });

    return [
      { name: 'แล้วเสร็จ', value: counts.completed, color: '#16a34a' },
      { name: 'อยู่ระหว่างดำเนินการ', value: counts.in_progress, color: '#0284c7' },
      { name: 'ล่าช้ากว่าแผน', value: counts.delayed, color: '#d97706' },
      { name: 'ยังไม่เริ่ม', value: counts.not_started, color: '#64748b' },
      { name: 'ยกเลิก', value: counts.cancelled, color: '#dc2626' },
    ].filter(d => d.value > 0);
  }, [filteredProjects]);

  // Chart Data 3: Execution by Quarter
  const quarterChartData = useMemo(() => {
    const quarters = [
      { name: 'ไตรมาส 1 (ต.ค.-ธ.ค.)', count: 0, budget: 0, spent: 0 },
      { name: 'ไตรมาส 2 (ม.ค.-มี.ค.)', count: 0, budget: 0, spent: 0 },
      { name: 'ไตรมาส 3 (เม.ย.-มิ.ย.)', count: 0, budget: 0, spent: 0 },
      { name: 'ไตรมาส 4 (ก.ค.-ก.ย.)', count: 0, budget: 0, spent: 0 },
    ];

    filteredProjects.forEach(p => {
      if (p.quarter >= 1 && p.quarter <= 4) {
        const qIndex = p.quarter - 1;
        quarters[qIndex].count++;
        quarters[qIndex].budget += p.approvedBudget / 1000000;
        quarters[qIndex].spent += p.spentBudget / 1000000;
      }
    });

    return quarters;
  }, [filteredProjects]);

  // Chart Data 4: Progress by 7 Key Flagship Projects
  const flagshipChartData = useMemo(() => {
    return keyProjects.map((kp, idx) => {
      const pList = filteredProjects.filter(p => p.keyFlagshipProjectId === kp.id);
      const count = pList.length;
      const avgProg = count > 0 ? pList.reduce((sum, p) => sum + p.progressPercentage, 0) / count : 0;
      const budget = pList.reduce((sum, p) => sum + p.approvedBudget, 0) / 1000000;
      return {
        key: `กลุ่มที่ ${idx + 1}`,
        fullTitle: kp.title,
        shortTitle: `ก.${idx + 1}`,
        progress: Math.round(avgProg),
        projectCount: count,
        budget: Number(budget.toFixed(2)),
      };
    });
  }, [keyProjects, filteredProjects]);

  // Delayed / High Priority Projects List
  const delayedProjects = useMemo(() => {
    return filteredProjects.filter(p => p.status === 'delayed');
  }, [filteredProjects]);

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
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Printable Area Wrapper for PDF Export */}
      <div id="printable-report-area" className="space-y-6">
        {/* Banner Section */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950 rounded-2xl p-6 text-white shadow-lg border border-slate-700/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold mb-2">
              <Award className="w-3.5 h-3.5" />
              แดชบอร์ดสรุปผลการดำเนินงานระดับจังหวัด
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              ระบบรายงานผลการดำเนินงานตามแผนพัฒนาการศึกษาและแผนปฏิบัติการด้านการศึกษาจังหวัดฉะเชิงเทรา
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              รายงานและวิเคราะห์ผลการดำเนินงานของ 14 หน่วยงานทางการศึกษา ครอบคลุม 6 ประเด็นยุทธศาสตร์ และ 7 กลุ่มโครงการสำคัญ
            </p>
          </div>
          <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
            <button
              onClick={() => printPDFReport('printable-report-area')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              พิมพ์ / พิมพ์ PDF รายงาน
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 print:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <Filter className="w-4 h-4 text-amber-700" />
              ตัวกรองข้อมูลโครงการ (Data Filter Controls)
            </div>
            <button
              onClick={resetFilters}
              className="text-xs text-amber-800 hover:text-amber-900 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              ล้างตัวกรอง
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {/* Search */}
            <div className="lg:col-span-2 relative">
              <input
                type="text"
                placeholder="ค้นหาชื่อ หรือ รหัสโครงการ..."
                value={filters.searchQuery}
                onChange={e => setFilters({ ...filters, searchQuery: e.target.value })}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>

            {/* Fiscal Year */}
            <div>
              <select
                value={filters.fiscalYear}
                onChange={e => setFilters({ ...filters, fiscalYear: e.target.value })}
                className="w-full py-1.5 px-2 text-xs rounded-lg border border-slate-300 bg-white"
              >
                <option value="all">ปีงบประมาณ: ทั้งหมด</option>
                <option value="2568">ปีงบประมาณ 2568</option>
                <option value="2567">ปีงบประมาณ 2567</option>
              </select>
            </div>

            {/* Quarter */}
            <div>
              <select
                value={filters.quarter}
                onChange={e => setFilters({ ...filters, quarter: e.target.value })}
                className="w-full py-1.5 px-2 text-xs rounded-lg border border-slate-300 bg-white"
              >
                <option value="all">ไตรมาส: ทั้งหมด</option>
                <option value="1">ไตรมาส 1 (ต.ค.-ธ.ค.)</option>
                <option value="2">ไตรมาส 2 (ม.ค.-มี.ค.)</option>
                <option value="3">ไตรมาส 3 (เม.ย.-มิ.ย.)</option>
                <option value="4">ไตรมาส 4 (ก.ค.-ก.ย.)</option>
              </select>
            </div>

            {/* Agency */}
            <div>
              <select
                value={filters.agencyId}
                onChange={e => setFilters({ ...filters, agencyId: e.target.value })}
                className="w-full py-1.5 px-2 text-xs rounded-lg border border-slate-300 bg-white truncate"
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
                onChange={e => setFilters({ ...filters, strategicIssueId: e.target.value })}
                className="w-full py-1.5 px-2 text-xs rounded-lg border border-slate-300 bg-white truncate"
              >
                <option value="all">ยุทธศาสตร์: ทั้งหมด (6 ด้าน)</option>
                {strategicIssues.map(si => (
                  <option key={si.id} value={si.id}>ยุทธศาสตร์ที่ {si.number}</option>
                ))}
              </select>
            </div>

            {/* Key Flagship Project */}
            <div>
              <select
                value={filters.keyFlagshipProjectId}
                onChange={e => setFilters({ ...filters, keyFlagshipProjectId: e.target.value })}
                className="w-full py-1.5 px-2 text-xs rounded-lg border border-slate-300 bg-white truncate"
              >
                <option value="all">โครงการสำคัญ: ทั้งหมด (7 กลุ่ม)</option>
                {keyProjects.map(kp => (
                  <option key={kp.id} value={kp.id}>โครงการสำคัญกลุ่มที่ {kp.number}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Projects Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">โครงการทั้งหมดในระบบ</p>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                  {stats.totalCount} <span className="text-sm font-normal text-slate-500">โครงการ</span>
                </p>
              </div>
              <div className="p-3 bg-sky-50 text-sky-700 rounded-xl">
                <FolderKanban className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
              <span className="inline-flex items-center text-emerald-600 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                {stats.completedCount} เสร็จสิ้น
              </span>
              <span>•</span>
              <span className="text-amber-600 font-bold">
                <AlertTriangle className="w-3.5 h-3.5 mr-1 inline" />
                {stats.delayedCount} ล่าช้า
              </span>
            </div>
          </div>

          {/* Budget Approved Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">งบประมาณที่ได้รับอนุมัติ</p>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                  ฿{(stats.totalApprovedBudget / 1000000).toFixed(2)}M
                </p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
                <Coins className="w-6 h-6" />
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              รวมเป็นเงิน: <strong className="text-slate-800">{stats.totalApprovedBudget.toLocaleString('th-TH')} บาท</strong>
            </p>
          </div>

          {/* Budget Execution Spent Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">ยอดเบิกจ่ายจริง (Execution)</p>
                <p className="text-2xl sm:text-3xl font-extrabold text-amber-800 mt-1">
                  {stats.spentPercentage.toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-amber-50 text-amber-800 rounded-xl">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-amber-700 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(stats.spentPercentage, 100)}%` }}
              ></div>
            </div>
            <p className="mt-1.5 text-[11px] text-slate-500 text-right">
              เบิกจ่ายแล้ว ฿{stats.totalSpentBudget.toLocaleString('th-TH')} บาท
            </p>
          </div>

          {/* Average Progress Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">ความก้าวหน้าเฉลี่ยโครงการ</p>
                <p className="text-2xl sm:text-3xl font-extrabold text-teal-700 mt-1">
                  {stats.avgProgress.toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-teal-50 text-teal-700 rounded-xl">
                <Clock className="w-6 h-6" />
              </div>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-teal-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(stats.avgProgress, 100)}%` }}
              ></div>
            </div>
            <p className="mt-1.5 text-[11px] text-slate-500">
              สถานะ: {stats.inProgressCount} อยู่ระหว่างดำเนินงาน
            </p>
          </div>
        </div>

        {/* Charts Grid 1: Budget by Agency & Status Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Budget Allocation by Agency Bar Chart */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  สัดส่วนงบประมาณอนุมัติและเบิกจ่าย จำแนกตามหน่วยงาน (ล้านบาท)
                </h3>
              </div>
              <span className="text-xs text-slate-400">หน่วย: ล้านบาท</span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agencyChartData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="shortName" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(val: number) => [`${val.toFixed(2)} ล้านบาท`, '']}
                    contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="approved" name="งบอนุมัติ" fill="#0284c7" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="spent" name="เบิกจ่ายแล้ว" fill="#d97706" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Status Breakdown Donut Chart */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Target className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">สัดส่วนสถานะโครงการ</h3>
            </div>

            <div className="h-56 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: number) => [`${val} โครงการ`, 'จำนวน']} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              {statusPieData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                    <span className="text-slate-700 font-medium">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-900">{item.value} โครงการ</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts Grid 2: 7 Key Flagship Projects Progress & Quarter Execution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 7 Key Flagship Projects Horizontal Progress Chart */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  ความก้าวหน้าเฉลี่ย (%) ใน 7 กลุ่มโครงการสำคัญ
                </h3>
              </div>
              <button
                onClick={onNavigateToProjects}
                className="text-xs text-amber-800 hover:underline font-semibold cursor-pointer"
              >
                ดูทั้งหมด →
              </button>
            </div>

            <div className="space-y-3">
              {flagshipChartData.map((item, idx) => (
                <div key={item.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 truncate max-w-[280px]" title={item.fullTitle}>
                      {idx + 1}. {item.fullTitle}
                    </span>
                    <span className="font-bold text-amber-800 ml-2">{item.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-600 to-amber-800 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${item.progress}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quarter Execution Bar Chart */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  การดำเนินงานรายไตรมาส (จำนวนโครงการ & งบอนุมัติ)
                </h3>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={quarterChartData} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(val: number, name: string) => [
                      name === 'budget' ? `${val.toFixed(2)} ล้านบาท` : `${val} โครงการ`,
                      name === 'budget' ? 'งบประมาณ' : 'จำนวนโครงการ'
                    ]}
                  />
                  <Bar dataKey="count" name="จำนวนโครงการ" fill="#0284c7" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="budget" name="งบอนุมัติ (ล้านบาท)" fill="#16a34a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Priority & Delayed Projects Warning Feed */}
        {delayedProjects.length > 0 && (
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                แจ้งเตือนโครงการที่ล่าช้ากว่าแผนงาน ({delayedProjects.length} โครงการ)
              </div>
              <span className="text-xs text-amber-700">ต้องการการกำกับดูแลเป็นพิเศษ</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {delayedProjects.map(p => (
                <div
                  key={p.id}
                  onClick={() => onSelectProject(p)}
                  className="p-3.5 bg-white rounded-xl border border-amber-200 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                        {p.code}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 mt-1 line-clamp-1">{p.name}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{p.agencyName}</p>
                    </div>
                    <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 shrink-0">
                      ก้าวหน้า {p.progressPercentage}%
                    </span>
                  </div>

                  {p.issuesAndSolutions && (
                    <div className="mt-2 p-2 bg-slate-50 rounded text-[11px] text-slate-600 border border-slate-100">
                      <strong>ปัญหา/แนวทาง:</strong> {p.issuesAndSolutions}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
