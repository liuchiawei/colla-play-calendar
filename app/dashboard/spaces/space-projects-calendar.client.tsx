"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SPACE_DETAIL_PAGE, PROJECTS_PAGE } from "@/lib/message";
import {
  PROJECT_STATUS_UI_LEGEND,
  getStatusColorClass,
  getUiProjectStatus,
  normalizeProjectStatusForUi,
} from "@/lib/config/project-status";
import {
  getEffectiveProjectStatus,
  getTaipeiTodayYmd,
} from "@/lib/utils/project-effective-status";
import type { Project, ProjectStatus } from "@/lib/types/project";
import { getProjectTimeRangesForDateKey, getProjectTimeRange } from "@/lib/utils/project";
import { expandRentalDateKeys } from "@/lib/utils/project-rental-interval";
import { ALL_SPACES, getSpaceNameById } from "@/lib/config/config";
import { formatMonthYear } from "@/lib/date-utils";
import {
  startOfMonth,
  getDaysInMonth,
  addMonths,
  subMonths,
  addDays,
  isSameDay,
} from "date-fns";
import { cn } from "@/lib/utils";

const WEEKDAY_MIN = ["日", "一", "二", "三", "四", "五", "六"] as const;
const WEEKDAY_FULL = [
  "星期日",
  "星期一",
  "星期二",
  "星期三",
  "星期四",
  "星期五",
  "星期六",
] as const;

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 取得專案主要空間 id（第一筆 rental 的第一個 spaceId），供 border 色與圖例對應 */
// function getPrimarySpaceId(project: Project): string | null {
//   const id = project.rentals?.[0]?.spaceIds?.[0];
//   return id ?? null;
// }

/** 從所有 rentals 取得不重複的空間名稱（依 id 去重後再依顯示名稱去重），供活動場地顯示 */
function getUniqueSpaceNames(
  project: Project,
): Array<{ id: string; name: string }> {
  const ids = [...new Set(project.rentals?.flatMap((r) => r.spaceIds) ?? [])];
  const withNames = ids.map((id) => ({ id, name: getSpaceNameById(id) }));
  const seen = new Set<string>();
  return withNames.filter(({ name }) => {
    if (seen.has(name)) return false;
    seen.add(name);
    return true;
  });
}

function badgeClassForProject(project: Project, todayYmd: string): string {
  const eff = getEffectiveProjectStatus(project, todayYmd);
  const statusForUi = normalizeProjectStatusForUi(eff);
  if (!statusForUi) return cn("border-0 bg-muted text-foreground");
  return cn("border-0", getStatusColorClass(eff), "text-white");
}

function ProjectBadgeLink({
  project,
  dateKey,
  contextSpaceId,
  todayYmd,
  className,
  showVenue = true,
  spaceBorderColors,
}: {
  project: Project;
  /** 格子日期 key（YYYY-MM-DD），有傳則顯示該日 rental 的時段 */
  dateKey?: string;
  /** 目前 row 的空間 id；有傳則 badge 內僅顯示該空間名稱 */
  contextSpaceId?: string;
  todayYmd: string;
  className?: string;
  showVenue?: boolean;
  /** spaceId → 框線顏色 class，用於場域名稱小標的邊框色 */
  spaceBorderColors?: Record<string, string>;
}) {
  const timeRange = dateKey
    ? getProjectTimeRangesForDateKey(project, dateKey, contextSpaceId)
    : getProjectTimeRange(project, dateKey);

  const uniqueSpaceNames = React.useMemo(() => {
    if (contextSpaceId) {
      return [{ id: contextSpaceId, name: getSpaceNameById(contextSpaceId) }];
    }
    return getUniqueSpaceNames(project);
  }, [contextSpaceId, project]);
  return (
    <Badge
      asChild
      className={cn(
        "rounded-sm",
        badgeClassForProject(project, todayYmd),
        className,
      )}
    >
      <Link
        href={`/dashboard/projects/${project.id}`}
        className="flex flex-col py-2"
      >
        <span className="text-wrap line-clamp-2">
          {project.eventOrVenueUse}
        </span>
        {timeRange != null && (
          <span className="font-normal opacity-90">{timeRange}</span>
        )}
        {showVenue && uniqueSpaceNames.length > 0 ? (
          <span className="font-normal opacity-90 text-[0.9em] mt-0.5 flex flex-col items-start gap-0.5">
            {uniqueSpaceNames.map(({ id, name }) => (
              <span
                key={id}
                className={cn(
                  "rounded-full border px-2 py-0.5",
                  spaceBorderColors?.[id] ?? "border-muted",
                )}
              >
                {name}
              </span>
            ))}
          </span>
        ) : null}
      </Link>
    </Badge>
  );
}

