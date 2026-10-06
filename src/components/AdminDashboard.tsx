import React, { useState } from 'react';
import { 
  Users, 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  Star, 
  Plus, 
  Trash2, 
  Edit3, 
  Send, 
  Share2, 
  Database, 
  Settings, 
  ShieldCheck, 
  Search, 
  Filter, 
  FileText, 
  Check, 
  Copy, 
  AlertTriangle, 
  ExternalLink,
  MessageCircle,
  TrendingUp,
  FolderPlus,
  RefreshCw
} from 'lucide-react';
import { Ticket, Category, TeamMember, TicketStatus, Priority, LineSettings, SupabaseConfig } from '../types';
import { 
  getStatusBadgeClass, 
  getStatusLabel, 
  getPriorityBadge, 
  updateTicketStatus, 
  saveCategory, 
  deleteCategory, 
  saveTeamMember, 
  deleteTeamMember,
  saveLineSettings,
  saveSupabaseConfig,
  SUPABASE_SQL_SCHEMA
} from '../services/storage';
import { calculateWeeklySummary } from '../services/analytics';
import { 
  formatTicketStatusLineMessage, 
  formatWeeklyReportLineMessage, 
  sendLineNotification 
} from '../services/lineService';
import { 
  showToast, 
  showSuccessAlert, 
  showErrorAlert, 
  showConfirmAlert 
} from '../services/sweetAlert';

interface AdminDashboardProps {
  tickets: Ticket[];
  categories: Category[];
  teamMembers: TeamMember[];
  lineSettings: LineSettings;
  supabaseConfig: SupabaseConfig;
  onRefreshData: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  tickets,
  categories,
  teamMembers,
  lineSettings,
  supabaseConfig,
  onRefreshData,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'performance' | 'tickets' | 'weekly' | 'categories' | 'team' | 'settings'>('performance');

