import type { Project } from "@/lib/types/project";

/**
 * 取得專案在指定日期（或首筆 rental）的時段字串 "HH:mm – HH:mm"。
 * @param project 專案（需含 rentals 且具 startTime/endTime）
 * @param dateKey 可選，YYYY-MM-DD；有傳則顯示該日對應 rental 的時段，無則用首筆
 */
export function getProjectTimeRange(
  project: Project,
  dateKey?: string,
): string | null {
  const rentals = project.rentals;
  if (!rentals?.length) return null;
  const r = dateKey
    ? rentals.find((x) => x.date.slice(0, 10) === dateKey)
    : rentals[0];
  if (!r?.startTime || !r?.endTime) return null;
  return `${r.startTime} – ${r.endTime}`;
}
