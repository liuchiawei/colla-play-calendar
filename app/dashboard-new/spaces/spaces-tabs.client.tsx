"use client";

import * as React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ALL_SPACES } from "@/lib/config/config";
import { SPACES_PAGE } from "@/lib/message";
import type { Project } from "@/lib/types/project";
import { SpaceProjectsCalendar } from "./[slug]/space-projects-calendar.client";
import { LayoutGrid, Building2 } from "lucide-react";

const FILTER_ALL = "all" as const;

/** 各空間對應的 border 色 class（左側邊框），用於月曆上區分空間 */
const SPACE_BORDER_COLORS: Record<string, string> = {
  "3f-community-cafe": "border-blue-500",
  "3f-focus-area": "border-emerald-500",
  "4f-multipurpose-room": "border-amber-500",
  "4f-multipurpose-room-1": "border-amber-500",
  "4f-multipurpose-room-2": "border-amber-500",
  "4f-podcast-studio": "border-rose-500",
  "4f-product-photo": "border-violet-500",
  "4f-event-lounge": "border-cyan-500",
  "4f-screening-room": "border-orange-500",
  "4f-tik-&-sip": "border-teal-500",
  "5f-exhibition-hall": "border-pink-500",
};

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
            spaceName={
              isAllView
                ? ""
                : (ALL_SPACES.find((s) => s.id === selectedFilter)?.name ?? "")
            }
            showVenue={true}
            spaceBorderColors={isAllView ? SPACE_BORDER_COLORS : undefined}
            spaceLegend={isAllView ? spaceLegend : undefined}
          />
        </div>
      </Tabs>
    </div>
  );
}
