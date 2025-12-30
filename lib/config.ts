// 商店基本設定
// CollaPlay の店舗情報を一元管理

// 商店基本配置
export const STORE_CONFIG = {
  name: "CollaPlay",
  subtitle: "可能存在的遊樂園",
  phone: "02 6627 0836",
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

// 型別定義
export type StoreConfig = typeof STORE_CONFIG;
export type BusinessHours = typeof STORE_CONFIG.businessHours;
