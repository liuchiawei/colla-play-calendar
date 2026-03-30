"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ALL_SPACES, getSpaceNameById } from "@/lib/config/config";
import {
  getWeekDays,
  getNextWeek,
  getPreviousWeek,
  formatDayHeader,
} from "@/lib/date-utils";
import { startOfDay, isSameDay } from "date-fns";
import { PROJECTS_PAGE } from "@/lib/message";
import {
  PROJECT_STATUS_UI_SELECTABLE,
  getStatusColorClass,
} from "@/lib/config/project-status";
import type { Project, ProjectStatus } from "@/lib/types/project";
import { getProjectTimeRange } from "@/lib/utils/project";
import { expandRentalDateKeys } from "@/lib/utils/project-rental-interval";
import { cn } from "@/lib/utils";

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function projectDateKey(project: Project): string {
  return project.date.slice(0, 10);
}

function badgeClassNameByStatus(status: ProjectStatus): string {
  return cn(
    "rounded-sm border-0",
    getStatusColorClass(status),
    status !== "cancelled" ? "text-white" : "",
  );
}

function ProjectBadgeLink({
  project,
  dateKey,
  className,
}: {
  project: Project;
  /** 週曆格子的日期 key，有傳則顯示該日 rental 的時段 */
  dateKey?: string;
  className?: string;
}) {
  const timeRange = getProjectTimeRange(project, dateKey);
  return (
    <Badge
      asChild
      className={cn(badgeClassNameByStatus(project.status), className)}
    >
      <Link
        href={`/dashboard-new/projects/${project.id}`}
        className="flex flex-col"
      >
        <span className="text-wrap">{project.eventOrVenueUse}</span>
        {timeRange != null && (
          <span className="font-normal opacity-90">{timeRange}</span>
        )}
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

function DayColumnHeader({ day, isToday }: { day: Date; isToday: boolean }) {
  return (
    <div
      className={cn(
        "p-2 text-center border-b border-border/50 font-medium text-xs md:text-sm",
        isToday && "bg-primary/10 text-primary",
      )}
    >
      {formatDayHeader(day)}
    </div>
  );
}

function DayColumnContent({
  projects,
  dateKey,
}: {
  projects: Project[];
  dateKey?: string;
}) {
  if (projects.length === 0) {
    return (
      <div className="p-2 text-muted-foreground text-xs text-center min-h-16 flex items-center justify-center">
        —
      </div>
    );
  }
  return (
    <div className="p-2 flex flex-col gap-1.5 min-h-16">
      {projects.map((project) => (
        <ProjectBadgeLink
          key={project.id}
          project={project}
          dateKey={dateKey}
          className="text-[10px] truncate w-full"
        />
      ))}
    </div>
  );
}

interface ProjectsWeekCalendarProps {
  projects: Project[];
}

export function ProjectsWeekCalendar({ projects }: ProjectsWeekCalendarProps) {
  const [currentDate, setCurrentDate] = React.useState(() => new Date());
  const [calendarOpen, setCalendarOpen] = React.useState(false);

  const displayDays = React.useMemo(
    () => getWeekDays(currentDate),
    [currentDate],
  );

  const displayWeekDateKeys = React.useMemo(
    () => displayDays.map((d) => toDateKey(d)),
    [displayDays],
  );

  const weekDateKeySet = React.useMemo(
    () => new Set(displayWeekDateKeys),
    [displayWeekDateKeys],
  );

  const hasRentals = projects.some((p) => p.rentals && p.rentals.length > 0);

  const projectsByDate = React.useMemo(() => {
    const m = new Map<string, Project[]>();
    for (const p of projects) {
      const rentals = p.rentals;
      if (rentals?.length) {
        const seenDays = new Set<string>();
        for (const r of rentals) {
          for (const dk of expandRentalDateKeys({
            date: r.date,
            endDate: r.endDate,
          })) {
            if (!weekDateKeySet.has(dk)) continue;
            if (seenDays.has(dk)) continue;
            seenDays.add(dk);
            const list = m.get(dk);
            if (list) list.push(p);
            else m.set(dk, [p]);
          }
        }
      } else {
        const key = projectDateKey(p);
        if (!weekDateKeySet.has(key)) continue;
        const list = m.get(key);
        if (list) list.push(p);
        else m.set(key, [p]);
      }
    }
    return m;
  }, [projects, weekDateKeySet]);

  const projectsBySpaceAndDate = React.useMemo(() => {
    if (!hasRentals) return null;
    const spaceToDateToProjects = new Map<string, Map<string, Project[]>>();
    for (const p of projects) {
      const rentals = p.rentals;
      if (!rentals?.length) continue;
      for (const r of rentals) {
        for (const dateKey of expandRentalDateKeys({
          date: r.date,
          endDate: r.endDate,
        })) {
          if (!weekDateKeySet.has(dateKey)) continue;
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
  }, [projects, hasRentals, weekDateKeySet]);

  const spaceIdsWithProjectsInWeek = React.useMemo(
    () => new Set(projectsBySpaceAndDate?.keys() ?? []),
    [projectsBySpaceAndDate],
  );
  const spacesToDisplay = React.useMemo(
    () => ALL_SPACES.filter((s) => spaceIdsWithProjectsInWeek.has(s.id)),
    [spaceIdsWithProjectsInWeek],
  );

  /** 有 rental 資料時使用空間網格；縱軸僅顯示該週有專案的空間 */
  const useSpaceGrid = hasRentals;

  const weekHasProjects = projects.length > 0;

  const goToPreviousWeek = () => {
    setCurrentDate((d) => getPreviousWeek(d));
  };

  const goToNextWeek = () => {
    setCurrentDate((d) => getNextWeek(d));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const baseDay = startOfDay(currentDate);
  const isToday = (date: Date) => isSameDay(date, new Date());

  return (
    <section
      className="flex-1 flex flex-col min-w-0 w-full rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden"
      aria-label={PROJECTS_PAGE.tableCaption}
    >
      {/* 週導覽 */}
      <div className="flex items-center justify-between gap-2 p-3 border-b border-border/50 w-full">
        <Button
          variant="outline"
          size="icon"
          onClick={goToPreviousWeek}
          aria-label="上一週"
          className="size-8 shrink-0"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 shrink-0"
              aria-label="選擇日期"
            >
              <CalendarDays className="size-4" />
              {formatDayHeader(baseDay)} —{" "}
              {formatDayHeader(displayDays[displayDays.length - 1] ?? baseDay)}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center">
            <Calendar
              mode="single"
              selected={currentDate}
              onSelect={(date) => {
                if (date) {
                  setCurrentDate(date);
                  setCalendarOpen(false);
                }
              }}
            />
          </PopoverContent>
        </Popover>
        <Button
          variant="outline"
          size="icon"
          onClick={goToNextWeek}
          aria-label="下一週"
          className="size-8 shrink-0"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {/* 週曆網格：縱軸＝空間、橫軸＝weekday */}
      {weekHasProjects ? (
        useSpaceGrid ? (
          <div className="flex-1 min-w-0 flex flex-col border-t border-border/50">
            {spacesToDisplay.length === 0 ? (
              <div className="flex-1 flex items-center justify-center py-12 px-4">
                <p className="text-muted-foreground text-sm text-center">
                  {PROJECTS_PAGE.emptySpaceBookingsThisWeek}
                </p>
              </div>
            ) : (
              <>
                {/* 表頭列：空間標題 + 7 日 */}
                <div className="grid grid-cols-[minmax(0,1fr)_repeat(7,minmax(0,1fr))] border-b border-border/50 min-w-0">
                  <div className="p-2 border-r border-border/30 font-medium text-sm text-muted-foreground flex items-center">
                    {PROJECTS_PAGE.columnSpace}
                  </div>
                  {displayDays.map((day) => (
                    <DayColumnHeader
                      key={toDateKey(day)}
                      day={day}
                      isToday={isToday(day)}
                    />
                  ))}
                </div>
                {/* 各空間列（僅顯示該週有專案的空間） */}
                {spacesToDisplay.map((space) => {
                  const spaceId = space.id;
                  const dateMap = projectsBySpaceAndDate?.get(spaceId);
                  return (
                    <div
                      key={spaceId}
                      className="grid grid-cols-[minmax(0,1fr)_repeat(7,minmax(0,1fr))] min-w-0 border-b border-border/30 last:border-b-0"
                    >
                      <p className="p-2 border-r border-border/30 font-medium text-xs md:text-sm shrink-0 min-w-0">
                        {getSpaceNameById(spaceId)}
                      </p>
                      {displayWeekDateKeys.map((dateKey) => {
                        const dayProjects = dateMap?.get(dateKey) ?? [];
                        return (
                          <div
                            key={dateKey}
                            className={cn(
                              "min-w-0 border-r border-border/30 last:border-r-0",
                              (() => {
                                const d = displayDays.find(
                                  (x) => toDateKey(x) === dateKey,
                                );
                                return d && isToday(d) ? "bg-primary/5" : "";
                              })(),
                            )}
                          >
                            <DayColumnContent
                              projects={dayProjects}
                              dateKey={dateKey}
                            />
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        ) : (
          <div className="flex-1 min-w-0 grid grid-cols-7 border-t border-border/50">
            {displayDays.map((day) => {
              const dayKey = toDateKey(day);
              const dayProjects = projectsByDate.get(dayKey) ?? [];
              return (
                <div
                  key={dayKey}
                  className={cn(
                    "min-w-0 border-r border-border/30 last:border-r-0 flex flex-col",
                    isToday(day) && "bg-primary/5",
                  )}
                >
                  <DayColumnHeader day={day} isToday={isToday(day)} />
                  <DayColumnContent projects={dayProjects} dateKey={dayKey} />
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="flex-1 flex items-center justify-center py-12 px-4">
          <p className="text-muted-foreground text-sm text-center">
            {PROJECTS_PAGE.emptyProjects}
          </p>
        </div>
      )}

      {/* 圖例 */}
      {projects.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground border-t border-border/50 pt-3 pb-2">
          {PROJECT_STATUS_UI_SELECTABLE.map((opt) => (
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
            {PROJECT_STATUS_UI_SELECTABLE.map((opt) => (
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
      ) : null}
    </section>
  );
}