  // Filter state for tickets tab
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchTicket, setSearchTicket] = useState<string>('');

  // Status editing modal
  const [selectedTicketForEdit, setSelectedTicketForEdit] = useState<Ticket | null>(null);
  const [editStatus, setEditStatus] = useState<TicketStatus>('in_progress');
  const [editAssignee, setEditAssignee] = useState<string>('');
  const [editNote, setEditNote] = useState<string>('');
  const [editSolution, setEditSolution] = useState<string>('');
  const [notifyLineOnUpdate, setNotifyLineOnUpdate] = useState<boolean>(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  // Category addition modal / form
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatColor, setNewCatColor] = useState('blue');
  const [showAddCatModal, setShowAddCatModal] = useState(false);

  // Team member addition
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('ฝ่ายบริการลูกค้า & ช่างเทคนิค');
  const [newMemberLine, setNewMemberLine] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberSpecialty, setNewMemberSpecialty] = useState('');
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  // Settings
  const [supabaseUrl, setSupabaseUrl] = useState(supabaseConfig.url || '');
  const [supabaseKey, setSupabaseKey] = useState(supabaseConfig.anonKey || '');
  const [lineWebhook, setLineWebhook] = useState(lineSettings.webhookUrl || '');
  const [copiedSql, setCopiedSql] = useState(false);
  const [settingsSavedToast, setSettingsSavedToast] = useState(false);

  // Weekly report state
  const [weeklyOffset, setWeeklyOffset] = useState<number>(0);
  const weeklySummary = calculateWeeklySummary(tickets, teamMembers, weeklyOffset);
  const [isSendingWeeklyLine, setIsSendingWeeklyLine] = useState(false);
  const [weeklySentSuccess, setWeeklySentSuccess] = useState(false);

  // ---------------- Handlers ----------------

  const handleOpenEditTicket = (ticket: Ticket) => {
    setSelectedTicketForEdit(ticket);
    setEditStatus(ticket.status);
    setEditAssignee(ticket.assignedTo || '');
    setEditNote('');
    setEditSolution(ticket.solutionNotes || '');
    setNotifyLineOnUpdate(true);
  };

  const handleSaveTicketStatus = async () => {
    if (!selectedTicketForEdit) return;
    setIsUpdatingStatus(true);
    try {
      const updated = updateTicketStatus(
        selectedTicketForEdit.id,
        editStatus,
        editNote.trim(),
        'ผู้ดูแลระบบ',
        editAssignee || undefined,
        editSolution.trim() || undefined
      );

      if (updated && notifyLineOnUpdate) {
        // Send LINE status update notification
        const lineMsg = formatTicketStatusLineMessage(updated, editStatus, editNote.trim());
        await sendLineNotification(lineMsg, 'status_updated', updated);
      }

      showToast(`อัปเดตสถานะ ${selectedTicketForEdit.id} สำเร็จ!`, 'success');
      setSelectedTicketForEdit(null);
      onRefreshData();
    } catch (err) {
      console.error(err);
      showErrorAlert('เกิดข้อผิดพลาดในการบันทึกสถานะ');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const newCat: Category = {
      id: 'cat-' + Date.now(),
      name: newCatName.trim(),
      description: newCatDesc.trim() || 'หมวดหมู่ที่เพิ่มโดยผู้ดูแลระบบ',
      color: newCatColor,
      icon: 'Tag',
      isActive: true,
    };

    saveCategory(newCat);
    showToast(`เพิ่มหัวข้อ "${newCat.name}" เรียบร้อย`, 'success');
    setNewCatName('');
    setNewCatDesc('');
    setShowAddCatModal(false);
    onRefreshData();
  };

  const handleAddTeamMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    const newMem: TeamMember = {
      id: 'tm-' + Date.now(),
      name: newMemberName.trim(),
      role: newMemberRole.trim(),
      lineId: newMemberLine.trim() || '@staff',
      phone: newMemberPhone.trim() || '08X-XXX-XXXX',
      email: `${newMemberName.trim().toLowerCase().replace(/\s+/g, '')}@helpdesk.local`,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      specialty: newMemberSpecialty.trim() || 'ดูแลงานซ่อมทั่วไป',
    };

    saveTeamMember(newMem);
    showToast(`เพิ่มสมาชิก "${newMem.name}" สำเร็จ`, 'success');
    setNewMemberName('');
    setNewMemberLine('');
    setNewMemberPhone('');
    setNewMemberSpecialty('');
    setShowAddMemberModal(false);
    onRefreshData();
  };

  const handleSaveSettings = () => {
    saveSupabaseConfig({
      url: supabaseUrl.trim(),
      anonKey: supabaseKey.trim(),
      isConnected: Boolean(supabaseUrl.trim() && supabaseKey.trim()),
    });

    saveLineSettings({
      ...lineSettings,
      webhookUrl: lineWebhook.trim(),
    });

    showToast('บันทึกการตั้งค่า Supabase & LINE แล้ว', 'success');
    setSettingsSavedToast(true);
    setTimeout(() => setSettingsSavedToast(false), 3000);
  };

  const handleSendWeeklyToLine = async () => {
    setIsSendingWeeklyLine(true);
    try {
      const msg = formatWeeklyReportLineMessage(weeklySummary);
      await sendLineNotification(msg, 'weekly_report');
      showSuccessAlert('ส่งรายงานเข้า LINE สำเร็จ!', 'ระบบสรุปรายงานสัปดาห์นี้และส่งเข้า LINE เรียบร้อยแล้ว');
      setWeeklySentSuccess(true);
      setTimeout(() => setWeeklySentSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      showErrorAlert('ส่งรายงานเข้า LINE ไม่สำเร็จ', 'กรุณาตรวจสอบการเชื่อมต่อ Webhook');
    } finally {
      setIsSendingWeeklyLine(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  // Filtered tickets
  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (searchTicket) {
      const q = searchTicket.toLowerCase();
      return (
        t.id.toLowerCase().includes(q) ||
        t.reporterName.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.categoryName.toLowerCase().includes(q) ||
        t.lineContact.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      
      {/* Top Banner & Tab Navigation */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold">Admin Management Portal</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
                  ผู้ดูแลระบบ
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                ศูนย์ควบคุม ตรวจสอบประสิทธิภาพทีมงาน จัดการเคส และระบบสรุปรายงานอัตโนมัติ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefreshData}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-slate-200 transition-colors border border-white/10"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>รีเฟรชข้อมูล</span>
            </button>
          </div>
        </div>

        {/* Sub-tab Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold border-t border-slate-800 pt-4">
          <button
            onClick={() => setActiveSubTab('performance')}
            className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
              activeSubTab === 'performance'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>ประสิทธิภาพทีมงาน (หน้าเดียว)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('tickets')}
            className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
              activeSubTab === 'tickets'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>จัดการเคสทั้งหมด ({tickets.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('weekly')}
            className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
              activeSubTab === 'weekly'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>รายงานสรุปประจำสัปดาห์</span>
          </button>

          <button
            onClick={() => setActiveSubTab('categories')}
            className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
              activeSubTab === 'categories'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FolderPlus className="w-4 h-4" />
            <span>หัวข้อปัญหา ({categories.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('team')}
            className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
              activeSubTab === 'team'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>รายชื่อทีมงาน ({teamMembers.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('settings')}
            className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
              activeSubTab === 'settings'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>ตั้งค่า Supabase & LINE</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 1. SINGLE-PANE TEAM PERFORMANCE DASHBOARD (ตามโจทย์ผู้ใช้!) */}
      {/* ============================================================ */}
      {activeSubTab === 'performance' && (
        <div className="space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="text-xs font-semibold text-slate-500">เคสที่รอดำเนินการ</div>
              <div className="text-2xl font-bold text-amber-600 mt-1">
                {tickets.filter((t) => t.status === 'pending').length}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">รอส่งต่อให้ช่าง</div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="text-xs font-semibold text-slate-500">กำลังแก้ไข (In Progress)</div>
              <div className="text-2xl font-bold text-indigo-600 mt-1">
                {tickets.filter((t) => t.status === 'in_progress' || t.status === 'investigating').length}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">ทีมงานกำลังดำเนินการ</div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="text-xs font-semibold text-slate-500">ปิดเคสสำเร็จแล้ว</div>
              <div className="text-2xl font-bold text-emerald-600 mt-1">
                {tickets.filter((t) => t.status === 'resolved').length}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">จากทั้งหมด {tickets.length} เคส</div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="text-xs font-semibold text-slate-500">เคสด่วนที่สุดที่ยังค้าง</div>
              <div className="text-2xl font-bold text-rose-600 mt-1">
                {tickets.filter((t) => t.priority === 'urgent_highest' && t.status !== 'resolved').length}
              </div>
              <div className="text-[11px] text-rose-600 font-medium mt-0.5">ต้องเร่งดำเนินการทันที</div>
            </div>
          </div>

          {/* Team Members Performance Cards Grid */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">
                  ประสิทธิภาพของทีมงาน (Team Performance Overview)
                </h3>
                <p className="text-xs text-slate-500">
                  ตรวจสอบปริมาณงาน อัตราปิดเคส และความพึงพอใจของลูกค้าแบบเรียลไทม์ในหน้าเดียว
                </p>
              </div>
              <button
                onClick={() => setShowAddMemberModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200"
              >
                <Plus className="w-3.5 h-3.5" />
                เพิ่มสมาชิกทีม
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
              {teamMembers.map((member) => {
                const assignedAll = tickets.filter((t) => t.assignedTo === member.id);
                const memberResolved = assignedAll.filter((t) => t.status === 'resolved');
                const memberWorking = assignedAll.filter((t) => t.status === 'in_progress' || t.status === 'investigating' || t.status === 'waiting_verification');
                const successRate = assignedAll.length > 0 ? (memberResolved.length / assignedAll.length) * 100 : 100;

                // Ratings for this technician
                const rated = memberResolved.filter((t) => t.rating !== undefined);
                const avgRating = rated.length > 0 ? rated.reduce((a, b) => a + (b.rating || 5), 0) / rated.length : 5.0;

                return (
                  <div
                    key={member.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all space-y-4"
                  >
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-13 h-13 rounded-2xl object-cover border-2 border-indigo-200 shadow-xs"
                      />
                      <div className="overflow-hidden">
                        <div className="font-bold text-slate-900 text-sm truncate">
                          {member.name}
                        </div>
                        <div className="text-xs text-indigo-600 font-medium truncate">
                          {member.role}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          LINE: <span className="text-[#06C755] font-semibold">{member.lineId}</span>
                        </div>
                      </div>
                    </div>

                    {/* Specialty */}
                    <div className="text-xs bg-white p-2.5 rounded-xl border border-slate-200/70 text-slate-600">
                      <span className="font-semibold text-slate-700">ความเชี่ยวชาญ:</span> {member.specialty}
                    </div>

                    {/* Metrics Matrix */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                        <span className="text-[10px] text-slate-400 block">รับผิดชอบ</span>
                        <span className="text-base font-bold text-slate-800">{assignedAll.length}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                        <span className="text-[10px] text-slate-400 block">กำลังทำ</span>
                        <span className="text-base font-bold text-amber-600">{memberWorking.length}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                        <span className="text-[10px] text-slate-400 block">ปิดเสร็จ</span>
                        <span className="text-base font-bold text-emerald-600">{memberResolved.length}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-500">อัตราปิดงาน:</span>
                        <span className="text-emerald-700">{successRate.toFixed(0)}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${successRate}%` }}
                        />
                      </div>
                    </div>

                    {/* Customer Rating & Contact */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                      <div className="flex items-center gap-1 text-amber-600 font-bold">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span>{avgRating.toFixed(1)} / 5.0</span>
                      </div>

                      <a
                        href={`https://line.me/R/ti/p/~${member.lineId.replace('@', '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#06C755]/10 text-[#06C755] hover:bg-[#06C755]/20 font-semibold text-[11px] transition-colors"
                      >
                        <MessageCircle className="w-3 h-3" />
                        ติดต่อ LINE
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. TICKETS MANAGEMENT BOARD                                  */}
      {/* ============================================================ */}
      {activeSubTab === 'tickets' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col lg:flex-row gap-3 justify-between">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchTicket}
                onChange={(e) => setSearchTicket(e.target.value)}
                placeholder="ค้นหาตามรหัสเคส, ชื่อผู้แจ้ง, รายละเอียด หรือ LINE ID..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">สถานะทั้งหมด</option>
                <option value="pending">รอดำเนินการ</option>
                <option value="investigating">กำลังตรวจสอบ</option>
                <option value="in_progress">กำลังแก้ไข</option>
                <option value="waiting_verification">รอยืนยัน/ทดสอบ</option>
                <option value="resolved">เสร็จสิ้น</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">ความสำคัญทั้งหมด</option>
                <option value="urgent_highest">ด่วนที่สุด</option>
                <option value="urgent">ด่วน</option>
                <option value="normal">ไม่รีบ</option>
              </select>
            </div>
          </div>

          {/* Mobile & Tablet Friendly Tickets Cards / Table */}
          <div className="space-y-3">
            {filteredTickets.length > 0 ? (
              filteredTickets.map((t) => {
                const statusBadge = getStatusBadgeClass(t.status);
                const priBadge = getPriorityBadge(t.priority);

                return (
                  <div
                    key={t.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-indigo-400 shadow-2xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                          {t.id}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}>
                          {getStatusLabel(t.status)}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${priBadge.bg} ${priBadge.text}`}>
                        {priBadge.label}
                      </span>
                    </div>

                    <div>
                      <div className="font-bold text-slate-900 text-sm">{t.categoryName}</div>
                      <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">{t.description}</p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                      <div>
                        <span className="font-semibold text-slate-700">{t.reporterName}</span>
                        <span className="text-[#06C755] ml-1.5 font-medium">LINE: {t.lineContact}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        ช่าง: <span className="text-slate-700 font-medium">{t.assignedMemberName || 'ยังไม่ระบุ'}</span>
                      </div>
                    </div>

                    <div className="pt-1 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400">
                        {new Date(t.createdAt).toLocaleDateString('th-TH')}
                      </span>
                      <button
                        onClick={() => handleOpenEditTicket(t)}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-transform"
                      >
                        อัปเดตสถานะ & จัดการ
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                ไม่พบเคสที่ตรงกับเงื่อนไข
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. AUTOMATED WEEKLY SUMMARY REPORT (ระบบสรุปรายงานรายสัปดาห์) */}
      {/* ============================================================ */}
      {activeSubTab === 'weekly' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <FileText className="w-5 h-5" />
                </span>
                <h3 className="font-bold text-slate-800 text-xl">
                  ระบบสรุปรายงานประจำสัปดาห์อัตโนมัติ (Automated Weekly Digest)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                สรุปข้อมูลผลงานการบริการรายสัปดาห์ พร้อมส่งแจ้งเตือนเข้ากลุ่ม LINE ทีมงานได้ทันที
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={weeklyOffset}
                onChange={(e) => setWeeklyOffset(Number(e.target.value))}
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-slate-50"
              >
                <option value={0}>สัปดาห์ปัจจุบัน</option>
                <option value={1}>สัปดาห์ที่แล้ว (ย้อนหลัง 1 สัปดาห์)</option>
                <option value={2}>ย้อนหลัง 2 สัปดาห์</option>
              </select>

              <button
                onClick={handleSendWeeklyToLine}
                disabled={isSendingWeeklyLine}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#06C755] hover:bg-[#05b34c] text-white text-xs font-bold shadow-xs transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSendingWeeklyLine ? 'กำลังส่ง...' : 'ส่งสรุปเข้า LINE ทีมงาน'}</span>
              </button>
            </div>
          </div>

          {weeklySentSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>ส่งรายงานประจำสัปดาห์เข้า LINE สำเร็จเรียบร้อย!</span>
            </div>
          )}

          {/* Weekly Numbers Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-xs text-slate-500 font-semibold">เคสทั้งหมดในสัปดาห์</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{weeklySummary.totalTickets}</div>
              <div className="text-[11px] text-slate-400">{weeklySummary.startDate} - {weeklySummary.endDate}</div>
            </div>

            <div className="p-4.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-xs text-slate-500 font-semibold">ดำเนินการเสร็จสิ้น</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">{weeklySummary.resolvedTickets}</div>
              <div className="text-[11px] text-emerald-700 font-semibold">อัตราสำเร็จ {weeklySummary.resolutionRate.toFixed(1)}%</div>
            </div>

            <div className="p-4.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-xs text-slate-500 font-semibold">เวลาเฉลี่ยในการปิดงาน</div>
              <div className="text-2xl font-black text-indigo-600 mt-1">
                {weeklySummary.avgResolutionHours.toFixed(1)} <span className="text-xs text-slate-400">ชม.</span>
              </div>
              <div className="text-[11px] text-slate-400">นับจากเวลาเปิดเคส</div>
            </div>

            <div className="p-4.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-xs text-slate-500 font-semibold">เคสด่วนที่สุด</div>
              <div className="text-2xl font-black text-rose-600 mt-1">{weeklySummary.urgentTickets}</div>
              <div className="text-[11px] text-slate-400">หมวดสูงสุด: {weeklySummary.topCategory}</div>
            </div>
          </div>

          {/* Executive Insights */}
          <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2">
            <div className="font-bold text-xs text-indigo-900 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <span>บทวิเคราะห์และข้อเสนอแนะเชิงลึกประจำสัปดาห์ (AI & Rules Executive Insights)</span>
            </div>
            <ul className="space-y-1.5 text-xs text-indigo-800 list-disc list-inside">
              {weeklySummary.insights.map((ins, i) => (
                <li key={i}>{ins}</li>
              ))}
            </ul>
          </div>

          {/* Team Breakdown in this week */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs text-slate-600 uppercase tracking-wider">
              สรุปผลงานรายบุคคลในสัปดาห์นี้
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {weeklySummary.teamPerformance.map((tp) => (
                <div key={tp.memberId} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="font-bold text-slate-800 text-sm">{tp.memberName}</div>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>ปิดเคสสำเร็จ:</span>
                    <span className="font-bold text-emerald-600">{tp.resolved} เคส</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>กำลังทำค้างอยู่:</span>
                    <span className="font-bold text-amber-600">{tp.inProgress} เคส</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-600 pt-1 border-t border-slate-100">
                    <span>คะแนนความพึงพอใจ:</span>
                    <span className="font-bold text-amber-500 flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-amber-400" /> {tp.avgRating.toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. CATEGORY MANAGEMENT (หัวข้อปัญหา ให้แอดมินเข้าไปเพิ่มเองได้)  */}
      {/* ============================================================ */}
      {activeSubTab === 'categories' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">
                จัดการหัวข้อปัญหา (Custom Categories)
              </h3>
              <p className="text-xs text-slate-500">
                ผู้ดูแลระบบสามารถเพิ่ม แก้ไข หรือปิดใช้งานหัวข้อปัญหาที่ให้ผู้ใช้งานเลือกได้เอง
              </p>
            </div>
            <button
              onClick={() => setShowAddCatModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มหัวข้อปัญหาใหม่</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((cat) => {
              const ticketCount = tickets.filter((t) => t.categoryId === cat.id).length;

              return (
                <div
                  key={cat.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{cat.name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-700">
                        {ticketCount} เคส
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{cat.description}</p>
                  </div>

                  <button
                    onClick={async () => {
                      const ok = await showConfirmAlert(`ลบหัวข้อ "${cat.name}"`, 'คุณแน่ใจหรือไม่ว่าต้องการลบหัวข้อปัญหานี้?');
                      if (ok) {
                        deleteCategory(cat.id);
                        showToast(`ลบหัวข้อ "${cat.name}" แล้ว`, 'info');
                        onRefreshData();
                      }
                    }}
                    title="ลบหมวดหมู่นี้"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. TEAM MEMBERS MANAGEMENT                                   */}
      {/* ============================================================ */}
      {activeSubTab === 'team' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">
                จัดการรายชื่อเจ้าหน้าที่ / ช่างเทคนิค
              </h3>
              <p className="text-xs text-slate-500">
                เพิ่มข้อมูลเจ้าหน้าที่สำหรับมอบหมายงานและตรวจสอบประสิทธิภาพ
              </p>
            </div>
            <button
              onClick={() => setShowAddMemberModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มเจ้าหน้าที่ใหม่</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3 relative group"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-12 h-12 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <div className="font-bold text-slate-800 text-sm">{member.name}</div>
                    <div className="text-xs text-indigo-600">{member.role}</div>
                  </div>
                </div>

                <div className="text-xs space-y-1 text-slate-600">
                  <div>LINE: <span className="font-semibold text-[#06C755]">{member.lineId}</span></div>
                  <div>เบอร์โทร: <span className="font-semibold">{member.phone}</span></div>
                  <div>ความถนัด: <span className="text-slate-500">{member.specialty}</span></div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={async () => {
                      const ok = await showConfirmAlert(`ลบเจ้าหน้าที่ "${member.name}"`, 'คุณแน่ใจหรือไม่ว่าต้องการลบเจ้าหน้าที่ท่านนี้?');
                      if (ok) {
                        deleteTeamMember(member.id);
                        showToast(`ลบเจ้าหน้าที่ "${member.name}" แล้ว`, 'info');
                        onRefreshData();
                      }
                    }}
                    className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> ลบ
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 6. SYSTEM SETTINGS: SUPABASE & LINE                          */}
      {/* ============================================================ */}
      {activeSubTab === 'settings' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-8">
          <div>
            <h3 className="font-bold text-slate-800 text-xl">
              การเชื่อมต่อ Supabase Database & LINE Notifications
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              รองรับการ Deploy ผ่าน GitHub Pages / Vercel และเชื่อมต่อตาราง Supabase สำหรับฐานข้อมูลถาวร
            </p>
          </div>

          {settingsSavedToast && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>บันทึกการตั้งค่าเรียบร้อยแล้ว!</span>
            </div>
          )}

          {/* Supabase Config Box */}
          <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-4">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>ตั้งค่า Supabase Database (ผู้ใช้งานต้องการใช้ Supabase)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="text"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Supabase Anon Public API Key
                </label>
                <input
                  type="password"
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Ready-to-run SQL snippet */}
            <div className="mt-4 pt-4 border-t border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  โค้ด SQL สำหรับสร้างตารางบน Supabase (Run in SQL Editor):
                </span>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedSql ? 'คัดลอกสำเร็จแล้ว!' : 'คัดลอกโค้ด SQL ทั้งหมด'}
                </button>
              </div>

              <pre className="p-3.5 rounded-xl bg-slate-900 text-emerald-300 font-mono text-[11px] overflow-x-auto max-h-40">
                {SUPABASE_SQL_SCHEMA}
              </pre>
            </div>
          </div>

          {/* LINE Webhook Configuration */}
          <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-4">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-[#06C755]" />
              <span>ตั้งค่า LINE Webhook / Notify URL</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                LINE Webhook Endpoint URL (Zapier, Make, n8n, หรือ Custom Backend)
              </label>
              <input
                type="text"
                value={lineWebhook}
                onChange={(e) => setLineWebhook(e.target.value)}
                placeholder="https://hook.eu1.make.com/your-line-webhook-path"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#06C755]"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                เมื่อมีเคสใหม่หรืออัปเดตสถานะ ระบบจะส่ง HTTP POST พร้อมข้อมูลเคสและข้อความแจ้งเตือนไปทันที
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveSettings}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all active:scale-98"
            >
              บันทึกการตั้งค่าทั้งหมด
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: UPDATE TICKET STATUS & LINE DISPATCH                  */}
      {/* ============================================================ */}
      {selectedTicketForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">อัปเดตสถานะเคส: {selectedTicketForEdit.id}</h3>
                <p className="text-[11px] text-slate-400">{selectedTicketForEdit.categoryName}</p>
              </div>
              <button
                onClick={() => setSelectedTicketForEdit(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Change Status */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">สถานะใหม่</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as TicketStatus)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold bg-white"
                >
                  <option value="pending">รอดำเนินการ</option>
                  <option value="investigating">กำลังตรวจสอบ</option>
                  <option value="in_progress">กำลังแก้ไข</option>
                  <option value="waiting_verification">รอยืนยัน/ทดสอบ</option>
                  <option value="resolved">แก้ไขเสร็จสิ้น (Resolved)</option>
                  <option value="cancelled">ยกเลิกเคส (Cancelled)</option>
                </select>
              </div>

              {/* Assign Technician */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">มอบหมายช่างผู้รับผิดชอบ</label>
                <select
                  value={editAssignee}
                  onChange={(e) => setEditAssignee(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold bg-white"
                >
                  <option value="">-- ยังไม่มอบหมาย --</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Timeline Update Note */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">หมายเหตุบันทึกความคืบหน้า</label>
                <input
                  type="text"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="เช่น ตรวจสอบพบอะไหล่ชำรุด อยู่ระหว่างเปลี่ยนชิ้นส่วนใหม่..."
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              {/* Solution Notes if resolved */}
              {editStatus === 'resolved' && (
                <div>
                  <label className="block font-bold text-emerald-800 mb-1">
                    สรุปผลการแก้ไข (Solution Notes)
                  </label>
                  <textarea
                    rows={2}
                    value={editSolution}
                    onChange={(e) => setEditSolution(e.target.value)}
                    placeholder="ระบุสาเหตุและการแก้ไขเสร็จสิ้น เพื่อบันทึกเป็นประวัติและแจ้งลูกค้า..."
                    className="w-full p-2.5 rounded-xl border border-emerald-300 bg-emerald-50/30"
                  />
                </div>
              )}

              {/* LINE Notification Checkbox */}
              <div className="p-3 rounded-xl bg-[#06C755]/10 border border-[#06C755]/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#06C755]" />
                  <span className="font-bold text-[#06C755]">
                    แจ้งเตือนอัปเดตเข้า LINE ลูกค้าทันที ({selectedTicketForEdit.lineContact})
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyLineOnUpdate}
                  onChange={(e) => setNotifyLineOnUpdate(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedTicketForEdit(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={handleSaveTicketStatus}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md transition-all active:scale-98"
                >
                  {isUpdatingStatus ? 'กำลังบันทึก...' : 'บันทึกสถานะ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD CATEGORY */}
      {showAddCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">เพิ่มหัวข้อปัญหาใหม่</h3>
            <form onSubmit={handleAddCategory} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ชื่อหัวข้อปัญหา</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="เช่น ปัญหาเครื่องอ่านบาร์โค้ด, ระบบเบิกจ่ายสินค้า"
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">คำอธิบายเพิ่มเติม</label>
                <input
                  type="text"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="คำแนะนำสั้นๆ สำหรับผู้ใช้..."
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCatModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  เพิ่มหัวข้อ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD TEAM MEMBER */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">เพิ่มเจ้าหน้าที่ใหม่</h3>
            <form onSubmit={handleAddTeamMember} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ชื่อ-นามสกุล / ชื่อเล่น</label>
                <input
                  type="text"
                  required
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="เช่น ปิยะวัฒน์ รักดี (ช่างปิยะ)"
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ตำแหน่ง</label>
                <input
                  type="text"
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">LINE ID</label>
                  <input
                    type="text"
                    value={newMemberLine}
                    onChange={(e) => setNewMemberLine(e.target.value)}
                    placeholder="@piyawat_it"
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">เบอร์โทร</label>
                  <input
                    type="text"
                    value={newMemberPhone}
                    onChange={(e) => setNewMemberPhone(e.target.value)}
                    placeholder="08X-XXX-XXXX"
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ความเชี่ยวชาญ</label>
                <input
                  type="text"
                  value={newMemberSpecialty}
                  onChange={(e) => setNewMemberSpecialty(e.target.value)}
                  placeholder="เช่น ฮาร์ดแวร์, ซอฟต์แวร์, ระบบเน็ตเวิร์ก"
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
