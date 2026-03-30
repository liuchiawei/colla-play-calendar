/**
 * 專案詳情 CSV 匯出（可重用）
 *
 * 目前會在：
 * - 專案詳情頁下載
 * - 專案列表每列下載
 *
 * 注意：此模組只負責「字串與檔名」生成；實際 Blob 下載留在 client 端處理。
 */

import { format } from "date-fns";
import { zhTW } from "date-fns/locale";

import { getSpaceNameById } from "@/lib/config/config";
import {
  getStatusLabel,
  normalizeProjectStatusForUi,
} from "@/lib/config/project-status";
import { CREATE_PROJECT_PAGE, PROJECT_DETAIL_PAGE } from "@/lib/message";
import type { ProjectWithRentals } from "@/lib/types/project";
import { formatRentalDateRangeForTable } from "@/lib/utils/project";
import { parseEquipmentNeedsFromDb } from "@/lib/utils/project-equipment-needs";

const CURRENCY_FORMATTER = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
});

const DATE_FORMATTER = new Intl.DateTimeFormat("zh-TW", { dateStyle: "short" });

function formatDateTime(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return format(d, "yyyy/MM/dd HH:mm", { locale: zhTW });
}

function escapeCsvCell(value: string): string {
  const s = String(value);
  if (/[,"\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** 設備勾選：唯讀一行（CSV／詳情） */
function formatEquipmentNeedsLine(
  raw: ProjectWithRentals["equipmentNeeds"],
): string | null {
  const p = parseEquipmentNeedsFromDb(raw);
  const parts: string[] = [];
  if (p.microphone) parts.push(CREATE_PROJECT_PAGE.labelEquipmentMicrophone);
  if (p.extensionCord)
    parts.push(CREATE_PROJECT_PAGE.labelEquipmentExtensionCord);
  if (p.projector) parts.push(CREATE_PROJECT_PAGE.labelEquipmentProjector);
  if (p.whiteboard) parts.push(CREATE_PROJECT_PAGE.labelEquipmentWhiteboard);
  return parts.length > 0 ? parts.join("、") : null;
}

export function getProjectDetailCsvFilename(project: {
  id: string;
  eventOrVenueUse?: string | null;
}): string {
  const safeName = (project.eventOrVenueUse || project.id)
    .replace(/[/\\:*?"<>|]/g, "_")
    .slice(0, 80);
  const dateStr = format(new Date(), "yyyyMMdd", { locale: zhTW });
  return `專案詳情-${safeName}-${dateStr}.csv`;
}

export function buildProjectDetailCsv(
  project: ProjectWithRentals,
  collaPlayContactDisplayName: string,
): string {
  const rows: string[] = [];

  // Section 1: 專案／客戶摘要（欄位名, 值）
  rows.push(
    [PROJECT_DETAIL_PAGE.labelCustomerName, project.customerName]
      .map(escapeCsvCell)
      .join(","),
  );
  rows.push(
    [PROJECT_DETAIL_PAGE.labelPhone, project.customerPhone]
      .map(escapeCsvCell)
      .join(","),
  );
  if (project.company) {
    rows.push(
      [PROJECT_DETAIL_PAGE.labelCompany, project.company]
        .map(escapeCsvCell)
        .join(","),
    );
  }
  if (project.taxId) {
    rows.push(
      [PROJECT_DETAIL_PAGE.labelTaxId, project.taxId]
        .map(escapeCsvCell)
        .join(","),
    );
  }
  rows.push(
    [PROJECT_DETAIL_PAGE.labelEventOrVenueUse, project.eventOrVenueUse]
      .map(escapeCsvCell)
      .join(","),
  );
  if (project.totalAttendees != null) {
    rows.push(
      [PROJECT_DETAIL_PAGE.labelTotalAttendees, String(project.totalAttendees)]
        .map(escapeCsvCell)
        .join(","),
    );
  }
  if (project.tables) {
    rows.push(
      [PROJECT_DETAIL_PAGE.labelTables, project.tables]
        .map(escapeCsvCell)
        .join(","),
    );
  }
  if (project.chairs != null) {
    rows.push(
      [PROJECT_DETAIL_PAGE.labelChairs, String(project.chairs)]
        .map(escapeCsvCell)
        .join(","),
    );
  }
  const equipmentLine = formatEquipmentNeedsLine(project.equipmentNeeds);
  if (equipmentLine) {
    rows.push(
      [PROJECT_DETAIL_PAGE.labelEquipmentSummary, equipmentLine]
        .map(escapeCsvCell)
        .join(","),
    );
  }
  if (project.fnbItems) {
    rows.push(
      [PROJECT_DETAIL_PAGE.labelFnb, project.fnbItems]
        .map(escapeCsvCell)
        .join(","),
    );
  }
  if (project.projectNotes) {
    rows.push(
      [PROJECT_DETAIL_PAGE.labelProjectNotes, project.projectNotes]
        .map(escapeCsvCell)
        .join(","),
    );
  }
  rows.push(
    [PROJECT_DETAIL_PAGE.labelCollaPlayContact, collaPlayContactDisplayName]
      .map(escapeCsvCell)
      .join(","),
  );
  const statusForUi = normalizeProjectStatusForUi(project.status);
  if (statusForUi) {
    rows.push(
      [PROJECT_DETAIL_PAGE.labelStatus, getStatusLabel(statusForUi)]
        .map(escapeCsvCell)
        .join(","),
    );
  }
  rows.push(
    [PROJECT_DETAIL_PAGE.labelCreatedAt, formatDateTime(project.createdAt)]
      .map(escapeCsvCell)
      .join(","),
  );
  rows.push(
    [PROJECT_DETAIL_PAGE.labelUpdatedAt, formatDateTime(project.updatedAt)]
      .map(escapeCsvCell)
      .join(","),
  );
  if (project.internalNotes) {
    rows.push(
      [PROJECT_DETAIL_PAGE.labelInternalNotes, project.internalNotes]
        .map(escapeCsvCell)
        .join(","),
    );
  }

  rows.push(""); // 空行分隔

  // Section 2: 租借項目表
  const rentalHeaders = [
    PROJECT_DETAIL_PAGE.labelDate,
    PROJECT_DETAIL_PAGE.labelTimeRange,
    PROJECT_DETAIL_PAGE.labelSpaces,
    PROJECT_DETAIL_PAGE.labelRentalAmount,
    PROJECT_DETAIL_PAGE.labelFnbAmount,
    PROJECT_DETAIL_PAGE.labelPaidAmount,
    PROJECT_DETAIL_PAGE.labelPendingAmount,
  ];
  rows.push(rentalHeaders.map(escapeCsvCell).join(","));

  const totalAmount = project.rentals.reduce(
    (sum, r) => sum + r.rentalAmount + r.fnbAmount,
    0,
  );
  for (const r of project.rentals) {
    const dateStr = formatRentalDateRangeForTable(r, (d) =>
      DATE_FORMATTER.format(d),
    );
    const timeRange = `${r.startTime} – ${r.endTime}`;
    const spaces = r.spaceIds.map((id) => getSpaceNameById(id)).join("、");
    rows.push(
      [
        dateStr,
        timeRange,
        spaces,
        CURRENCY_FORMATTER.format(r.rentalAmount),
        CURRENCY_FORMATTER.format(r.fnbAmount),
        CURRENCY_FORMATTER.format(r.paidAmount),
        CURRENCY_FORMATTER.format(r.pendingAmount),
      ]
        .map(escapeCsvCell)
        .join(","),
    );
  }
  rows.push(
    [
      "",
      "",
      PROJECT_DETAIL_PAGE.totalAmount,
      CURRENCY_FORMATTER.format(totalAmount),
      "",
      "",
      "",
    ]
      .map(escapeCsvCell)
      .join(","),
  );

  const csvContent = rows.join("\r\n");
  return "\uFEFF" + csvContent;
}

