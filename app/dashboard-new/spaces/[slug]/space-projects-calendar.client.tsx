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
import { SPACE_DETAIL_PAGE } from "@/lib/message";
import type { Project } from "@/lib/types/project";
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

function ProjectBadgeLink({
  project,
  className,
}: {
  project: Project;
  className?: string;
}) {
  return (
    <Badge asChild variant="secondary" className={className}>
      <Link href={`/dashboard-new/projects/${project.id}`}>
        {project.eventOrVenueUse}
      </Link>
    </Badge>
  );
}

function DayNumber({ date }: { date: Date }) {
  return <>{date.getDate()}</>;
}

const DAY_CELL_MAX_VISIBLE = 2;

function DayCellProjectBadges({
  projects,
  maxVisible = DAY_CELL_MAX_VISIBLE,
  className,
}: {
  projects: Project[];
  maxVisible?: number;
  className?: string;
}) {
  const visible = projects.slice(0, maxVisible);
  const restCount = projects.length - visible.length;
  return (
    <span
      className={cn(
        "flex flex-wrap items-center justify-end gap-0.5 overflow-hidden",
        className,
      )}
      aria-label={projects.length > 0 ? `${projects.length} 個專案` : undefined}
    >
      {visible.map((project) => (
        <ProjectBadgeLink
          key={project.id}
          project={project}
          className="min-w-0 max-w-full truncate text-[10px]"
        />
      ))}
      {restCount > 0 ? (
        <span className="text-[10px] font-medium text-muted-foreground shrink-0">
          +{restCount}
        </span>
      ) : null}
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
    <>
      <DayNumber date={date} />
      {projects.length > 0 ? (
        <DayCellProjectBadges projects={projects} />
      ) : null}
    </>
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
                  <ProjectBadgeLink project={project} />
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
    </section>
  );
}
