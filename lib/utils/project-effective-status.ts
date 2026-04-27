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
