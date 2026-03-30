import type { Project } from "@/lib/types/project";
import {
  effectiveEndDate,
  expandRentalDateKeys,
} from "@/lib/utils/project-rental-interval";

/**
 * 租借列：日期欄（含跨日區間）
 */
export function formatRentalDateRangeForTable(
  r: { date: string; endDate?: string | null },
  formatDate: (d: Date) => string,
): string {
  const eff = effectiveEndDate(r.date, r.endDate);
  const d0 = r.date.slice(0, 10);
  const a = formatDate(new Date(`${d0}T00:00:00`));
  if (eff === d0) return a;
  return `${a} – ${formatDate(new Date(`${eff}T00:00:00`))}`;
}

/**
 * 取得專案在指定日期（或首筆 rental）的時段字串。
 * @param dateKey 有傳時找涵蓋該曆日之 rental，跨日時依是否為起迄日顯示片段或「全日」
 */
export function getProjectTimeRange(
  project: Project,
  dateKey?: string,
): string | null {
  const rentals = project.rentals;
  if (!rentals?.length) return null;

  const pick = (() => {
    if (!dateKey) return rentals[0];
    const key = dateKey.slice(0, 10);
    return (
      rentals.find((x) =>
        expandRentalDateKeys({ date: x.date, endDate: x.endDate }).includes(
          key,
        ),
      ) ?? null
    );
  })();

  if (!pick?.startTime || !pick?.endTime) return null;

  const d0 = pick.date.slice(0, 10);
  const eff = effectiveEndDate(pick.date, pick.endDate);

  if (!dateKey) {
    if (eff === d0) return `${pick.startTime} – ${pick.endTime}`;
    return `${d0} ${pick.startTime} → ${eff} ${pick.endTime}`;
  }

  const dk = dateKey.slice(0, 10);
  if (eff === d0) return `${pick.startTime} – ${pick.endTime}`;
  if (dk === d0) return `${pick.startTime} – …`;
  if (dk === eff) return `… – ${pick.endTime}`;
  return "全日";
}
