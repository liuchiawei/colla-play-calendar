"use client";

import * as React from "react";
import Link from "next/link";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  getDefaultClassNames,
  type DayButton,
} from "react-day-picker";
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
      const count = dayProjects.length;

      const dayButtonContent = (
        <>
          {day.date.getDate()}
          {count > 0 ? (
            <span
              className="absolute bottom-0.5 right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground"
              aria-label={`${count} 個專案`}
            >
              {count}
            </span>
          ) : null}
        </>
      );

      if (count === 0) {
        return (
          <Button
            variant="ghost"
            size="icon"
            data-day={day.date.toISOString().slice(0, 10)}
            className={cn(
              "flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-0.5 leading-none font-normal",
              defaultClassNames.day,
              className
            )}
            aria-label={day.date.toLocaleDateString("zh-TW")}
            {...rest}
          >
            {dayButtonContent}
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
                className
              )}
              aria-label={`${day.date.toLocaleDateString("zh-TW")}，${count} 個專案`}
              {...rest}
            >
              {dayButtonContent}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 p-2">
            <p className="mb-2 text-xs text-muted-foreground">
              {DATE_FORMATTER.format(day.date)}
            </p>
            <ul className="flex flex-col gap-0.5">
              {dayProjects.map((project) => (
                <li key={project.id}>
                  <Link
                    href={`/dashboard-new/projects/${project.id}`}
                    className="block rounded-md px-2 py-1.5 text-sm font-medium text-primary hover:bg-accent hover:underline focus:outline-none focus:underline"
                  >
                    {project.eventOrVenueUse}
                  </Link>
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>
      );
    },
    [projectsByDate]
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
          className="mx-auto"
        />
      ) : (
        <p className="text-muted-foreground text-sm py-12 text-center px-4">
          {SPACE_DETAIL_PAGE.emptyProjects}
        </p>
      )}
    </section>
  );
}
