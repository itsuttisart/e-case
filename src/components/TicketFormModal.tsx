import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  CheckCircle, 
  AlertCircle, 
  Copy, 
  MessageSquare, 
  Share2, 
  Search,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Category, Priority, Ticket } from '../types';
import { createTicket } from '../services/storage';
import { formatTicketCreatedLineMessage, sendLineNotification } from '../services/lineService';

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
      alert('กรุณากรอกข้อมูลที่จำเป็น: ชื่อผู้แจ้ง, รายละเอียดปัญหา และ Line ติดต่อกลับ');
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
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });

      setCreatedTicket(newTicket);
      onTicketCreated(newTicket);
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการบันทึกเคส กรุณาลองใหม่อีกครั้ง');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">
                {createdTicket ? 'เปิดเคสสำเร็จแล้ว!' : 'แจ้งเคสปัญหา / ติดตามการบริการ'}
              </h3>
              <p className="text-xs text-emerald-100">
                {createdTicket ? 'บันทึกข้อมูลเรียบร้อยและส่งแจ้งเตือนเข้า LINE แล้ว' : 'กรอกรายละเอียดเพื่อส่งเรื่องให้ทีมงานเข้าดูแลอย่างรวดเร็ว'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              handleResetForm();
              onClose();
            }}
            className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {createdTicket ? (
          /* SUCCESS SCREEN */
          <div className="p-6 sm:p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle className="w-10 h-10 animate-bounce" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                ส่งเรื่องสำเร็จแล้ว
              </span>
              <h4 className="text-2xl font-bold text-slate-800 mt-2">ขอบคุณสำหรับการแจ้งข้อมูล</h4>
              <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
                ระบบได้บันทึกเคสของคุณและส่งแจ้งเตือนไปยังเจ้าหน้าที่ทีมซัพพอร์ตเรียบร้อยแล้ว
              </p>
            </div>

            {/* Ticket Card */}
            <div className="p-4.5 rounded-2xl bg-slate-50 border border-slate-200 text-left max-w-md mx-auto space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <div>
                  <span className="text-xs text-slate-500 font-medium">รหัสเคสของคุณ (Ticket ID)</span>
                  <div className="text-xl font-mono font-bold text-emerald-700 tracking-wide">
                    {createdTicket.id}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyTicketId}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-xs font-medium text-slate-700 shadow-xs transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  {copied ? 'คัดลอกแล้ว!' : 'คัดลอกรหัส'}
                </button>
              </div>

              <div className="text-xs space-y-1.5 text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-500">ผู้แจ้ง:</span>
                  <span className="font-semibold text-slate-800">{createdTicket.reporterName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">หัวข้อ:</span>
                  <span className="font-semibold text-slate-800">{createdTicket.categoryName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ระดับความสำคัญ:</span>
                  <span className="font-semibold text-rose-600">
                    {createdTicket.priority === 'urgent_highest' ? 'ด่วนที่สุด' : createdTicket.priority === 'urgent' ? 'ด่วน' : 'ไม่รีบ'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">LINE สำหรับติดต่อ:</span>
                  <span className="font-semibold text-[#06C755]">{createdTicket.lineContact}</span>
                </div>
              </div>
            </div>

            {/* Notification Alert Status Banner */}
            <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs max-w-md mx-auto">
              <div className="w-2.5 h-2.5 rounded-full bg-[#06C755] animate-ping" />
              <span>ส่งแจ้งเตือนเข้าระบบ LINE เรียบร้อย พร้อมการติดตามสถานะ 24 ชม.</span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  onTrackTicket(createdTicket.id);
                  onClose();
                  handleResetForm();
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm transition-all"
              >
                <Search className="w-4 h-4" />
                ติดตามสถานะเคสนี้เลย
              </button>

              <a
                href={`https://line.me/R/share?text=${encodeURIComponent(formatTicketCreatedLineMessage(createdTicket))}`}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#06C755] hover:bg-[#05b34c] text-white text-sm font-semibold shadow-sm transition-all"
              >
                <Share2 className="w-4 h-4" />
                แชร์เข้าแอป LINE
              </a>

              <button
                type="button"
                onClick={() => {
                  handleResetForm();
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors"
              >
                แจ้งเคสเพิ่มเติม
              </button>
            </div>
          </div>
        ) : (
          /* INPUT FORM */
          <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-5">
            {/* 1. ชื่อผู้แจ้ง */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                1. ชื่อ-นามสกุล ผู้แจ้งเคส <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                placeholder="เช่น สมชาย ใจดี, คุณกนกวรรณ (แผนกการเงิน)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm placeholder:text-slate-400"
              />
            </div>

            {/* 2. หัวข้อปัญหา (Admin สามารถปรับได้) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  2. หัวข้อปัญหา / หมวดหมู่ <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400">กำหนดโดยผู้ดูแลระบบ</span>
              </div>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm bg-white"
              >
                {categories
                  .filter((c) => c.isActive !== false)
                  .map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
              </select>
              {categories.find((c) => c.id === categoryId)?.description && (
                <p className="text-xs text-slate-500 mt-1 pl-1">
                  💡 {categories.find((c) => c.id === categoryId)?.description}
                </p>
              )}
            </div>

            {/* 3. รายละเอียดปัญหา */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                3. รายละเอียดปัญหาที่พบ <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="ระบุอาการของปัญหา สถานที่หรือแผนก เช่น เข้าใช้งาน Wi-Fi ชั้น 3 ไม่ได้ ขึ้นสัญลักษณ์ตกใจสีเหลือง หรือคอมเปิดไม่ติด..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm placeholder:text-slate-400 resize-none"
              />
            </div>

            {/* 4. ความสำคัญ (ด่วนที่สุด / ด่วน / ไม่รีบ) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                4. ระดับความสำคัญ <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {/* ด่วนที่สุด */}
                <button
                  type="button"
                  onClick={() => setPriority('urgent_highest')}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    priority === 'urgent_highest'
                      ? 'border-red-500 bg-red-50 ring-2 ring-red-400 text-red-800 font-bold shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                    <span>ด่วนที่สุด</span>
                  </div>
                  <span className="text-[10px] text-red-600 block mt-0.5 font-normal">กระทบงานหลักทันที</span>
                </button>

                {/* ด่วน */}
                <button
                  type="button"
                  onClick={() => setPriority('urgent')}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    priority === 'urgent'
                      ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-400 text-amber-800 font-bold shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span>ด่วน</span>
                  </div>
                  <span className="text-[10px] text-amber-700 block mt-0.5 font-normal">ต้องการแก้ไขในวัน</span>
                </button>

                {/* ไม่รีบ */}
                <button
                  type="button"
                  onClick={() => setPriority('normal')}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    priority === 'normal'
                      ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-400 text-emerald-800 font-bold shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span>ไม่รีบ</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 block mt-0.5 font-normal">ตามรอบคิวปกติ</span>
                </button>
              </div>
            </div>

            {/* 5. รูปภาพประกอบ */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  5. รูปภาพประกอบปัญหา (ถ้ามี)
                </label>
                <span className="text-[11px] text-slate-400">แนบรูปภาพหน้าจอหรือรูปถ่าย</span>
              </div>

              {/* Upload area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-3.5 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-emerald-50/30"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center gap-1 text-slate-500">
                  <Upload className="w-5 h-5 text-emerald-600" />
                  <span className="text-xs font-medium text-slate-700">
                    คลิกเพื่อเลือกรูปภาพ หรือลากไฟล์มาวางที่นี่
                  </span>
                  <span className="text-[11px] text-slate-400">รองรับ PNG, JPG, JPEG (ไม่จำกัดจำนวน)</span>
                </div>
              </div>

              {/* Preview thumbnails */}
              {images.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2.5">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-slate-200">
                      <img src={img} alt={`Attached ${idx}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-rose-600 text-white opacity-90 hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 6. Line ติดต่อกลับ และเบอร์โทร */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  6. LINE ติดต่อกลับ <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={lineContact}
                    onChange={(e) => setLineContact(e.target.value)}
                    placeholder="เช่น Line ID หรือ @user"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                  <div className="absolute left-3 top-3 text-[#06C755] font-bold text-xs">
                    L
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">ใช้สำหรับการส่งแจ้งเตือนสถานะความคืบหน้า</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  เบอร์โทรศัพท์ (สำรอง)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="เช่น 081-234-5678"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-800 hover:bg-slate-100 text-sm font-medium transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-semibold shadow-md transition-all active:scale-98 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>กำลังบันทึกและส่ง LINE...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>ยืนยันแจ้งเคสปัญหา</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
