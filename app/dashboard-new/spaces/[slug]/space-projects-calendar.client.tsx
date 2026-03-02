"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getDefaultClassNames, type DayButton } from "react-day-picker";
import { SPACE_DETAIL_PAGE, PROJECTS_PAGE } from "@/lib/message";
import {
  PROJECT_STATUS_OPTIONS,
  getStatusColorClass,
} from "@/lib/config/project-status";
import type { Project, ProjectStatus } from "@/lib/types/project";
import { getProjectTimeRange } from "@/lib/utils/project";
import { getSpaceNameById } from "@/lib/config/config";
import { cn } from "@/lib/utils";

const DATE_FORMATTER = new Intl.DateTimeFormat("zh-TW", {
  dateStyle: "short",
});

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function projectDateKey(project: Project): string {
  return project.date.slice(0, 10);
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
                  "rounded-sm border-1 px-1 py-0.5",
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

function DayNumber({ date }: { date: Date }) {
  return <>{date.getDate()}</>;
}

const DAY_CELL_MAX_VISIBLE = 2;

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

function DayCellProjectBadges({
  projects,
  date,
  maxVisible = DAY_CELL_MAX_VISIBLE,
  className,
  showVenue = true,
  spaceBorderColors,
}: {
  projects: Project[];
  /** 格子日期，用於顯示該日的 rental 時段 */
  date?: Date;
  maxVisible?: number;
  className?: string;
  showVenue?: boolean;
  spaceBorderColors?: Record<string, string>;
}) {
  const visible = projects.slice(0, maxVisible);
  const restCount = projects.length - visible.length;
  const dateKey = date ? toDateKey(date) : undefined;
  return (
    <span
      className={cn(
        "flex min-w-0 w-full flex items-center justify-center gap-0.5 overflow-hidden",
        className,
      )}
      aria-label={projects.length > 0 ? `${projects.length} 個專案` : undefined}
    >
      {/* 手機：圓點（依 status） */}
      <span className="min-w-0 flex items-center gap-0.5 justify-center md:hidden">
        {visible.map((project) => (
          <StatusDot key={project.id} status={project.status} />
        ))}
        {restCount > 0 ? (
          <span className="text-[10px] font-medium text-muted-foreground shrink-0">
            +{restCount}
          </span>
        ) : null}
      </span>
      {/* 平板以上：專案名稱 Badge */}
      <span className="hidden min-w-0 flex-1 flex-wrap items-center justify-center gap-0.5 overflow-hidden md:flex">
        {visible.map((project) => (
          <ProjectBadgeLink
            key={project.id}
            project={project}
            dateKey={dateKey}
            className="min-w-0 truncate text-[10px]"
            showVenue={showVenue}
            spaceBorderClass={
              spaceBorderColors
                ? spaceBorderColors[getPrimarySpaceId(project) ?? ""]
                : undefined
            }
            spaceBorderColors={spaceBorderColors}
          />
        ))}
        {restCount > 0 ? (
          <span className="text-[10px] font-medium text-muted-foreground shrink-0">
            +{restCount}
          </span>
        ) : null}
      </span>
    </span>
  );
}

function DayCellContent({
  date,
  projects,
  showVenue,
  spaceBorderColors,
}: {
  date: Date;
  projects: Project[];
  showVenue?: boolean;
  spaceBorderColors?: Record<string, string>;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5">
      <DayNumber date={date} />
      {projects.length > 0 ? (
        <DayCellProjectBadges
          projects={projects}
          date={date}
          showVenue={showVenue}
          spaceBorderColors={spaceBorderColors}
        />
      ) : null}
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

export function SpaceProjectsCalendar({
  projects,
  spaceName,
  showVenue = true,
  spaceBorderColors,
  spaceLegend,
}: SpaceProjectsCalendarProps) {
  const [month, setMonth] = React.useState(() => new Date());

  const projectsByDate = React.useMemo(() => {
    const m = new Map<string, Project[]>();
    for (const p of projects) {
      const key = projectDateKey(p);
      const list = m.get(key);
      if (list) list.push(p);
      else m.set(key, [p]);
    }
    return m;
  }, [projects]);

  const defaultClassNames = getDefaultClassNames();

  const CustomDayButton = React.useCallback(
    (props: React.ComponentProps<typeof DayButton>) => {
      const { day, className, modifiers, ...rest } = props;
      const dayKey = toDateKey(day.date);
      const dayProjects = projectsByDate.get(dayKey) ?? [];

      if (dayProjects.length === 0) {
        return (
          <Button
            variant="ghost"
            size="icon"
            data-day={day.date.toISOString().slice(0, 10)}
            className={cn(
              "flex flex-col items-center justify-center aspect-square size-auto w-full min-w-(--cell-size) gap-0.5 leading-none font-normal hover:bg-muted hover:text-foreground",
              defaultClassNames.day,
              className,
            )}
            aria-label={day.date.toLocaleDateString("zh-TW")}
            {...rest}
          >
            <DayCellContent
              date={day.date}
              projects={[]}
              showVenue={showVenue}
              spaceBorderColors={spaceBorderColors}
            />
          </Button>
        );
      }

      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              data-day={day.date.toISOString().slice(0, 10)}
              className={cn(
                "flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-0.5 leading-none font-normal hover:bg-muted hover:text-foreground",
                defaultClassNames.day,
                className,
              )}
              aria-label={`${day.date.toLocaleDateString("zh-TW")}，${dayProjects.length} 個專案`}
              {...rest}
            >
              <DayCellContent
                date={day.date}
                projects={dayProjects}
                showVenue={showVenue}
                spaceBorderColors={spaceBorderColors}
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 p-2">
            <p className="mb-2 text-xs text-muted-foreground">
              {DATE_FORMATTER.format(day.date)}
            </p>
            <ul className="flex flex-wrap gap-1.5">
              {dayProjects.map((project) => (
                <li key={project.id}>
                  <ProjectBadgeLink
                    project={project}
                    dateKey={toDateKey(day.date)}
                    showVenue={showVenue}
                    spaceBorderClass={
                      spaceBorderColors
                        ? spaceBorderColors[getPrimarySpaceId(project) ?? ""]
                        : undefined
                    }
                    spaceBorderColors={spaceBorderColors}
                  />
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>
      );
    },
    [projectsByDate, showVenue, spaceBorderColors],
  );

  const hasAnyProjects = projects.length > 0;

  return (
    <section
      className="flex-1 min-w-0 rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden p-4"
      aria-label={SPACE_DETAIL_PAGE.tableCaption}
    >
      {hasAnyProjects ? (
        <Calendar
          mode="single"
          selected={undefined}
          onSelect={() => {}}
          month={month}
          onMonthChange={setMonth}
          showOutsideDays
          components={{ DayButton: CustomDayButton }}
          className="mx-auto w-full"
        />
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
                      <span className="truncate max-w-[8rem]">
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
