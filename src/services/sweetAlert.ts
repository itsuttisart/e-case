import Swal from 'sweetalert2';
import confetti from 'canvas-confetti';

// Modern SweetAlert2 Base Theme Configuration
const ModernSwal = Swal.mixin({
  customClass: {
    popup: 'font-[\'Prompt\',sans-serif] rounded-3xl shadow-2xl border border-slate-100 p-6',
    title: 'text-lg font-bold text-slate-900',
    htmlContainer: 'text-xs text-slate-600',
    confirmButton: 'px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-md mx-1 hover:opacity-90 active:scale-95 transition-all',
    cancelButton: 'px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs mx-1 active:scale-95 transition-all',
    denyButton: 'px-5 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs mx-1 hover:opacity-90 active:scale-95 transition-all',
  },
  buttonsStyling: false,
  backdrop: 'rgba(15, 23, 42, 0.55)',
});

// Modern Toast Notification
export const showToast = (title: string, icon: 'success' | 'error' | 'warning' | 'info' = 'success') => {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top',
    showConfirmButton: false,
    timer: 2800,
    timerProgressBar: true,
    customClass: {
      popup: 'font-[\'Prompt\',sans-serif] rounded-2xl shadow-xl border border-slate-200/80 bg-white/95 backdrop-blur-md px-4 py-2.5 text-xs font-bold text-slate-800',
    },
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    },
  });

  return Toast.fire({
    icon,
    title,
  });
};

// Modern Success Alert
export const showSuccessAlert = (title: string, html?: string) => {
  return ModernSwal.fire({
    icon: 'success',
    title,
    html,
    confirmButtonText: 'ตกลง',
  });
};

// Modern Error Alert
export const showErrorAlert = (title: string, text?: string) => {
  return ModernSwal.fire({
    icon: 'error',
    title,
    text: text || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
    confirmButtonText: 'รับทราบ',
    customClass: {
      popup: 'font-[\'Prompt\',sans-serif] rounded-3xl shadow-2xl p-6',
      confirmButton: 'px-6 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs shadow-md',
    },
  });
};

// Modern Confirmation Alert
export const showConfirmAlert = async (
  title: string,
  text: string,
  confirmButtonText = 'ยืนยัน',
  cancelButtonText = 'ยกเลิก'
): Promise<boolean> => {
  const result = await ModernSwal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
  });
  return result.isConfirmed;
};

// Modern Interactive Ticket Created Celebration Alert
export const showTicketCreatedAlert = (
  ticketId: string,
  reporterName: string,
  onTrack: () => void,
  lineShareUrl?: string
) => {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
  });

  ModernSwal.fire({
    icon: 'success',
    title: 'เปิดเคสสำเร็จเรียบร้อย!',
    html: `
      <div style="margin-top: 8px; text-align: center;">
        <p style="font-size: 13px; color: #64748b; margin-bottom: 12px;">
          ระบบได้บันทึกข้อมูลและส่งแจ้งเตือนเข้า LINE เรียบร้อยแล้ว
        </p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 14px; margin: 10px 0;">
          <div style="font-size: 11px; color: #94a3b8; font-weight: 600;">รหัสเคสของคุณ (Ticket ID)</div>
          <div style="font-size: 22px; font-weight: 800; color: #047857; font-family: monospace; letter-spacing: 1px; margin-top: 2px;">
            ${ticketId}
          </div>
          <div style="font-size: 12px; color: #475569; margin-top: 4px;">
            ผู้แจ้ง: <b>${reporterName}</b>
          </div>
        </div>
        <p style="font-size: 11px; color: #059669; font-weight: 600;">
          🟢 ระบบพร้อมให้คุณติดตามความคืบหน้าได้ตลอด 24 ชั่วโมง
        </p>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: '🔍 ติดตามสถานะเคสนี้ทันที',
    cancelButtonText: 'ปิดหน้าต่าง',
    showDenyButton: Boolean(lineShareUrl),
    denyButtonText: '💬 แชร์เข้า LINE',
    customClass: {
      popup: 'font-[\'Prompt\',sans-serif] rounded-3xl shadow-2xl p-6 max-w-sm',
      confirmButton: 'w-full mb-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-md active:scale-95 block',
      denyButton: 'w-full mb-2 py-3 rounded-xl bg-[#06C755] text-white font-bold text-xs shadow-sm active:scale-95 block',
      cancelButton: 'w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs block',
    },
  }).then((res) => {
    if (res.isConfirmed) {
      onTrack();
    } else if (res.isDenied && lineShareUrl) {
      window.open(lineShareUrl, '_blank');
    }
  });
};
