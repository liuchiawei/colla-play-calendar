/**
 * 專案狀態常數與顯示輔助
 * 單一來源：狀態選項、標籤 key、顏色 class
 */

import { PROJECTS_PAGE } from "@/lib/message";
import type { ProjectStatus } from "@/lib/types/project";
import {
  getEffectiveProjectStatus,
  getTaipeiTodayYmd,
  type ProjectLikeForEffectiveStatus,
} from "@/lib/utils/project-effective-status";

export { getTaipeiTodayYmd };

export type ProjectStatusUi =
  | "negotiating"
  | "confirmed"
  | "cancelled"
  | "completed";

/** 表單／篩選／圖例僅露出此三種；completed 仍可顯示但不提供選取 */
export const PROJECT_STATUS_UI_SELECTABLE_VALUES = [
  "negotiating",
  "confirmed",
  "cancelled",
] as const satisfies readonly ProjectStatus[];

/**
 * UI 正規化：不改 DB 架構，只在前端把狀態合併/隱藏
 * - deposit_paid -> confirmed（顯示一致）
 */
export function normalizeProjectStatusForUi(
  status: ProjectStatus,
): ProjectStatusUi | null {
  switch (status) {
    case "deposit_paid":
      return "confirmed";
    case "negotiating":
    case "confirmed":
    case "cancelled":
    case "completed":
      return status;
  }
}

/**
 * 租借結束日已過則視為已完成後，再套用 UI 正規化（與 normalizeProjectStatusForUi 一致）
 * @param todayYmd 省略時使用台北當日曆日期
 */
export function getUiProjectStatus(
  project: ProjectLikeForEffectiveStatus,
  todayYmd?: string,
): ProjectStatusUi | null {
  const ymd = todayYmd ?? getTaipeiTodayYmd();
  return normalizeProjectStatusForUi(
    getEffectiveProjectStatus(project, ymd),
  );
}

export const PROJECT_STATUS_OPTIONS: Array<{
  value: ProjectStatus;
  labelKey: keyof Pick<
    typeof PROJECTS_PAGE,
    | "statusNegotiating"
    | "statusConfirmed"
    | "statusDepositPaid"
    | "statusCompleted"
    | "statusCancelled"
  >;
  /** Tailwind class for badge/dot (e.g. bg-slate-500, bg-primary) */
  colorClass: string;
}> = [
  {
    value: "negotiating",
    labelKey: "statusNegotiating",
    colorClass: "bg-accent",
  },
  {
    value: "confirmed",
    labelKey: "statusConfirmed",
    colorClass: "bg-teal-600",
  },
  {
    value: "deposit_paid",
    labelKey: "statusDepositPaid",
    colorClass: "bg-primary",
  },
  {
    value: "completed",
    labelKey: "statusCompleted",
    colorClass: "bg-neutral-400 dark:bg-neutral-600",
  },
  {
    value: "cancelled",
    labelKey: "statusCancelled",
    colorClass: "bg-muted text-muted-foreground",
  },
];

/** 狀態下拉與曆圖例用（洽談中／已確定） */
export const PROJECT_STATUS_UI_SELECTABLE = PROJECT_STATUS_OPTIONS.filter((o) =>
  (PROJECT_STATUS_UI_SELECTABLE_VALUES as readonly string[]).includes(o.value),
);

/** 週曆等視圖的圖例用（含已完成，但不提供篩選選取） */
export const PROJECT_STATUS_UI_LEGEND = PROJECT_STATUS_OPTIONS.filter((o) =>
  (["negotiating", "confirmed", "completed"] as readonly ProjectStatus[]).includes(
    o.value,
  ),
);

/** 目前狀態是否在三選項內（否則 Select 需額外 item 以綁定 value） */
export function isProjectStatusUiSelectable(status: ProjectStatus): boolean {
  return (PROJECT_STATUS_UI_SELECTABLE_VALUES as readonly string[]).includes(
    status,
  );
}

const STATUS_BY_VALUE = new Map(
  PROJECT_STATUS_OPTIONS.map((o) => [o.value, o]),
);

/** 依狀態回傳顯示用標籤（從 PROJECTS_PAGE 取文案） */
export function getStatusLabel(status: ProjectStatus): string {
  const normalized = normalizeProjectStatusForUi(status);
  if (normalized === null) return "";
  const option = STATUS_BY_VALUE.get(normalized);
  if (!option) return normalized;
  return PROJECTS_PAGE[option.labelKey];
}

/** 依狀態回傳 Tailwind 顏色 class（用於 Badge、StatusDot 等） */
export function getStatusColorClass(status: ProjectStatus): string {
  const normalized = normalizeProjectStatusForUi(status);
  if (normalized === null) return "bg-muted";
  const option = STATUS_BY_VALUE.get(normalized);
  return option?.colorClass ?? "bg-muted";
}
