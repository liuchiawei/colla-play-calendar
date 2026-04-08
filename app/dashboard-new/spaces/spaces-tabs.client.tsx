"use client";

import * as React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ALL_SPACES, SPACE_BORDER_COLORS } from "@/lib/config/config";
import { SPACES_PAGE } from "@/lib/message";
import type { Project } from "@/lib/types/project";
import { SpaceProjectsCalendar } from "./space-projects-calendar.client";
import { LayoutGrid } from "lucide-react";

const FILTER_ALL = "all" as const;

function filterProjectsBySpace(
  projects: Project[],
  spaceId: string | null,
): Project[] {
  if (spaceId == null || spaceId === FILTER_ALL) return projects;
  return projects.filter((p) =>
    p.rentals?.some((r) => r.spaceIds.includes(spaceId)),
  );
}

interface SpacesTabsProps {
  projects: Project[];
}

export function SpacesTabs({ projects }: SpacesTabsProps) {
  const [selectedFilter, setSelectedFilter] =
    React.useState<string>(FILTER_ALL);

  const filteredProjects = React.useMemo(
    () =>
      filterProjectsBySpace(
        projects,
        selectedFilter === FILTER_ALL ? null : selectedFilter,
      ),
    [projects, selectedFilter],
  );

  const isAllView = selectedFilter === FILTER_ALL;
  const spaceLegend = React.useMemo(
    () =>
      ALL_SPACES.map((s) => ({
        id: s.id,
        name: s.name,
      })),
    [],
  );

  return (
    <div className="flex-1 p-6 flex flex-col justify-center min-w-0">
      <Tabs
        value={selectedFilter}
        onValueChange={setSelectedFilter}
        className="w-full flex-1 flex flex-col min-w-0"
      >
        <TabsList
          className="flex flex-wrap h-auto gap-1 w-full justify-start mx-auto"
          aria-label={SPACES_PAGE.tabsFilterAriaLabel}
        >
          <TabsTrigger
            value={FILTER_ALL}
            className="flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <LayoutGrid className="size-4 shrink-0" aria-hidden />
            {SPACES_PAGE.tabAll}
          </TabsTrigger>
          {ALL_SPACES.map((space) => (
            <TabsTrigger
              key={space.id}
              value={space.id}
              className="flex items-center gap-1.5"
            >
              {space.name}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="mt-6 flex-1 min-w-0">
          <SpaceProjectsCalendar
            projects={filteredProjects}
            showVenue={true}
            spaceBorderColors={isAllView ? SPACE_BORDER_COLORS : undefined}
          />
        </div>
      </Tabs>
    </div>
  );
}
