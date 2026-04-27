"use client";

import type React from "react";
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
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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
  FNB_AMOUNT_PENDING_LABEL,
} from "@/lib/message";
import {
  getStatusLabel,
  getStatusColorClass,
  normalizeProjectStatusForUi,
} from "@/lib/config/project-status";
import {
  PROJECTS_LIST_COLUMNS,
  type ProjectsListColumnConfig,
  type ProjectsListColumnId,
  type ProjectsListSortKey,
} from "@/lib/config/projects-list-table";
import type { Project } from "@/lib/types/project";
import { cn } from "@/lib/utils";
import { differenceInCalendarDays, startOfDay } from "date-fns";
import { formatRentalDateRangeForTable } from "@/lib/utils/project";
import { formatEquipmentNeedsLine } from "@/lib/utils/project-equipment-needs";
import { deleteProject, downloadProjectDetailCsv } from "./[id]/actions";

/** 專案表格每頁筆數（列表為客戶端 slice，僅影響 DOM 與互動） */
const PROJECTS_LIST_PAGE_SIZE = 25;

function formatTemplate(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const v = vars[key];
    return v == null ? "" : String(v);
  });
}

/**
 * 產生分頁按鈕序列（頁碼或省略號），總頁數大時收斂顯示。
 */
function buildPaginationItems(
  currentPage: number,
  totalPages: number,
): Array<number | "ellipsis"> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const result: Array<number | "ellipsis"> = [];
  result.push(1);

  if (currentPage <= 4) {
    result.push(2, 3, 4, 5, "ellipsis", totalPages);
  } else if (currentPage >= totalPages - 3) {
    result.push(
      "ellipsis",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    );
  } else {
    result.push(
      "ellipsis",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "ellipsis",
      totalPages,
    );
  }

  return result;
}

const DATE_FORMATTER = new Intl.DateTimeFormat("zh-TW", {
  dateStyle: "short",
});

// const CURRENCY_FORMATTER = new Intl.NumberFormat("zh-TW", {
//   style: "currency",
//   currency: "TWD",
// });

/** 列表「金額」欄：僅顯示整數（無小數） */
const CURRENCY_FORMATTER_INTEGER = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
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

type SortState = { key: ProjectsListSortKey; dir: SortDirection } | null;

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

/** 預設排序：解析 ISO / date-only 為 Date（與篩選／列表日期欄一致） */
function parseDateToDateOnly(value: string | undefined | null): Date | null {
  if (!value) return null;
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const d = dateOnly ? new Date(`${value}T12:00:00`) : new Date(value);
  const ms = d.getTime();
  return Number.isFinite(ms) ? d : null;
}

/** 租借起訖整理為時間序區間（與 projects-content rentalToDateRange 對齊） */
function rentalToOrderedDateRange(
  rental: NonNullable<Project["rentals"]>[number],
): { from: Date; to: Date } | null {
  const from = parseDateToDateOnly(rental.date);
  const to = parseDateToDateOnly(rental.endDate ?? rental.date);
  if (!from || !to) return null;
  if (from <= to) return { from, to };
  return { from: to, to: from };
}

/** 今日（日曆起點）到區間〔含〕最近距離（天數）；今天在區間內為 0 */
function minCalendarDistanceToInclusiveRange(
  todayStart: Date,
  rangeStart: Date,
  rangeEnd: Date,
): number {
  const t = startOfDay(todayStart).getTime();
  const sd = startOfDay(rangeStart).getTime();
  const ed = startOfDay(rangeEnd).getTime();
  if (t >= sd && t <= ed) return 0;
  if (t < sd) return differenceInCalendarDays(startOfDay(rangeStart), startOfDay(todayStart));
  return differenceInCalendarDays(startOfDay(todayStart), startOfDay(rangeEnd));
}

/** 預設排序：與今天日曆距離最小的活動日（多段租借取最小距離；無有效租借則 fallback project.date） */
function getNearestActivityCalendarDistance(
  project: Project,
  todayStart: Date,
): number {
  let minDist = Infinity;
  const rentals = project.rentals;
  if (rentals?.length) {
    for (const r of rentals) {
      const range = rentalToOrderedDateRange(r);
      if (!range) continue;
      const d = minCalendarDistanceToInclusiveRange(
        todayStart,
        range.from,
        range.to,
      );
      if (d < minDist) minDist = d;
    }
  }
  if (minDist !== Infinity) return minDist;
  const single = parseDateToDateOnly(project.date);
  if (!single) return Infinity;
  return minCalendarDistanceToInclusiveRange(todayStart, single, single);
}

/** 預設排序：已完成專案置於非完成之後（僅依 DB status） */
function isCompletedBucket(project: Project): boolean {
  return project.status === "completed";
}

