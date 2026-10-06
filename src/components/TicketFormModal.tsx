import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Camera,
  Image as ImageIcon, 
  CheckCircle, 
  AlertCircle, 
  Copy, 
  MessageSquare, 
  Share2, 
  Search,
  ChevronDown
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Category, Priority, Ticket } from '../types';
import { createTicket } from '../services/storage';
import { formatTicketCreatedLineMessage, sendLineNotification } from '../services/lineService';
import { showErrorAlert, showToast } from '../services/sweetAlert';

interface TicketFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onTicketCreated: (ticket: Ticket) => void;
  onTrackTicket: (ticketId: string) => void;
}

export const TicketFormModal: React.FC<TicketFormModalProps> = ({
  isOpen,
  onClose,
  categories,
  onTicketCreated,
  onTrackTicket,
}) => {
  const [reporterName, setReporterName] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('urgent');
  const [lineContact, setLineContact] = useState('');
  const [phone, setPhone] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTicket, setCreatedTicket] = useState<Ticket | null>(null);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImages((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reporterName.trim() || !description.trim() || !lineContact.trim()) {
      showErrorAlert('กรุณากรอกข้อมูลให้ครบถ้วน', 'ต้องระบุ: ชื่อผู้แจ้ง, รายละเอียดปัญหา และ Line ติดต่อกลับ');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedCat = categories.find((c) => c.id === categoryId) || categories[0];
      const newTicket = createTicket({
        reporterName: reporterName.trim(),
        categoryId: selectedCat?.id || 'general',
        categoryName: selectedCat?.name || 'ทั่วไป',
        description: description.trim(),
        priority,
        images,
        lineContact: lineContact.trim(),
        phone: phone.trim() || undefined,
      });

      // Dispatch LINE Notification
      const msg = formatTicketCreatedLineMessage(newTicket);
      await sendLineNotification(msg, 'ticket_created', newTicket);

      // Trigger Confetti
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });

      showToast(`เปิดเคส ${newTicket.id} สำเร็จแล้ว!`, 'success');

      setCreatedTicket(newTicket);
      onTicketCreated(newTicket);
    } catch (err) {
      console.error(err);
      showErrorAlert('เกิดข้อผิดพลาดในการบันทึกเคส', 'กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyTicketId = () => {
    if (!createdTicket) return;
    navigator.clipboard.writeText(createdTicket.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetForm = () => {
    setReporterName('');
    setCategoryId(categories[0]?.id || '');
    setDescription('');
    setPriority('urgent');
    setLineContact('');
    setPhone('');
    setImages([]);
    setCreatedTicket(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      
      {/* Mobile Bottom Sheet Container */}
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border-t sm:border border-slate-100 max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-250">
        
        {/* iOS-Style Drag Handle */}
        <div className="pt-2.5 pb-1 flex justify-center sm:hidden">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 text-white shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                {createdTicket ? 'เปิดเคสเรียบร้อยแล้ว!' : 'แบบฟอร์มแจ้งเคสปัญหา'}
              </h3>
              <p className="text-[11px] text-emerald-100">
                {createdTicket ? 'ส่งแจ้งเตือนเข้า LINE เจ้าหน้าที่แล้ว' : 'เปิดเรื่องได้ทันที ไม่ต้องลงชื่อเข้าใช้'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              handleResetForm();
              onClose();
            }}
            className="p-1.5 rounded-full text-emerald-100 hover:text-white hover:bg-white/10 active:scale-90 transition-transform"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-5">
          {createdTicket ? (
            /* ================= SUCCESS SCREEN ================= */
            <div className="text-center space-y-5 py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle className="w-10 h-10 animate-bounce" />
              </div>

              <div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  ส่งเรื่องเรียบร้อย
                </span>
                <h4 className="text-xl font-bold text-slate-800 mt-2">บันทึกเคสของคุณสำเร็จ</h4>
                <p className="text-xs text-slate-500 mt-1">
                  ระบบได้ส่งแจ้งเตือนไปยังทีมช่างเรียบร้อยแล้ว
                </p>
              </div>

              {/* Ticket ID Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium">รหัสเคสของคุณ</span>
                    <div className="text-xl font-mono font-black text-emerald-700">
                      {createdTicket.id}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyTicketId}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 active:scale-95 shadow-2xs"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied ? 'คัดลอกแล้ว!' : 'คัดลอก'}</span>
                  </button>
                </div>

                <div className="text-xs space-y-1.5 text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">ผู้แจ้ง:</span>
                    <span className="font-semibold text-slate-800">{createdTicket.reporterName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">เรื่อง:</span>
                    <span className="font-semibold text-slate-800">{createdTicket.categoryName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">ระดับความเร่งด่วน:</span>
                    <span className="font-bold text-rose-600">
                      {createdTicket.priority === 'urgent_highest' ? 'ด่วนที่สุด' : createdTicket.priority === 'urgent' ? 'ด่วน' : 'ไม่รีบ'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">LINE สำหรับติดต่อ:</span>
                    <span className="font-bold text-[#06C755]">{createdTicket.lineContact}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons for Mobile */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onTrackTicket(createdTicket.id);
                    onClose();
                    handleResetForm();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-emerald-600 text-white font-bold text-sm shadow-md active:scale-98"
                >
                  <Search className="w-4 h-4" />
                  <span>ติดตามสถานะเคสนี้ทันที</span>
                </button>

                <a
                  href={`https://line.me/R/share?text=${encodeURIComponent(formatTicketCreatedLineMessage(createdTicket))}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#06C755] text-white font-bold text-sm shadow-sm active:scale-98"
                >
                  <Share2 className="w-4 h-4" />
                  <span>แชร์ข้อมูลเข้าห้องแชต LINE</span>
                </a>

                <button
                  type="button"
                  onClick={handleResetForm}
                  className="w-full py-2.5 text-xs text-slate-500 font-semibold"
                >
                  + แจ้งเคสปัญหาอื่นๆ เพิ่มเติม
                </button>
              </div>
            </div>
          ) : (
            /* ================= INPUT FORM (MOBILE FIRST) ================= */
            <form id="ticket-report-form" onSubmit={handleSubmit} className="space-y-4">
              
              {/* 1. ชื่อผู้แจ้ง */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1. ชื่อผู้แจ้งปัญหา <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  placeholder="เช่น สมชาย ใจดี หรือ คุณกนกวรรณ (ฝ่ายบัญชี)"
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base sm:text-sm bg-slate-50/50"
                />
              </div>

              {/* 2. หัวข้อปัญหา */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  2. หัวข้อปัญหา / ประเภทงาน <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base sm:text-sm bg-slate-50/50 appearance-none font-medium pr-10"
                  >
                    {categories
                      .filter((c) => c.isActive !== false)
                      .map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-4 pointer-events-none" />
                </div>
              </div>

              {/* 3. รายละเอียดปัญหา */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  3. รายละเอียดปัญหาที่พบ <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="ระบุอาการของปัญหา เช่น คอมพิวเตอร์เปิดไม่ติด มีเสียงร้อง, อินเทอร์เน็ตหลุดบ่อย..."
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base sm:text-sm bg-slate-50/50 resize-none"
                />
              </div>

              {/* 4. ระดับความสำคัญ (Large touch buttons) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  4. ระดับความสำคัญ <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPriority('urgent_highest')}
                    className={`p-3 rounded-2xl border text-center transition-all active:scale-95 ${
                      priority === 'urgent_highest'
                        ? 'border-red-500 bg-red-50 ring-2 ring-red-400 text-red-800 font-bold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                      <span>ด่วนที่สุด</span>
                    </div>
                    <span className="text-[10px] text-red-600 block mt-0.5">งานสะดุดทันที</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPriority('urgent')}
                    className={`p-3 rounded-2xl border text-center transition-all active:scale-95 ${
                      priority === 'urgent'
                        ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-400 text-amber-800 font-bold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span>ด่วน</span>
                    </div>
                    <span className="text-[10px] text-amber-700 block mt-0.5">ในวันนี้</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPriority('normal')}
                    className={`p-3 rounded-2xl border text-center transition-all active:scale-95 ${
                      priority === 'normal'
                        ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-400 text-emerald-800 font-bold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span>ไม่รีบ</span>
                    </div>
                    <span className="text-[10px] text-emerald-700 block mt-0.5">ตามรอบคิว</span>
                  </button>
                </div>
              </div>

              {/* 5. รูปภาพประกอบ (Smartphone Camera + Gallery) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  5. ถ่ายรูปหรือแนบรูปภาพปัญหา (ถ้ามี)
                </label>

                {/* Hidden File Inputs */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
                <input
                  type="file"
                  ref={cameraInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                />

                {/* Smartphone Trigger Buttons */}
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-emerald-400 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-800 font-bold text-xs active:scale-95 transition-all"
                  >
                    <Camera className="w-4 h-4 text-emerald-600" />
                    <span>ถ่ายรูปตอนนี้</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs active:scale-95 transition-all"
                  >
                    <ImageIcon className="w-4 h-4 text-slate-500" />
                    <span>เลือกจากคลังภาพ</span>
                  </button>
                </div>

                {/* Thumbnail Previews */}
                {images.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto py-2">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-slate-200">
                        <img src={img} alt={`Attached ${idx}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 text-white shadow-xs"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 6. Line ติดต่อกลับ */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    6. LINE ID สำหรับติดต่อกลับ <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={lineContact}
                      onChange={(e) => setLineContact(e.target.value)}
                      placeholder="เช่น Line ID: somchai_it หรือ เบอร์โทร"
                      className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base sm:text-sm bg-slate-50/50"
                    />
                    <div className="absolute left-3.5 top-3.5 text-[#06C755] font-black text-sm">
                      L
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    เบอร์โทรศัพท์ติดต่อ (สำรอง)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="เช่น 081-234-5678"
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base sm:text-sm bg-slate-50/50"
                  />
                </div>
              </div>

            </form>
          )}
        </div>

        {/* Sticky Mobile Submit Footer */}
        {!createdTicket && (
          <div className="p-4 bg-white border-t border-slate-100 flex items-center gap-3 shrink-0 pb-[max(env(safe-area-inset-bottom),1rem)]">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm active:bg-slate-100 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              form="ticket-report-form"
              disabled={isSubmitting}
              className="w-2/3 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm shadow-md active:scale-98 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>กำลังส่งข้อมูล...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>ยืนยันแจ้งเคสทันที</span>
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
