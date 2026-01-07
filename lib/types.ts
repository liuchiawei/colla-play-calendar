// CollaPlay 活動行事曆 TypeScript 型別定義
// イベントとカテゴリの型定義

import type {
  Event,
  Category,
  Profile,
  EventRegistration,
  Comment,
  CommentLike,
} from "@/lib/generated/prisma/client";

// カテゴリ型（Prismaから生成）
export type { Category };

// イベント型（カテゴリ情報を含む）
export type EventWithCategory = Event & {
  category: Category | null;
  registrationCount?: number;
  isRegistered?: boolean;
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
  imageBlobUrl?: string | null;
  imageBlobPathname?: string | null;
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

// ============================================
// 個人資料相關型別定義
// ============================================

// 個人資料型別（由 Prisma 生成）
export type { Profile };

// 個人資料可見性設定型別
// 每個字段可以獨立設定是否公開
export type ProfileVisibility = {
  displayName?: boolean;
  birthDate?: boolean;
  gender?: boolean;
  occupation?: boolean;
  education?: boolean;
  skills?: boolean;
  bio?: boolean;
};

// 個人資料更新用輸入型別
export type ProfileUpdateInput = {
  displayName?: string | null;
  birthDate?: string | null; // ISO 格式日期字串
  gender?: string | null;
  occupation?: string | null;
  education?: string | null;
  skills?: string[] | null; // 技能陣列（前端以字串處理）
  bio?: string | null;
  extra?: Record<string, any> | null;
  visibility?: ProfileVisibility | null;
};

// 公開個人資料型別（根據 visibility 設定過濾後的資料）
export type PublicProfileDto = {
  id: string;
  userId: string;
  displayName: string | null;
  birthDate: Date | null;
  gender: string | null;
  occupation: string | null;
  education: string | null;
  skills: string[] | null;
  bio: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// ============================================
// 用戶管理相關型別定義
// ============================================

// 包含管理員標籤的用戶型別
export type UserWithAdmin = {
  id: string;
  name: string | null;
  email: string;
  emailVerified: boolean;
  image: string | null;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// 用戶列表響應型別
export type UserListResponse = {
  users: UserWithAdmin[];
  total: number;
  page?: number;
  pageSize?: number;
};

// 更新用戶輸入型別
export type UpdateUserInput = {
  isAdmin?: boolean;
  name?: string | null;
};

// ============================================
// 活動報名相關型別定義
// ============================================

// 活動報名型別（由 Prisma 生成）
export type { EventRegistration };

// 活動報名（包含用戶資訊）
export type EventRegistrationWithUser = EventRegistration & {
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
};

// 已報名使用者型別（用於活動報名列表）
export type RegisteredUser = {
  id: string;
  name: string | null;
  email?: string; // 可選，因為某些 API 可能不返回 email
  image: string | null;
};

// ============================================
// 活動留言相關型別定義
// ============================================

// 留言型別（由 Prisma 生成）
export type { Comment, CommentLike };

// 留言作者資訊
export type CommentAuthor = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
} | {
  type: "anonymous";
  displayNumber: number;
  displayName: string; // "匿名用戶 #123"
};

// 留言（包含關聯資料）
export type CommentWithRelations = Comment & {
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
  likes: CommentLike[];
  _count: {
    likes: number;
    replies: number;
  };
  replies?: CommentWithRelations[]; // 巢狀回覆
  isLiked?: boolean; // 當前用戶是否已按讚
};

// 留言輸入型別
export type CommentInput = {
  content: string;
  parentId?: string | null; // 用於回覆
};

// 留言更新輸入型別
export type CommentUpdateInput = {
  content: string;
};

// 留言列表響應型別（包含分頁資訊）
export type CommentListResponse = {
  comments: CommentWithRelations[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

// 留言按讚響應型別
export type CommentLikeResponse = {
  isLiked: boolean;
  likeCount: number;
};
