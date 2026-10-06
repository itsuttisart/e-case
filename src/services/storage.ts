import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Ticket, Category, TeamMember, LineSettings, SupabaseConfig, TicketStatus, Priority } from '../types';
import { INITIAL_CATEGORIES, INITIAL_TEAM_MEMBERS, INITIAL_TICKETS, INITIAL_LINE_SETTINGS, INITIAL_SUPABASE_CONFIG } from './seedData';

const STORAGE_KEYS = {
  TICKETS: 'linehelpdesk_tickets_v1',
  CATEGORIES: 'linehelpdesk_categories_v1',
  TEAM_MEMBERS: 'linehelpdesk_team_members_v1',
  LINE_SETTINGS: 'linehelpdesk_line_settings_v1',
  SUPABASE_CONFIG: 'linehelpdesk_supabase_config_v1',
  ADMIN_SESSION: 'linehelpdesk_admin_session_v1',
};

// Event bus for real-time reactivity within client
type ChangeListener = () => void;
const listeners: Set<ChangeListener> = new Set();

export function subscribeToDataChanges(callback: ChangeListener) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function notifyDataChanged() {
  listeners.forEach((fn) => fn());
}

// Supabase client instance holder
let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (config.url && config.anonKey) {
    if (!supabaseClient) {
      try {
        supabaseClient = createClient(config.url, config.anonKey);
      } catch (err) {
        console.error('Failed to initialize Supabase client:', err);
      }
    }
    return supabaseClient;
  }
  return null;
}

// ----------------- Categories -----------------
export function getCategories(): Category[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
      return INITIAL_CATEGORIES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_CATEGORIES;
  }
}

export function saveCategory(category: Category): void {
  const categories = getCategories();
  const existingIdx = categories.findIndex((c) => c.id === category.id);
  if (existingIdx >= 0) {
    categories[existingIdx] = category;
  } else {
    categories.push(category);
  }
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  notifyDataChanged();
  syncCategoryToSupabase(category);
}

export function deleteCategory(id: string): void {
  const categories = getCategories().filter((c) => c.id !== id);
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  notifyDataChanged();
}

// ----------------- Team Members -----------------
export function getTeamMembers(): TeamMember[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TEAM_MEMBERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.TEAM_MEMBERS, JSON.stringify(INITIAL_TEAM_MEMBERS));
      return INITIAL_TEAM_MEMBERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_TEAM_MEMBERS;
  }
}

export function saveTeamMember(member: TeamMember): void {
  const members = getTeamMembers();
  const idx = members.findIndex((m) => m.id === member.id);
  if (idx >= 0) {
    members[idx] = member;
  } else {
    members.push(member);
  }
  localStorage.setItem(STORAGE_KEYS.TEAM_MEMBERS, JSON.stringify(members));
  notifyDataChanged();
}

export function deleteTeamMember(id: string): void {
  const members = getTeamMembers().filter((m) => m.id !== id);
  localStorage.setItem(STORAGE_KEYS.TEAM_MEMBERS, JSON.stringify(members));
  notifyDataChanged();
}

// ----------------- Tickets -----------------
export function getTickets(): Ticket[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TICKETS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(INITIAL_TICKETS));
      return INITIAL_TICKETS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_TICKETS;
  }
}

export function getTicketById(id: string): Ticket | undefined {
  const tickets = getTickets();
  const trimmed = id.trim().toLowerCase();
  return tickets.find(
    (t) =>
      t.id.toLowerCase() === trimmed ||
      t.lineContact.toLowerCase() === trimmed ||
      (t.phone && t.phone.replace(/[^0-9]/g, '') === trimmed.replace(/[^0-9]/g, ''))
  );
}

