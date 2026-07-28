"use client";

import Link from "next/link";
import { DASHBOARD_OVERVIEW } from "@/lib/message";
import type { Project } from "@/lib/types/project";

const DATE_FORMATTER = new Intl.DateTimeFormat("zh-TW", {
  dateStyle: "short",
});

const EVENT_TYPE_COLORS: Record<string, string> = {
  場租: "bg-accent text-white",
  空間企劃: "bg-[oklch(0.55_0.06_180)] text-white",
  分潤合作: "bg-[oklch(0.55_0.07_140)] text-white",
  場地贊助: "bg-[oklch(0.55_0.02_60)] text-white",
  店內活動: "bg-[oklch(0.4_0.06_250)] text-white",
  商業攝影: "bg-[oklch(0.35_0.02_50)] text-white",
  酒吧包場: "bg-[oklch(0.55_0.05_220)] text-white",
  其他: "bg-muted text-muted-foreground",
};
const EVENT_TYPE_FALLBACK_COLOR = "bg-muted text-muted-foreground";

function ProjectRow({ project }: { project: Project }) {
  const firstRental = [...(project.rentals ?? [])].sort((a, b) =>
    a.date.localeCompare(b.date),
  )[0];
  return (
    <li>
      <Link
        href={`/dashboard/projects/${project.id}`}
        className="flex items-center justify-between gap-3 px-3 py-2 border-b border-border/50 last:border-0 min-w-0 hover:bg-accent/20 rounded-xs"
      >
        <div className="min-w-0 flex-1 space-y-1">
          <span className="flex items-center gap-1.5 min-w-0">
            {project.eventType ? (
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ${
                  EVENT_TYPE_COLORS[project.eventType] ??
                  EVENT_TYPE_FALLBACK_COLOR
                }`}
              >
                {project.eventType}
              </span>
            ) : null}
            <span className="text-sm font-medium truncate">
              {project.eventOrVenueUse}
            </span>
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
            {DATE_FORMATTER.format(new Date(project.date))}
            {firstRental?.startTime && firstRental?.endTime ? (
              <span className="shrink-0">
                {firstRental.startTime}–{firstRental.endTime}
              </span>
            ) : null}
            {project.space ? (
              <>
                {" "}
                ·<span className="truncate">{project.space}</span>
              </>
            ) : null}
          </span>
        </div>
        <div className="text-right shrink-0">
          <span className="text-xs text-muted-foreground block">
            {DATE_FORMATTER.format(new Date(project.createdAt))} 新增
          </span>
        </div>
      </Link>
    </li>
  );
}

function ProjectListCard({
  headingId,
  title,
  filterNote,
  seeAllAria,
  projects,
}: {
  headingId: string;
  title: string;
  filterNote: string;
  seeAllAria: string;
  projects: Project[];
}) {
  return (
    <section
      className="backdrop-blur-2xl bg-card/50 rounded-2xl p-6 border border-border min-h-[300px] flex flex-col"
      aria-labelledby={headingId}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <h2 id={headingId} className="text-lg font-semibold text-balance">
            {title}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">{filterNote}</p>
        </div>
        <Link
          href="/dashboard/projects"
          className="text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm shrink-0"
          aria-label={seeAllAria}
        >
          {DASHBOARD_OVERVIEW.seeAll}
        </Link>
      </div>
      {projects.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground text-sm text-center">
            {DASHBOARD_OVERVIEW.noProjectsYet}
          </p>
        </div>
      ) : (
        <ul
          className="flex-1 list-none p-0 m-0 max-h-[420px] overflow-y-auto"
          role="list"
        >
          {projects.map((project) => (
            <ProjectRow key={project.id} project={project} />
          ))}
        </ul>
      )}
    </section>
  );
}

interface OverviewContentProps {
  recentProjects: Project[];
  upcomingProjects: Project[];
}

export function OverviewContent({
  recentProjects,
  upcomingProjects,
}: OverviewContentProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ProjectListCard
        headingId="overview-projects-heading"
        title={DASHBOARD_OVERVIEW.recentProjectsTitle}
        filterNote={DASHBOARD_OVERVIEW.recentProjectsFilterNote}
        seeAllAria={DASHBOARD_OVERVIEW.seeAllProjectsAria}
        projects={recentProjects}
      />
      <ProjectListCard
        headingId="overview-upcoming-projects-heading"
        title={DASHBOARD_OVERVIEW.upcomingProjectsTitle}
        filterNote={DASHBOARD_OVERVIEW.upcomingProjectsFilterNote}
        seeAllAria={DASHBOARD_OVERVIEW.seeAllProjectsAria}
        projects={upcomingProjects}
      />
    </div>
  );
}
