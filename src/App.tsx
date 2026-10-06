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
  Star
} from 'lucide-react';
import { Navbar } from './components/Navbar';
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

  // Quick stats for hero banner
  const totalResolved = tickets.filter((t) => t.status === 'resolved').length;
  const resolutionRate = tickets.length > 0 ? (totalResolved / tickets.length) * 100 : 96;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-['Prompt',sans-serif]">
      {/* Top Navbar */}
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

      {/* Main Content Area */}
      <main className="flex-1">
        {/* ======================================================== */}
        {/* TAB 1: HOME PAGE (ผู้แจ้งเปิดเว็บปุป แจ้งเคสได้ทันที)     */}
        {/* ======================================================== */}
        {activeTab === 'home' && (
          <div className="space-y-12 pb-16">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-900 text-white pt-12 pb-20 px-4 sm:px-6 lg:px-8">
              <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold backdrop-blur-md">
                  <span className="w-2 h-2 rounded-full bg-[#06C755] animate-ping" />
                  <span>ระบบแจ้งเคสและติดตามปัญหาแบบเรียลไทม์ • พร้อมแจ้งเตือนผ่าน LINE ทันที</span>
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
                  แก้ปัญหาได้รวดเร็ว <br className="hidden sm:block" />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                    ติดตามสถานะได้ทันใจ
                  </span> ทุกเวลา
                </h1>

                <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
                  เปิดเคสแจ้งปัญหาได้ทันทีโดยไม่ต้องเข้าสู่ระบบ กำหนดระดับความสำคัญ 
                  และรับการแจ้งเตือนความคืบหน้าตรงสู่ LINE ของคุณแบบเรียลไทม์
                </p>

                {/* Primary Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
                  <button
                    onClick={handleOpenReportModal}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-base shadow-lg shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <PlusCircle className="w-5 h-5 text-slate-950" />
                    <span>แจ้งเคสปัญหาตอนนี้ (เปิดเรื่องทันที)</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('track')}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold text-base border border-white/15 backdrop-blur-md transition-colors"
                  >
                    <Search className="w-4 h-4 text-emerald-400" />
                    <span>ติดตามสถานะเคสเดิม</span>
                  </button>
                </div>

                {/* Quick Search Widget */}
                <div className="max-w-xl mx-auto pt-6">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (searchTicketQuery.trim()) {
                        setActiveTab('track');
                      }
                    }}
                    className="flex items-center bg-white/10 border border-white/20 rounded-2xl p-1.5 backdrop-blur-md"
                  >
                    <Search className="w-5 h-5 text-slate-400 ml-3" />
                    <input
                      type="text"
                      value={searchTicketQuery}
                      onChange={(e) => setSearchTicketQuery(e.target.value)}
                      placeholder="กรอกรหัสเคส (เช่น TK-2610-001) หรือ Line ID เพื่อค้นหา..."
                      className="w-full bg-transparent border-none text-white text-xs sm:text-sm px-3 focus:outline-none placeholder:text-slate-400"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shrink-0"
                    >
                      ค้นหา
                    </button>
                  </form>
                </div>

                {/* Hero KPI Numbers */}
                <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto pt-8 border-t border-white/10 text-center">
                  <div>
                    <div className="text-xl sm:text-2xl font-black text-emerald-400">
                      {resolutionRate.toFixed(0)}%
                    </div>
                    <div className="text-xs text-slate-400">อัตราการปิดงาน</div>
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-black text-teal-300">
                      2.4 ชม.
                    </div>
                    <div className="text-xs text-slate-400">เวลาเฉลี่ยปิดเคส</div>
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-black text-amber-300 flex items-center justify-center gap-1">
                      <Star className="w-4 h-4 fill-amber-300 text-amber-300 inline" /> 4.9
                    </div>
                    <div className="text-xs text-slate-400">ความพึงพอใจลูกค้า</div>
                  </div>
                </div>
              </div>

              {/* Decorative Background Blob */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            </section>

            {/* Feature Highlights Grid */}
            <section className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="text-center max-w-2xl mx-auto mb-10">
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                  จุดเด่นของระบบ
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                  บริการที่โปร่งใส ตรวจสอบได้ทุกขั้นตอน
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-emerald-500 transition-all space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <Zap className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-base">ไม่ต้องเข้าสู่ระบบ</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    ผู้แจ้งเคสสามารถเปิดหน้าเว็บแล้วกดแจ้งเรื่องได้ทันที สะดวก รวดเร็ว ไม่ยุ่งยากเรื่องจำรหัสผ่าน
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-[#06C755] transition-all space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#06C755]/15 text-[#06C755] flex items-center justify-center font-bold">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-base">แจ้งเตือนผ่าน LINE ทันที</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    ระบบส่งข้อความแจ้งเตือนเมื่อเปิดเคส และอัปเดตสถานะตรงสู่ LINE ของคุณและทีมช่างแบบเรียลไทม์
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-blue-500 transition-all space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-base">สรุปสถิติเพื่อความโปร่งใส</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    แสดงผลสรุปสถิติรายเดือน และรายงานสรุปรายสัปดาห์อัตโนมัติ เพื่อการประเมินผลงานของทีมงาน
                  </p>
                </div>
              </div>
            </section>

            {/* Recent Live Tickets Showcase */}
            <section className="max-w-6xl mx-auto px-4 sm:px-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-xl">เคสบริการล่าสุดในระบบ</h3>
                  <p className="text-xs text-slate-500">ติดตามความคืบหน้าการปฏิบัติงานของทีมงาน</p>
                </div>
                <button
                  onClick={() => setActiveTab('track')}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  ดูทั้งหมด <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {tickets.slice(0, 3).map((t) => {
                  const statusBadge = getStatusBadgeClass(t.status);
                  const priBadge = getPriorityBadge(t.priority);

                  return (
                    <div
                      key={t.id}
                      onClick={() => handleTrackTicket(t.id)}
                      className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer space-y-3 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md">
                          {t.id}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${priBadge.bg} ${priBadge.text}`}>
                          {priBadge.label}
                        </span>
                      </div>

                      <div>
                        <div className="font-bold text-slate-800 text-sm group-hover:text-emerald-700 transition-colors">
                          {t.categoryName}
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                          {t.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusBadge.bg} ${statusBadge.text}`}>
                          {getStatusLabel(t.status)}
                        </span>
                        <span className="text-[11px] text-emerald-600 font-semibold group-hover:translate-x-0.5 transition-transform">
                          ติดตาม &rarr;
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: TICKET TRACKER VIEW (ติดตามสถานะเคส)               */}
        {/* ======================================================== */}
        {activeTab === 'track' && (
          <TicketTracker
            tickets={tickets}
            initialSearchId={searchTicketQuery}
            onOpenReportModal={handleOpenReportModal}
          />
        )}

        {/* ======================================================== */}
        {/* TAB 3: MONTHLY TRANSPARENCY STATS (สถิติบริการรายเดือน)   */}
        {/* ======================================================== */}
        {activeTab === 'stats' && (
          <MonthlyStatsView tickets={tickets} />
        )}

        {/* ======================================================== */}
        {/* TAB 4: ADMIN PORTAL (แดชบอร์ดผู้ดูแลระบบ)                  */}
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
            <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">กรุณาเข้าสู่ระบบผู้ดูแลระบบ</h2>
              <p className="text-xs text-slate-500">
                สำหรับผู้ดูแลระบบ ให้ทำการ login ทุกครั้งเพื่อความปลอดภัย
              </p>
              <button
                onClick={() => setIsAdminLoginModalOpen(true)}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all"
              >
                เข้าสู่ระบบผู้ดูแลระบบ (Admin Login)
              </button>
            </div>
          )
        )}
      </main>

      {/* Floating Action Button for Mobile */}
      <div className="fixed bottom-5 right-5 z-30 sm:hidden">
        <button
          onClick={handleOpenReportModal}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xl flex items-center justify-center active:scale-95"
        >
          <PlusCircle className="w-7 h-7" />
        </button>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">LineHelpDesk</span>
            <span>• ระบบแจ้งและติดตามเคสบริการลูกค้า</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <span>รองรับ Supabase & GitHub Deployment</span>
            <button
              onClick={() => setIsAdminLoginModalOpen(true)}
              className="text-indigo-600 hover:underline font-semibold"
            >
              เข้าสู่ระบบแอดมิน
            </button>
          </div>
        </div>
      </footer>

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
