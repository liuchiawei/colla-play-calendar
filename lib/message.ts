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

// Space names and descriptions (keyed by slug = function, second part of Chinese name)
export const SPACE_MESSAGES: Record<
  string,
  { name: string; description: string }
> = {
  "community-cafe": {
    name: "頻率交流道／社群咖啡廳",
    description: "開放式社群交流空間，適合小型聚會與工作坊",
  },
  "focus-area": {
    name: "背對世界的時間／專注工作區",
    description: "安靜的專注工作環境，適合深度工作與學習",
  },
  "multipurpose-room": {
    name: "空白分頁／多功能教室",
    description: "彈性時段制，適合課程、工作坊與團體活動",
  },
  "podcast-studio": {
    name: "水下的聲音／Podcast 錄音室",
    description: "專業 Podcast 錄音空間，配備高品質錄音設備",
  },
  "product-photo": {
    name: "艾莉緹的相機／小物攝影間",
    description: "專業小物攝影空間，適合產品拍攝與內容創作",
  },
  "event-lounge": {
    name: "WUCOLIN／活動交誼廳",
    description: "舒適的活動交誼空間，適合聚會與小型活動",
  },
  "screening-room": {
    name: "第三人稱／播映室",
    description: "專業播映空間，適合影片放映與簡報展示",
  },
  "exhibition-hall": {
    name: "大氣層／展演廳",
    description: "大型展演空間，適合展覽、表演與大型活動",
  },
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

// Dashboard Overview (總覽頁區塊)
export const DASHBOARD_OVERVIEW = {
  spacesSectionTitle: "場域列表",
  recentProjectsTitle: "最近專案",
  seeAll: "查看全部",
  seeAllSpacesAria: "查看全部場域",
  seeAllProjectsAria: "查看全部專案",
  noProjectsYet: "尚無專案",
} as const;

// Type exports for type safety
export type StoreMessages = typeof STORE_MESSAGES;
export type NavLabels = typeof NAV_LABELS;
export type SocialLabels = typeof SOCIAL_LABELS;
export type DashboardLabels = typeof DASHBOARD_LABELS;
export type DashboardNewLabels = typeof DASHBOARD_NEW_LABELS;
export type SpacesPageMessages = typeof SPACES_PAGE;
export type SpaceMessages = typeof SPACE_MESSAGES;
export type DashboardOverviewMessages = typeof DASHBOARD_OVERVIEW;
