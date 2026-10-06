import React from 'react';
import { X, Bell, Share2, Copy, Send, CheckCircle2, MessageCircle, RefreshCw } from 'lucide-react';
import { getLineLogs, sendLineNotification, LineNotificationLog } from '../services/lineService';

interface LineLiveSimulatorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LineLiveSimulatorDrawer: React.FC<LineLiveSimulatorDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const [logs, setLogs] = React.useState<LineNotificationLog[]>([]);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [testing, setTesting] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setLogs(getLineLogs());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendTestNotification = async () => {
    setTesting(true);
    await sendLineNotification(
      `🔔 [ทดสอบการเชื่อมต่อ LINE]
━━━━━━━━━━━━━━━━
ระบบแจ้งเคสและติดตามปัญหาออนไลน์พร้อมทำงาน
เวลาทดสอบ: ${new Date().toLocaleString('th-TH')}`,
      'test'
    );
    setLogs(getLineLogs());
    setTesting(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200">
          
          {/* Header with LINE branding */}
          <div className="p-4 bg-[#06C755] text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bell className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm">LINE Live Notifications</h3>
                <p className="text-[11px] text-emerald-100">บันทึกการส่งแจ้งเตือนผ่านไลน์แบบเรียลไทม์</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Test & Action Bar */}
          <div className="p-3 bg-emerald-50/60 border-b border-emerald-100 flex items-center justify-between text-xs">
            <span className="text-emerald-800 font-medium">
              ข้อความแจ้งเตือนล่าสุด ({logs.length})
            </span>
            <button
              onClick={handleSendTestNotification}
              disabled={testing}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#06C755] hover:bg-[#05b34c] text-white font-semibold transition-colors shadow-xs"
            >
              <Send className="w-3 h-3" />
              <span>{testing ? 'กำลังทดสอบ...' : 'ทดสอบส่งแจ้งเตือน'}</span>
            </button>
          </div>

          {/* Logs Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {logs.length > 0 ? (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2.5 relative group hover:bg-white hover:shadow-xs transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#06C755]/15 text-[#06C755]">
                      {log.type === 'ticket_created'
                        ? 'แจ้งเคสใหม่'
                        : log.type === 'status_updated'
                        ? 'อัปเดตสถานะ'
                        : log.type === 'weekly_report'
                        ? 'รายงานสรุปประจำสัปดาห์'
                        : 'ข้อความทดสอบ'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(log.timestamp).toLocaleTimeString('th-TH')}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-slate-200/80 font-mono text-[11px] text-slate-800 whitespace-pre-wrap leading-relaxed shadow-2xs">
                    {log.message}
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <span className="text-slate-500 truncate max-w-[150px]">
                      ผู้รับ: <b>{log.recipient}</b>
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(log.id, log.message)}
                        className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedId === log.id ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                      </button>

                      <a
                        href={`https://line.me/R/share?text=${encodeURIComponent(log.message)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[#06C755] font-bold hover:underline"
                      >
                        <Share2 className="w-3 h-3" />
                        <span>แชร์เข้า LINE</span>
                      </a>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-16 text-center text-slate-400 text-xs space-y-2">
                <MessageCircle className="w-8 h-8 text-slate-300 mx-auto" />
                <p>ยังไม่มีประวัติการส่งแจ้งเตือน</p>
                <p className="text-[11px]">เมื่อมีเคสใหม่หรืออัปเดตสถานะ ข้อมูลจะแสดงที่นี่แบบเรียลไทม์</p>
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-500">
            สามารถเชื่อมต่อ LINE Webhook หรือ LINE Notify Token ได้ในแท็บตั้งค่า
          </div>

        </div>
      </div>
    </div>
  );
};
