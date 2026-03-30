/**
 * 專案狀態常數與顯示輔助
 * 單一來源：狀態選項、標籤 key、顏色 class
 */

import { PROJECTS_PAGE } from "@/lib/message";
import type { ProjectStatus } from "@/lib/types/project";

/** 表單／篩選／圖例僅露出此三種；其餘狀態仍可由 getStatusLabel 顯示 */
export const PROJECT_STATUS_UI_SELECTABLE_VALUES = [
  "negotiating",
  "confirmed",
  "completed",
] as const satisfies readonly ProjectStatus[];

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
    colorClass: "bg-slate-500",
  },
  {
    value: "confirmed",
    labelKey: "statusConfirmed",
    colorClass: "bg-blue-500",
  },
  {
    value: "deposit_paid",
    labelKey: "statusDepositPaid",
    colorClass: "bg-primary",
  },
  {
    value: "completed",
    labelKey: "statusCompleted",
    colorClass: "bg-green-600",
  },
  {
    value: "cancelled",
    labelKey: "statusCancelled",
    colorClass: "bg-muted text-muted-foreground",
  },
];

/** 狀態下拉與曆圖例用（洽談中／已確定／完成） */
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
  const option = STATUS_BY_VALUE.get(status);
  if (!option) return status;
  return PROJECTS_PAGE[option.labelKey];
}

/** 依狀態回傳 Tailwind 顏色 class（用於 Badge、StatusDot 等） */
export function getStatusColorClass(status: ProjectStatus): string {
  const option = STATUS_BY_VALUE.get(status);
  return option?.colorClass ?? "bg-muted";
}
