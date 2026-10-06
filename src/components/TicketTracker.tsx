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
  ExternalLink
} from 'lucide-react';
import { Ticket, TicketStatus } from '../types';
import { getPriorityBadge, getStatusBadgeClass, getStatusLabel, updateTicket } from '../services/storage';

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

  // Sync if initialSearchId is provided
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
      alert('ไม่พบข้อมูลเคสที่ค้นหา กรุณาตรวจสอบรหัสเคส หรือ Line ID อีกครั้ง');
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
  };

  // Status Step calculation
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
    { label: 'รอดำเนินการ', desc: 'บันทึกเข้าระบบ' },
    { label: 'กำลังตรวจสอบ', desc: 'ช่างรับเรื่อง' },
    { label: 'กำลังแก้ไข', desc: 'ดำเนินการซ่อม' },
    { label: 'รอยืนยัน/ทดสอบ', desc: 'ตรวจรับงาน' },
    { label: 'เสร็จสิ้น', desc: 'ปิดเคสสมบูรณ์' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Search Bar Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            ระบบติดตามสถานะงานซ่อมแบบเรียลไทม์
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            ติดตามสถานะและตรวจสอบความคืบหน้าเคส
          </h2>
          <p className="text-sm text-slate-300 mt-2">
            กรอกรหัสเคส (เช่น TK-2610-001) หรือ Line ID ของคุณ เพื่อดูสถานะการแก้ไขงานแบบสดๆ
          </p>

          <form onSubmit={handleSearch} className="mt-6 flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ระบุรหัสเคส (TK-...) หรือ Line ID..."
                className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm backdrop-blur-md"
              />
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
            <button
              type="submit"
              className="px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold text-sm shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
            >
              <span>ค้นหาเคส</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Background decorative glow */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* TICKET DETAILS CARD */}
      {selectedTicket ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="p-6 sm:p-8 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-mono text-lg font-bold text-slate-900">
                  {selectedTicket.id}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                    getStatusBadgeClass(selectedTicket.status).bg
                  } ${getStatusBadgeClass(selectedTicket.status).text} ${
                    getStatusBadgeClass(selectedTicket.status).border
                  }`}
                >
                  {getStatusLabel(selectedTicket.status)}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                    getPriorityBadge(selectedTicket.priority).bg
                  } ${getPriorityBadge(selectedTicket.priority).text} ${
                    getPriorityBadge(selectedTicket.priority).border
                  }`}
                >
                  {getPriorityBadge(selectedTicket.priority).label}
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mt-2">
                {selectedTicket.categoryName}
              </h3>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                แจ้งเมื่อ {new Date(selectedTicket.createdAt).toLocaleString('th-TH')}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`https://line.me/R/share?text=${encodeURIComponent(
                  `ติดตามเคส ${selectedTicket.id} (${selectedTicket.categoryName}) - สถานะ: ${getStatusLabel(
                    selectedTicket.status
                  )}`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#06C755]/10 hover:bg-[#06C755]/20 text-[#06C755] font-semibold text-xs border border-[#06C755]/30 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                แชร์เข้า LINE
              </a>
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <div className="p-6 sm:p-8 border-b border-slate-100">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-6">
              ความคืบหน้าการดำเนินการ
            </h4>
            
            {selectedTicket.status === 'cancelled' ? (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <div>
                  <div className="font-bold">เคสนี้ถูกยกเลิกแล้ว</div>
                  <div className="text-xs text-rose-600 mt-0.5">โปรดตรวจสอบรายละเอียดในบันทึกเหตุการณ์</div>
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="hidden sm:block absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 z-0" />
                <div
                  className="hidden sm:block absolute top-1/2 left-0 h-1 bg-emerald-500 -translate-y-1/2 z-0 transition-all duration-500"
                  style={{ width: `${Math.min(100, (currentStep / (steps.length - 1)) * 100)}%` }}
                />

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 relative z-10">
                  {steps.map((st, idx) => {
                    const isPassed = idx <= currentStep;
                    const isCurrent = idx === currentStep;

                    return (
                      <div
                        key={idx}
                        className={`flex sm:flex-col items-center gap-3 sm:gap-2 p-2 sm:p-0 rounded-xl ${
                          isCurrent ? 'bg-emerald-50 sm:bg-transparent' : ''
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                            isPassed
                              ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {isPassed ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                        </div>
                        <div className="sm:text-center">
                          <div
                            className={`text-xs font-bold ${
                              isCurrent
                                ? 'text-emerald-700'
                                : isPassed
                                ? 'text-slate-800'
                                : 'text-slate-400'
                            }`}
                          >
                            {st.label}
                          </div>
                          <div className="text-[11px] text-slate-500">{st.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Details Grid */}
          <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left 2 Cols: Description & Images & Timeline */}
            <div className="md:col-span-2 space-y-6">
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  รายละเอียดปัญหา
                </h4>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {selectedTicket.description}
                </div>
              </div>

              {/* Photos attached */}
              {selectedTicket.images && selectedTicket.images.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    รูปภาพประกอบที่แนบมา ({selectedTicket.images.length})
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedTicket.images.map((img, i) => (
                      <a
                        key={i}
                        href={img}
                        target="_blank"
                        rel="noreferrer"
                        className="group relative rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-100 block"
                      >
                        <img
                          src={img}
                          alt={`Ticket Attachment ${i + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium">
                          <ExternalLink className="w-4 h-4 mr-1" /> ดูรูปขนาดเต็ม
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Resolution Notes if completed */}
              {selectedTicket.solutionNotes && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-sm">
                  <div className="flex items-center gap-2 font-bold text-emerald-800 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>บันทึกผลการแก้ไขจากช่างผู้รับผิดชอบ</span>
                  </div>
                  <p className="text-emerald-900 leading-relaxed">
                    {selectedTicket.solutionNotes}
                  </p>
                </div>
              )}

              {/* Interactive Timeline */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  บันทึกประวัติความคืบหน้า (Timeline)
                </h4>
                <div className="space-y-3 relative pl-6 border-l-2 border-slate-200">
                  {selectedTicket.timeline.map((evt) => (
                    <div key={evt.id} className="relative">
                      <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-4 ring-white" />
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                        <div className="flex items-center justify-between text-slate-500">
                          <span className="font-semibold text-slate-700">{evt.updatedBy}</span>
                          <span>{new Date(evt.timestamp).toLocaleString('th-TH')}</span>
                        </div>
                        <p className="text-slate-800 font-medium">{evt.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right 1 Col: Reporter & Assigned Tech Info & Rating */}
            <div className="space-y-6">
              {/* Assigned Technician Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-slate-50 border border-indigo-100 space-y-3">
                <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
                  เจ้าหน้าที่ผู้รับผิดชอบ
                </span>
                {selectedTicket.assignedMemberName ? (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-lg shadow-sm">
                      {selectedTicket.assignedMemberName[0]}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-sm">
                        {selectedTicket.assignedMemberName}
                      </div>
                      <div className="text-xs text-indigo-600">ช่างเทคนิคประจำเคส</div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-amber-50 text-amber-800 text-xs border border-amber-200">
                    อยู่ระหว่างจัดสรรเจ้าหน้าที่เข้าดูแล
                  </div>
                )}
              </div>

              {/* Reporter Info */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <span className="font-bold text-slate-500 uppercase tracking-wider block">
                  ข้อมูลผู้แจ้ง
                </span>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">ชื่อ:</span>
                  <span className="font-semibold text-slate-800">{selectedTicket.reporterName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">LINE:</span>
                  <span className="font-semibold text-[#06C755]">{selectedTicket.lineContact}</span>
                </div>
                {selectedTicket.phone && (
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">โทรศัพท์:</span>
                    <span className="font-semibold text-slate-800">{selectedTicket.phone}</span>
                  </div>
                )}
              </div>

              {/* Customer Rating Widget (When Resolved) */}
              {selectedTicket.status === 'resolved' && (
                <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
                  <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                    <span>ประเมินความพึงพอใจการบริการ</span>
                  </div>

                  {ratingSubmitted || selectedTicket.rating ? (
                    <div className="text-center py-2 space-y-1">
                      <div className="flex items-center justify-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-5 h-5 ${
                              s <= (selectedTicket.rating || rating)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-300'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-amber-800 font-semibold">
                        คุณได้ให้คะแนน {selectedTicket.rating || rating} / 5 ดาว
                      </p>
                      {selectedTicket.customerFeedback && (
                        <p className="text-xs text-slate-600 italic">
                          "{selectedTicket.customerFeedback}"
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setRating(s)}
                            className="p-1 hover:scale-110 transition-transform"
                          >
                            <Star
                              className={`w-6 h-6 ${
                                s <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="คำติชมเพิ่มเติม (ถ้ามี)..."
                        className="w-full px-3 py-2 text-xs bg-white border border-amber-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                      <button
                        onClick={handleRateTicket}
                        className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-colors shadow-xs"
                      >
                        ส่งคะแนนประเมิน
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* RECENT TICKETS LIST (When no specific ticket is searched) */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg text-slate-800">เคสปัญหาล่าสุดที่อยู่ระหว่างดำเนินการ</h3>
              <p className="text-xs text-slate-500">คลิกที่เคสเพื่อดูขั้นตอนการแก้ไขแบบเรียลไทม์</p>
            </div>
            <button
              onClick={onOpenReportModal}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
            >
              + เปิดเคสใหม่
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {tickets.slice(0, 6).map((ticket) => {
              const statusBadge = getStatusBadgeClass(ticket.status);
              const priorityBadge = getPriorityBadge(ticket.priority);

              return (
                <div
                  key={ticket.id}
                  onClick={() => {
                    setSelectedTicket(ticket);
                    setSearchQuery(ticket.id);
                  }}
                  className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer space-y-2.5 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {ticket.id}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusBadge.bg} ${statusBadge.text}`}>
                        {getStatusLabel(ticket.status)}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${priorityBadge.bg} ${priorityBadge.text}`}>
                        {priorityBadge.label}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-800 text-sm group-hover:text-emerald-700 transition-colors">
                      {ticket.categoryName}
                    </h4>
                    <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                      {ticket.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                    <span>ผู้แจ้ง: {ticket.reporterName.slice(0, 3)}***</span>
                    <span className="flex items-center gap-1 text-emerald-600 font-semibold group-hover:translate-x-0.5 transition-transform">
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
