/**
 * 專案狀態常數與顯示輔助
 * 單一來源：狀態選項、標籤 key、顏色 class
 */

import { PROJECTS_PAGE } from "@/lib/message";
import type { ProjectStatus } from "@/lib/types/project";

export type ProjectStatusUi = "negotiating" | "confirmed" | "completed";

/** 表單／篩選／圖例僅露出此兩種；其餘狀態仍可由 getStatusLabel 顯示 */
export const PROJECT_STATUS_UI_SELECTABLE_VALUES = [
  "negotiating",
  "confirmed",
] as const satisfies readonly ProjectStatus[];

/**
 * UI 正規化：不改 DB 架構，只在前端把狀態合併/隱藏
 * - deposit_paid -> confirmed（顯示一致）
 * - cancelled -> null（前端不顯示狀態文字/選單）
 */
export function normalizeProjectStatusForUi(
  status: ProjectStatus,
): ProjectStatusUi | null {
  switch (status) {
    case "deposit_paid":
      return "confirmed";
    case "cancelled":
      return null;
    case "negotiating":
    case "confirmed":
    case "completed":
      return status;
  }
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
    colorClass: "bg-primary",
  },
  {
    value: "deposit_paid",
    labelKey: "statusDepositPaid",
    colorClass: "bg-primary",
  },
  {
    value: "completed",
    labelKey: "statusCompleted",
    colorClass: "bg-emerald-600",
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
  if (normalized === null) {
    // cancelled 目前仍保留標籤以供既有呼叫點/除錯使用；
    // 但新的 UI 應該在 normalize === null 時直接不渲染。
    return PROJECTS_PAGE.statusCancelled;
  }
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
