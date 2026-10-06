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
  ChevronDown
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
    <div className="max-w-md sm:max-w-xl md:max-w-2xl mx-auto px-4 py-4 space-y-4">
      
      {/* Top Header Card for Mobile */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <BarChart3 className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-bold text-base text-slate-800">
                สถิติบริการรายเดือน
              </h2>
              <p className="text-[11px] text-slate-400">สรุปผลงานและความโปร่งใส</p>
            </div>
          </div>

          {/* Month Dropdown */}
          <div className="relative">
            <select
              value={selectedMonth || availableMonths[0]?.key || ''}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="pl-3 pr-8 py-2 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 text-xs font-bold appearance-none focus:outline-none"
            >
              {availableMonths.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-3 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* KPI Cards (2x2 on smartphone) */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-medium text-slate-400">เคสทั้งหมด</span>
          <div className="text-2xl font-black text-slate-800">{currentStats.totalTickets}</div>
          <span className="text-[10px] text-slate-400 block">ในเดือนนี้</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-medium text-slate-400">ปิดเคสสำเร็จ</span>
          <div className="text-2xl font-black text-emerald-600">
            {currentStats.resolutionRate.toFixed(0)}%
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold block">
            สำเร็จ {currentStats.resolvedTickets} เคส
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-medium text-slate-400">เวลาเฉลี่ย</span>
          <div className="text-2xl font-black text-amber-600">
            {currentStats.avgHours.toFixed(1)} <span className="text-xs font-normal">ชม.</span>
          </div>
          <span className="text-[10px] text-slate-400 block">จนแก้ไขเสร็จ</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-medium text-slate-400">ความพึงพอใจ</span>
          <div className="text-2xl font-black text-amber-500 flex items-center gap-1">
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            <span>{currentStats.avgRating.toFixed(1)}</span>
          </div>
          <span className="text-[10px] text-slate-400 block">จาก 5.0 ดาว</span>
        </div>
      </div>

      {/* Categories Breakdown (Compact Mobile Bars) */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
        <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
          ปัญหาจำแนกตามประเภทงาน
        </h3>

        <div className="space-y-2.5 pt-1">
          {currentStats.categoryDistribution.map((item, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-700">{item.name}</span>
                <span className="font-bold text-slate-900">{item.count} เคส</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Priority Breakdown (3 Touch Tiles) */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
        <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
          สัดส่วนตามความเร่งด่วน
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {currentStats.priorityDistribution.map((p, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <span className="text-[11px] text-slate-500 font-medium block">{p.label}</span>
              <span className="text-lg font-black mt-0.5 block" style={{ color: p.color }}>
                {p.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Resolved Tickets Transparency Cards (Mobile View) */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-700">เคสที่ปิดแล้วในเดือนนี้ ({currentStats.resolvedRecentTickets.length})</span>
          <span className="text-[10px] text-slate-400">ปิดบังข้อมูลส่วนตัว</span>
        </div>

        <div className="space-y-2">
          {currentStats.resolvedRecentTickets.map((t) => (
            <div key={t.id} className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  {t.id}
                </span>
                <span className="text-[11px] text-slate-400">
                  {t.reporterName.slice(0, 3)}***
                </span>
              </div>
              <div className="font-bold text-xs text-slate-800">{t.categoryName}</div>
              {t.solutionNotes && (
                <p className="text-[11px] text-slate-500 line-clamp-1 italic bg-slate-50 p-2 rounded-lg">
                  "{t.solutionNotes}"
                </p>
              )}
              {t.rating && (
                <div className="flex items-center gap-1 text-[11px] text-amber-500 font-bold pt-0.5">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>ประเมิน {t.rating} ดาว</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
