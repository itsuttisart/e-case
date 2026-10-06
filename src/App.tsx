import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  Search, 
  BarChart3, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  MessageSquare, 
  Sparkles, 
  Zap, 
  Shield, 
  ChevronRight, 
  Users, 
  Bell, 
  HeartHandshake,
  Star,
  Wifi,
  Monitor,
  Laptop
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { BottomNavBar } from './components/BottomNavBar';
import { TicketFormModal } from './components/TicketFormModal';
import { TicketTracker } from './components/TicketTracker';
import { MonthlyStatsView } from './components/MonthlyStatsView';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminDashboard } from './components/AdminDashboard';
import { LineLiveSimulatorDrawer } from './components/LineLiveSimulatorDrawer';
import { 
  getCategories, 
  getTickets, 
  getTeamMembers, 
  getLineSettings, 
  getSupabaseConfig, 
  isAdminLoggedIn, 
  setAdminLogin, 
  subscribeToDataChanges,
  getStatusLabel,
  getStatusBadgeClass,
  getPriorityBadge
} from './services/storage';
import { getLineLogs } from './services/lineService';
import { Ticket, Category, TeamMember, LineSettings, SupabaseConfig } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'track' | 'stats' | 'admin'>('home');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [lineSettings, setLineSettings] = useState<LineSettings>(getLineSettings());
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(getSupabaseConfig());

  // Modals & Drawers
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);
  const [isLineDrawerOpen, setIsLineDrawerOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(isAdminLoggedIn());
  const [searchTicketQuery, setSearchTicketQuery] = useState('');
  const [lineLogsCount, setLineLogsCount] = useState(getLineLogs().length);

  // Sync data from localStorage / memory
  const reloadData = () => {
    setTickets(getTickets());
    setCategories(getCategories());
    setTeamMembers(getTeamMembers());
    setLineSettings(getLineSettings());
    setSupabaseConfig(getSupabaseConfig());
    setIsAdmin(isAdminLoggedIn());
    setLineLogsCount(getLineLogs().length);
  };

  useEffect(() => {
    reloadData();
    const unsubscribe = subscribeToDataChanges(() => {
      reloadData();
    });
    return () => unsubscribe();
  }, []);

  const handleOpenReportModal = () => {
    setIsReportModalOpen(true);
  };

  const handleTrackTicket = (ticketId: string) => {
    setSearchTicketQuery(ticketId);
    setActiveTab('track');
  };

  const handleAdminLogout = () => {
    setAdminLogin(false);
    setIsAdmin(false);
    if (activeTab === 'admin') {
      setActiveTab('home');
    }
  };

  const handleAdminLoginSuccess = () => {
    setIsAdmin(true);
    setActiveTab('admin');
  };

  const totalResolved = tickets.filter((t) => t.status === 'resolved').length;
  const resolutionRate = tickets.length > 0 ? (totalResolved / tickets.length) * 100 : 96;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-['Prompt',sans-serif] select-none touch-manipulation pb-24">
      
      {/* Sleek Mobile App Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenReportModal={handleOpenReportModal}
        isAdmin={isAdmin}
        onAdminLogout={handleAdminLogout}
        onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
        onOpenLineDrawer={() => setIsLineDrawerOpen(true)}
        unreadCount={lineLogsCount}
        supabaseConfig={supabaseConfig}
      />

      {/* Main Screen Content */}
      <main className="flex-1 w-full">
        {/* ======================================================== */}
        {/* TAB 1: HOME PAGE (SMARTPHONE & IPAD FIRST UX)             */}
        {/* ======================================================== */}
        {activeTab === 'home' && (
          <div className="max-w-md sm:max-w-xl md:max-w-2xl mx-auto px-4 py-4 space-y-5">
            
            {/* Mobile Hero Card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 rounded-3xl p-5 sm:p-6 text-white shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#06C755] animate-ping" />
                  <span>แจ้งเตือนตรงสู่ LINE 24 ชม.</span>
                </span>
                <span className="text-[11px] text-emerald-400 font-medium">ไม่ต้อง Login</span>
              </div>

              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                  พบปัญหาการใช้งาน? <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300">
                    แจ้งเคสเพื่อรับบริการทันที
                  </span>
                </h1>
                <p className="text-xs text-slate-300 mt-1 font-light leading-relaxed">
                  เปิดเคสได้ทันใจ ระบุความเร่งด่วน พร้อมติดตามสถานะงานซ่อมแบบเรียลไทม์
                </p>
              </div>

              {/* Big 1-Tap Report Button for Thumb */}
              <button
                onClick={handleOpenReportModal}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 text-slate-950 font-black text-sm shadow-md active:scale-98 transition-transform"
              >
                <PlusCircle className="w-5 h-5 text-slate-950" />
                <span>กดเพื่อแจ้งเคสปัญหาตอนนี้</span>
              </button>

              {/* Quick Status Bar */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center">
                <div className="p-2 rounded-xl bg-white/5">
                  <div className="text-base font-extrabold text-emerald-400">{resolutionRate.toFixed(0)}%</div>
                  <div className="text-[10px] text-slate-400">ปิดงานสำเร็จ</div>
                </div>
                <div className="p-2 rounded-xl bg-white/5">
                  <div className="text-base font-extrabold text-teal-300">2.4 ชม.</div>
                  <div className="text-[10px] text-slate-400">เวลาเฉลี่ย</div>
                </div>
                <div className="p-2 rounded-xl bg-white/5">
                  <div className="text-base font-extrabold text-amber-300 flex items-center justify-center gap-0.5">
                    <Star className="w-3.5 h-3.5 fill-amber-300 inline" /> 4.9
                  </div>
                  <div className="text-[10px] text-slate-400">ความพึงพอใจ</div>
                </div>
              </div>
            </div>

            {/* Quick Category Action Tiles (1-Tap to report that category) */}
            <div>
              <div className="flex items-center justify-between px-1 mb-2">
                <span className="text-xs font-bold text-slate-700">หมวดหมู่ปัญหาที่พบบ่อย</span>
                <span className="text-[11px] text-slate-400">แตะเพื่อเปิดเคสทันที</span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <button
                  onClick={handleOpenReportModal}
                  className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-emerald-500 text-center space-y-1.5 active:scale-95 transition-all"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                    <Wifi className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 block line-clamp-1">อินเทอร์เน็ต</span>
                  <span className="text-[10px] text-slate-400 block">Wi-Fi / สาย LAN</span>
                </button>

                <button
                  onClick={handleOpenReportModal}
                  className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-blue-500 text-center space-y-1.5 active:scale-95 transition-all"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                    <Monitor className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 block line-clamp-1">คอม & ปริ้นเตอร์</span>
                  <span className="text-[10px] text-slate-400 block">เปิดไม่ติด / พัง</span>
                </button>

                <button
                  onClick={handleOpenReportModal}
                  className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-purple-500 text-center space-y-1.5 active:scale-95 transition-all"
                >
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 block line-clamp-1">โปรแกรม</span>
                  <span className="text-[10px] text-slate-400 block">ค้าง / แจ้ง Error</span>
                </button>
              </div>
            </div>

            {/* Quick Search Widget */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchTicketQuery.trim()) {
                    setActiveTab('track');
                  }
                }}
                className="flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchTicketQuery}
                    onChange={(e) => setSearchTicketQuery(e.target.value)}
                    placeholder="ค้นหาเคสเดิม (รหัส หรือ Line ID)..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
                <button
                  type="submit"
                  className="px-3.5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs active:scale-95 shrink-0"
                >
                  ติดตาม
                </button>
              </form>
            </div>

            {/* Recent Tickets Feed */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-700">เคสปัญหาล่าสุดที่กำลังทำ</span>
                <button
                  onClick={() => setActiveTab('track')}
                  className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center"
                >
                  ดูทั้งหมด <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2">
                {tickets.slice(0, 3).map((t) => {
                  const statusBadge = getStatusBadgeClass(t.status);
                  const priBadge = getPriorityBadge(t.priority);

                  return (
                    <div
                      key={t.id}
                      onClick={() => handleTrackTicket(t.id)}
                      className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs active:bg-slate-50 transition-colors cursor-pointer space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          {t.id}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${statusBadge.bg} ${statusBadge.text}`}>
                            {getStatusLabel(t.status)}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${priBadge.bg} ${priBadge.text}`}>
                            {priBadge.label}
                          </span>
                        </div>
                      </div>

                      <div className="font-bold text-slate-900 text-xs truncate">
                        {t.categoryName}
                      </div>

                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        {t.description}
                      </p>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-400">
                        <span>ผู้แจ้ง: {t.reporterName.slice(0, 3)}***</span>
                        <span className="text-emerald-600 font-bold">แตะเพื่อติดตาม &rarr;</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: TICKET TRACKER VIEW (MOBILE FIRST)                 */}
        {/* ======================================================== */}
        {activeTab === 'track' && (
          <TicketTracker
            tickets={tickets}
            initialSearchId={searchTicketQuery}
            onOpenReportModal={handleOpenReportModal}
          />
        )}

        {/* ======================================================== */}
        {/* TAB 3: MONTHLY STATS VIEW (MOBILE FIRST)                  */}
        {/* ======================================================== */}
        {activeTab === 'stats' && (
          <MonthlyStatsView tickets={tickets} />
        )}

        {/* ======================================================== */}
        {/* TAB 4: ADMIN PORTAL                                       */}
        {/* ======================================================== */}
        {activeTab === 'admin' && (
          isAdmin ? (
            <AdminDashboard
              tickets={tickets}
              categories={categories}
              teamMembers={teamMembers}
              lineSettings={lineSettings}
              supabaseConfig={supabaseConfig}
              onRefreshData={reloadData}
            />
          ) : (
            <div className="max-w-md mx-auto py-12 px-4 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">เข้าสู่ระบบผู้ดูแลระบบ</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  สำหรับผู้ดูแลระบบ ให้ทำการ login ทุกครั้งเพื่อความปลอดภัย
                </p>
              </div>
              <button
                onClick={() => setIsAdminLoginModalOpen(true)}
                className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md active:scale-98"
              >
                เข้าสู่ระบบแอดมิน (Admin Login)
              </button>
            </div>
          )
        )}
      </main>

      {/* Smartphone Bottom Navigation Bar (Thumb Anchored) */}
      <BottomNavBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenReportModal={handleOpenReportModal}
        isAdmin={isAdmin}
      />

      {/* Modals & Drawers */}
      <TicketFormModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        categories={categories}
        onTicketCreated={(ticket) => {
          reloadData();
          setSearchTicketQuery(ticket.id);
        }}
        onTrackTicket={handleTrackTicket}
      />

      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
        onSuccess={handleAdminLoginSuccess}
      />

      <LineLiveSimulatorDrawer
        isOpen={isLineDrawerOpen}
        onClose={() => setIsLineDrawerOpen(false)}
      />

    </div>
  );
}
