import React, { useState, useMemo } from 'react';
import { AuditLogEntry, User } from '../types';
import { StorageService } from '../services/storage';
import { exportAuditLogsToExcel } from '../utils/exportUtils';
import { FileText, Search, FileSpreadsheet, Filter, ShieldCheck, Clock } from 'lucide-react';

interface AuditLogViewProps {
  currentUser: User;
}

export const AuditLogView: React.FC<AuditLogViewProps> = () => {
  const [logs] = useState<AuditLogEntry[]>(StorageService.getAuditLogs());
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (
        searchQuery &&
        !log.userName.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !log.details.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !log.agencyName.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      if (actionFilter !== 'all' && log.action !== actionFilter) return false;
      return true;
    });
  }, [logs, searchQuery, actionFilter]);

  const getActionBadgeClass = (action: string) => {
    switch (action) {
      case 'LOGIN':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'ADD_PROJECT':
        return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'EDIT_PROJECT':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'DELETE_PROJECT':
        return 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
      case 'USER_CREATE':
      case 'USER_UPDATE':
      case 'USER_TOGGLE':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-2xl shadow-md border border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold flex items-center gap-2">
            <FileText className="w-6 h-6 text-amber-400" />
            ประวัติการบันทึกและแก้ไขข้อมูลระบบ (Audit Log)
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            บันทึกการทำงานแบบ Real-time ตามมาตรฐานธรรมาภิบาลภาครัฐ
          </p>
        </div>

        <button
          onClick={() => exportAuditLogsToExcel(filteredLogs)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4" /> Export Audit Log (Excel)
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="ค้นหาตามชื่อผู้ปฏิบัติงาน, รายละเอียดการกระทำ, หน่วยงาน..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-300"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
        </div>

        <div className="w-full sm:w-64">
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs rounded-xl border border-slate-300 bg-white font-semibold"
          >
            <option value="all">ประเภทการกระทำ: ทั้งหมด</option>
            <option value="LOGIN">LOGIN (การเข้าสู่ระบบ)</option>
            <option value="ADD_PROJECT">ADD_PROJECT (เพิ่มโครงการ)</option>
            <option value="EDIT_PROJECT">EDIT_PROJECT (แก้ไขโครงการ)</option>
            <option value="DELETE_PROJECT">DELETE_PROJECT (ลบโครงการ)</option>
            <option value="USER_CREATE">USER_CREATE (สร้างผู้ใช้)</option>
            <option value="USER_TOGGLE">USER_TOGGLE (เปลี่ยนสถานะผู้ใช้)</option>
            <option value="EXPORT_DATA">EXPORT_DATA (ส่งออกรายงาน)</option>
          </select>
        </div>
      </div>

      {/* Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700 uppercase">
              <tr>
                <th className="px-4 py-3 w-40">วัน-เวลา</th>
                <th className="px-4 py-3 min-w-[160px]">ผู้ปฏิบัติงาน / หน่วยงาน</th>
                <th className="px-3 py-3 text-center w-32">ประเภท (Action)</th>
                <th className="px-4 py-3 min-w-[280px]">รายละเอียดกิจกรรม</th>
                <th className="px-3 py-3 font-mono text-right w-28">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap">
                    <Clock className="w-3.5 h-3.5 text-slate-400 inline mr-1" />
                    {log.timestamp}
                  </td>

                  <td className="px-4 py-3">
                    <strong className="text-slate-900 block">{log.userName}</strong>
                    <span className="text-[11px] text-slate-500">{log.agencyName}</span>
                  </td>

                  <td className="px-3 py-3 text-center">
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded text-[10px] font-bold border ${getActionBadgeClass(
                        log.action
                      )}`}
                    >
                      {log.action}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-slate-800 leading-relaxed font-medium">
                    {log.details}
                  </td>

                  <td className="px-3 py-3 text-right font-mono text-slate-400">
                    {log.ipAddress || '127.0.0.1'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
