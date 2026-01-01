import { Calendar, Tag, Users } from "lucide-react";

// 商店基本設定
// CollaPlay の店舗情報を一元管理

// 商店基本配置
export const STORE_CONFIG = {
  name: "CollaPlay",
  subtitle: "可能存在的遊樂園",
  description: [
    "Collaboration + Play = CollaPlay",
    "一座專為大人打造的遊樂園",
    "咖啡館｜工作空間｜多功能教室｜社群活動｜場地租借",
  ],
  phone: "02 6627 0836",
  email: "hello@collaplay.com",
  address: "108臺北市萬華區武昌街二段83之6號3樓",

  // 營業時間
  businessHours: {
    open: 10, // 10:00
    close: 22, // 22:00
  },

  // 公休日（空陣列表示無公休）
  // 0 = 星期日, 1 = 星期一, ..., 6 = 星期六
  closedDays: [] as number[],
} as const;

// クイックリンク設定
export const QUICK_LINKS = [
  { label: "首頁", href: "/" },
  { label: "活動行事曆", href: "/calendar" },
  { label: "後台管理", href: "/dashboard" },
] as const;

// ソーシャルリンク設定
// icon: lucide-react のアイコン名を指定
export const SOCIAL_LINKS = [
  {
    icon: "Instagram" as const,
    label: "Instagram",
    href: "https://www.instagram.com/colla_play/",
  },
  {
    icon: "Facebook" as const,
    label: "Facebook",
    href: "https://www.facebook.com/collaplay",
  },
] as const;

export type DashboardTab = "events" | "categories" | "users";

export const dashboardNavigationItems: Array<{
  id: DashboardTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: "events",
    label: "活動管理",
    icon: Calendar,
  },
  {
    id: "categories",
    label: "類型管理",
    icon: Tag,
  },
  {
    id: "users",
    label: "會員管理",
    icon: Users,
  },
];

// 型別定義
export type StoreConfig = typeof STORE_CONFIG;
export type BusinessHours = typeof STORE_CONFIG.businessHours;
export type QuickLink = (typeof QUICK_LINKS)[number];
export type SocialLink = (typeof SOCIAL_LINKS)[number];
