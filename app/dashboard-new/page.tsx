// Modern Admin Dashboard - Overview Page
// 現代化管理後台 - 總覽頁面

import { DashboardShell } from "./components/dashboard-shell.client";
import { PageHeader } from "./components/page-header.client";
import { OverviewContent } from "./overview-content.client";
import { OverviewStats } from "@/components/features/admin-dashboard/overview-stats";
import { ALL_SPACES } from "@/lib/config/config";
import {
  getOverviewStats,
  getRecentProjects,
} from "@/lib/services/project/project.service";

const PREVIEW_SPACES_COUNT = 6;

export default async function DashboardNewPage() {
  const [recentProjects, stats] = await Promise.all([
    getRecentProjects(PREVIEW_SPACES_COUNT),
    getOverviewStats(),
  ]);
  const previewSpaces = ALL_SPACES.slice(0, PREVIEW_SPACES_COUNT);

  return (
    <DashboardShell>
      <PageHeader
        title="總覽"
        description="管理後台概覽與數據統計"
        iconName="LayoutDashboard"
      />

      <div className="flex-1 p-6 space-y-6">
        <OverviewStats data={stats} />
        <OverviewContent
          previewSpaces={previewSpaces}
          recentProjects={recentProjects}
        />
      </div>
    </DashboardShell>
  );
}
