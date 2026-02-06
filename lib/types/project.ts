// Project type for dashboard project list
// 專案列表型別

export type ProjectStatus = "negotiating" | "deposit_paid";

export interface Project {
  id: string;
  customer: string;
  eventOrVenueUse: string;
  space: string;
  date: string; // ISO date string
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
  contactName: string;
  contactPhone: string;
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

// Mock data for projects page (replace with API later)
export const MOCK_PROJECTS: Project[] = [
  {
    id: "1",
    customer: "某某工作室",
    eventOrVenueUse: "Podcast 錄製",
    space: "水下的聲音／Podcast 錄音室",
    date: "2025-02-15",
    contactPerson: "王小明",
    amount: 8000,
    status: "negotiating",
  },
  {
    id: "2",
    customer: "藝文協會",
    eventOrVenueUse: "小型講座",
    space: "空白分頁／多功能教室",
    date: "2025-02-20",
    contactPerson: "陳小姐",
    amount: 12000,
    status: "deposit_paid",
  },
  {
    id: "3",
    customer: "品牌方",
    eventOrVenueUse: "產品拍攝",
    space: "艾莉緹的相機／小物攝影間",
    date: "2025-02-25",
    contactPerson: "李經理",
    amount: 15000,
    status: "deposit_paid",
  },
];

// Mock options for create project form - 場域請使用 @/lib/config ALL_SPACES（來源為 message SPACE_MESSAGES）
export const MOCK_CONTACT_OPTIONS: { id: string; name: string }[] = [
  { id: "contact-1", name: "王小明" },
  { id: "contact-2", name: "陳小姐" },
  { id: "contact-3", name: "李經理" },
];
