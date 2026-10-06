import React from 'react';
import { 
  PlusCircle, 
  Search, 
  BarChart3, 
  ShieldCheck, 
  MessageSquare, 
  CheckCircle2, 
  LogOut,
  Bell
} from 'lucide-react';
import { SupabaseConfig } from '../types';

interface NavbarProps {
  activeTab: 'home' | 'track' | 'stats' | 'admin';
  setActiveTab: (tab: 'home' | 'track' | 'stats' | 'admin') => void;
  onOpenReportModal: () => void;
  isAdmin: boolean;
  onAdminLogout: () => void;
  onOpenAdminLogin: () => void;
  onOpenLineDrawer: () => void;
  unreadCount: number;
  supabaseConfig: SupabaseConfig;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenReportModal,
  isAdmin,
  onAdminLogout,
  onOpenAdminLogin,
  onOpenLineDrawer,
  unreadCount,
  supabaseConfig,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('home')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">LineHelpDesk</span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Real-time
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">ระบบแจ้งเคสและติดตามปัญหาพร้อมแจ้งเตือน LINE</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'home'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              หน้าแรก
            </button>

            <button
              onClick={() => setActiveTab('track')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'track'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Search className="w-4 h-4 text-slate-500" />
              ติดตามสถานะเคส
            </button>

            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'stats'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              สถิติบริการรายเดือน
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5">
            {/* Quick Report Button */}
            <button
              onClick={onOpenReportModal}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-medium shadow-sm transition-all hover:shadow active:scale-98"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="font-medium">แจ้งเคสปัญหา</span>
            </button>

            {/* LINE Live Notifications Drawer Button */}
            <button
              onClick={onOpenLineDrawer}
              title="การแจ้งเตือน LINE แบบเรียลไทม์"
              className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200"
            >
              <Bell className="w-4 h-4 text-[#06C755]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#06C755] text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Admin Portal Gateway */}
            {isAdmin ? (
              <div className="flex items-center gap-1.5 pl-1">
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                    activeTab === 'admin'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>จัดการระบบแอดมิน</span>
                </button>
                <button
                  onClick={onAdminLogout}
                  title="ออกจากระบบแอดมิน"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-slate-200"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAdminLogin}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-slate-500" />
                <span className="hidden sm:inline">ผู้ดูแลระบบ</span>
                <span className="sm:hidden">แอดมิน</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Secondary Navigation Bar */}
      <div className="flex md:hidden border-t border-slate-200 bg-slate-50 px-2 py-1.5 justify-around text-xs">
        <button
          onClick={() => setActiveTab('home')}
          className={`px-3 py-1.5 rounded-lg ${activeTab === 'home' ? 'font-bold text-emerald-700 bg-emerald-50' : 'text-slate-600'}`}
        >
          หน้าแรก
        </button>
        <button
          onClick={() => setActiveTab('track')}
          className={`px-3 py-1.5 rounded-lg ${activeTab === 'track' ? 'font-bold text-emerald-700 bg-emerald-50' : 'text-slate-600'}`}
        >
          ติดตามสถานะ
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-3 py-1.5 rounded-lg ${activeTab === 'stats' ? 'font-bold text-emerald-700 bg-emerald-50' : 'text-slate-600'}`}
        >
          สถิติรายเดือน
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-3 py-1.5 rounded-lg ${activeTab === 'admin' ? 'font-bold text-indigo-700 bg-indigo-50' : 'text-indigo-600'}`}
          >
            แดชบอร์ด
          </button>
        )}
      </div>
    </header>
  );
};