export function createTicket(
  data: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'timeline' | 'status'>
): Ticket {
  const tickets = getTickets();
  
  // Format ID: TK-YYMM-XXX (e.g. TK-2610-006)
  const now = new Date();
  const yearSuffix = now.getFullYear().toString().slice(-2);
  const monthStr = String(now.getMonth() + 1).padStart(2, '0');
  const count = tickets.filter((t) => t.id.startsWith(`TK-${yearSuffix}${monthStr}`)).length + 1;
  const newId = `TK-${yearSuffix}${monthStr}-${String(count).padStart(3, '0')}`;

  const newTicket: Ticket = {
    ...data,
    id: newId,
    status: 'pending',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    timeline: [
      {
        id: 'tl-' + Date.now(),
        status: 'pending',
        note: `เปิดเคสใหม่เรียบร้อย (ความสำคัญ: ${getPriorityLabel(data.priority)})`,
        updatedBy: data.reporterName,
        timestamp: now.toISOString(),
      },
    ],
  };

  const updatedTickets = [newTicket, ...tickets];
  localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(updatedTickets));
  notifyDataChanged();

  // Async sync to Supabase if connected
  syncTicketToSupabase(newTicket);

  return newTicket;
}

export function updateTicket(ticket: Ticket): void {
  const tickets = getTickets();
  const idx = tickets.findIndex((t) => t.id === ticket.id);
  if (idx >= 0) {
    tickets[idx] = {
      ...ticket,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
    notifyDataChanged();
    syncTicketToSupabase(tickets[idx]);
  }
}

export function updateTicketStatus(
  ticketId: string,
  newStatus: TicketStatus,
  note: string,
  updatedBy: string,
  assignedTo?: string,
  solutionNotes?: string
): Ticket | null {
  const tickets = getTickets();
  const ticket = tickets.find((t) => t.id === ticketId);
  if (!ticket) return null;

  const now = new Date().toISOString();
  let assignedMemberName = ticket.assignedMemberName;

  if (assignedTo) {
    const member = getTeamMembers().find((m) => m.id === assignedTo);
    if (member) {
      assignedMemberName = member.name;
    }
  }

  const updatedTicket: Ticket = {
    ...ticket,
    status: newStatus,
    updatedAt: now,
    assignedTo: assignedTo !== undefined ? assignedTo : ticket.assignedTo,
    assignedMemberName: assignedTo !== undefined ? assignedMemberName : ticket.assignedMemberName,
    solutionNotes: solutionNotes !== undefined ? solutionNotes : ticket.solutionNotes,
    resolvedAt: newStatus === 'resolved' ? (ticket.resolvedAt || now) : ticket.resolvedAt,
    timeline: [
      ...ticket.timeline,
      {
        id: 'tl-' + Date.now(),
        status: newStatus,
        note: note || `เปลี่ยนสถานะเป็น: ${getStatusLabel(newStatus)}`,
        updatedBy: updatedBy || 'ผู้ดูแลระบบ',
        timestamp: now,
      },
    ],
  };

  const idx = tickets.findIndex((t) => t.id === ticketId);
  tickets[idx] = updatedTicket;
  localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
  notifyDataChanged();
  syncTicketToSupabase(updatedTicket);

  return updatedTicket;
}

// ----------------- LINE & Supabase Settings -----------------
export function getLineSettings(): LineSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LINE_SETTINGS);
    if (!raw) return INITIAL_LINE_SETTINGS;
    return { ...INITIAL_LINE_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return INITIAL_LINE_SETTINGS;
  }
}

export function saveLineSettings(settings: LineSettings): void {
  localStorage.setItem(STORAGE_KEYS.LINE_SETTINGS, JSON.stringify(settings));
  notifyDataChanged();
}

export function getSupabaseConfig(): SupabaseConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SUPABASE_CONFIG);
    if (!raw) return INITIAL_SUPABASE_CONFIG;
    return { ...INITIAL_SUPABASE_CONFIG, ...JSON.parse(raw) };
  } catch {
    return INITIAL_SUPABASE_CONFIG;
  }
}

export function saveSupabaseConfig(config: SupabaseConfig): void {
  localStorage.setItem(STORAGE_KEYS.SUPABASE_CONFIG, JSON.stringify(config));
  supabaseClient = null; // reset client to re-instantiate
  notifyDataChanged();
}

// ----------------- Admin Auth Session -----------------
export function isAdminLoggedIn(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.ADMIN_SESSION) === 'true';
  } catch {
    return false;
  }
}

export function setAdminLogin(isLogged: boolean): void {
  if (isLogged) {
    localStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, 'true');
  } else {
    localStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
  }
  notifyDataChanged();
}

