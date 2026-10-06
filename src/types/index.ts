export type Priority = 'urgent_highest' | 'urgent' | 'normal';

export type TicketStatus = 
  | 'pending'               // รอดำเนินการ
  | 'investigating'         // กำลังตรวจสอบ
  | 'in_progress'           // กำลังแก้ไข
  | 'waiting_verification'  // รอยืนยัน/ทดสอบ
  | 'resolved'              // แก้ไขเสร็จสิ้น
  | 'cancelled';            // ยกเลิก

export interface TimelineEvent {
  id: string;
  status: TicketStatus;
  note: string;
  updatedBy: string;
  timestamp: string;
  attachmentUrl?: string;
}

export interface Ticket {
  id: string;
  reporterName: string;
  categoryId: string;
  categoryName: string;
  description: string;
  priority: Priority;
  images: string[];
  lineContact: string;
  phone?: string;
  status: TicketStatus;
  assignedTo?: string; // TeamMember id
  assignedMemberName?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  solutionNotes?: string;
  solutionImages?: string[];
  timeline: TimelineEvent[];
  rating?: number; // 1-5 stars
  customerFeedback?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  isActive: boolean;
  ticketCount?: number;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  lineId: string;
  phone: string;
  email: string;
  avatar: string;
  specialty: string;
  activeTickets?: number;
  resolvedTickets?: number;
}

export interface LineSettings {
  enabled: boolean;
  notifyToken: string;
  webhookUrl: string;
  adminGroupNotify: boolean;
  statusUpdateNotify: boolean;
  autoWeeklyReport: boolean;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
  lastSynced?: string;
}

export interface WeeklyReportSummary {
  weekLabel: string;
  startDate: string;
  endDate: string;
  totalTickets: number;
  resolvedTickets: number;
  pendingTickets: number;
  resolutionRate: number;
  avgResolutionHours: number;
  urgentTickets: number;
  topCategory: string;
  teamPerformance: {
    memberId: string;
    memberName: string;
    resolved: number;
    inProgress: number;
    avgRating: number;
  }[];
  insights: string[];
}
