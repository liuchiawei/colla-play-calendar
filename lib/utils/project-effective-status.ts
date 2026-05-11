/**
 * 依租借結束日計算「顯示用」專案狀態（不寫回 DB）
 * 規則：台北曆「今天」之前已結束的非取消／非已完成專案視為 completed
 */

import type { ProjectStatus } from "@/lib/types/project";
import { effectiveEndDate } from "@/lib/utils/project-rental-interval";

/** 與列表用 Project 或 Prisma `ProjectWithRentals` 皆相容 */
export type ProjectLikeForEffectiveStatus = {
  status: ProjectStatus;
  date?: string;
  rentals?: Array<{ date: string; endDate?: string | null }>;
};

const TAIPEI_TIMEZONE = "Asia/Taipei";

/**
 * 台北時區當日曆日期 YYYY-MM-DD（與租借 date 字串可比較）
 */
export function getTaipeiTodayYmd(now: Date = new Date()): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: TAIPEI_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(now);
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  if (!y || !m || !d) {
    throw new Error("getTaipeiTodayYmd: 無法解析日期");
  }
  return `${y}-${m}-${d}`;
}

/**
 * 台北時區「昨日」曆日 YYYY-MM-DD（與租借 date 字串可比較）
 * 以今日台北曆日正午 +08:00 為錨點回推一日，避免依賴本機時區；台灣無 DST。
 */
export function getTaipeiYesterdayYmd(now: Date = new Date()): string {
  const todayYmd = getTaipeiTodayYmd(now);
  const anchor = new Date(`${todayYmd}T12:00:00+08:00`);
  anchor.setTime(anchor.getTime() - 86400000);
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: TAIPEI_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(anchor);
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  if (!y || !m || !d) {
    throw new Error("getTaipeiYesterdayYmd: 無法解析日期");
  }
  return `${y}-${m}-${d}`;
}

/**
 * 台北曆當月 1 日 YYYY-MM-DD（與租借 date 字串可比較）
 */
export function getTaipeiMonthStartYmd(now: Date = new Date()): string {
  const ymd = getTaipeiTodayYmd(now);
  return `${ymd.slice(0, 7)}-01`;
}

/**
 * 台北曆「當月起算共 months 個曆月」的最後一日 YYYY-MM-DD（months >= 1）
 * 例：months=6 且今天在 4/28 → 自 4/1 起算第六個曆月為 9 月 → 回傳 9 月最後一日。
 */
export function getTaipeiEndOfMonthSpanYmd(
  now: Date,
  months: number,
): string {
  if (!Number.isFinite(months) || months < 1) {
    throw new Error("getTaipeiEndOfMonthSpanYmd: months 須為 >= 1 的整數");
  }
  const start = getTaipeiMonthStartYmd(now);
  const y = Number(start.slice(0, 4));
  const m = Number(start.slice(5, 7));
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) {
    throw new Error("getTaipeiEndOfMonthSpanYmd: 無法解析月份起點");
  }
  const last = new Date(y, m - 1 + months, 0);
  const yy = last.getFullYear();
  const mm = String(last.getMonth() + 1).padStart(2, "0");
  const dd = String(last.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/**
 * 專案所有租借區間中，最後一日（YYYY-MM-DD）
 */
export function getProjectLastRentalDayYmd(
  project: ProjectLikeForEffectiveStatus,
): string | null {
  const rentals = project.rentals;
  if (rentals?.length) {
    let max = "";
    for (const r of rentals) {
      const eff = effectiveEndDate(r.date, r.endDate);
      if (!max || eff > max) max = eff;
    }
    return max || null;
  }
  const d = project.date?.slice(0, 10);
  return d?.length === 10 ? d : null;
}

/**
 * 結合 DB 狀態與租借結束日之有效狀態（供列表／總覽／篩選）
 */
export function getEffectiveProjectStatus(
  project: ProjectLikeForEffectiveStatus,
  todayYmd: string,
): ProjectStatus {
  const db = project.status;
  if (db === "cancelled" || db === "completed") return db;
  const last = getProjectLastRentalDayYmd(project);
  if (!last) return db;
  if (last < todayYmd) return "completed";
  return db;
}