function parseIntIfNumeric(value: string | null | undefined): number | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const n = Number.parseInt(trimmed, 10);
  return Number.isFinite(n) ? n : null;
}

function statusLabelForSort(project: Project): string {
  const statusForUi = normalizeProjectStatusForUi(project.status);
  return statusForUi ? getStatusLabel(statusForUi) : "";
}

/** 與 ProjectsListSortKey 對齊；增刪欄位時須同步更新 */
const PROJECT_LIST_SORT_VALUE_GETTERS: {
  [K in ProjectsListSortKey]: (project: Project) => string | number | null;
} = {
  eventType: (p) => p.eventType ?? "",
  customer: (p) => p.customer ?? "",
  eventOrVenueUse: (p) => p.eventOrVenueUse ?? "",
  space: (p) => p.space ?? "",
  date: (p) => {
    const rentalDate = p.rentals?.[0]?.date;
    return parseDateToEpochMs(rentalDate) ?? parseDateToEpochMs(p.date);
  },
  eventStartTime: (p) => parseTimeToMinutes(p.rentals?.[0]?.startTime),
  eventEndTime: (p) => parseTimeToMinutes(p.rentals?.[0]?.endTime),
  contactPerson: (p) => p.contactPerson ?? "",
  amount: (p) => p.amount ?? null,
  status: (p) => statusLabelForSort(p),
  tables: (p) => {
    const n = parseIntIfNumeric(p.tables);
    return n ?? p.tables ?? "";
  },
  chairs: (p) => {
    const s = p.chairs;
    if (s == null || s === "") return null;
    const n = parseIntIfNumeric(s);
    return n ?? s;
  },
  fnbItems: (p) => p.fnbItems ?? "",
  otherEquipment: (p) =>
    formatEquipmentNeedsLine(p.equipmentNeeds, EQUIPMENT_NEEDS_LINE_LABELS) ??
    "",
  rentalAmountTotal: (p) => p.rentalAmountTotal,
  fnbAmountTotal: (p) =>
    p.hasFnbAmountPending ? null : p.fnbAmountTotal,
  paidAmountTotal: (p) => p.paidAmountTotal,
  pendingAmountTotal: (p) => p.pendingAmountTotal,
  totalAttendees: (p) => {
    const s = p.totalAttendees;
    if (s == null || s === "") return null;
    const n = parseIntIfNumeric(s);
    return n ?? s;
  },
  internalNotes: (p) => p.internalNotes ?? "",
};

