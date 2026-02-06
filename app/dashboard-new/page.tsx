// Modern Admin Dashboard - Overview Page
// 現代化管理後台 - 總覽頁面

import Link from "next/link";
import { DashboardShell } from "./components/dashboard-shell.client";
import { PageHeader } from "./components/page-header.client";
import { OverviewStats } from "@/components/features/admin-dashboard/overview-stats";
import { ALL_SPACES, type Space } from "@/lib/config";
import { DASHBOARD_OVERVIEW } from "@/lib/message";

const PREVIEW_SPACES_COUNT = 6;
const previewSpaces = ALL_SPACES.slice(0, PREVIEW_SPACES_COUNT);

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

export default function DashboardNewPage() {
  return (
    <DashboardShell>
      <PageHeader
        title="總覽"
        description="管理後台概覽與數據統計"
        iconName="LayoutDashboard"
      />

      <div className="flex-1 p-6 space-y-6">
        <OverviewStats />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 場域列表 */}
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

          {/* 最近專案 */}
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
            <div className="flex-1 flex items-center justify-center">
              <p className="text-muted-foreground text-sm text-center">
                {DASHBOARD_OVERVIEW.noProjectsYet}
              </p>
            </div>
          </section>
        </div>
      </div>
    </DashboardShell>
  );
}
