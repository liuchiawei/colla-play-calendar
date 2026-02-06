// Message and Text Content Configuration
// 訊息與文字內容配置
// This file contains all user-facing text, labels, and messages used throughout the application

// Store Information Messages
export const STORE_MESSAGES = {
  name: "CollaPlay",
  subtitle: "可能存在的遊樂園",
  catchphrase: "一座專為大人打造的遊樂園。",
  description: [
    "Collaboration + Play = CollaPlay",
    "一座專為大人打造的遊樂園",
    "咖啡館｜工作空間｜多功能教室｜社群活動｜場地租借",
  ],
} as const;

// Navigation Labels
export const NAV_LABELS = {
  home: "首頁",
  about: "關於我們",
  calendar: "活動行事曆",
} as const;

// Social Media Labels
export const SOCIAL_LABELS = {
  instagram: "Instagram",
  facebook: "Facebook",
} as const;

// Dashboard Navigation Labels
export const DASHBOARD_LABELS = {
  events: "活動管理",
  categories: "類型管理",
  users: "會員管理",
} as const;

// Dashboard New Navigation Labels
export const DASHBOARD_NEW_LABELS = {
  overview: "總覽",
  spaces: "場域列表",
  projects: "專案管理",
  reports: "報表下載",
} as const;

// Spaces Page (場域列表頁)
export const SPACES_PAGE = {
  title: "場域列表",
  description: "管理與檢視所有場域空間",
  tabsFilterAriaLabel: "依樓層篩選場域",
  tabAll: "全部",
  tab3F: "3F",
  tab4F: "4F",
  tab5F: "5F",
  sectionAll: "全部場域",
  section3F: "3F 場域",
  section4F: "4F 場域",
  section5F: "5F 場域",
  emptyFloor: "此樓層尚無場域",
} as const;

// Type exports for type safety
export type StoreMessages = typeof STORE_MESSAGES;
export type NavLabels = typeof NAV_LABELS;
export type SocialLabels = typeof SOCIAL_LABELS;
export type DashboardLabels = typeof DASHBOARD_LABELS;
export type DashboardNewLabels = typeof DASHBOARD_NEW_LABELS;
export type SpacesPageMessages = typeof SPACES_PAGE;
