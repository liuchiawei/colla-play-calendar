"use client";

import Link from "next/link";
import {
  Table,
  TableCaption,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { PROJECTS_PAGE } from "@/lib/message";
import {
  getStatusLabel,
  getStatusColorClass,
} from "@/lib/config/project-status";
import { addMinutesToTime, subtractMinutesFromTime } from "@/lib/date-utils";
import type { Project } from "@/lib/types/project";
import { cn } from "@/lib/utils";

const DATE_FORMATTER = new Intl.DateTimeFormat("zh-TW", {
  dateStyle: "short",
});

const CURRENCY_FORMATTER = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
});

function getSetupTimeDisplay(
  startTime: string | undefined,
  setupMinutesBefore: number | undefined,
): string {
  if (!startTime) return "—";
  const minutes = setupMinutesBefore ?? 30;
  return subtractMinutesFromTime(startTime, minutes);
}

function getTeardownTimeDisplay(
  endTime: string | undefined,
  teardownMinutesAfter: number | undefined,
): string {
  if (!endTime) return "—";
  const minutes = teardownMinutesAfter ?? 30;
  return addMinutesToTime(endTime, minutes);
}

interface ProjectsListProps {
  projects: Project[];
}

export function ProjectsList({ projects }: ProjectsListProps) {
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
                <TableHead scope="col">
                  {PROJECTS_PAGE.columnCustomer}
                </TableHead>
                <TableHead scope="col">
                  {PROJECTS_PAGE.columnEventOrVenueUse}
                </TableHead>
                <TableHead scope="col">{PROJECTS_PAGE.columnSpace}</TableHead>
                <TableHead scope="col">{PROJECTS_PAGE.columnDate}</TableHead>
                <TableHead
                  scope="col"
                  className="tabular-nums whitespace-nowrap"
                >
                  {PROJECTS_PAGE.columnEventStartTime}
                </TableHead>
                <TableHead
                  scope="col"
                  className="tabular-nums whitespace-nowrap"
                >
                  {PROJECTS_PAGE.columnEventEndTime}
                </TableHead>
                <TableHead
                  scope="col"
                  className="tabular-nums whitespace-nowrap"
                >
                  {PROJECTS_PAGE.columnSetupTime}
                </TableHead>
                <TableHead
                  scope="col"
                  className="tabular-nums whitespace-nowrap"
                >
                  {PROJECTS_PAGE.columnTeardownTime}
                </TableHead>
                <TableHead scope="col">{PROJECTS_PAGE.columnContact}</TableHead>
                <TableHead scope="col" className="text-right tabular-nums">
                  {PROJECTS_PAGE.columnAmount}
                </TableHead>
                <TableHead scope="col">{PROJECTS_PAGE.columnStatus}</TableHead>
                <TableHead scope="col">{PROJECTS_PAGE.columnTables}</TableHead>
                <TableHead scope="col" className="text-right tabular-nums">
                  {PROJECTS_PAGE.columnChairs}
                </TableHead>
                <TableHead scope="col">
                  {PROJECTS_PAGE.columnFnbItems}
                </TableHead>
                <TableHead scope="col" className="text-right tabular-nums">
                  {PROJECTS_PAGE.columnTotalAttendees}
                </TableHead>
                <TableHead scope="col">
                  {PROJECTS_PAGE.columnProjectNotes}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="min-w-0 max-w-[120px] truncate">
                    {project.customer}
                  </TableCell>
                  <TableCell className="min-w-0 max-w-[180px] truncate">
                    <Link
                      href={`/dashboard-new/projects/${project.id}`}
                      className="font-medium text-primary hover:underline focus:outline-none focus:underline"
                    >
                      {project.eventOrVenueUse}
                    </Link>
                  </TableCell>
                  <TableCell className="min-w-0 max-w-[160px] truncate">
                    {project.space}
                  </TableCell>
                  <TableCell className="tabular-nums whitespace-nowrap">
                    {DATE_FORMATTER.format(new Date(project.date))}
                  </TableCell>
                  <TableCell className="tabular-nums whitespace-nowrap">
                    {project.rentals?.[0]?.startTime ?? "—"}
                  </TableCell>
                  <TableCell className="tabular-nums whitespace-nowrap">
                    {project.rentals?.[0]?.endTime ?? "—"}
                  </TableCell>
                  <TableCell className="tabular-nums whitespace-nowrap">
                    {getSetupTimeDisplay(
                      project.rentals?.[0]?.startTime,
                      project.rentals?.[0]?.setupMinutesBefore,
                    )}
                  </TableCell>
                  <TableCell className="tabular-nums whitespace-nowrap">
                    {getTeardownTimeDisplay(
                      project.rentals?.[0]?.endTime,
                      project.rentals?.[0]?.teardownMinutesAfter,
                    )}
                  </TableCell>
                  <TableCell className="min-w-0 max-w-[100px] truncate">
                    {project.contactPerson}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {CURRENCY_FORMATTER.format(project.amount)}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          "size-2 shrink-0 rounded-full",
                          getStatusColorClass(project.status),
                        )}
                        aria-hidden
                      />
                      {getStatusLabel(project.status)}
                    </span>
                  </TableCell>
                  <TableCell className="min-w-0 max-w-[80px] truncate">
                    {project.tables ?? "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {project.chairs != null ? project.chairs : "—"}
                  </TableCell>
                  <TableCell className="min-w-0 max-w-[140px] truncate">
                    {project.fnbItems ?? "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {project.totalAttendees != null
                      ? project.totalAttendees
                      : "—"}
                  </TableCell>
                  <TableCell className="min-w-0 max-w-[180px] truncate">
                    {project.projectNotes ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}
