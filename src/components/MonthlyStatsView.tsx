import React, { useState } from 'react';
import { 
  BarChart3, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Star, 
  TrendingUp, 
  Layers, 
  ShieldCheck, 
  FileText,
  Printer
} from 'lucide-react';
import { Ticket } from '../types';
import { calculateMonthlyStats } from '../services/analytics';
import { getPriorityBadge, getStatusBadgeClass, getStatusLabel } from '../services/storage';

interface MonthlyStatsViewProps {
  tickets: Ticket[];
}

export const MonthlyStatsView: React.FC<MonthlyStatsViewProps> = ({ tickets }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  const { availableMonths, currentStats } = calculateMonthlyStats(tickets, selectedMonth);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
              รายงานสถิติการให้บริการรายเดือน
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            สรุปข้อมูลสถิติเพื่อความโปร่งใสและประเมินผลการทำงานของฝ่ายสนับสนุน
          </p>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-500" />
          <select
            value={selectedMonth || availableMonths[0]?.key || ''}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {availableMonths.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => window.print()}
            title="พิมพ์รายงาน"
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tickets */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">จำนวนเคสทั้งหมด</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {currentStats.totalTickets}
          </div>
          <p className="text-[11px] text-slate-500">
            เปิดเรื่องในเดือน{currentStats.monthNameTh}
          </p>
        </div>

        {/* Resolution Rate */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">อัตราการปิดเคสสำเร็จ</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
            {currentStats.resolutionRate.toFixed(1)}%
          </div>
          <p className="text-[11px] text-emerald-700 font-medium">
            ปิดสำเร็จ {currentStats.resolvedTickets} จาก {currentStats.totalTickets} เคส
          </p>
        </div>

        {/* Avg Resolution Hours */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">เวลาเฉลี่ยในการแก้ไข</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {currentStats.avgHours.toFixed(1)} <span className="text-sm font-normal text-slate-500">ชม.</span>
          </div>
          <p className="text-[11px] text-slate-500">
            คำนวณจากเคสที่แก้ไขเสร็จ
          </p>
        </div>

        {/* Customer Satisfaction */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">ความพึงพอใจเฉลี่ย (CSAT)</span>
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 flex items-center gap-1">
            {currentStats.avgRating.toFixed(1)} <span className="text-sm font-normal text-slate-400">/ 5.0</span>
          </div>
          <p className="text-[11px] text-slate-500">
            ประเมินจากผู้รับบริการจริง
          </p>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            สัดส่วนปัญหาจำแนกตามประเภท
          </h3>

          <div className="space-y-3.5 pt-2">
            {currentStats.categoryDistribution.length > 0 ? (
              currentStats.categoryDistribution.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700">{item.name}</span>
                    <span className="font-bold text-slate-900">
                      {item.count} เคส ({item.percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 py-4 text-center">ไม่มีข้อมูลเคสในเดือนนี้</div>
            )}
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            สัดส่วนตามระดับความสำคัญ
          </h3>

          <div className="grid grid-cols-3 gap-3 pt-2">
            {currentStats.priorityDistribution.map((item, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
                <span className="text-xs font-semibold text-slate-600 block">{item.label}</span>
                <span className="text-2xl font-extrabold" style={{ color: item.color }}>
                  {item.count}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {currentStats.totalTickets > 0 ? ((item.count / currentStats.totalTickets) * 100).toFixed(0) : 0}% ของทั้งหมด
                </span>
              </div>
            ))}
          </div>

          {/* SLA Benchmark Banner */}
          <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-start gap-3 text-xs text-emerald-800">
            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">เกณฑ์มาตรฐานการบริการ (SLA Target):</span>
              <p className="text-emerald-700 mt-0.5">
                เคสด่วนที่สุดตอบสนองภายใน 1 ชม. / เคสด่วนภายใน 4 ชม. / เคสทั่วไปภายใน 24 ชม.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Public Resolved Cases Transparency Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-base">
              รายการเคสที่แก้ไขเสร็จสิ้นประจำเดือน{currentStats.monthNameTh}
            </h3>
            <p className="text-xs text-slate-500">
              บันทึกผลงานการซ่อมแซมและแก้ไขปัญหาจริงเพื่อความโปร่งใส (ปกปิดข้อมูลส่วนบุคคล)
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {currentStats.resolvedRecentTickets.length} เคส
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">รหัสเคส</th>
                <th className="py-3 px-4">ผู้แจ้ง (ย่อ)</th>
                <th className="py-3 px-4">หมวดหมู่</th>
                <th className="py-3 px-4">ความสำคัญ</th>
                <th className="py-3 px-4">ผู้รับผิดชอบ</th>
                <th className="py-3 px-4">วิธีแก้ไข</th>
                <th className="py-3 px-4">คะแนน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {currentStats.resolvedRecentTickets.length > 0 ? (
                currentStats.resolvedRecentTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700">{t.id}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {t.reporterName.slice(0, 3)}***
                    </td>
                    <td className="py-3 px-4">{t.categoryName}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getPriorityBadge(t.priority).bg} ${getPriorityBadge(t.priority).text}`}>
                        {getPriorityBadge(t.priority).label}
                      </span>
                    </td>
                    <td className="py-3 px-4">{t.assignedMemberName || 'ทีมเทคนิค'}</td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-500" title={t.solutionNotes}>
                      {t.solutionNotes || 'ดำเนินการแก้ไขและทดสอบเรียบร้อย'}
                    </td>
                    <td className="py-3 px-4">
                      {t.rating ? (
                        <div className="flex items-center gap-0.5 text-amber-500 font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{t.rating}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    ยังไม่มีข้อมูลเคสที่ปิดในเดือนนี้
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
