import React, { useState } from 'react';
import { Project, KeyFlagshipProject } from '../types';
import { STATUS_THAI_MAP } from '../utils/exportUtils';
import { Award, ChevronDown, ChevronRight, FolderKanban, Coins, TrendingUp, CheckCircle2 } from 'lucide-react';

interface FlagshipProjectsViewProps {
  keyProjects: KeyFlagshipProject[];
  projects: Project[];
  onSelectProject: (p: Project) => void;
}

export const FlagshipProjectsView: React.FC<FlagshipProjectsViewProps> = ({
  keyProjects,
  projects,
  onSelectProject,
}) => {
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(keyProjects[0]?.id || null);

  return (
    <div className="space-y-6 pb-12">
      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-amber-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-amber-800/40">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-amber-700/50 rounded-xl border border-amber-500/30">
            <Award className="w-7 h-7 text-amber-300" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight">
              ติดตาม 7 กลุ่มโครงการสำคัญ (7 Key Flagship Projects)
            </h2>
            <p className="text-xs text-amber-200 mt-1 max-w-3xl">
              กลุ่มโครงการสำคัญตามนโยบายขับเคลื่อนการศึกษาจังหวัดฉะเชิงเทรา สำหรับให้ทุกหน่วยงานลงทะเบียนตอบความสอดคล้องของโครงการ
            </p>
          </div>
        </div>
      </div>

      {/* 7 Accordion Cards Grid */}
      <div className="space-y-4">
        {keyProjects.map((group) => {
          const groupProjects = projects.filter(p => p.keyFlagshipProjectId === group.id);
          const projectCount = groupProjects.length;
          const totalApproved = groupProjects.reduce((sum, p) => sum + p.approvedBudget, 0);
          const totalSpent = groupProjects.reduce((sum, p) => sum + p.spentBudget, 0);
          const avgProgress = projectCount > 0
            ? Math.round(groupProjects.reduce((sum, p) => sum + p.progressPercentage, 0) / projectCount)
            : 0;

          const isExpanded = expandedGroupId === group.id;

          return (
            <div
              key={group.id}
              className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                isExpanded ? 'border-amber-400 shadow-md ring-1 ring-amber-400/20' : 'border-slate-200 hover:border-amber-300'
              }`}
            >
              {/* Accordion Header */}
              <div
                onClick={() => setExpandedGroupId(isExpanded ? null : group.id)}
                className="p-5 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 hover:bg-slate-100/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-700 text-amber-50 font-extrabold text-sm flex items-center justify-center shrink-0 shadow-xs">
                    {group.number}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      {group.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">{group.description}</p>
                  </div>
                </div>

                {/* Right side stats & toggle */}
                <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">
                  <div className="flex items-center gap-3 text-xs">
                    <div className="text-center px-3 py-1 bg-white rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">จำนวน</span>
                      <strong className="text-slate-900 font-bold">{projectCount} โครงการ</strong>
                    </div>

                    <div className="text-center px-3 py-1 bg-white rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">งบอนุมัติ</span>
                      <strong className="text-amber-900 font-bold">฿{(totalApproved / 1000000).toFixed(2)}M</strong>
                    </div>

                    <div className="text-center px-3 py-1 bg-teal-50 rounded-lg border border-teal-200 text-teal-800">
                      <span className="text-[10px] text-teal-600 block">ก้าวหน้าเฉลี่ย</span>
                      <strong className="font-extrabold">{avgProgress}%</strong>
                    </div>
                  </div>

                  <div className="text-slate-400">
                    {isExpanded ? <ChevronDown className="w-5 h-5 text-amber-700" /> : <ChevronRight className="w-5 h-5" />}
                  </div>
                </div>
              </div>

              {/* Accordion Content */}
              {isExpanded && (
                <div className="p-5 border-t border-slate-100 bg-white space-y-4">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <FolderKanban className="w-4 h-4 text-amber-700" />
                    รายการโครงการที่สอดคล้องกับกลุ่มโครงการสำคัญที่ {group.number} ({projectCount} โครงการ)
                  </h4>

                  {projectCount === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                      ยังไม่มีโครงการสอดคล้องในกลุ่มโครงการสำคัญนี้
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {groupProjects.map(p => (
                        <div
                          key={p.id}
                          onClick={() => onSelectProject(p)}
                          className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-white hover:shadow-md transition-all cursor-pointer space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded">
                              {p.code}
                            </span>
                            <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                              ก้าวหน้า {p.progressPercentage}%
                            </span>
                          </div>

                          <h5 className="text-xs font-bold text-slate-900 line-clamp-2">{p.name}</h5>
                          <p className="text-[11px] text-slate-500">{p.agencyName}</p>

                          <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-200/60 text-slate-600">
                            <span>งบ: <strong>฿{p.approvedBudget.toLocaleString('th-TH')}</strong></span>
                            <span>สถานะ: <strong className="text-slate-800">{STATUS_THAI_MAP[p.status]}</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
