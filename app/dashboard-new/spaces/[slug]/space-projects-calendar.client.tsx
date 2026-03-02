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
import type { Project, ProjectStatus } from "@/lib/types/project";
import { getProjectTimeRange } from "@/lib/utils/project";
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

function badgeVariantByStatus(status: ProjectStatus): "outline" | "default" {
  return status === "deposit_paid" ? "default" : "outline";
}

function ProjectBadgeLink({
  project,
  dateKey,
  className,
}: {
  project: Project;
  /** 格子日期 key（YYYY-MM-DD），有傳則顯示該日 rental 的時段 */
  dateKey?: string;
  className?: string;
}) {
  const variant = badgeVariantByStatus(project.status);
  const timeRange = getProjectTimeRange(project, dateKey);
  return (
    <Badge asChild variant={variant} className={className}>
      <Link href={`/dashboard-new/projects/${project.id}`} className="truncate">
        {project.eventOrVenueUse}
        {timeRange != null && (
          <>
            <br />
            <span className="font-normal opacity-90">{timeRange}</span>
          </>
        )}
      </Link>
    </Badge>
  );
}

function DayNumber({ date }: { date: Date }) {
  return <>{date.getDate()}</>;
}

const DAY_CELL_MAX_VISIBLE = 2;

function StatusDot({ status }: { status: ProjectStatus }) {
  const isDepositPaid = status === "deposit_paid";
  return (
    <span
      className={cn(
        "shrink-0 rounded-full",
        isDepositPaid
          ? "size-1.5 bg-primary"
          : "size-1.5 border-2 border-current bg-transparent",
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
}: {
  projects: Project[];
  /** 格子日期，用於顯示該日的 rental 時段 */
  date?: Date;
  maxVisible?: number;
  className?: string;
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
}: {
  date: Date;
  projects: Project[];
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5">
      <DayNumber date={date} />
      {projects.length > 0 ? (
        <DayCellProjectBadges projects={projects} date={date} />
      ) : null}
    </div>
  );
}

interface SpaceProjectsCalendarProps {
  projects: Project[];
  spaceName: string;
}

export function SpaceProjectsCalendar({
  projects,
  spaceName,
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
              "flex flex-col items-center justify-center aspect-square size-auto w-full min-w-(--cell-size) gap-0.5 leading-none font-normal",
              defaultClassNames.day,
              className,
            )}
            aria-label={day.date.toLocaleDateString("zh-TW")}
            {...rest}
          >
            <DayCellContent date={day.date} projects={[]} />
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
                "flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-0.5 leading-none font-normal hover:bg-accent",
                defaultClassNames.day,
                className,
              )}
              aria-label={`${day.date.toLocaleDateString("zh-TW")}，${dayProjects.length} 個專案`}
              {...rest}
            >
              <DayCellContent date={day.date} projects={dayProjects} />
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
                  />
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>
      );
    },
    [projectsByDate],
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
        <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
          {/* 手機：圓點圖例 */}
          <span
            className="flex items-center gap-1.5 md:hidden"
            aria-label={PROJECTS_PAGE.statusNegotiating}
          >
            <span className="size-2 rounded-full border-2 border-current bg-transparent" />
            <span>{PROJECTS_PAGE.statusNegotiating}</span>
          </span>
          <span
            className="flex items-center gap-1.5 md:hidden"
            aria-label={PROJECTS_PAGE.statusDepositPaid}
          >
            <span className="size-2 rounded-full bg-primary" />
            <span>{PROJECTS_PAGE.statusDepositPaid}</span>
          </span>
          {/* 平板以上：Status Badge */}
          <span className="hidden items-center gap-1.5 md:flex">
            <Badge variant="outline" className="text-[10px] font-medium">
              {PROJECTS_PAGE.statusNegotiating}
            </Badge>
          </span>
          <span className="hidden items-center gap-1.5 md:flex">
            <Badge variant="default" className="text-[10px] font-medium">
              {PROJECTS_PAGE.statusDepositPaid}
            </Badge>
          </span>
        </div>
      ) : null}
    </section>
  );
}
