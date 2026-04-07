/**
 * 專案列表表格：欄位順序與表頭／儲存格版型（單一來源）
 * 表身內容與排序取值仍於 projects-list 實作，避免設定檔依賴 React 與格式化邏輯。
 */

import { PROJECTS_PAGE } from "@/lib/message";

/**
 * 欄位顯示順序即陣列順序；調整順序時僅改此處即可與表頭／表身對齊。
 */
export const PROJECTS_LIST_COLUMNS = [
  {
    id: "eventType",
    sortable: true,
    label: PROJECTS_PAGE.columnActivityType,
    cellClassName: "min-w-0 max-w-[120px] truncate",
  },
  {
    id: "eventOrVenueUse",
    sortable: true,
    label: PROJECTS_PAGE.columnEventOrVenueUse,
    cellClassName: "min-w-0 max-w-[180px] truncate",
  },
  {
    id: "customer",
    sortable: true,
    label: PROJECTS_PAGE.columnCustomer,
    cellClassName: "min-w-0 max-w-[120px] truncate",
  },
  {
    id: "space",
    sortable: true,
    label: PROJECTS_PAGE.columnSpace,
    cellClassName: "min-w-0 max-w-[160px] truncate",
  },
  {
    id: "date",
    sortable: true,
    label: PROJECTS_PAGE.columnDate,
    cellClassName: "tabular-nums whitespace-nowrap",
  },
  {
    id: "eventStartTime",
    sortable: true,
    label: PROJECTS_PAGE.columnEventStartTime,
    headerClassName: "tabular-nums whitespace-nowrap",
    cellClassName: "tabular-nums whitespace-nowrap",
  },
  {
    id: "eventEndTime",
    sortable: true,
    label: PROJECTS_PAGE.columnEventEndTime,
    headerClassName: "tabular-nums whitespace-nowrap",
    cellClassName: "tabular-nums whitespace-nowrap",
  },
  {
    id: "contactPerson",
    sortable: true,
    label: PROJECTS_PAGE.columnContact,
    cellClassName: "min-w-0 max-w-[100px] truncate",
  },
  {
    id: "amount",
    sortable: true,
    label: PROJECTS_PAGE.columnAmount,
    headerClassName: "text-right tabular-nums",
    cellClassName: "text-right tabular-nums",
    headerButtonJustifyEnd: true,
  },
  {
    id: "status",
    sortable: true,
    label: PROJECTS_PAGE.columnStatus,
    cellClassName: "",
  },
  {
    id: "totalAttendees",
    sortable: true,
    label: PROJECTS_PAGE.columnTotalAttendees,
    headerClassName: "text-right tabular-nums",
    cellClassName: "text-right tabular-nums",
    headerButtonJustifyEnd: true,
  },
  {
    id: "tables",
    sortable: true,
    label: PROJECTS_PAGE.columnTables,
    cellClassName: "min-w-0 max-w-[80px] truncate",
  },
  {
    id: "chairs",
    sortable: true,
    label: PROJECTS_PAGE.columnChairs,
    headerClassName: "text-right tabular-nums",
    cellClassName: "text-right tabular-nums",
    headerButtonJustifyEnd: true,
  },
  {
    id: "otherEquipment",
    sortable: true,
    label: PROJECTS_PAGE.columnOtherEquipment,
    cellClassName: "min-w-0 max-w-[160px] truncate",
  },
  {
    id: "rentalAmountTotal",
    sortable: true,
    label: PROJECTS_PAGE.columnRentalAmount,
    headerClassName: "text-right tabular-nums",
    cellClassName: "text-right tabular-nums",
    headerButtonJustifyEnd: true,
  },
  {
    id: "fnbAmountTotal",
    sortable: true,
    label: PROJECTS_PAGE.columnFnbAmount,
    headerClassName: "text-right tabular-nums",
    cellClassName: "text-right tabular-nums",
    headerButtonJustifyEnd: true,
  },
  {
    id: "paidAmountTotal",
    sortable: true,
    label: PROJECTS_PAGE.columnPaidAmount,
    headerClassName: "text-right tabular-nums",
    cellClassName: "text-right tabular-nums",
    headerButtonJustifyEnd: true,
  },
  {
    id: "pendingAmountTotal",
    sortable: true,
    label: PROJECTS_PAGE.columnPendingAmount,
    headerClassName: "text-right tabular-nums",
    cellClassName: "text-right tabular-nums",
    headerButtonJustifyEnd: true,
  },
  {
    id: "fnbItems",
    sortable: true,
    label: PROJECTS_PAGE.columnFnbItems,
    cellClassName: "min-w-0 max-w-[140px] truncate",
  },
  {
    id: "projectNotes",
    sortable: true,
    label: PROJECTS_PAGE.columnProjectNotes,
    cellClassName: "min-w-0 max-w-[180px] truncate",
  },
  {
    id: "actions",
    sortable: false,
    label: PROJECTS_PAGE.columnActions,
    headerClassName: "w-0",
    cellClassName: "w-0 whitespace-nowrap",
  },
] as const;

/** 單一欄位設定列 */
export type ProjectsListColumnConfig =
  (typeof PROJECTS_LIST_COLUMNS)[number];

/** 可排序欄位鍵 */
export type ProjectsListSortKey = Extract<
  ProjectsListColumnConfig,
  { sortable: true }
>["id"];

/** 含操作欄在內的欄位識別 */
export type ProjectsListColumnId = ProjectsListColumnConfig["id"];
