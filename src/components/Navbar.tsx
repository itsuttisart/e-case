import React from 'react';
import { 
  ShieldCheck, 
  MessageSquare, 
  LogOut,
  Bell,
  Sparkles
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
  setActiveTab,
  isAdmin,
  onAdminLogout,
  onOpenAdminLogin,
  onOpenLineDrawer,
  unreadCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs pt-[env(safe-area-inset-top)]">
      <div className="max-w-md md:max-w-xl lg:max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          
          {/* Logo & Brand (Mobile Compact) */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer active:scale-95 transition-transform" 
            onClick={() => setActiveTab('home')}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-sm shadow-emerald-600/30">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight">LineHelpDesk</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="ระบบออนไลน์เรียลไทม์" />
              </div>
              <p className="text-[10px] text-slate-400 font-medium -mt-0.5">ระบบแจ้งและติดตามปัญหา</p>
            </div>
          </div>

          {/* Right Action Icons (Thumb friendly) */}
          <div className="flex items-center gap-1.5">
            {/* LINE Live Notifications Bell */}
            <button
              onClick={onOpenLineDrawer}
              aria-label="แจ้งเตือน LINE"
              className="relative p-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 transition-colors border border-slate-200/70"
            >
              <Bell className="w-4 h-4 text-[#06C755]" />
              {unreadCount > 0 && (
                <span className="absolute 1 top-1 right-1 w-3.5 h-3.5 rounded-full bg-[#06C755] text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Admin Badge or Login Button */}
            {isAdmin ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab('admin')}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs active:scale-95 transition-transform"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>แอดมิน</span>
                </button>
                <button
                  onClick={onAdminLogout}
                  title="ออกจากระบบ"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAdminLogin}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 text-xs font-semibold active:scale-95 transition-transform"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>แอดมิน</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
