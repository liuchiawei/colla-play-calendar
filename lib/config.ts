import {
  Calendar,
  Tag,
  Users,
  Home,
  Layout,
  Settings,
  Instagram,
  Facebook,
  Info,
} from "lucide-react";
import {
  STORE_MESSAGES,
  NAV_LABELS,
  SOCIAL_LABELS,
  DASHBOARD_LABELS,
} from "./message";

// 商店基本設定
// CollaPlay の店舗情報を一元管理

// 商店基本配置
export const STORE_CONFIG = {
  ...STORE_MESSAGES,
  since: 2025,
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
export const PAGE_LINKS = [
  { label: NAV_LABELS.home, href: "/", icon: Home },
  { label: NAV_LABELS.about, href: "/about", icon: Info },
  { label: NAV_LABELS.calendar, href: "/calendar", icon: Calendar },
];

// ソーシャルリンク設定
// icon: lucide-react のアイコン名を指定
export const SOCIAL_LINKS = [
  {
    icon: Instagram,
    label: SOCIAL_LABELS.instagram,
    href: "https://www.instagram.com/colla_play/",
  },
  {
    icon: Facebook,
    label: SOCIAL_LABELS.facebook,
    href: "https://www.facebook.com/collaplay",
  },
];

export type DashboardTab = "events" | "categories" | "users";

export const dashboardNavigationItems: Array<{
  id: DashboardTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: "events",
    label: DASHBOARD_LABELS.events,
    icon: Calendar,
  },
  {
    id: "categories",
    label: DASHBOARD_LABELS.categories,
    icon: Tag,
  },
  {
    id: "users",
    label: DASHBOARD_LABELS.users,
    icon: Users,
  },
];

// 型別定義
export type StoreConfig = typeof STORE_CONFIG;
export type BusinessHours = typeof STORE_CONFIG.businessHours;
export type PageLink = (typeof PAGE_LINKS)[number];
export type SocialLink = (typeof SOCIAL_LINKS)[number];
