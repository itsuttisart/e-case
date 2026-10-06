import { Ticket, TicketStatus, WeeklyReportSummary } from '../types';
import { getLineSettings, getPriorityLabel, getStatusLabel } from './storage';

export interface LineNotificationLog {
  id: string;
  ticketId?: string;
  recipient: string;
  message: string;
  type: 'ticket_created' | 'status_updated' | 'weekly_report' | 'test';
  timestamp: string;
  status: 'sent' | 'simulated' | 'failed';
}

const LINE_LOGS_KEY = 'linehelpdesk_line_logs_v1';

export function getLineLogs(): LineNotificationLog[] {
  try {
    const raw = localStorage.getItem(LINE_LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLineLog(log: LineNotificationLog): void {
  const logs = [log, ...getLineLogs()].slice(0, 50); // keep last 50 logs
  localStorage.setItem(LINE_LOGS_KEY, JSON.stringify(logs));
}

/**
 * Format Thai notification message for LINE
 */
export function formatTicketCreatedLineMessage(ticket: Ticket): string {
  return `🔔 [แจ้งเตือนเคสใหม่]
━━━━━━━━━━━━━━━━
🎫 รหัสเคส: ${ticket.id}
👤 ผู้แจ้ง: ${ticket.reporterName}
📁 หมวดหมู่: ${ticket.categoryName}
⚡ ความสำคัญ: ${getPriorityLabel(ticket.priority)}
📝 รายละเอียด: ${ticket.description.slice(0, 100)}${ticket.description.length > 100 ? '...' : ''}
💬 LINE ติดต่อ: ${ticket.lineContact}
${ticket.phone ? `📞 เบอร์โทร: ${ticket.phone}\n` : ''}🕒 เวลา: ${new Date(ticket.createdAt).toLocaleString('th-TH')}
━━━━━━━━━━━━━━━━
👉 ติดตามสถานะได้ที่หน้าเว็บ`;
}

export function formatTicketStatusLineMessage(ticket: Ticket, newStatus: TicketStatus, note: string): string {
  const statusEmoji = {
    pending: '⏳',
    investigating: '🔍',
    in_progress: '🔧',
    waiting_verification: '📋',
    resolved: '✅',
    cancelled: '❌',
  }[newStatus] || '📌';

  return `${statusEmoji} [อัปเดตสถานะเคส]
━━━━━━━━━━━━━━━━
🎫 รหัสเคส: ${ticket.id}
👤 คุณ: ${ticket.reporterName}
📁 เรื่อง: ${ticket.categoryName}
สถานะใหม่: 👉 ${getStatusLabel(newStatus)}
👨‍🔧 ผู้รับผิดชอบ: ${ticket.assignedMemberName || 'ทีมเทคนิค'}
💬 หมายเหตุ: ${note || '-'}
🕒 อัปเดตเมื่อ: ${new Date().toLocaleString('th-TH')}
━━━━━━━━━━━━━━━━
ขอบคุณที่ใช้บริการครับ`;
}

export function formatWeeklyReportLineMessage(summary: WeeklyReportSummary): string {
  return `📊 [สรุปรายงานประจำสัปดาห์]
🗓 ${summary.weekLabel} (${summary.startDate} - ${summary.endDate})
━━━━━━━━━━━━━━━━
📈 เคสทั้งหมด: ${summary.totalTickets} เคส
✅ ดำเนินการเสร็จสิ้น: ${summary.resolvedTickets} เคส
⏳ รอดำเนินการ: ${summary.pendingTickets} เคส
🎯 อัตราสำเร็จ: ${summary.resolutionRate.toFixed(1)}%
⚡ เคสด่วนที่สุด: ${summary.urgentTickets} เคส
⏱ เวลาเฉลี่ยปิดเคส: ${summary.avgResolutionHours.toFixed(1)} ชม.
🏆 หมวดที่พบบ่อยสุด: ${summary.topCategory}

👨‍💻 สรุปผลงานทีมงาน:
${summary.teamPerformance.map(m => `• ${m.memberName}: ปิดได้ ${m.resolved} เคส (ความพึงพอใจ ⭐ ${m.avgRating.toFixed(1)})`).join('\n')}
━━━━━━━━━━━━━━━━
รายงานอัตโนมัติจากระบบ LineHelpDesk`;
}

/**
 * Dispatch LINE Notification
 * Sends to webhook if configured, logs in notification feed, and provides shareable URL
 */
export async function sendLineNotification(
  message: string,
  type: LineNotificationLog['type'],
  ticket?: Ticket,
  targetLine?: string
): Promise<{ success: boolean; log: LineNotificationLog; shareUrl: string }> {
  const settings = getLineSettings();
  const recipient = targetLine || (ticket ? ticket.lineContact : 'Admin Group');

  let sentStatus: LineNotificationLog['status'] = 'simulated';

  // If webhook URL is set (e.g., custom webhook, Zapier, Make, Line bot relay)
  if (settings.enabled && settings.webhookUrl) {
    try {
      const response = await fetch(settings.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: ticket?.id,
          message,
          type,
          recipient,
          timestamp: new Date().toISOString(),
          ticket,
        }),
      });
      if (response.ok) {
        sentStatus = 'sent';
      }
    } catch (err) {
      console.warn('Webhook dispatch error:', err);
    }
  }

  const log: LineNotificationLog = {
    id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    ticketId: ticket?.id,
    recipient,
    message,
    type,
    timestamp: new Date().toISOString(),
    status: sentStatus,
  };

  saveLineLog(log);

  // Generate LINE Share URL (allows direct 1-tap sharing to any LINE chat or group on mobile/desktop)
  const shareUrl = `https://line.me/R/share?text=${encodeURIComponent(message)}`;

  return { success: true, log, shareUrl };
}