function StatusDot({ status }: { status: ProjectStatus }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full size-1.5",
        getStatusColorClass(status),
      )}
      aria-hidden
    />
  );
}

function DayCellContent({
  projects,
  dateKey,
  todayYmd,
  showVenue,
  spaceBorderColors,
  contextSpaceId,
}: {
  projects: Project[];
  dateKey: string;
  todayYmd: string;
  showVenue?: boolean;
  spaceBorderColors?: Record<string, string>;
  contextSpaceId?: string;
}) {
  if (projects.length === 0) {
    return (
      <div className="p-2 text-muted-foreground text-xs text-center min-h-12 flex items-center justify-center">
        —
      </div>
    );
  }
  return (
    <div className="p-2 flex flex-col gap-1.5 min-h-12">
      {projects.map((project) => (
        <ProjectBadgeLink
          key={project.id}
          project={project}
          dateKey={dateKey}
          contextSpaceId={contextSpaceId}
          todayYmd={todayYmd}
          className="text-[10px] truncate w-full"
          showVenue={showVenue}
          spaceBorderColors={spaceBorderColors}
        />
      ))}
    </div>
  );
}

export interface SpaceLegendEntry {
  id: string;
  name: string;
}

interface SpaceProjectsCalendarProps {
  projects: Project[];
  // spaceName: string;
  /** 是否顯示活動場地，預設 true；單一空間頁可傳 false */
  showVenue?: boolean;
  /** spaceId → border 色 class（如 border-l-blue-500），用於區分不同空間 */
  spaceBorderColors?: Record<string, string>;
  onNavigate?: (date: Date) => void;
  /** 圖例項目（空間 id + 名稱），與 spaceBorderColors 一併使用時顯示圖例 */
  // spaceLegend?: SpaceLegendEntry[];
}

const MAX_SPACES_COLUMNS = 8;

