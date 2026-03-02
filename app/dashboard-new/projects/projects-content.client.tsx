"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PROJECTS_PAGE } from "@/lib/message";
import type { Project } from "@/lib/types/project";

const ProjectsWeekCalendar = dynamic(
  () =>
    import("./projects-week-calendar.client").then((m) => m.ProjectsWeekCalendar),
  { ssr: false },
);

const ProjectsList = dynamic(
  () => import("./projects-list").then((m) => m.ProjectsList),
  { ssr: false },
);

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
    <div className="flex-1 min-w-0 p-6 flex flex-col gap-6">
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Create New Project Button */}
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
        {/* Search Bar */}
        <Popover open={searchOpen} onOpenChange={setSearchOpen}>
          <PopoverAnchor asChild>
            <div className="relative flex-1 max-w-xl w-full">
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
          </PopoverAnchor>
          <PopoverContent
            align="start"
            sideOffset={4}
            onOpenAutoFocus={(e) => e.preventDefault()}
            className="max-h-[min(20rem,var(--radix-popover-content-available-height))] w-[var(--radix-popover-trigger-width)] overflow-y-auto p-1"
          >
            {filteredProjects.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground px-2">
                {searchQuery.trim()
                  ? PROJECTS_PAGE.searchNoResults
                  : PROJECTS_PAGE.emptyProjects}
              </div>
            ) : (
              <ul role="list" className="outline-hidden">
                {filteredProjects.slice(0, dropdownResultsLimit).map((project) => (
                  <li key={project.id} role="listitem">
                    <Link
                      href={`/dashboard-new/projects/${project.id}`}
                      className="block cursor-pointer rounded-sm px-2 py-1.5 text-sm outline-hidden focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground"
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
                  </li>
                ))}
              </ul>
            )}
          </PopoverContent>
        </Popover>
      </div>

      <Tabs
        defaultValue="list"
        className="flex-1 flex flex-col items-center min-w-0"
      >
        <TabsList
          className="w-full md:max-w-md grid grid-cols-2"
          aria-label={PROJECTS_PAGE.tabsAriaLabel}
        >
          <TabsTrigger value="list">{PROJECTS_PAGE.tabListView}</TabsTrigger>
          <TabsTrigger value="week">{PROJECTS_PAGE.tabWeekView}</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="flex-1 min-w-0 w-full">
          <ProjectsList projects={filteredProjects} />
        </TabsContent>

        <TabsContent value="week" className="flex-1 min-w-0 w-full">
          <ProjectsWeekCalendar projects={projects} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
