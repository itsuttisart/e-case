import React from 'react';
import { Home, Search, PlusCircle, BarChart3, ShieldCheck } from 'lucide-react';

interface BottomNavBarProps {
  activeTab: 'home' | 'track' | 'stats' | 'admin';
  setActiveTab: (tab: 'home' | 'track' | 'stats' | 'admin') => void;
  onOpenReportModal: () => void;
  isAdmin: boolean;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  setActiveTab,
  onOpenReportModal,
  isAdmin,
}) => {
  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-1.5 px-3">
      <div className="max-w-md md:max-w-xl mx-auto flex items-center justify-around relative">
        
        {/* Tab 1: Home */}
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all active:scale-95 ${
            activeTab === 'home'
              ? 'text-emerald-700 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home className={`w-5 h-5 ${activeTab === 'home' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
          <span className="text-[10px] mt-0.5 tracking-tight">หน้าแรก</span>
        </button>

        {/* Tab 2: Track */}
        <button
          onClick={() => setActiveTab('track')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all active:scale-95 ${
            activeTab === 'track'
              ? 'text-emerald-700 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Search className={`w-5 h-5 ${activeTab === 'track' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
          <span className="text-[10px] mt-0.5 tracking-tight">ติดตามสถานะ</span>
        </button>

        {/* Center Primary Action: Quick Report Case (Elevated Thumb Target) */}
        <div className="relative -top-4 flex flex-col items-center">
          <button
            onClick={onOpenReportModal}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-400 text-white flex items-center justify-center shadow-lg shadow-emerald-600/35 border-4 border-white active:scale-90 transition-transform"
            aria-label="แจ้งเคสใหม่ทันที"
          >
            <PlusCircle className="w-7 h-7 stroke-[2.2px]" />
          </button>
          <span className="text-[10px] font-bold text-emerald-800 tracking-tight -mt-0.5">แจ้งเคส</span>
        </div>

        {/* Tab 3: Monthly Stats */}
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all active:scale-95 ${
            activeTab === 'stats'
              ? 'text-emerald-700 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className={`w-5 h-5 ${activeTab === 'stats' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
          <span className="text-[10px] mt-0.5 tracking-tight">สถิติรายเดือน</span>
        </button>

        {/* Tab 4: Admin */}
        <button
          onClick={() => setActiveTab('admin')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all active:scale-95 ${
            activeTab === 'admin'
              ? 'text-indigo-700 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <ShieldCheck className={`w-5 h-5 ${activeTab === 'admin' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
            {isAdmin && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white" />
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">
            {isAdmin ? 'แอดมิน' : 'สำหรับแอดมิน'}
          </span>
        </button>

      </div>
    </div>
  );
};
