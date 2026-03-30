/**
 * 專案租借區間：跨日 endDate、時間戳、重疊判斷、日期鍵展開
 */

/** 結束日：未填視同開始日 */
export function effectiveEndDate(
  date: string,
  endDate: string | null | undefined,
): string {
  const d = (endDate ?? "").trim();
  return d.length >= 10 ? d.slice(0, 10) : date.slice(0, 10);
}

/** 結束是否晚於開始（字串 YYYY-MM-DD 可比較） */
export function isEndDateOnOrAfterStart(date: string, end: string): boolean {
  return end.slice(0, 10) >= date.slice(0, 10);
}

/**
 * 租借時間是否有效：跨日可 endTime <= startTime；同日須 endTime > startTime
 */
export function isValidRentalTimeWindow(input: {
  date: string;
  endDate?: string | null;
  startTime: string;
  endTime: string;
}): boolean {
  const start = input.startTime.slice(0, 5);
  const end = input.endTime.slice(0, 5);
  if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) {
    return false;
  }
  const effEnd = effectiveEndDate(input.date, input.endDate);
  if (!isEndDateOnOrAfterStart(input.date, effEnd)) return false;
  if (effEnd > input.date.slice(0, 10)) return true;
  return end > start;
}

/** 本地日期字串 + HH:mm → 可排序的毫秒（用於重疊比對） */
export function rentalBoundsMs(input: {
  date: string;
  endDate?: string | null;
  startTime: string;
  endTime: string;
}): { startMs: number; endMs: number } | null {
  if (!isValidRentalTimeWindow(input)) return null;
  const d = input.date.slice(0, 10);
  const eff = effectiveEndDate(d, input.endDate);
  const st = input.startTime.slice(0, 5);
  const et = input.endTime.slice(0, 5);
  const startMs = new Date(`${d}T${st}:00`).getTime();
  const endMs = new Date(`${eff}T${et}:00`).getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return null;
  if (endMs <= startMs) return null;
  return { startMs, endMs };
}

/** 兩區間是否重疊（半開區間 [start, end) 語意：接點不重疊） */
export function intervalsOverlap(
  a: { startMs: number; endMs: number },
  b: { startMs: number; endMs: number },
): boolean {
  return a.startMs < b.endMs && b.startMs < a.endMs;
}

/** 兩組 spaceIds 是否有交集 */
export function spaceIdsIntersect(a: string[], b: string[]): boolean {
  const setA = new Set(a);
  for (const id of b) {
    if (setA.has(id)) return true;
  }
  return false;
}

/**
 * 展開租借涵蓋的每個曆日 YYYY-MM-DD（含起迄日）
 */
export function expandRentalDateKeys(input: {
  date: string;
  endDate?: string | null;
}): string[] {
  const start = input.date.slice(0, 10);
  const end = effectiveEndDate(start, input.endDate);
  if (end < start) return [start];
  const keys: string[] = [];
  const cur = new Date(`${start}T12:00:00`);
  const last = new Date(`${end}T12:00:00`);
  while (cur.getTime() <= last.getTime()) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, "0");
    const day = String(cur.getDate()).padStart(2, "0");
    keys.push(`${y}-${m}-${day}`);
    cur.setDate(cur.getDate() + 1);
  }
  return keys;
}
