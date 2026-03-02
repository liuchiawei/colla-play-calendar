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
  users: "成員管理",
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
  "tik-&-sip": {
    name: "Tik & Sip",
    description: "自然酒酒吧，適合小酌與放鬆",
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

// Space Detail Page (單一場域專案列表，動態路由 /spaces/[slug])
export const SPACE_DETAIL_PAGE = {
  description: "此場域下的專案列表",
  buttonBackToList: "返回場域列表",
  emptyProjects: "此場域尚無專案",
  tableCaption: "專案列表",
  tabCalendarView: "月曆",
  tabListView: "列表",
  tabsAriaLabel: "專案檢視方式",
  emptyDayProjects: "當日無專案",
} as const;

// Dashboard Overview (總覽頁區塊)
export const DASHBOARD_OVERVIEW = {
  spacesSectionTitle: "場域列表",
  recentProjectsTitle: "最近專案",
  seeAll: "查看全部",
  seeAllSpacesAria: "查看全部場域",
  seeAllProjectsAria: "查看全部專案",
  noProjectsYet: "尚無專案",
  // 總覽統計四項
  statsMonthlyRentalLabel: "當月場租收入",
  statsMonthlyRentalDescription: "僅計算已付訂專案",
  statsNegotiatingLabel: "洽談中專案",
  statsNegotiatingDescription: "待確認訂金",
  statsConfirmedLabel: "已確認專案",
  statsConfirmedDescription: "已收取訂金",
  statsTodayReservationsLabel: "今日預定",
  statsTodayReservationsDescription: "今日場域使用",
} as const;

// Projects Page (專案管理頁)
export const PROJECTS_PAGE = {
  title: "專案管理",
  description: "管理與追蹤所有專案進度",
  createNewProject: "建立專案",
  createNewProjectAria: "建立新專案",
  searchPlaceholder: "搜尋客戶、活動名稱、場域、接洽人…",
  searchAriaLabel: "搜尋專案",
  searchNoResults: "搜尋無結果",
  tableCaption: "專案列表",
  columnCustomer: "客戶",
  columnEventOrVenueUse: "活動名稱或場地用途",
  columnSpace: "場域",
  columnDate: "日期",
  columnContact: "接洽人",
  columnAmount: "金額",
  columnStatus: "狀態",
  statusNegotiating: "洽談中",
  statusDepositPaid: "已付訂",
  emptyProjects: "尚無專案或搜尋無結果",
  tabListView: "列表",
  tabWeekView: "週曆",
  tabsAriaLabel: "專案檢視方式",
} as const;

// Create Project Page (建立新專案表單)
export const CREATE_PROJECT_PAGE = {
  pageTitle: "建立專案",
  pageDescription: "填寫客戶與專案資訊以建立新專案",

  sectionCustomer: "客戶資訊",
  sectionProject: "專案資訊",
  sectionNotes: "專案備註",
  sectionRentals: "租借項目",

  labelCustomerName: "客戶名稱",
  labelCustomerNameRequired: "客戶名稱 *",
  placeholderCustomerName: "請輸入姓名…",
  labelPhone: "聯絡電話",
  labelPhoneRequired: "聯絡電話 *",
  placeholderPhone: "0912-345-678",
  labelCompany: "公司行號",
  optional: "選填",
  labelTaxId: "統一編號",

  labelEventOrVenueUse: "活動名稱或場地用途",
  labelEventOrVenueUseRequired: "活動名稱或場地用途 *",
  placeholderEventOrVenueUse:
    "例如：產品發表會、工作坊、Podcast 錄製…",
  labelTotalAttendees: "活動總人數",
  placeholderAttendees: "預估參與人數",
  labelTables: "桌子需求",
  labelChairs: "椅子需求",
  labelFnb: "餐飲品項",
  labelProjectNotes: "備註",
  labelCollaPlayContact: "CollaPlay 接洽人",
  labelCollaPlayContactRequired: "CollaPlay 接洽人 *",
  placeholderSelectContact: "選擇接洽人…",

  labelInternalNotes: "內部備註",
  placeholderInternalNotes: "內部備註，例如特殊需求、注意事項…",

  addRental: "新增場域",
  labelSpaces: "場域",
  labelSpacesRequired: "場域 *",
  placeholderSelectSpaces: "選擇場域…",
  labelDate: "日期",
  labelDateRequired: "日期 *",
  dateFormat: "年 / 月 / 日",
  labelStartTime: "開始時間",
  labelStartTimeRequired: "開始時間 *",
  placeholderSelectTime: "選擇時間…",
  labelEndTime: "結束時間",
  labelEndTimeRequired: "結束時間 *",
  labelSetupTime: "場佈時間",
  setupDefault: "預設：開始前 30 分鐘",
  labelTeardownTime: "場復時間",
  teardownDefault: "預設：結束後 30 分鐘",
  labelRentalAmount: "場租金額 (NT$)",
  labelFnbAmount: "餐飲金額 (NT$)",
  labelPaidAmount: "已付款項 (NT$)",
  labelPendingAmount: "待付金額 (NT$)",

  submit: "建立專案",
  submitting: "儲存中…",
  removeRental: "移除",
  removeRentalAria: "移除此筆租借",

  errorRequired: "此欄位為必填",
  errorPhoneInvalid: "請輸入有效的聯絡電話",
  errorEndBeforeStart: "結束時間須晚於開始時間",
} as const;

// Project Detail Page (專案詳情頁)
export const PROJECT_DETAIL_PAGE = {
  title: "專案詳情",
  description: "檢視與編輯專案資訊",

  sectionCustomer: "客戶資訊",
  sectionProject: "專案資訊",
  sectionNotes: "備註",
  sectionRentals: "租借項目",

  labelCustomerName: "客戶名稱",
  labelPhone: "聯絡電話",
  labelCompany: "公司行號",
  labelTaxId: "統一編號",
  labelEventOrVenueUse: "活動名稱或場地用途",
  labelTotalAttendees: "活動總人數",
  labelTables: "桌子需求",
  labelChairs: "椅子需求",
  labelFnb: "餐飲品項",
  labelProjectNotes: "專案備註",
  labelCollaPlayContact: "CollaPlay 接洽人",
  labelInternalNotes: "內部備註",
  labelStatus: "狀態",
  labelCreatedAt: "建立時間",
  labelUpdatedAt: "更新時間",

  labelDate: "日期",
  labelTimeRange: "時段",
  labelSpaces: "場域",
  labelRentalAmount: "場租",
  labelFnbAmount: "餐飲",
  labelPaidAmount: "已付",
  labelPendingAmount: "待付",
  totalAmount: "總金額",

  buttonEdit: "編輯",
  buttonDelete: "刪除",
  buttonSave: "儲存",
  buttonCancel: "取消",
  buttonBackToList: "返回列表",
  buttonDownloadCsv: "下載 CSV",

  deleteConfirmTitle: "確認刪除專案",
  deleteConfirmDescription: "刪除後無法復原，確定要刪除此專案嗎？",
  deleteConfirmConfirm: "刪除",
  deleteConfirmCancel: "取消",

  updateSuccess: "已儲存",
  updateError: "更新失敗",
  deleteError: "刪除失敗",
  notFound: "找不到此專案",
} as const;

// Users Page (成員管理頁 /dashboard-new/users)
export const USERS_PAGE = {
  title: "成員管理",
  description: "檢視與管理所有成員",
  searchPlaceholder: "搜尋姓名或 Email…",
  searchAriaLabel: "搜尋成員",
  filterLabel: "篩選",
  filterAll: "全部用戶",
  filterAdmin: "僅管理員",
  filterUser: "僅一般用戶",
  tableCaption: "成員列表",
  columnName: "姓名",
  columnEmail: "Email",
  columnCreatedAt: "註冊時間",
  columnVerified: "驗證狀態",
  columnAdmin: "管理員",
  columnActions: "操作",
  verified: "已驗證",
  unverified: "未驗證",
  adminBadge: "管理員",
  buttonEdit: "編輯",
  buttonDelete: "刪除",
  buttonSave: "儲存",
  buttonCancel: "取消",
  buttonRefresh: "重新整理",
  buttonRefreshAria: "重新載入列表",
  editDialogTitle: "編輯成員",
  editDialogDescription: "修改成員姓名",
  editLabelName: "姓名",
  editPlaceholderName: "請輸入姓名…",
  deleteConfirmTitle: "確認刪除成員",
  deleteConfirmDescription: "刪除後無法復原，確定要刪除此成員嗎？",
  deleteConfirmConfirm: "刪除",
  deleteConfirmCancel: "取消",
  emptyUsers: "尚無成員或搜尋無結果",
  emptyHint: "嘗試調整搜尋條件",
  paginationRange: "第 {from}–{to} 筆，共 {total} 筆",
  paginationPrev: "上一頁",
  paginationNext: "下一頁",
  updateSuccess: "已儲存",
  updateError: "更新失敗",
  deleteError: "刪除失敗",
  toggleAdminAria: "切換 {name} 的管理員狀態",
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
export type ProjectsPageMessages = typeof PROJECTS_PAGE;
export type CreateProjectPageMessages = typeof CREATE_PROJECT_PAGE;
export type ProjectDetailPageMessages = typeof PROJECT_DETAIL_PAGE;
export type UsersPageMessages = typeof USERS_PAGE;
