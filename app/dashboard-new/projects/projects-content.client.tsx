"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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

/** Subsequence fuzzy match: query chars appear in order in text. */
function fuzzyMatch(text: string, query: string): boolean {
  const t = text.toLowerCase();
  const q = query.trim().toLowerCase();
  if (!q) return true;
  let j = 0;
  for (let i = 0; i < t.length && j < q.length; i++) {
    if (t[i] === q[j]) j++;
  }
  return j === q.length;
}

function filterProjectsFuzzy(projects: Project[], query: string): Project[] {
  const q = query.trim();
  if (!q) return projects;
  return projects.filter((p) => {
    const fields = [
      p.customer,
      p.eventOrVenueUse,
      p.space,
      p.contactPerson,
    ].filter(Boolean);
    return fields.some((field) => fuzzyMatch(field, q));
  });
}

function getStatusLabel(status: Project["status"]): string {
  return status === "negotiating"
    ? PROJECTS_PAGE.statusNegotiating
    : PROJECTS_PAGE.statusDepositPaid;
}

interface ProjectsContentProps {
  projects: Project[];
}

export function ProjectsContent({ projects }: ProjectsContentProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchOpen, setSearchOpen] = React.useState(false);

  const filteredProjects = React.useMemo(
    () => filterProjectsFuzzy(projects, searchQuery),
    [projects, searchQuery],
  );

  const searchInputId = "projects-search";
  const dropdownResultsLimit = 8;

  return (
    <div className="flex-1 p-6 flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <Link href="/dashboard-new/projects/new" className="shrink-0">
          <Button
            variant="default"
            className="gap-2"
            aria-label={PROJECTS_PAGE.createNewProjectAria}
          >
            <Plus className="size-4 shrink-0" aria-hidden />
            {PROJECTS_PAGE.createNewProject}
          </Button>
        </Link>

        <DropdownMenu open={searchOpen} onOpenChange={setSearchOpen}>
          <DropdownMenuTrigger asChild>
            <div className="relative flex-1 sm:max-w-md">
              <Label htmlFor={searchInputId} className="sr-only">
                {PROJECTS_PAGE.searchAriaLabel}
              </Label>
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
                aria-hidden
              />
              <Input
                id={searchInputId}
                type="search"
                autoComplete="off"
                placeholder={PROJECTS_PAGE.searchPlaceholder}
                value={searchQuery}
                onChange={(e) =>
                  React.startTransition(() =>
                    setSearchQuery(e.target.value),
                  )
                }
                onFocus={() => setSearchOpen(true)}
                className="pl-9"
                aria-label={PROJECTS_PAGE.searchAriaLabel}
              />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="max-h-[min(20rem,var(--radix-dropdown-menu-content-available-height))] w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto"
            align="start"
            sideOffset={4}
          >
            {filteredProjects.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground px-2">
                {searchQuery.trim()
                  ? PROJECTS_PAGE.searchNoResults
                  : PROJECTS_PAGE.emptyProjects}
              </div>
            ) : (
              filteredProjects.slice(0, dropdownResultsLimit).map((project) => (
                <DropdownMenuItem key={project.id} asChild>
                  <Link
                    href={`/dashboard-new/projects/${project.id}`}
                    className="block cursor-pointer"
                    onClick={() => setSearchOpen(false)}
                  >
                    <span className="font-medium truncate block">
                      {project.eventOrVenueUse}
                    </span>
                    <span className="text-muted-foreground text-xs truncate block">
                      {project.customer}
                      {project.space ? ` · ${project.space}` : ""}
                    </span>
                  </Link>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <section
        className="flex-1 min-w-0 rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden [&_th]:p-4 [&_td]:p-4"
        aria-label={PROJECTS_PAGE.tableCaption}
      >
        {filteredProjects.length === 0 ? (
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
                <TableHead scope="col">
                  {PROJECTS_PAGE.columnCustomer}
                </TableHead>
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
              {filteredProjects.map((project) => (
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
    </div>
  );
}
