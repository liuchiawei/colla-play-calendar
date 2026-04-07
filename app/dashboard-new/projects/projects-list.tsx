"use client";

import { useCallback, useMemo, useTransition, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Download,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  Table,
  TableCaption,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  CREATE_PROJECT_PAGE,
  PROJECTS_PAGE,
  PROJECT_DETAIL_PAGE,
} from "@/lib/message";
import {
  getStatusLabel,
  getStatusColorClass,
  normalizeProjectStatusForUi,
} from "@/lib/config/project-status";
import type { Project } from "@/lib/types/project";
import { cn } from "@/lib/utils";
import { formatRentalDateRangeForTable } from "@/lib/utils/project";
import { formatEquipmentNeedsLine } from "@/lib/utils/project-equipment-needs";
import { deleteProject, downloadProjectDetailCsv } from "./[id]/actions";

const DATE_FORMATTER = new Intl.DateTimeFormat("zh-TW", {
  dateStyle: "short",
});

const CURRENCY_FORMATTER = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
});

/** 設備勾選一行顯示（與 CSV／詳情一致） */
const EQUIPMENT_NEEDS_LINE_LABELS = {
  microphone: CREATE_PROJECT_PAGE.labelEquipmentMicrophone,
  extensionCord: CREATE_PROJECT_PAGE.labelEquipmentExtensionCord,
  projector: CREATE_PROJECT_PAGE.labelEquipmentProjector,
  whiteboard: CREATE_PROJECT_PAGE.labelEquipmentWhiteboard,
  noOtherEquipmentNeeds: CREATE_PROJECT_PAGE.labelEquipmentNoOtherNeeds,
} as const;

type SortDirection = "asc" | "desc";

type SortKey =
  | "eventType"
  | "customer"
  | "eventOrVenueUse"
  | "space"
  | "date"
  | "eventStartTime"
  | "eventEndTime"
  | "contactPerson"
  | "amount"
  | "status"
  | "tables"
  | "chairs"
  | "otherEquipment"
  | "rentalAmountTotal"
  | "fnbAmountTotal"
  | "paidAmountTotal"
  | "pendingAmountTotal"
  | "fnbItems"
  | "totalAttendees"
  | "projectNotes";

type SortState = { key: SortKey; dir: SortDirection } | null;

interface ProjectsListProps {
  projects: Project[];
}