// ----------------- Supabase Sync Helpers -----------------
async function syncTicketToSupabase(ticket: Ticket) {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    await client.from('tickets').upsert({
      id: ticket.id,
      reporter_name: ticket.reporterName,
      category_id: ticket.categoryId,
      category_name: ticket.categoryName,
      description: ticket.description,
      priority: ticket.priority,
      images: ticket.images,
      line_contact: ticket.lineContact,
      phone: ticket.phone,
      status: ticket.status,
      assigned_to: ticket.assignedTo,
      assigned_member_name: ticket.assignedMemberName,
      created_at: ticket.createdAt,
      updated_at: ticket.updatedAt,
      resolved_at: ticket.resolvedAt,
      solution_notes: ticket.solutionNotes,
      timeline: ticket.timeline,
      rating: ticket.rating,
      customer_feedback: ticket.customerFeedback,
    });
  } catch (err) {
    console.warn('Supabase ticket sync error (using local storage fallback):', err);
  }
}

async function syncCategoryToSupabase(cat: Category) {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    await client.from('categories').upsert({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      color: cat.color,
      icon: cat.icon,
      is_active: cat.isActive,
    });
  } catch (err) {
    console.warn('Supabase category sync error:', err);
  }
}

// ----------------- Helper Formatters -----------------
export function getStatusLabel(status: TicketStatus): string {
  switch (status) {
    case 'pending':
      return 'รอดำเนินการ';
    case 'investigating':
      return 'กำลังตรวจสอบ';
    case 'in_progress':
      return 'กำลังแก้ไข';
    case 'waiting_verification':
      return 'รอยืนยัน/ทดสอบ';
    case 'resolved':
      return 'แก้ไขเสร็จสิ้น';
    case 'cancelled':
      return 'ยกเลิกเคส';
    default:
      return status;
  }
}

