"use client";

import { useTransition, useState } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
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
import { PROJECTS_PAGE, PROJECT_DETAIL_PAGE } from "@/lib/message";
import {
  getStatusLabel,
  getStatusColorClass,
} from "@/lib/config/project-status";
import { addMinutesToTime, subtractMinutesFromTime } from "@/lib/date-utils";
import type { Project } from "@/lib/types/project";
import { cn } from "@/lib/utils";
import { formatRentalDateRangeForTable } from "@/lib/utils/project";
import { deleteProject } from "./[id]/actions";

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
  const [, startTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
                <TableHead scope="col" className="w-0">
                  {PROJECTS_PAGE.columnActions}
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
                    {project.rentals?.[0]
                      ? formatRentalDateRangeForTable(
                          project.rentals[0],
                          (d) => DATE_FORMATTER.format(d),
                        )
                      : DATE_FORMATTER.format(new Date(project.date))}
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
                  <TableCell className="w-0 whitespace-nowrap">
                    <div className="flex items-center gap-1">
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
                          if (!open) setDeleteError(null);
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
                          {deleteError ? (
                            <p
                              className="text-sm text-destructive"
                              role="alert"
                            >
                              {deleteError}
                            </p>
                          ) : null}
                          <AlertDialogFooter>
                            <AlertDialogCancel>
                              {PROJECT_DETAIL_PAGE.deleteConfirmCancel}
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteConfirm(project.id)}
                              disabled={deletingId === project.id}
                            >
                              {deletingId === project.id
                                ? "刪除中…"
                                : PROJECT_DETAIL_PAGE.deleteConfirmConfirm}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
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
