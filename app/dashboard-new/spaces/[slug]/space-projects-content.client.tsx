"use client";

import * as React from "react";
import Link from "next/link";
import { Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PROJECTS_PAGE, SPACE_DETAIL_PAGE } from "@/lib/message";
import {
  getStatusLabel,
  getStatusColorClass,
} from "@/lib/config/project-status";
import type { Project } from "@/lib/types/project";
import { SpaceProjectsCalendar } from "./space-projects-calendar.client";
import { cn } from "@/lib/utils";

const DATE_FORMATTER = new Intl.DateTimeFormat("zh-TW", {
  dateStyle: "short",
});

const CURRENCY_FORMATTER = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
});

function filterProjects(projects: Project[], query: string): Project[] {
  const q = query.trim().toLowerCase();
  if (!q) return projects;
  return projects.filter(
    (p) =>
      p.customer.toLowerCase().includes(q) ||
      p.eventOrVenueUse.toLowerCase().includes(q) ||
      p.space.toLowerCase().includes(q) ||
      p.contactPerson.toLowerCase().includes(q),
  );
}

interface SpaceProjectsContentProps {
  spaceName: string;
  projects: Project[];
}

export function SpaceProjectsContent({
  spaceName,
  projects,
}: SpaceProjectsContentProps) {
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredProjects = React.useMemo(
    () => filterProjects(projects, searchQuery),
    [projects, searchQuery],
  );

  const searchInputId = "space-projects-search";

  return (
    <div className="flex-1 p-6 flex flex-col gap-6">
      <Link href="/dashboard-new/spaces" className="self-start">
        <Button variant="ghost" size="sm" className="gap-2">
          <ArrowLeft className="size-4" aria-hidden />
          {SPACE_DETAIL_PAGE.buttonBackToList}
        </Button>
      </Link>

      <Tabs defaultValue="calendar" className="flex-1 flex flex-col min-w-0">
        <TabsList
          className="w-full max-w-[240px] grid grid-cols-2"
          aria-label={SPACE_DETAIL_PAGE.tabsAriaLabel}
        >
          <TabsTrigger value="calendar">
            {SPACE_DETAIL_PAGE.tabCalendarView}
          </TabsTrigger>
          <TabsTrigger value="list">
            {SPACE_DETAIL_PAGE.tabListView}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-6 flex-1 min-w-0">
          <SpaceProjectsCalendar projects={projects} spaceName={spaceName} />
        </TabsContent>

        <TabsContent value="list" className="mt-6 flex-1 min-w-0">
          <div className="flex flex-col gap-4">
            <div className="grid w-full max-w-sm items-center gap-2">
              <Label htmlFor={searchInputId} className="sr-only">
                {PROJECTS_PAGE.searchAriaLabel}
              </Label>
              <div className="relative">
                <Search
                  className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden
                />
                <Input
                  id={searchInputId}
                  type="search"
                  placeholder={PROJECTS_PAGE.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  aria-label={PROJECTS_PAGE.searchAriaLabel}
                />
              </div>
            </div>
            <section
              className="flex-1 min-w-0 rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden [&_th]:p-4 [&_td]:p-4"
              aria-label={SPACE_DETAIL_PAGE.tableCaption}
            >
              {filteredProjects.length === 0 ? (
                <p className="text-muted-foreground text-sm py-12 text-center px-4">
                  {SPACE_DETAIL_PAGE.emptyProjects}
                </p>
              ) : (
                <Table>
                  <TableCaption className="sr-only">
                    {SPACE_DETAIL_PAGE.tableCaption}：{spaceName}
                  </TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">
                        {PROJECTS_PAGE.columnCustomer}
                      </TableHead>
                      <TableHead scope="col">
                        {PROJECTS_PAGE.columnEventOrVenueUse}
                      </TableHead>
                      <TableHead scope="col">
                        {PROJECTS_PAGE.columnSpace}
                      </TableHead>
                      <TableHead scope="col">
                        {PROJECTS_PAGE.columnDate}
                      </TableHead>
                      <TableHead scope="col">
                        {PROJECTS_PAGE.columnContact}
                      </TableHead>
                      <TableHead
                        scope="col"
                        className="text-right tabular-nums"
                      >
                        {PROJECTS_PAGE.columnAmount}
                      </TableHead>
                      <TableHead scope="col">
                        {PROJECTS_PAGE.columnStatus}
                      </TableHead>
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </section>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