export function getStatusBadgeClass(status: TicketStatus): { bg: string; text: string; border: string } {
  switch (status) {
    case 'pending':
      return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
    case 'investigating':
      return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
    case 'in_progress':
      return { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' };
    case 'waiting_verification':
      return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' };
    case 'resolved':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
    case 'cancelled':
      return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' };
    default:
      return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
  }
}

export function getPriorityLabel(priority: Priority): string {
  switch (priority) {
    case 'urgent_highest':
      return 'ด่วนที่สุด (Urgent)';
    case 'urgent':
      return 'ด่วน (High)';
    case 'normal':
      return 'ไม่รีบ (Normal)';
    default:
      return priority;
  }
}

export function getPriorityBadge(priority: Priority): { label: string; bg: string; text: string; border: string; dot: string } {
  switch (priority) {
    case 'urgent_highest':
      return { label: 'ด่วนที่สุด', bg: 'bg-red-500/10', text: 'text-red-700', border: 'border-red-300', dot: 'bg-red-500' };
    case 'urgent':
      return { label: 'ด่วน', bg: 'bg-amber-500/10', text: 'text-amber-700', border: 'border-amber-300', dot: 'bg-amber-500' };
    case 'normal':
      return { label: 'ไม่รีบ', bg: 'bg-emerald-500/10', text: 'text-emerald-700', border: 'border-emerald-300', dot: 'bg-emerald-500' };
    default:
      return { label: 'ปกติ', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-400' };
  }
}

// SQL Schema Generator for user to paste directly in Supabase SQL editor
export const SUPABASE_SQL_SCHEMA = `-- ==========================================
-- LineHelpDesk Supabase Schema Setup Script
-- คัดลอกไปวางใน Supabase Dashboard -> SQL Editor แล้วกด RUN ได้ทันที
-- ==========================================

-- 1. สร้างตาราง Categories (หัวข้อปัญหา)
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT 'blue',
    icon TEXT DEFAULT 'HelpCircle',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. สร้างตาราง Team Members (สมาชิกทีมงาน / ช่าง)
CREATE TABLE IF NOT EXISTS public.team_members (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    line_id TEXT,
    phone TEXT,
    email TEXT,
    avatar TEXT,
    specialty TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. สร้างตาราง Tickets (เคสแจ้งปัญหา)
CREATE TABLE IF NOT EXISTS public.tickets (
    id TEXT PRIMARY KEY,
    reporter_name TEXT NOT NULL,
    category_id TEXT REFERENCES public.categories(id),
    category_name TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT NOT NULL,
    images JSONB DEFAULT '[]'::jsonb,
    line_contact TEXT NOT NULL,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    assigned_to TEXT REFERENCES public.team_members(id),
    assigned_member_name TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    resolved_at TIMESTAMPTZ,
    solution_notes TEXT,
    timeline JSONB DEFAULT '[]'::jsonb,
    rating INTEGER,
    customer_feedback TEXT
);

-- 4. ตั้งค่าสิทธิ์ความปลอดภัย Row Level Security (RLS)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- อนุญาตให้อ่านและเพิ่มข้อมูลได้สำหรับผู้ใช้งานทั่วไป (Anon Public Access)
CREATE POLICY "Allow public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow public read team_members" ON public.team_members FOR SELECT USING (true);
CREATE POLICY "Allow public select tickets" ON public.tickets FOR SELECT USING (true);
CREATE POLICY "Allow public insert tickets" ON public.tickets FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update tickets" ON public.tickets FOR UPDATE USING (true);
CREATE POLICY "Allow admin manage categories" ON public.categories FOR ALL USING (true);
CREATE POLICY "Allow admin manage team_members" ON public.team_members FOR ALL USING (true);

-- 5. ข้อมูลเริ่มต้น (Default Categories & Team Members)
INSERT INTO public.categories (id, name, description, color, icon, is_active)
VALUES 
  ('cat-network', 'ปัญหาอินเทอร์เน็ตและเครือข่าย', 'เชื่อมต่อ Wi-Fi ไม่ได้, สาย LAN หลุด, ความเร็วช้า หรือเข้าเว็บไม่ได้', 'emerald', 'Wifi', true),
  ('cat-hardware', 'อุปกรณ์และคอมพิวเตอร์ชำรุด', 'คอมพิวเตอร์เปิดไม่ติด, จอดำ, ปริ้นเตอร์ไม่ทำงาน หรืออุปกรณ์ต่อพ่วงมีปัญหา', 'blue', 'Monitor', true),
  ('cat-software', 'ระบบโปรแกรมและซอฟต์แวร์', 'โปรแกรมค้าง, แจ้ง Error, อัปเดตไม่ผ่าน, ฐานข้อมูลขัดข้อง', 'purple', 'Laptop', true),
  ('cat-account', 'บัญชีผู้ใช้และสิทธิ์การเข้าถึง', 'ลืมรหัสผ่าน, เข้าสู่ระบบไม่ได้, ขอเพิ่มสิทธิ์ หรือสร้างบัญชีใหม่', 'amber', 'Key', true),
  ('cat-other', 'สอบถามข้อมูลและบริการทั่วไป', 'ขอคำปรึกษาการใช้งาน หรือเรื่องอื่นๆ ที่ไม่ระบุไว้ข้างต้น', 'slate', 'HelpCircle', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.team_members (id, name, role, line_id, phone, email, avatar, specialty)
VALUES
  ('tm-1', 'วิชาญ ชัยมงคล (ช่างวิชาญ)', 'Senior IT Support Lead', '@wichan_it', '081-456-7890', 'wichan@helpdesk.local', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 'ระบบเครือข่าย, เซิร์ฟเวอร์ และฮาร์ดแวร์แม่ข่าย'),
  ('tm-2', 'กานดา สุขสมบูรณ์ (ช่างกาน)', 'IT Application Specialist', '@kanda_dev', '089-123-4567', 'kanda@helpdesk.local', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', 'ซอฟต์แวร์, ฐานข้อมูล และระบบสิทธิ์เข้าถึง'),
  ('tm-3', 'ธีรเดช พัฒนไพบูลย์ (ช่างเดช)', 'On-site Technician & Hardware', '@theeradech_tech', '086-789-0123', 'theeradech@helpdesk.local', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', 'คอมพิวเตอร์ตั้งโต๊ะ, จอภาพ, เครื่องพิมพ์, สายสัญญาณ')
ON CONFLICT (id) DO NOTHING;

-- 6. เปิดใช้งาน Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
`;
