// 日付処理ユーティリティ関数
import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  format,
  isSameDay,
  isWithinInterval,
  differenceInMinutes,
  startOfDay,
  addDays,
  parseISO,
} from "date-fns";
import { zhTW, enUS } from "date-fns/locale";
import type { WeekRange, TimeSlot, EventPosition } from "./types";
import type { EventWithCategory } from "./types";
import { STORE_CONFIG } from "./config/config";

// 週の開始日を月曜日に設定
const WEEK_OPTIONS = { weekStartsOn: 1 as const };

// カレンダー表示用の時間範囲（營業時間から取得）
export const CALENDAR_START_HOUR = STORE_CONFIG.businessHours.open;
export const CALENDAR_END_HOUR = STORE_CONFIG.businessHours.close;
export const HOURS_IN_VIEW = CALENDAR_END_HOUR - CALENDAR_START_HOUR;

// 週の日付範囲を取得
export function getWeekRange(date: Date): WeekRange {
  return {
    start: startOfWeek(date, WEEK_OPTIONS),
    end: endOfWeek(date, WEEK_OPTIONS),
  };
}

// 次の週に移動
export function getNextWeek(date: Date): Date {
  return addWeeks(date, 1);
}

// 前の週に移動
export function getPreviousWeek(date: Date): Date {
  return subWeeks(date, 1);
}

// 次の日に移動（モバイル用）
export function getNextDay(date: Date): Date {
  return addDays(date, 1);
}

// 前の日に移動（モバイル用）
export function getPreviousDay(date: Date): Date {
  return addDays(date, -1);
}

// 週の各日を取得（月〜日）
export function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date, WEEK_OPTIONS);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

// 年を取得（例："2025"）
export function formatYear(date: Date): string {
  return format(date, "yyyy", { locale: enUS });
}

// 月を取得（例："12月"）
export function formatMonth(date: Date): string {
  return format(date, "M月", { locale: zhTW });
}

// 月を取得（英語例："August"）
export function formatMonthEng(date: Date): string {
  return format(date, "MMMM", { locale: enUS });
}

// 日付をフォーマット（例："12/30 (一)"）
export function formatDayHeader(date: Date): string {
  return format(date, "M/d (EEE)", { locale: zhTW });
}

// 年月を取得（例："2025年12月"）
export function formatMonthYear(date: Date): string {
  return format(date, "yyyy年M月", { locale: zhTW });
}

// 時間スロットを生成（營業時間に基づく）
export function generateTimeSlots(): TimeSlot[] {
  return Array.from({ length: HOURS_IN_VIEW }, (_, i) => ({
    hour: CALENDAR_START_HOUR + i,
    label: `${String(CALENDAR_START_HOUR + i).padStart(2, "0")}:00`,
  }));
}

// イベントが特定の日に表示されるかチェック
export function isEventOnDay(event: EventWithCategory, day: Date): boolean {
  const eventStart = new Date(event.startTime);
  const eventEnd = new Date(event.endTime);
  const dayStart = startOfDay(day);
  const dayEnd = addDays(dayStart, 1);

  // イベントの期間が日と重複するかチェック
  return (
    isWithinInterval(eventStart, { start: dayStart, end: dayEnd }) ||
    isWithinInterval(dayStart, { start: eventStart, end: eventEnd }) ||
    isSameDay(eventStart, day)
  );
}

// イベントのカレンダー表示位置を計算
export function calculateEventPosition(
  event: EventWithCategory,
  day: Date,
): EventPosition {
  const eventStart = new Date(event.startTime);
  const eventEnd = new Date(event.endTime);
  const dayStart = startOfDay(day);

  // その日の表示開始時間（營業開始時間）
  const viewStart = new Date(dayStart);
  viewStart.setHours(CALENDAR_START_HOUR, 0, 0, 0);

  // その日の表示終了時間（營業結束時間）
  const viewEnd = new Date(dayStart);
  viewEnd.setHours(CALENDAR_END_HOUR, 0, 0, 0);

  // イベントの表示開始時間（表示範囲内にクランプ）
  const displayStart = eventStart < viewStart ? viewStart : eventStart;
  const displayEnd = eventEnd > viewEnd ? viewEnd : eventEnd;

  // 表示時間の計算（分単位）
  const totalMinutes = HOURS_IN_VIEW * 60;
  const startMinutes = differenceInMinutes(displayStart, viewStart);
  const endMinutes = differenceInMinutes(displayEnd, viewStart);

  // パーセンテージに変換
  const top = Math.max(0, (startMinutes / totalMinutes) * 100);
  const height = Math.min(
    100 - top,
    ((endMinutes - startMinutes) / totalMinutes) * 100,
  );

  return {
    top,
    height: Math.max(height, 2), // 最小高さを確保
    left: 0,
    width: 100,
  };
}

// ISO文字列から日付オブジェクトを取得
export function parseDateTime(isoString: string): Date {
  return parseISO(isoString);
}

// 時間をフォーマット（例："14:30"）
export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "HH:mm");
}

// 日付をフォーマット（例："2025/12/30"）
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "yyyy/MM/dd");
}

// 日付と時間を結合してISO文字列を生成
export function combineDateAndTime(date: string, time: string): string {
  return `${date}T${time}:00`;
}

// 日時入力用にフォーマット（datetime-local input用）
export function formatForDateTimeInput(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "yyyy-MM-dd'T'HH:mm");
}

const HHMM_REGEX = /^(\d{1,2}):(\d{2})$/;

/** 將 "HH:mm" 轉為自 00:00 起算的分鐘數；無效格式回傳 null */
function parseTimeToMinutes(time: string): number | null {
  const m = time.trim().match(HHMM_REGEX);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

/** 將分鐘數（0–1439）格式為 "HH:mm" */
function formatMinutesToTime(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min(1439, Math.floor(totalMinutes)));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * "HH:mm" 加上指定分鐘數，結果限制在當日 00:00–23:59。
 * @param time "HH:mm" 字串
 * @param minutes 要加上的分鐘數（可為負）
 */
export function addMinutesToTime(time: string, minutes: number): string {
  const base = parseTimeToMinutes(time);
  if (base === null) return time;
  return formatMinutesToTime(base + minutes);
}

/**
 * "HH:mm" 減去指定分鐘數，結果限制在當日 00:00–23:59。
 * @param time "HH:mm" 字串
 * @param minutes 要減去的分鐘數（可為負）
 */
export function subtractMinutesFromTime(time: string, minutes: number): string {
  const base = parseTimeToMinutes(time);
  if (base === null) return time;
  return formatMinutesToTime(base - minutes);
}
