// CollaPlay 活動行事曆 TypeScript 型別定義
// イベントとカテゴリの型定義

import type { Event, Category } from "@/lib/generated/prisma/client";

// カテゴリ型（Prismaから生成）
export type { Category };

// イベント型（カテゴリ情報を含む）
export type EventWithCategory = Event & {
  category: Category | null;
};

// APIレスポンス用の型
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// イベント作成・更新用の入力型
export type EventInput = {
  title: string;
  description?: string | null;
  startTime: string; // ISO形式の日時文字列
  endTime: string; // ISO形式の日時文字列
  location?: string | null;
  organizer?: string | null;
  imageUrl?: string | null;
  registrationUrl?: string | null;
  price?: string | null;
  categoryId?: string | null;
};

// カテゴリ作成・更新用の入力型
export type CategoryInput = {
  name: string;
  color: string;
};

// 週間カレンダー用の日付範囲型
export type WeekRange = {
  start: Date;
  end: Date;
};

// カレンダー表示用の時間スロット型
export type TimeSlot = {
  hour: number; // 0-23
  label: string; // 表示用ラベル（例："08:00"）
};

// イベントの位置計算用型（カレンダー表示用）
export type EventPosition = {
  top: number; // パーセンテージ
  height: number; // パーセンテージ
  left: number; // パーセンテージ（重複イベント用）
  width: number; // パーセンテージ（重複イベント用）
};

// デフォルトカテゴリカラー
export const DEFAULT_CATEGORY_COLORS = [
  "#FF6B6B", // 珊瑚紅
  "#4ECDC4", // 青綠色
  "#45B7D1", // 天藍色
  "#96CEB4", // 薄荷綠
  "#FFEAA7", // 淡黃色
  "#DDA0DD", // 梅紫色
  "#98D8C8", // 薄荷綠
  "#F7DC6F", // 金黃色
  "#BB8FCE", // 淡紫色
  "#85C1E9", // 淺藍色
];

// 預設活動類型
export const DEFAULT_CATEGORIES: CategoryInput[] = [
  { name: "工作坊", color: "#FF6B6B" },
  { name: "講座", color: "#4ECDC4" },
  { name: "展演", color: "#45B7D1" },
  { name: "市集", color: "#96CEB4" },
  { name: "社群聚會", color: "#FFEAA7" },
  { name: "其他", color: "#DDA0DD" },
];

