// Project type for dashboard project list
// 專案列表型別

export type ProjectStatus = "negotiating" | "deposit_paid";

export interface Project {
  id: string;
  /** 對應 DB customerName（客戶姓名） */
  customer: string;
  eventOrVenueUse: string;
  space: string;
  date: string; // ISO date string
  /** 對應 DB collaPlayContactId（CollaPlay 窗口） */
  contactPerson: string;
  amount: number;
  status: ProjectStatus;
}

// Create project form: single rental item (場域可多選)
export interface RentalItem {
  spaceIds: string[];
  date: string; // ISO date YYYY-MM-DD
  startTime: string; // HH:mm 24h
  endTime: string; // HH:mm 24h
  setupMinutesBefore?: number; // 場佈提前分鐘數，預設 30
  teardownMinutesAfter?: number; // 場復延後分鐘數，預設 30
  rentalAmount: number;
  fnbAmount: number;
  paidAmount: number;
  pendingAmount: number;
}

export interface CreateProjectInput {
  customerName: string;
  customerPhone: string;
  company?: string;
  taxId?: string;
  eventOrVenueUse: string;
  totalAttendees?: number;
  tables?: string;
  chairs?: number;
  fnbItems?: string;
  projectNotes?: string;
  collaPlayContactId: string;
  internalNotes?: string;
  rentals: RentalItem[];
}

// API / service 回傳：建立後的專案含租借項目
export type ProjectWithRentals = import("@/lib/generated/prisma/client").Project & {
  rentals: import("@/lib/generated/prisma/client").ProjectRental[];
};

// Mock options for create project form - 場域請使用 @/lib/config ALL_SPACES（來源為 message SPACE_MESSAGES）
export const MOCK_CONTACT_OPTIONS: { id: string; name: string }[] = [
  { id: "contact-1", name: "王小明" },
  { id: "contact-2", name: "陳小姐" },
  { id: "contact-3", name: "李經理" },
];
