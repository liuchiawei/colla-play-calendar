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
import type { Project } from "@/lib/types/project";

const DATE_FORMATTER = new Intl.DateTimeFormat("zh-TW", {
  dateStyle: "short",
});

const CURRENCY_FORMATTER = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
});

function getStatusLabel(status: Project["status"]): string {
  return status === "negotiating"
    ? PROJECTS_PAGE.statusNegotiating
    : PROJECTS_PAGE.statusDepositPaid;
}

interface ProjectsListProps {
  projects: Project[];
}

export function ProjectsList({ projects }: ProjectsListProps) {
  return (
    <section
      className="flex-1 min-w-0 rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden [&_th]:p-4 [&_td]:p-4"
      aria-label={PROJECTS_PAGE.tableCaption}
    >
      {projects.length === 0 ? (
        <p className="text-muted-foreground text-sm py-12 text-center px-4">
          {PROJECTS_PAGE.emptyProjects}
        </p>
      ) : (
        <Table>
          <TableCaption className="sr-only">
            {PROJECTS_PAGE.tableCaption}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">{PROJECTS_PAGE.columnCustomer}</TableHead>
              <TableHead scope="col">
                {PROJECTS_PAGE.columnEventOrVenueUse}
              </TableHead>
              <TableHead scope="col">{PROJECTS_PAGE.columnSpace}</TableHead>
              <TableHead scope="col">{PROJECTS_PAGE.columnDate}</TableHead>
              <TableHead scope="col">{PROJECTS_PAGE.columnContact}</TableHead>
              <TableHead scope="col" className="text-right tabular-nums">
                {PROJECTS_PAGE.columnAmount}
              </TableHead>
              <TableHead scope="col">{PROJECTS_PAGE.columnStatus}</TableHead>
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
                <TableCell className="min-w-0 max-w-[100px] truncate">
                  {project.contactPerson}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {CURRENCY_FORMATTER.format(project.amount)}
                </TableCell>
                <TableCell>{getStatusLabel(project.status)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
