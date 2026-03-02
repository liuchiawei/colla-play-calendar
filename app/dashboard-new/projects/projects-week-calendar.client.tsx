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
import {
  getWeekDays,
  getNextWeek,
  getPreviousWeek,
  formatDayHeader,
} from "@/lib/date-utils";
import { startOfDay, isSameDay } from "date-fns";
import { PROJECTS_PAGE } from "@/lib/message";
import type { Project, ProjectStatus } from "@/lib/types/project";
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

function badgeVariantByStatus(status: ProjectStatus): "outline" | "default" {
  return status === "deposit_paid" ? "default" : "outline";
}

function ProjectBadgeLink({
  project,
  className,
}: {
  project: Project;
  className?: string;
}) {
  const variant = badgeVariantByStatus(project.status);
  return (
    <Badge asChild variant={variant} className={className}>
      <Link href={`/dashboard-new/projects/${project.id}`} className="truncate">
        {project.eventOrVenueUse}
      </Link>
    </Badge>
  );
}

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

function DayColumnHeader({ day, isToday }: { day: Date; isToday: boolean }) {
  return (
    <div
      className={cn(
        "p-2 text-center border-b border-border/50 font-medium text-sm",
        isToday && "bg-primary/10 text-primary",
      )}
    >
      {formatDayHeader(day)}
    </div>
  );
}

function DayColumnContent({ projects }: { projects: Project[] }) {
  if (projects.length === 0) {
    return (
      <div className="p-2 text-muted-foreground text-xs text-center min-h-[4rem] flex items-center justify-center">
        —
      </div>
    );
  }
  return (
    <div className="p-2 flex flex-col gap-1.5 min-h-[4rem]">
      {projects.map((project) => (
        <ProjectBadgeLink
          key={project.id}
          project={project}
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

      {/* 7 日欄位 */}
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
                <DayColumnContent projects={dayProjects} />
              </div>
            );
          })}
        </div>

      {/* 圖例 */}
      {projects.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground border-t border-border/50 pt-3 pb-2">
          <span
            className="flex items-center gap-1.5 md:hidden"
            aria-label={PROJECTS_PAGE.statusNegotiating}
          >
            <StatusDot status="negotiating" />
            <span>{PROJECTS_PAGE.statusNegotiating}</span>
          </span>
          <span
            className="flex items-center gap-1.5 md:hidden"
            aria-label={PROJECTS_PAGE.statusDepositPaid}
          >
            <StatusDot status="deposit_paid" />
            <span>{PROJECTS_PAGE.statusDepositPaid}</span>
          </span>
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
