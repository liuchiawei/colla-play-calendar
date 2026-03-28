"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SPACE_DETAIL_PAGE, PROJECTS_PAGE } from "@/lib/message";
import {
  PROJECT_STATUS_OPTIONS,
  getStatusColorClass,
} from "@/lib/config/project-status";
import type { Project, ProjectStatus } from "@/lib/types/project";
import { getProjectTimeRange } from "@/lib/utils/project";
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

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 取得專案主要空間 id（第一筆 rental 的第一個 spaceId），供 border 色與圖例對應 */
function getPrimarySpaceId(project: Project): string | null {
  const id = project.rentals?.[0]?.spaceIds?.[0];
  return id ?? null;
}

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

function badgeClassNameByStatus(status: ProjectStatus): string {
  return cn(
    "border-0",
    getStatusColorClass(status),
    status !== "cancelled" ? "text-white" : "",
  );
}

function ProjectBadgeLink({
  project,
  dateKey,
  className,
  showVenue = true,
  spaceBorderClass,
  spaceBorderColors,
}: {
  project: Project;
  /** 格子日期 key（YYYY-MM-DD），有傳則顯示該日 rental 的時段 */
  dateKey?: string;
  className?: string;
  showVenue?: boolean;
  /** 依空間套用的框線 class（整圈 Badge 邊框） */
  spaceBorderClass?: string;
  /** spaceId → 框線顏色 class，用於場域名稱小標的邊框色 */
  spaceBorderColors?: Record<string, string>;
}) {
  const timeRange = getProjectTimeRange(project, dateKey);
  const uniqueSpaceNames = React.useMemo(
    () => getUniqueSpaceNames(project),
    [project],
  );
  return (
    <Badge
      asChild
      className={cn(
        "rounded-sm",
        badgeClassNameByStatus(project.status),
        className,
      )}
    >
      <Link
        href={`/dashboard-new/projects/${project.id}`}
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
                  "rounded-sm border px-1 py-0.5",
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
  showVenue,
  spaceBorderColors,
}: {
  projects: Project[];
  dateKey: string;
  showVenue?: boolean;
  spaceBorderColors?: Record<string, string>;
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
          className="text-[10px] truncate w-full"
          showVenue={showVenue}
          spaceBorderClass={
            spaceBorderColors
              ? spaceBorderColors[getPrimarySpaceId(project) ?? ""]
              : undefined
          }
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
  spaceName: string;
  /** 是否顯示活動場地，預設 true；單一空間頁可傳 false */
  showVenue?: boolean;
  /** spaceId → border 色 class（如 border-l-blue-500），用於區分不同空間 */
  spaceBorderColors?: Record<string, string>;
  /** 圖例項目（空間 id + 名稱），與 spaceBorderColors 一併使用時顯示圖例 */
  spaceLegend?: SpaceLegendEntry[];
}

const MAX_SPACES_COLUMNS = 8;

export function SpaceProjectsCalendar({
  projects,
  spaceName,
  showVenue = true,
  spaceBorderColors,
  spaceLegend,
}: SpaceProjectsCalendarProps) {
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

  const hasRentals = projects.some((p) => p.rentals && p.rentals.length > 0);

  const projectsBySpaceAndDate = React.useMemo(() => {
    if (!hasRentals) return null;
    const spaceToDateToProjects = new Map<string, Map<string, Project[]>>();
    for (const p of projects) {
      const rentals = p.rentals;
      if (!rentals?.length) continue;
      for (const r of rentals) {
        const dateKey = r.date.slice(0, 10);
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
    return spaceToDateToProjects;
  }, [projects, hasRentals, monthDateKeySet]);

  const spacesToDisplay = React.useMemo(() => {
    const spaceIdsWithActivity = new Set(projectsBySpaceAndDate?.keys() ?? []);
    return ALL_SPACES.filter((s) => spaceIdsWithActivity.has(s.id)).slice(
      0,
      MAX_SPACES_COLUMNS,
    );
  }, [projectsBySpaceAndDate]);

  const hasAnyProjects = projects.length > 0;
  const showMonthGrid =
    hasAnyProjects && (spacesToDisplay.length > 0 || !hasRentals);

  const goToPreviousMonth = () => {
    setCurrentDate((d) => subMonths(d, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate((d) => addMonths(d, 1));
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
                        className="p-2 text-left font-medium text-xs md:text-sm text-muted-foreground min-w-[100px] shrink-0 border-r border-border/30"
                      >
                        空間
                      </th>
                      {monthDateKeys.map((dateKey) => {
                        const dayDate = new Date(dateKey + "T12:00:00");
                        return (
                          <th
                            key={dateKey}
                            scope="col"
                            className={cn(
                              "p-2 text-center font-medium text-xs md:text-sm text-muted-foreground w-12 min-w-10 border-r border-border/30 last:border-r-0",
                              isToday(dayDate) && "bg-primary/10 text-primary",
                            )}
                          >
                            {dayDate.getDate()}
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
                        <td className="p-2 font-medium text-xs md:text-sm min-w-0 border-r border-border/30 align-top">
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

      {hasAnyProjects ? (
        <div className="mt-3 flex flex-col items-center gap-3 text-xs text-muted-foreground">
          {spaceLegend != null &&
            spaceLegend.length > 0 &&
            spaceBorderColors != null && (
              <div
                className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2"
                aria-label="場域圖例"
              >
                {spaceLegend.map((entry) => {
                  const borderClass = spaceBorderColors[entry.id];
                  return (
                    <span
                      key={entry.id}
                      className="flex items-center gap-1.5"
                      title={entry.name}
                    >
                      <span
                        className={cn(
                          "size-3 shrink-0 rounded-sm border-2 border-muted",
                          borderClass ?? "border-muted-foreground/50",
                        )}
                        aria-hidden
                      />
                      <span className="truncate max-w-32">
                        {entry.name}
                      </span>
                    </span>
                  );
                })}
              </div>
            )}
          <div className="flex flex-wrap items-center justify-center gap-4">
            {PROJECT_STATUS_OPTIONS.map((opt) => (
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
              {PROJECT_STATUS_OPTIONS.map((opt) => (
                <Badge
                  key={opt.value}
                  className={cn(
                    "text-[10px] font-medium border-0",
                    getStatusColorClass(opt.value),
                    opt.value !== "cancelled" && "text-white",
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
