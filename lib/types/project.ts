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