export function SpaceProjectsCalendar({
  projects,
  showVenue = true,
  spaceBorderColors,
  onNavigate,
}: SpaceProjectsCalendarProps) {
  const todayYmd = React.useMemo(() => getTaipeiTodayYmd(), []);

  const visibleProjects = React.useMemo(() => {
    return projects.filter((p) => {
      const statusForUi = getUiProjectStatus(p, todayYmd);
      return (
        statusForUi === "negotiating" ||
        statusForUi === "confirmed" ||
        statusForUi === "completed"
      );
    });
  }, [projects, todayYmd]);

  const [currentDate, setCurrentDate] = React.useState(() =>
    startOfMonth(new Date()),
  );

  const firstDayOfMonth = startOfMonth(currentDate);
  const daysInMonth = getDaysInMonth(currentDate);

  const monthDateKeys = React.useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) =>
      toDateKey(addDays(firstDayOfMonth, i)),
    );
  }, [firstDayOfMonth, daysInMonth]);

  const monthDateKeySet = React.useMemo(
    () => new Set(monthDateKeys),
    [monthDateKeys],
  );

  const hasRentals = visibleProjects.some(
    (p) => p.rentals && p.rentals.length > 0,
  );

  const projectsBySpaceAndDate = React.useMemo(() => {
    if (!hasRentals) return null;
    const spaceToDateToProjects = new Map<string, Map<string, Project[]>>();
    for (const p of visibleProjects) {
      const rentals = p.rentals;
      if (!rentals?.length) continue;
      for (const r of rentals) {
        for (const dateKey of expandRentalDateKeys({
          date: r.date,
          endDate: r.endDate,
        })) {
          if (!monthDateKeySet.has(dateKey)) continue;
          for (const spaceId of r.spaceIds) {
            let dateMap = spaceToDateToProjects.get(spaceId);
            if (!dateMap) {
              dateMap = new Map<string, Project[]>();
              spaceToDateToProjects.set(spaceId, dateMap);
            }
            let list = dateMap.get(dateKey);
            if (!list) {
              list = [];
              dateMap.set(dateKey, list);
            }
            if (!list.includes(p)) list.push(p);
          }
        }
      }
    }
    return spaceToDateToProjects;
  }, [visibleProjects, hasRentals, monthDateKeySet]);

  const spacesToDisplay = React.useMemo(() => {
    const spaceIdsWithActivity = new Set(projectsBySpaceAndDate?.keys() ?? []);
    return ALL_SPACES.filter((s) => spaceIdsWithActivity.has(s.id)).slice(
      0,
      MAX_SPACES_COLUMNS,
    );
  }, [projectsBySpaceAndDate]);

  const hasAnyProjects = visibleProjects.length > 0;
  const showMonthGrid =
    hasAnyProjects && (spacesToDisplay.length > 0 || !hasRentals);

  const goToPreviousMonth = () => {
    setCurrentDate((d) => {
      const next = subMonths(d, 1);
      onNavigate?.(next);
      return next;
    });
  };

  const goToNextMonth = () => {
    setCurrentDate((d) => {
      const next = addMonths(d, 1);
      onNavigate?.(next);
      return next;
    });
  };

  const isToday = (date: Date) => isSameDay(date, new Date());

  return (
    <section
      className="flex-1 min-w-0 rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden p-4"
      aria-label={SPACE_DETAIL_PAGE.tableCaption}
    >
      {hasAnyProjects ? (
        <>
          {/* Header: 上一月 | 月份 | 下一月 */}
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-border/50 w-full">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPreviousMonth}
              aria-label="上一月"
              className="size-8 shrink-0"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="font-medium text-sm md:text-base tabular-nums">
              {formatMonthYear(currentDate)}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={goToNextMonth}
              aria-label="下一月"
              className="size-8 shrink-0"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          {/* Body: 月曆網格 — 橫軸日期(1~31)、縱軸空間 */}
          {showMonthGrid ? (
            spacesToDisplay.length > 0 ? (
              <div className="flex-1 min-w-0 flex flex-col border-t border-border/50 overflow-x-auto mt-3">
                <table className="w-full min-w-[400px] border-collapse">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th
                        scope="col"
                        className="sticky left-0 z-30 bg-card p-2 text-left font-medium text-xs md:text-sm text-muted-foreground min-w-[100px] shrink-0 border-r border-border/30"
                      >
                        空間
                      </th>
                      {monthDateKeys.map((dateKey) => {
                        const dayDate = new Date(dateKey + "T12:00:00");
                        const weekdayIndex = dayDate.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
                        return (
                          <th
                            key={dateKey}
                            scope="col"
                            className={cn(
                              "p-2 text-center font-medium text-xs md:text-sm text-muted-foreground w-12 min-w-10 border-r border-border/30 last:border-r-0",
                              isToday(dayDate) && "bg-primary/10 text-primary",
                            )}
                            aria-label={`${dayDate.getDate()} 日（${WEEKDAY_FULL[weekdayIndex]}）`}
                          >
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="leading-none">{dayDate.getDate()}</span>
                              <span
                                className={cn(
                                  "text-[10px] leading-none opacity-80",
                                  isToday(dayDate) && "text-primary",
                                )}
                              >
                                {WEEKDAY_MIN[weekdayIndex]}
                              </span>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {spacesToDisplay.map((space) => (
                      <tr
                        key={space.id}
                        className="border-b border-border/30 last:border-b-0"
                      >
                        <td className="sticky left-0 z-20 bg-card p-2 font-medium text-xs md:text-sm min-w-0 border-r border-border/30 align-top">
                          {space.name}
                        </td>
                        {monthDateKeys.map((dateKey) => {
                          const dayDate = new Date(dateKey + "T12:00:00");
                          const dayProjects =
                            projectsBySpaceAndDate
                              ?.get(space.id)
                              ?.get(dateKey) ?? [];
                          return (
                            <td
                              key={dateKey}
                              className={cn(
                                "min-w-0 border-r border-border/30 last:border-r-0 align-top",
                                isToday(dayDate) && "bg-primary/5",
                              )}
                            >
                              <DayCellContent
                                projects={dayProjects}
                                dateKey={dateKey}
                                contextSpaceId={space.id}
                                todayYmd={todayYmd}
                                showVenue={showVenue}
                                spaceBorderColors={spaceBorderColors}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center py-12 px-4 mt-3">
                <p className="text-muted-foreground text-sm text-center">
                  {SPACE_DETAIL_PAGE.emptyProjects}
                </p>
              </div>
            )
          ) : null}
        </>
      ) : (
        <p className="text-muted-foreground text-sm py-12 text-center px-4">
          {SPACE_DETAIL_PAGE.emptyProjects}
        </p>
      )}

      {/* 圖例 */}
      {hasAnyProjects ? (
        <div className="mt-3 flex flex-col items-center gap-3 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center justify-center gap-4">
            {PROJECT_STATUS_UI_LEGEND.map((opt) => (
              <span
                key={opt.value}
                className="flex items-center gap-1.5 md:hidden"
                aria-label={PROJECTS_PAGE[opt.labelKey]}
              >
                <StatusDot status={opt.value} />
                <span>{PROJECTS_PAGE[opt.labelKey]}</span>
              </span>
            ))}
            <span className="hidden md:flex flex-wrap items-center gap-2">
              {PROJECT_STATUS_UI_LEGEND.map((opt) => (
                <Badge
                  key={opt.value}
                  className={cn(
                    "text-xs font-medium border-0",
                    getStatusColorClass(opt.value),
                    "text-white",
                  )}
                >
                  {PROJECTS_PAGE[opt.labelKey]}
                </Badge>
              ))}
            </span>
          </div>
        </div>
      ) : null}
    </section>
  );
}
