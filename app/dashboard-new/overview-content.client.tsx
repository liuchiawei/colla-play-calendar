"use client";

import Link from "next/link";
import { DASHBOARD_OVERVIEW, PROJECTS_PAGE } from "@/lib/message";
import type { Project } from "@/lib/types/project";
import type { Space } from "@/lib/config";

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

function SpacePreviewItem({ space }: { space: Space }) {
  return (
    <li className="flex items-center justify-between gap-3 py-2 border-b border-border/50 last:border-0 min-w-0">
      <span className="text-sm font-medium truncate">{space.name}</span>
      <span className="text-xs text-muted-foreground shrink-0" aria-hidden>
        {space.floor}
      </span>
    </li>
  );
}

interface OverviewContentProps {
  previewSpaces: Space[];
  recentProjects: Project[];
}

export function OverviewContent({
  previewSpaces,
  recentProjects,
}: OverviewContentProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <section
        className="backdrop-blur-2xl bg-card/50 rounded-2xl p-6 border border-border min-h-[300px] flex flex-col"
        aria-labelledby="overview-spaces-heading"
      >
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2
            id="overview-spaces-heading"
            className="text-lg font-semibold text-balance"
          >
            {DASHBOARD_OVERVIEW.spacesSectionTitle}
          </h2>
          <Link
            href="/dashboard-new/spaces"
            className="text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm shrink-0"
            aria-label={DASHBOARD_OVERVIEW.seeAllSpacesAria}
          >
            {DASHBOARD_OVERVIEW.seeAll}
          </Link>
        </div>
        <ul className="flex-1 list-none p-0 m-0" role="list">
          {previewSpaces.map((space) => (
            <SpacePreviewItem key={space.id} space={space} />
          ))}
        </ul>
      </section>

      <section
        className="backdrop-blur-2xl bg-card/50 rounded-2xl p-6 border border-border min-h-[300px] flex flex-col"
        aria-labelledby="overview-projects-heading"
      >
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2
            id="overview-projects-heading"
            className="text-lg font-semibold text-balance"
          >
            {DASHBOARD_OVERVIEW.recentProjectsTitle}
          </h2>
          <Link
            href="/dashboard-new/projects"
            className="text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm shrink-0"
            aria-label={DASHBOARD_OVERVIEW.seeAllProjectsAria}
          >
            {DASHBOARD_OVERVIEW.seeAll}
          </Link>
        </div>
        {recentProjects.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground text-sm text-center">
              {DASHBOARD_OVERVIEW.noProjectsYet}
            </p>
          </div>
        ) : (
          <ul className="flex-1 list-none p-0 m-0" role="list">
            {recentProjects.map((project) => (
              <li key={project.id}>
                <Link
                  href={`/dashboard-new/projects/${project.id}`}
                  className="flex items-center justify-between gap-3 px-3 py-2 border-b border-border/50 last:border-0 min-w-0 hover:bg-accent/20 rounded-xs"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium truncate block">
                      {project.customer}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {DATE_FORMATTER.format(new Date(project.date))} ·{" "}
                      {getStatusLabel(project.status)}
                    </span>
                  </div>
                  <span className="text-sm tabular-nums shrink-0">
                    {CURRENCY_FORMATTER.format(project.amount)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