function getAriaSort(
  sort: SortState,
  key: ProjectsListSortKey,
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

const HEADER_BTN_BASE =
  "group inline-flex items-center gap-2 rounded-sm hover:text-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";
const HEADER_BTN_END =
  "group inline-flex w-full items-center justify-end gap-2 rounded-sm hover:text-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";

type ColumnWithSticky = ProjectsListColumnConfig & {
  stickyHeaderClassName?: string;
  stickyCellClassName?: string;
};

function projectsListStickyHeaderClass(column: ProjectsListColumnConfig) {
  return (column as ColumnWithSticky).stickyHeaderClassName;
}

function projectsListStickyCellClass(column: ProjectsListColumnConfig) {
  return (column as ColumnWithSticky).stickyCellClassName;
}

function ProjectsListTableHeadCell({
  column,
  sort,
  onToggleSort,
}: {
  column: ProjectsListColumnConfig;
  sort: SortState;
  onToggleSort: (key: ProjectsListSortKey) => void;
}) {
  if (!column.sortable) {
    return (
      <TableHead
        scope="col"
        className={cn(
          "headerClassName" in column ? column.headerClassName : undefined,
          projectsListStickyHeaderClass(column),
        )}
      >
        {column.label}
      </TableHead>
    );
  }

  const sortKey = column.id;
  const headerClassName =
    "headerClassName" in column ? column.headerClassName : undefined;
  const stickyHeaderClassName = projectsListStickyHeaderClass(column);
  const headerButtonJustifyEnd =
    "headerButtonJustifyEnd" in column && column.headerButtonJustifyEnd;

  return (
    <TableHead
      scope="col"
      className={cn(headerClassName, stickyHeaderClassName)}
      aria-sort={getAriaSort(sort, sortKey)}
    >
      <button
        type="button"
        className={headerButtonJustifyEnd ? HEADER_BTN_END : HEADER_BTN_BASE}
        onClick={() => onToggleSort(sortKey)}
      >
        <span>{column.label}</span>
        <SortIcon
          active={sort?.key === sortKey}
          dir={sort?.key === sortKey ? sort.dir : "asc"}
        />
      </button>
    </TableHead>
  );
}

type ActionsCellContext = {
  downloadingId: string | null;
  deletingId: string | null;
  deleteError: string | null;
  onDownloadCsv: (projectId: string) => void;
  onDeleteConfirm: (projectId: string) => void;
  onAlertOpenChange: (open: boolean) => void;
};

function renderProjectsListCell(
  columnId: ProjectsListColumnId,
  project: Project,
  statusForUi: ReturnType<typeof normalizeProjectStatusForUi>,
  actionsCtx: ActionsCellContext,
): React.ReactNode {
  switch (columnId) {
    case "eventType":
      return project.eventType?.trim() ? project.eventType : "—";
    case "eventOrVenueUse":
      return (
        <Link
          href={`/dashboard-new/projects/${project.id}`}
          className="font-medium text-primary hover:underline focus:outline-none focus:underline"
        >
          {project.eventOrVenueUse}
        </Link>
      );
    case "customer":
      return project.customer;
    case "space":
      return project.space;
    case "date":
      return project.rentals?.[0]
        ? formatRentalDateRangeForTable(project.rentals[0], (d) =>
            DATE_FORMATTER.format(d),
          )
        : DATE_FORMATTER.format(new Date(project.date));
    case "eventStartTime":
      return project.rentals?.[0]?.startTime ?? "—";
    case "eventEndTime":
      return project.rentals?.[0]?.endTime ?? "—";
    case "contactPerson":
      return project.contactPerson;
    case "amount":
      return CURRENCY_FORMATTER_INTEGER.format(project.amount);
    case "status":
      return statusForUi ? (
        <span
          className={cn(
            "flex items-center gap-2",
            statusForUi === "completed" && "text-muted-foreground",
          )}
        >
          <span
            className={cn(
              "size-2 shrink-0 rounded-full",
              statusForUi === "completed"
                ? "bg-muted-foreground"
                : getStatusColorClass(statusForUi),
            )}
            aria-hidden
          />
          {getStatusLabel(statusForUi)}
        </span>
      ) : null;
    case "totalAttendees":
      return project.totalAttendees != null ? project.totalAttendees : "—";
    case "tables":
      return project.tables ?? "—";
    case "chairs":
      return project.chairs != null ? project.chairs : "—";
    case "otherEquipment":
      return (
        formatEquipmentNeedsLine(
          project.equipmentNeeds,
          EQUIPMENT_NEEDS_LINE_LABELS,
        ) ?? "—"
      );
    case "rentalAmountTotal":
      return CURRENCY_FORMATTER_INTEGER.format(project.rentalAmountTotal);
    case "fnbAmountTotal":
      return project.hasFnbAmountPending
        ? FNB_AMOUNT_PENDING_LABEL
        : CURRENCY_FORMATTER_INTEGER.format(project.fnbAmountTotal);
    case "paidAmountTotal":
      return CURRENCY_FORMATTER_INTEGER.format(project.paidAmountTotal);
    case "pendingAmountTotal":
      return CURRENCY_FORMATTER_INTEGER.format(project.pendingAmountTotal);
    case "fnbItems":
      return project.fnbItems ?? "—";
    case "internalNotes":
      return project.internalNotes ?? "—";
    case "actions":
      return (
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={PROJECT_DETAIL_PAGE.buttonDownloadCsv}
            onClick={() => actionsCtx.onDownloadCsv(project.id)}
            disabled={actionsCtx.downloadingId === project.id}
          >
            {actionsCtx.downloadingId === project.id ? (
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
              actionsCtx.onAlertOpenChange(open);
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
              {actionsCtx.deleteError ? (
                <p className="text-sm text-destructive" role="alert">
                  {actionsCtx.deleteError}
                </p>
              ) : null}
              <AlertDialogFooter>
                <AlertDialogCancel>
                  {PROJECT_DETAIL_PAGE.deleteConfirmCancel}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => actionsCtx.onDeleteConfirm(project.id)}
                  disabled={actionsCtx.deletingId === project.id}
                >
                  {actionsCtx.deletingId === project.id
                    ? "刪除中…"
                    : PROJECT_DETAIL_PAGE.deleteConfirmConfirm}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      );
    default: {
      const _exhaustive: never = columnId;
      return _exhaustive;
    }
  }
}

export function ProjectsList({ projects }: ProjectsListProps) {
  const [, startTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [sort, setSort] = useState<SortState>(null);
  const [page, setPage] = useState(1);

  const sortedProjects = useMemo(() => {
    const localeCompareZhTw = (a: string, b: string) =>
      a.localeCompare(b, "zh-TW", { sensitivity: "base" });

    if (!sort) {
      const todayStart = startOfDay(new Date());
      const withMeta = projects.map((project, originalIndex) => ({
        project,
        originalIndex,
        completedRank: isCompletedBucket(project) ? 1 : 0,
        distance: getNearestActivityCalendarDistance(project, todayStart),
      }));

      withMeta.sort((a, b) => {
        if (a.completedRank !== b.completedRank) {
          return a.completedRank - b.completedRank;
        }
        if (a.distance !== b.distance) {
          return a.distance - b.distance;
        }
        return a.originalIndex - b.originalIndex;
      });

      return withMeta.map((x) => x.project);
    }

    const getter = PROJECT_LIST_SORT_VALUE_GETTERS[sort.key];

    const withIndex = projects.map((project, originalIndex) => ({
      project,
      originalIndex,
      value: getter(project),
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

  const totalPages = Math.max(
    1,
    Math.ceil(sortedProjects.length / PROJECTS_LIST_PAGE_SIZE),
  );

  const activePage = Math.min(Math.max(1, page), totalPages);

  const paginatedProjects = useMemo(() => {
    const start = (activePage - 1) * PROJECTS_LIST_PAGE_SIZE;
    return sortedProjects.slice(start, start + PROJECTS_LIST_PAGE_SIZE);
  }, [sortedProjects, activePage]);

  const rangeStart =
    sortedProjects.length === 0 ? 0 : (activePage - 1) * PROJECTS_LIST_PAGE_SIZE + 1;
  const rangeEnd = Math.min(
    activePage * PROJECTS_LIST_PAGE_SIZE,
    sortedProjects.length,
  );

  const paginationItems =
    sortedProjects.length > 0 ? buildPaginationItems(activePage, totalPages) : [];

  const paginationSummaryText = formatTemplate(
    PROJECTS_PAGE.listPaginationSummary,
    {
      start: rangeStart,
      end: rangeEnd,
      total: sortedProjects.length,
    },
  );

  const paginationSrOnlyText = formatTemplate(
    PROJECTS_PAGE.listPaginationSrOnly,
    {
      page: activePage,
      pages: totalPages,
    },
  );

  function toggleSort(nextKey: ProjectsListSortKey) {
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

  const actionsCellCtx = useMemo<ActionsCellContext>(
    () => ({
      downloadingId,
      deletingId,
      deleteError,
      onDownloadCsv: handleDownloadCsv,
      onDeleteConfirm: handleDeleteConfirm,
      onAlertOpenChange: (open) => {
        if (!open) setDeleteError(null);
      },
    }),
    [
      downloadingId,
      deletingId,
      deleteError,
      handleDownloadCsv,
    ],
  );

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
        <div className="min-w-0 flex flex-col">
          <div className="overflow-x-auto">
            <Table>
              <TableCaption className="sr-only">
                {PROJECTS_PAGE.tableCaption}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  {PROJECTS_LIST_COLUMNS.map((column) => (
                    <ProjectsListTableHeadCell
                      key={column.id}
                      column={column}
                      sort={sort}
                      onToggleSort={toggleSort}
                    />
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody className="[&_tr:last-child_td:first-child]:rounded-bl-xl">
                {paginatedProjects.map((project) => {
                  const statusForUi = normalizeProjectStatusForUi(project.status);
                  return (
                    <TableRow key={project.id} className="group">
                      {PROJECTS_LIST_COLUMNS.map((column) => (
                        <TableCell
                          key={column.id}
                          className={cn(
                            column.cellClassName,
                            projectsListStickyCellClass(column),
                          )}
                        >
                          {renderProjectsListCell(
                            column.id,
                            project,
                            statusForUi,
                            actionsCellCtx,
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 border-t border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground tabular-nums md:w-full">
              {paginationSummaryText}
              <span className="sr-only">
                {paginationSrOnlyText}
              </span>
            </p>

            {totalPages > 1 ? (
              <Pagination className="mx-0 w-full justify-end">
                <PaginationContent className="w-full flex-wrap justify-end gap-1">
                  <PaginationItem>
                    <PaginationPrevious
                      type="button"
                      disabled={activePage <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    />
                  </PaginationItem>

                  {paginationItems.map((item, idx) =>
                    item === "ellipsis" ? (
                      <PaginationItem key={`e-${idx}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={item}>
                        <PaginationLink
                          type="button"
                          isActive={item === activePage}
                          onClick={() => setPage(item)}
                          aria-label={`第 ${item} 頁`}
                        >
                          {item}
                        </PaginationLink>
                      </PaginationItem>
                    ),
                  )}

                  <PaginationItem>
                    <PaginationNext
                      type="button"
                      disabled={activePage >= totalPages}
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}
