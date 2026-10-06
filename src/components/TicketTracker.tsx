import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  Calendar, 
  Share2, 
  Star, 
  ChevronRight, 
  Send,
  MessageCircle,
  PhoneCall,
  Sparkles,
  ExternalLink,
  ChevronLeft
} from 'lucide-react';
import { Ticket, TicketStatus } from '../types';
import { getPriorityBadge, getStatusBadgeClass, getStatusLabel, updateTicket } from '../services/storage';
import { showErrorAlert, showToast } from '../services/sweetAlert';

interface TicketTrackerProps {
  tickets: Ticket[];
  initialSearchId?: string;
  onSelectTicket?: (ticketId: string) => void;
  onOpenReportModal: () => void;
}

export const TicketTracker: React.FC<TicketTrackerProps> = ({
  tickets,
  initialSearchId = '',
  onOpenReportModal,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearchId);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [feedback, setFeedback] = useState<string>('');
  const [ratingSubmitted, setRatingSubmitted] = useState<boolean>(false);

  useEffect(() => {
    if (initialSearchId) {
      setSearchQuery(initialSearchId);
      const match = tickets.find(
        (t) =>
          t.id.toLowerCase() === initialSearchId.toLowerCase() ||
          t.lineContact.toLowerCase() === initialSearchId.toLowerCase()
      );
      if (match) {
        setSelectedTicket(match);
      }
    }
  }, [initialSearchId, tickets]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    if (!query) return;

    const match = tickets.find(
      (t) =>
        t.id.toLowerCase() === query ||
        t.lineContact.toLowerCase() === query ||
        (t.phone && t.phone.replace(/[^0-9]/g, '') === query.replace(/[^0-9]/g, '')) ||
        t.reporterName.toLowerCase().includes(query)
    );

    if (match) {
      setSelectedTicket(match);
      setRatingSubmitted(match.rating !== undefined);
      if (match.rating) setRating(match.rating);
    } else {
      setSelectedTicket(null);
      showErrorAlert('ไม่พบข้อมูลเคส', 'กรุณาตรวจสอบรหัสเคสหรือ Line ID อีกครั้ง');
    }
  };

  const handleRateTicket = () => {
    if (!selectedTicket) return;
    const updated: Ticket = {
      ...selectedTicket,
      rating,
      customerFeedback: feedback.trim() || undefined,
    };
    updateTicket(updated);
    setSelectedTicket(updated);
    setRatingSubmitted(true);
    showToast('ขอบคุณสำหรับการประเมินความพึงพอใจ!', 'success');
  };

  const getStepIndex = (status: TicketStatus): number => {
    switch (status) {
      case 'pending':
        return 0;
      case 'investigating':
        return 1;
      case 'in_progress':
        return 2;
      case 'waiting_verification':
        return 3;
      case 'resolved':
        return 4;
      case 'cancelled':
        return -1;
      default:
        return 0;
    }
  };

  const currentStep = selectedTicket ? getStepIndex(selectedTicket.status) : 0;

  const steps = [
    { label: 'รอดำเนินการ', desc: 'บันทึกเข้าระบบแล้ว' },
    { label: 'กำลังตรวจสอบ', desc: 'ช่างรับเรื่องและวิเคราะห์ปัญหา' },
    { label: 'กำลังแก้ไข', desc: 'ทีมช่างกำลังดำเนินการซ่อม' },
    { label: 'รอยืนยัน/ทดสอบ', desc: 'รอตรวจสอบผลการใช้งาน' },
    { label: 'เสร็จสิ้นสมบูรณ์', desc: 'ปิดเคสเรียบร้อยแล้ว' },
  ];

  return (
    <div className="max-w-md sm:max-w-xl md:max-w-2xl mx-auto px-4 py-4 space-y-4">
      
      {/* Search Header for Mobile */}
      <div className="bg-gradient-to-br from-slate-900 to-emerald-950 rounded-2xl p-4 sm:p-5 text-white shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>ค้นหาเคสเพื่อติดตามงาน</span>
          </div>
          <span className="text-[11px] text-slate-400">อัปเดตสด Real-time</span>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="รหัสเคส (TK-...) หรือ Line ID"
              className="w-full pl-9 pr-3 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          </div>
          <button
            type="submit"
            className="px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs active:scale-95 transition-transform shrink-0"
          >
            ค้นหา
          </button>
        </form>
      </div>

      {/* SELECTED TICKET VIEW (MOBILE-FIRST VERTICAL PROGRESS) */}
      {selectedTicket ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden space-y-4 p-5">
          
          {/* Back button and ID */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <button
              onClick={() => setSelectedTicket(null)}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>ย้อนกลับ</span>
            </button>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                {selectedTicket.id}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getPriorityBadge(selectedTicket.priority).bg} ${getPriorityBadge(selectedTicket.priority).text}`}>
                {getPriorityBadge(selectedTicket.priority).label}
              </span>
            </div>
          </div>

          {/* Ticket Header & Status */}
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                  getStatusBadgeClass(selectedTicket.status).bg
                } ${getStatusBadgeClass(selectedTicket.status).text} ${
                  getStatusBadgeClass(selectedTicket.status).border
                }`}
              >
                {getStatusLabel(selectedTicket.status)}
              </span>
              <span className="text-[11px] text-slate-400">
                {new Date(selectedTicket.createdAt).toLocaleDateString('th-TH')}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-2">
              {selectedTicket.categoryName}
            </h3>
            <p className="text-xs text-slate-600 mt-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
              {selectedTicket.description}
            </p>
          </div>

          {/* Photos if any */}
          {selectedTicket.images && selectedTicket.images.length > 0 && (
            <div>
              <span className="text-[11px] font-bold text-slate-400 block mb-1">
                รูปภาพที่แนบ ({selectedTicket.images.length})
              </span>
              <div className="flex gap-2 overflow-x-auto py-1">
                {selectedTicket.images.map((img, i) => (
                  <a
                    key={i}
                    href={img}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-slate-200"
                  >
                    <img src={img} alt="Attachment" className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Smartphone-Optimized Vertical Stepper */}
          <div className="pt-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
              ขั้นตอนความคืบหน้า (Progress)
            </span>

            <div className="relative pl-6 space-y-4 border-l-2 border-slate-200 ml-3">
              {steps.map((st, idx) => {
                const isPassed = idx <= currentStep;
                const isCurrent = idx === currentStep;

                return (
                  <div key={idx} className="relative">
                    {/* Circle Indicator */}
                    <div
                      className={`absolute -left-[31px] top-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ring-4 ring-white ${
                        isCurrent
                          ? 'bg-emerald-600 text-white animate-pulse'
                          : isPassed
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {isPassed ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                    </div>

                    <div className={isCurrent ? 'bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200' : ''}>
                      <div className={`text-xs font-bold ${isCurrent ? 'text-emerald-800' : isPassed ? 'text-slate-800' : 'text-slate-400'}`}>
                        {st.label}
                      </div>
                      <div className="text-[11px] text-slate-500">{st.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Solution Note if completed */}
          {selectedTicket.solutionNotes && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs">
              <span className="font-bold text-emerald-800 flex items-center gap-1 mb-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> ผลการแก้ไขจากช่าง
              </span>
              <p className="text-emerald-900">{selectedTicket.solutionNotes}</p>
            </div>
          )}

          {/* Assigned Technician Quick Contact Bar */}
          {selectedTicket.assignedMemberName && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">ช่างผู้รับผิดชอบ</span>
                <span className="text-xs font-bold text-slate-800">{selectedTicket.assignedMemberName}</span>
              </div>
              <a
                href={`https://line.me/R/share?text=${encodeURIComponent(`สอบถามความคืบหน้าเคส ${selectedTicket.id}`)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#06C755] text-white font-bold text-xs active:scale-95 transition-transform"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>ทัก LINE</span>
              </a>
            </div>
          )}

          {/* Rating when resolved */}
          {selectedTicket.status === 'resolved' && (
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-center space-y-2">
              <span className="text-xs font-bold text-amber-800 block">
                ประเมินความพึงพอใจการให้บริการ
              </span>

              {ratingSubmitted || selectedTicket.rating ? (
                <div className="text-xs text-amber-800 font-bold">
                  ⭐ ให้คะแนนแล้ว {selectedTicket.rating || rating}/5 ดาว ขอบคุณครับ
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setRating(s)}
                        className="p-1.5 active:scale-125 transition-transform"
                      >
                        <Star
                          className={`w-7 h-7 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                        />
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="ข้อเสนอแนะเพิ่มเติม..."
                    className="w-full px-3 py-2 text-xs bg-white border border-amber-200 rounded-xl"
                  />
                  <button
                    onClick={handleRateTicket}
                    className="w-full py-2.5 rounded-xl bg-amber-500 text-white font-bold text-xs active:scale-98"
                  >
                    ส่งคะแนนประเมิน
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Share to LINE button */}
          <a
            href={`https://line.me/R/share?text=${encodeURIComponent(
              `ติดตามเคส ${selectedTicket.id} (${selectedTicket.categoryName}) - สถานะ: ${getStatusLabel(
                selectedTicket.status
              )}`
            )}`}
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#06C755]/10 text-[#06C755] font-bold text-xs border border-[#06C755]/30 active:scale-98"
          >
            <Share2 className="w-4 h-4" />
            <span>แชร์สถานะเคสเข้าห้องแชต LINE</span>
          </a>

        </div>
      ) : (
        /* RECENT TICKETS CARDS (TAP TO TRACK) */
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-700">เคสปัญหาล่าสุดในระบบ</span>
            <span className="text-[11px] text-slate-400">แตะเพื่อดูขั้นตอน</span>
          </div>

          <div className="space-y-2.5">
            {tickets.slice(0, 5).map((t) => {
              const statusBadge = getStatusBadgeClass(t.status);
              const priBadge = getPriorityBadge(t.priority);

              return (
                <div
                  key={t.id}
                  onClick={() => {
                    setSelectedTicket(t);
                    setSearchQuery(t.id);
                  }}
                  className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs active:bg-slate-50 transition-colors cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {t.id}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBadge.bg} ${statusBadge.text}`}>
                      {getStatusLabel(t.status)}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      {t.categoryName}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                      {t.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] text-slate-400">
                    <span>{t.reporterName.slice(0, 3)}***</span>
                    <span className="text-emerald-600 font-bold flex items-center">
                      ดูสถานะ <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