function parseTimeToMinutes(value: string | undefined): number | null {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function parseDateToEpochMs(value: string | undefined): number | null {
  if (!value) return null;
  // 對 date-only 字串用 T12 避免時區偏移造成跨日
  const d = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T12:00:00`)
    : new Date(value);
  const ms = d.getTime();
  return Number.isFinite(ms) ? ms : null;
}

function parseIntIfNumeric(value: string | null | undefined): number | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const n = Number.parseInt(trimmed, 10);
  return Number.isFinite(n) ? n : null;
}

function getAriaSort(
  sort: SortState,
  key: SortKey,
): React.AriaAttributes["aria-sort"] {
  if (!sort || sort.key !== key) return "none";
  return sort.dir === "asc" ? "ascending" : "descending";
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDirection }) {
  if (!active) {
    return (
      <ArrowUpDown
        className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
        aria-hidden
      />
    );
  }
  return dir === "asc" ? (
    <ArrowUp className="size-3.5 text-primary" aria-hidden />
  ) : (
    <ArrowDown className="size-3.5 text-primary" aria-hidden />
  );
}

export function ProjectsList({ projects }: ProjectsListProps) {
  const [, startTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [sort, setSort] = useState<SortState>(null);

  const sortedProjects = useMemo(() => {
    if (!sort) return projects;

    const localeCompareZhTw = (a: string, b: string) =>
      a.localeCompare(b, "zh-TW", { sensitivity: "base" });

    const getStatusLabelForSort = (project: Project) => {
      const statusForUi = normalizeProjectStatusForUi(project.status);
      return statusForUi ? getStatusLabel(statusForUi) : "";
    };

    const getSortValue = (project: Project): string | number | null => {
      switch (sort.key) {
        case "eventType":
          return project.eventType ?? "";
        case "customer":
          return project.customer ?? "";
        case "eventOrVenueUse":
          return project.eventOrVenueUse ?? "";
        case "space":
          return project.space ?? "";
        case "date": {
          const rentalDate = project.rentals?.[0]?.date;
          return (
            parseDateToEpochMs(rentalDate) ?? parseDateToEpochMs(project.date)
          );
        }
        case "eventStartTime":
          return parseTimeToMinutes(project.rentals?.[0]?.startTime);
        case "eventEndTime":
          return parseTimeToMinutes(project.rentals?.[0]?.endTime);
        case "contactPerson":
          return project.contactPerson ?? "";
        case "amount":
          return project.amount ?? null;
        case "status":
          return getStatusLabelForSort(project);
        case "tables": {
          const n = parseIntIfNumeric(project.tables);
          return n ?? project.tables ?? "";
        }
        case "chairs": {
          const s = project.chairs;
          if (s == null || s === "") return null;
          const n = parseIntIfNumeric(s);
          return n ?? s;
        }
        case "fnbItems":
          return project.fnbItems ?? "";
        case "otherEquipment":
          return (
            formatEquipmentNeedsLine(
              project.equipmentNeeds,
              EQUIPMENT_NEEDS_LINE_LABELS,
            ) ?? ""
          );
        case "rentalAmountTotal":
          return project.rentalAmountTotal;
        case "fnbAmountTotal":
          return project.fnbAmountTotal;
        case "paidAmountTotal":
          return project.paidAmountTotal;
        case "pendingAmountTotal":
          return project.pendingAmountTotal;
        case "totalAttendees": {
          const s = project.totalAttendees;
          if (s == null || s === "") return null;
          const n = parseIntIfNumeric(s);
          return n ?? s;
        }
        case "projectNotes":
          return project.projectNotes ?? "";
      }
    };

    const withIndex = projects.map((project, originalIndex) => ({
      project,
      originalIndex,
      value: getSortValue(project),
    }));

    withIndex.sort((a, b) => {
      const dirMultiplier = sort.dir === "asc" ? 1 : -1;
      const aVal = a.value;
      const bVal = b.value;

      if (aVal == null && bVal == null)
        return a.originalIndex - b.originalIndex;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      let result = 0;
      if (typeof aVal === "number" && typeof bVal === "number") {
        result = aVal - bVal;
      } else if (typeof aVal === "string" && typeof bVal === "string") {
        result = localeCompareZhTw(aVal, bVal);
      } else if (typeof aVal === "number" && typeof bVal === "string") {
        // 混合型別（例如 tables）：數字先排前，再排文字
        result = -1;
      } else if (typeof aVal === "string" && typeof bVal === "number") {
        result = 1;
      } else {
        result = localeCompareZhTw(String(aVal), String(bVal));
      }

      if (result === 0) return a.originalIndex - b.originalIndex;
      return result * dirMultiplier;
    });

    return withIndex.map((x) => x.project);
  }, [projects, sort]);

  function toggleSort(nextKey: SortKey) {
    setSort((prev) => {
      if (!prev || prev.key !== nextKey) return { key: nextKey, dir: "asc" };
      return { key: nextKey, dir: prev.dir === "asc" ? "desc" : "asc" };
    });
  }

  function handleDeleteConfirm(projectId: string) {
    setDeleteError(null);
    setDeletingId(projectId);
    startTransition(async () => {
      const result = await deleteProject(projectId);
      if (!result.success) {
        setDeleteError(result.error);
        setDeletingId(null);
      }
    });
  }

  const handleDownloadCsv = useCallback((projectId: string) => {
    setDownloadingId(projectId);
    startTransition(async () => {
      const result = await downloadProjectDetailCsv(projectId);
      if (!result.success) {
        setDownloadingId(null);
        return;
      }
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
      setDownloadingId(null);
    });
  }, []);

  return (
    <section
      className="flex-1 min-w-0 rounded-xl border border-border bg-card/50 backdrop-blur-sm [&_th]:p-4 [&_td]:p-4"
      aria-label={PROJECTS_PAGE.tableCaption}
    >
      {projects.length === 0 ? (
        <p className="text-muted-foreground text-sm py-12 text-center px-4">
          {PROJECTS_PAGE.emptyProjects}
        </p>
      ) : (
        <div className="min-w-0 overflow-x-auto">
          <Table>
            <TableCaption className="sr-only">
              {PROJECTS_PAGE.tableCaption}
            </TableCaption>
            <TableHeader>
              <TableRow>
                {/* 活動類型 */}
                <TableHead
                  scope="col"
                  aria-sort={getAriaSort(sort, "eventType")}
                >
                  <button
                    type="button"
                    className="group inline-flex items-center gap-2 rounded-sm hover:text-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    onClick={() => toggleSort("eventType")}
                  >
                    <span>{PROJECTS_PAGE.columnActivityType}</span>
                    <SortIcon
                      active={sort?.key === "eventType"}
                      dir={sort?.key === "eventType" ? sort.dir : "asc"}
                    />
                  </button>
                </TableHead>
                {/* 活動名稱 */}
                <TableHead
                  scope="col"
                  aria-sort={getAriaSort(sort, "eventOrVenueUse")}
                >
                  <button
                    type="button"
                    className="group inline-flex items-center gap-2 rounded-sm hover:text-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    onClick={() => toggleSort("eventOrVenueUse")}
                  >
                    <span>{PROJECTS_PAGE.columnEventOrVenueUse}</span>
                    <SortIcon
                      active={sort?.key === "eventOrVenueUse"}
                      dir={sort?.key === "eventOrVenueUse" ? sort.dir : "asc"}
                    />
                  </button>
                </TableHead>
                {/* 客戶 */}
                <TableHead
                  scope="col"
                  aria-sort={getAriaSort(sort, "customer")}
                >
                  <button
                    type="button"
                    className="group inline-flex items-center gap-2 rounded-sm hover:text-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    onClick={() => toggleSort("customer")}
                  >
                    <span>{PROJECTS_PAGE.columnCustomer}</span>
                    <SortIcon
                      active={sort?.key === "customer"}
                      dir={sort?.key === "customer" ? sort.dir : "asc"}
                    />
                  </button>
                </TableHead>
                {/* 場域 */}
                <TableHead scope="col" aria-sort={getAriaSort(sort, "space")}>
                  <button
                    type="button"
                    className="group inline-flex items-center gap-2 rounded-sm hover:text-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    onClick={() => toggleSort("space")}
                  >
                    <span>{PROJECTS_PAGE.columnSpace}</span>
                    <SortIcon
                      active={sort?.key === "space"}
                      dir={sort?.key === "space" ? sort.dir : "asc"}
                    />
                  </button>
                </TableHead>
                {/* 日期 */}
                <TableHead scope="col" aria-sort={getAriaSort(sort, "date")}>
                  <button
                    type="button"
                    className="group inline-flex items-center gap-2 rounded-sm hover:text-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    onClick={() => toggleSort("date")}
                  >
                    <span>{PROJECTS_PAGE.columnDate}</span>
                    <SortIcon
                      active={sort?.key === "date"}
                      dir={sort?.key === "date" ? sort.dir : "asc"}
                    />
                  </button>
                </TableHead>
                {/* 開始時間 */}
                <TableHead
                  scope="col"
                  className="tabular-nums whitespace-nowrap"
                  aria-sort={getAriaSort(sort, "eventStartTime")}
                >
                  <button
                    type="button"
                    className="group inline-flex items-center gap-2 rounded-sm hover:text-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    onClick={() => toggleSort("eventStartTime")}
                  >
                    <span>{PROJECTS_PAGE.columnEventStartTime}</span>
                    <SortIcon
                      active={sort?.key === "eventStartTime"}
                      dir={sort?.key === "eventStartTime" ? sort.dir : "asc"}
                    />
                  </button>
                </TableHead>
                {/* 結束時間 */}
                <TableHead
                  scope="col"
                  className="tabular-nums whitespace-nowrap"
                  aria-sort={getAriaSort(sort, "eventEndTime")}
                >
                  <button
                    type="button"
                    className="group inline-flex items-center gap-2 rounded-sm hover:text-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    onClick={() => toggleSort("eventEndTime")}
                  >
                    <span>{PROJECTS_PAGE.columnEventEndTime}</span>
                    <SortIcon
                      active={sort?.key === "eventEndTime"}
                      dir={sort?.key === "eventEndTime" ? sort.dir : "asc"}
                    />
                  </button>
                </TableHead>
                {/* 接洽人 */}
                <TableHead
                  scope="col"
                  aria-sort={getAriaSort(sort, "contactPerson")}
                >
                  <button
                    type="button"
                    className="group inline-flex items-center gap-2 rounded-sm hover:text-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    onClick={() => toggleSort("contactPerson")}
                  >
                    <span>{PROJECTS_PAGE.columnContact}</span>
                    <SortIcon
                      active={sort?.key === "contactPerson"}
                      dir={sort?.key === "contactPerson" ? sort.dir : "asc"}
                    />
                  </button>
                </TableHead>
                {/* 金額 */}
                <TableHead
                  scope="col"
                  className="text-right tabular-nums"
                  aria-sort={getAriaSort(sort, "amount")}
                >
                  <button
                    type="button"
                    className="group inline-flex w-full items-center justify-end gap-2 rounded-sm hover:text-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    onClick={() => toggleSort("amount")}
                  >
                    <span>{PROJECTS_PAGE.columnAmount}</span>
                    <SortIcon
                      active={sort?.key === "amount"}
                      dir={sort?.key === "amount" ? sort.dir : "asc"}
                    />
                  </button>
                </TableHead>
                {/* 狀態 */}
                <TableHead scope="col" aria-sort={getAriaSort(sort, "status")}>
                  <button
                    type="button"
                    className="group inline-flex items-center gap-2 rounded-sm hover:text-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    onClick={() => toggleSort("status")}
                  >
                    <span>{PROJECTS_PAGE.columnStatus}</span>
                    <SortIcon
                      active={sort?.key === "status"}
                      dir={sort?.key === "status" ? sort.dir : "asc"}
                    />
                  </button>
                </TableHead>
                {/* 人數 */}
                <TableHead
                  scope="col"
                  className="text-right tabular-nums"
                  aria-sort={getAriaSort(sort, "totalAttendees")}
                >
                  <button
                    type="button"
                    className="group inline-flex w-full items-center justify-end gap-2 rounded-sm hover:text-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    onClick={() => toggleSort("totalAttendees")}
                  >
                    <span>{PROJECTS_PAGE.columnTotalAttendees}</span>
                    <SortIcon
                      active={sort?.key === "totalAttendees"}
                      dir={sort?.key === "totalAttendees" ? sort.dir : "asc"}
                    />
                  </button>
                </TableHead>
                {/* 桌子 */}
                <TableHead scope="col" aria-sort={getAriaSort(sort, "tables")}>
                  <button
                    type="button"
                    className="group inline-flex items-center gap-2 rounded-sm hover:text-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    onClick={() => toggleSort("tables")}
                  >
                    <span>{PROJECTS_PAGE.columnTables}</span>
                    <SortIcon
                      active={sort?.key === "tables"}
                      dir={sort?.key === "tables" ? sort.dir : "asc"}
                    />
                  </button>
                </TableHead>
                {/* 椅子 */}
                <TableHead
                  scope="col"
                  className="text-right tabular-nums"
                  aria-sort={getAriaSort(sort, "chairs")}
                >
                  <button
                    type="button"
                    className="group inline-flex w-full items-center justify-end gap-2 rounded-sm hover:text-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    onClick={() => toggleSort("chairs")}
                  >
                    <span>{PROJECTS_PAGE.columnChairs}</span>
                    <SortIcon
                      active={sort?.key === "chairs"}
                      dir={sort?.key === "chairs" ? sort.dir : "asc"}
                    />
                  </button>
                </TableHead>
                {/* 其他設備 */}
                <TableHead
                  scope="col"
                  aria-sort={getAriaSort(sort, "otherEquipment")}
                >
                  <button
                    type="button"
                    className="group inline-flex items-center gap-2 rounded-sm hover:text-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    onClick={() => toggleSort("otherEquipment")}
                  >
                    <span>{PROJECTS_PAGE.columnOtherEquipment}</span>
                    <SortIcon
                      active={sort?.key === "otherEquipment"}
                      dir={sort?.key === "otherEquipment" ? sort.dir : "asc"}
                    />
                  </button>
                </TableHead>
                {/* 場租 */}
                <TableHead
                  scope="col"
                  className="text-right tabular-nums"
                  aria-sort={getAriaSort(sort, "rentalAmountTotal")}
                >
                  <button
                    type="button"
                    className="group inline-flex w-full items-center justify-end gap-2 rounded-sm hover:text-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    onClick={() => toggleSort("rentalAmountTotal")}
                  >
                    <span>{PROJECTS_PAGE.columnRentalAmount}</span>
                    <SortIcon
                      active={sort?.key === "rentalAmountTotal"}
                      dir={
                        sort?.key === "rentalAmountTotal" ? sort.dir : "asc"
                      }
                    />
                  </button>
                </TableHead>
                {/* 餐飲（金額） */}
                <TableHead
                  scope="col"
                  className="text-right tabular-nums"
                  aria-sort={getAriaSort(sort, "fnbAmountTotal")}
                >
                  <button
                    type="button"
                    className="group inline-flex w-full items-center justify-end gap-2 rounded-sm hover:text-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    onClick={() => toggleSort("fnbAmountTotal")}
                  >
                    <span>{PROJECTS_PAGE.columnFnbAmount}</span>
                    <SortIcon
                      active={sort?.key === "fnbAmountTotal"}
                      dir={sort?.key === "fnbAmountTotal" ? sort.dir : "asc"}
                    />
                  </button>
                </TableHead>
                {/* 已付 */}
                <TableHead
                  scope="col"
                  className="text-right tabular-nums"
                  aria-sort={getAriaSort(sort, "paidAmountTotal")}
                >
                  <button
                    type="button"
                    className="group inline-flex w-full items-center justify-end gap-2 rounded-sm hover:text-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    onClick={() => toggleSort("paidAmountTotal")}
                  >
                    <span>{PROJECTS_PAGE.columnPaidAmount}</span>
                    <SortIcon
                      active={sort?.key === "paidAmountTotal"}
                      dir={sort?.key === "paidAmountTotal" ? sort.dir : "asc"}
                    />
                  </button>
                </TableHead>
                {/* 待付 */}
                <TableHead
                  scope="col"
                  className="text-right tabular-nums"
                  aria-sort={getAriaSort(sort, "pendingAmountTotal")}
                >
                  <button
                    type="button"
                    className="group inline-flex w-full items-center justify-end gap-2 rounded-sm hover:text-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    onClick={() => toggleSort("pendingAmountTotal")}
                  >
                    <span>{PROJECTS_PAGE.columnPendingAmount}</span>
                    <SortIcon
                      active={sort?.key === "pendingAmountTotal"}
                      dir={
                        sort?.key === "pendingAmountTotal" ? sort.dir : "asc"
                      }
                    />
                  </button>
                </TableHead>
                {/* 餐飲項目 */}
                <TableHead
                  scope="col"
                  aria-sort={getAriaSort(sort, "fnbItems")}
                >
                  <button
                    type="button"
                    className="group inline-flex items-center gap-2 rounded-sm hover:text-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    onClick={() => toggleSort("fnbItems")}
                  >
                    <span>{PROJECTS_PAGE.columnFnbItems}</span>
                    <SortIcon
                      active={sort?.key === "fnbItems"}
                      dir={sort?.key === "fnbItems" ? sort.dir : "asc"}
                    />
                  </button>
                </TableHead>
                {/* 備註 */}
                <TableHead
                  scope="col"
                  aria-sort={getAriaSort(sort, "projectNotes")}
                >
                  <button
                    type="button"
                    className="group inline-flex items-center gap-2 rounded-sm hover:text-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    onClick={() => toggleSort("projectNotes")}
                  >
                    <span>{PROJECTS_PAGE.columnProjectNotes}</span>
                    <SortIcon
                      active={sort?.key === "projectNotes"}
                      dir={sort?.key === "projectNotes" ? sort.dir : "asc"}
                    />
                  </button>
                </TableHead>
                {/* 操作 */}
                <TableHead scope="col" className="w-0">
                  {PROJECTS_PAGE.columnActions}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedProjects.map((project) => {
                const statusForUi = normalizeProjectStatusForUi(project.status);
                return (
                  <TableRow key={project.id}>
                    {/* 活動類型 */}
                    <TableCell className="min-w-0 max-w-[120px] truncate">
                      {project.eventType?.trim() ? project.eventType : "—"}
                    </TableCell>
                    {/* 活動名稱 */}
                    <TableCell className="min-w-0 max-w-[180px] truncate">
                      <Link
                        href={`/dashboard-new/projects/${project.id}`}
                        className="font-medium text-primary hover:underline focus:outline-none focus:underline"
                      >
                        {project.eventOrVenueUse}
                      </Link>
                    </TableCell>
                    {/* 客戶 */}
                    <TableCell className="min-w-0 max-w-[120px] truncate">
                      {project.customer}
                    </TableCell>
                    {/* 場域 */}
                    <TableCell className="min-w-0 max-w-[160px] truncate">
                      {project.space}
                    </TableCell>
                    {/* 日期 */}
                    <TableCell className="tabular-nums whitespace-nowrap">
                      {project.rentals?.[0]
                        ? formatRentalDateRangeForTable(
                            project.rentals[0],
                            (d) => DATE_FORMATTER.format(d),
                          )
                        : DATE_FORMATTER.format(new Date(project.date))}
                    </TableCell>
                    {/* 開始時間 */}
                    <TableCell className="tabular-nums whitespace-nowrap">
                      {project.rentals?.[0]?.startTime ?? "—"}
                    </TableCell>
                    {/* 結束時間 */}
                    <TableCell className="tabular-nums whitespace-nowrap">
                      {project.rentals?.[0]?.endTime ?? "—"}
                    </TableCell>
                    {/* 接洽人 */}
                    <TableCell className="min-w-0 max-w-[100px] truncate">
                      {project.contactPerson}
                    </TableCell>
                    {/* 金額 */}
                    <TableCell className="text-right tabular-nums">
                      {CURRENCY_FORMATTER.format(project.amount)}
                    </TableCell>
                    {/* 狀態 */}
                    <TableCell>
                      {statusForUi ? (
                        <span className="flex items-center gap-2">
                          <span
                            className={cn(
                              "size-2 shrink-0 rounded-full",
                              getStatusColorClass(statusForUi),
                            )}
                            aria-hidden
                          />
                          {getStatusLabel(statusForUi)}
                        </span>
                      ) : null}
                    </TableCell>
                    {/* 人數 */}
                    <TableCell className="text-right tabular-nums">
                      {project.totalAttendees != null
                        ? project.totalAttendees
                        : "—"}
                    </TableCell>
                    {/* 桌子 */}
                    <TableCell className="min-w-0 max-w-[80px] truncate">
                      {project.tables ?? "—"}
                    </TableCell>
                    {/* 椅子 */}
                    <TableCell className="text-right tabular-nums">
                      {project.chairs != null ? project.chairs : "—"}
                    </TableCell>
                    {/* 其他設備 */}
                    <TableCell className="min-w-0 max-w-[160px] truncate">
                      {formatEquipmentNeedsLine(
                        project.equipmentNeeds,
                        EQUIPMENT_NEEDS_LINE_LABELS,
                      ) ?? "—"}
                    </TableCell>
                    {/* 場租 */}
                    <TableCell className="text-right tabular-nums">
                      {CURRENCY_FORMATTER.format(project.rentalAmountTotal)}
                    </TableCell>
                    {/* 餐飲（金額） */}
                    <TableCell className="text-right tabular-nums">
                      {CURRENCY_FORMATTER.format(project.fnbAmountTotal)}
                    </TableCell>
                    {/* 已付 */}
                    <TableCell className="text-right tabular-nums">
                      {CURRENCY_FORMATTER.format(project.paidAmountTotal)}
                    </TableCell>
                    {/* 待付 */}
                    <TableCell className="text-right tabular-nums">
                      {CURRENCY_FORMATTER.format(project.pendingAmountTotal)}
                    </TableCell>
                    {/* 餐飲項目 */}
                    <TableCell className="min-w-0 max-w-[140px] truncate">
                      {project.fnbItems ?? "—"}
                    </TableCell>
                    {/* 備註 */}
                    <TableCell className="min-w-0 max-w-[180px] truncate">
                      {project.projectNotes ?? "—"}
                    </TableCell>
                    {/* 操作 */}
                    <TableCell className="w-0 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={PROJECT_DETAIL_PAGE.buttonDownloadCsv}
                          onClick={() => handleDownloadCsv(project.id)}
                          disabled={downloadingId === project.id}
                        >
                          {downloadingId === project.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Download className="size-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          asChild
                          aria-label={PROJECTS_PAGE.actionEditAria}
                        >
                          <Link href={`/dashboard-new/projects/${project.id}`}>
                            <Pencil className="size-4" />
                          </Link>
                        </Button>
                        <AlertDialog
                          onOpenChange={(open) => {
                            if (!open) setDeleteError(null);
                          }}
                        >
                          <AlertDialogTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label={PROJECTS_PAGE.actionDeleteAria}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {PROJECT_DETAIL_PAGE.deleteConfirmTitle}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {PROJECT_DETAIL_PAGE.deleteConfirmDescription}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            {deleteError ? (
                              <p
                                className="text-sm text-destructive"
                                role="alert"
                              >
                                {deleteError}
                              </p>
                            ) : null}
                            <AlertDialogFooter>
                              <AlertDialogCancel>
                                {PROJECT_DETAIL_PAGE.deleteConfirmCancel}
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteConfirm(project.id)}
                                disabled={deletingId === project.id}
                              >
                                {deletingId === project.id
                                  ? "刪除中…"
                                  : PROJECT_DETAIL_PAGE.deleteConfirmConfirm}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}
