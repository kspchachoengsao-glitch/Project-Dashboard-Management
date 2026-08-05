import React from 'react';
import { Project, Agency, StrategicIssue } from '../types';
import { STATUS_THAI_MAP, printPDFReport } from '../utils/exportUtils';
import { BarChart3, Building2, Target, Printer, Layers, DollarSign } from 'lucide-react';

interface AnalyticsViewProps {
  projects: Project[];
  agencies: Agency[];
  strategicIssues: StrategicIssue[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  projects,
  agencies,
  strategicIssues,
}) => {
  // Cross-table matrix: Agency x Strategic Issue
  const agencyMatrix = agencies.map(ag => {
    const agProjects = projects.filter(p => p.agencyId === ag.id);
    const totalApproved = agProjects.reduce((sum, p) => sum + p.approvedBudget, 0);
    const totalSpent = agProjects.reduce((sum, p) => sum + p.spentBudget, 0);
    const avgProg = agProjects.length > 0
      ? Math.round(agProjects.reduce((sum, p) => sum + p.progressPercentage, 0) / agProjects.length)
      : 0;

    return {
      agency: ag,
      projectCount: agProjects.length,
      totalApproved,
      totalSpent,
      avgProg,
    };
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-amber-400" />
            รายงานวิเคราะห์ข้อมูลและตารางสรุปเชิงลึก (Analytics & Reports)
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            สรุปผลการดำเนินงานข้ามหน่วยงาน เปรียบเทียบสัดส่วนงบประมาณและการเบิกจ่ายจริง
          </p>
        </div>
        <button
          onClick={() => printPDFReport('analytics-printable-area')}
          className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <Printer className="w-4 h-4" /> พิมพ์รายงานตาราง PDF
        </button>
      </div>

      {/* Printable Area */}
      <div id="analytics-printable-area" className="space-y-6">
        {/* Table 1: Matrix Agency Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 className="w-5 h-5 text-amber-700" />
            <h3 className="text-sm font-bold text-slate-900">
              ตารางที่ 1: สรุปผลการดำเนินงานงบประมาณรายหน่วยงาน (14 หน่วยงาน)
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                <tr>
                  <th className="px-3 py-2.5 text-center w-10">ลำดับ</th>
                  <th className="px-4 py-2.5">หน่วยงานทางการศึกษา</th>
                  <th className="px-3 py-2.5 text-center">จำนวนโครงการ</th>
                  <th className="px-3 py-2.5 text-right">งบประมาณอนุมัติ (บาท)</th>
                  <th className="px-3 py-2.5 text-right">งบเบิกจ่ายจริง (บาท)</th>
                  <th className="px-3 py-2.5 text-center">อัตราการเบิกจ่าย (%)</th>
                  <th className="px-3 py-2.5 text-center">ความก้าวหน้าเฉลี่ย (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {agencyMatrix.map((row, idx) => {
                  const execPercent = row.totalApproved > 0 ? ((row.totalSpent / row.totalApproved) * 100).toFixed(1) : '0';
                  return (
                    <tr key={row.agency.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-2.5 font-semibold text-slate-900">{row.agency.name}</td>
                      <td className="px-3 py-2.5 text-center font-bold">{row.projectCount}</td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-800">
                        {row.totalApproved.toLocaleString('th-TH')}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-amber-900">
                        {row.totalSpent.toLocaleString('th-TH')}
                      </td>
                      <td className="px-3 py-2.5 text-center font-bold text-amber-800">
                        {execPercent}%
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className="px-2 py-0.5 rounded font-bold bg-teal-50 text-teal-700 border border-teal-200">
                          {row.avgProg}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2: Strategic Issues Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Target className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              ตารางที่ 2: สรุปโครงการจำแนกตาม 6 ประเด็นยุทธศาสตร์
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                <tr>
                  <th className="px-3 py-2.5 text-center w-12">ยุทธศาสตร์</th>
                  <th className="px-4 py-2.5">ประเด็นยุทธศาสตร์</th>
                  <th className="px-3 py-2.5 text-center">จำนวนโครงการ</th>
                  <th className="px-3 py-2.5 text-right">งบอนุมัติรวม (บาท)</th>
                  <th className="px-3 py-2.5 text-center">ความก้าวหน้าเฉลี่ย (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {strategicIssues.map(si => {
                  const siProjects = projects.filter(p => p.strategicIssueId === si.id);
                  const budget = siProjects.reduce((sum, p) => sum + p.approvedBudget, 0);
                  const avgProg = siProjects.length > 0
                    ? Math.round(siProjects.reduce((sum, p) => sum + p.progressPercentage, 0) / siProjects.length)
                    : 0;

                  return (
                    <tr key={si.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5 text-center font-bold text-amber-900">
                        ด้านที่ {si.number}
                      </td>
                      <td className="px-4 py-2.5 font-medium text-slate-900">{si.title}</td>
                      <td className="px-3 py-2.5 text-center font-bold">{siProjects.length}</td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-800">
                        {budget.toLocaleString('th-TH')}
                      </td>
                      <td className="px-3 py-2.5 text-center font-bold text-teal-700">
                        {avgProg}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
