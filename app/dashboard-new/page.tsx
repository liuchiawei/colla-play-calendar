// Modern Admin Dashboard - Overview Page
// 現代化管理後台 - 總覽頁面

import { DashboardShell } from "./components/dashboard-shell.client";
import { PageHeader } from "./components/page-header.client";
import { OverviewStats } from "@/components/features/admin-dashboard/overview-stats";

export default function DashboardNewPage() {
  return (
    <DashboardShell>
      <PageHeader
        title="總覽"
        description="管理後台概覽與數據統計"
        iconName="LayoutDashboard"
      />

      <div className="flex-1 p-6 space-y-6">
        {/* Stats Grid */}
        <OverviewStats />

        {/* Additional sections can be added here in the future */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="backdrop-blur-2xl bg-card/50 rounded-2xl p-6 border border-border min-h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground text-center">
              未來可在此處添加圖表與分析
              <br />
              <span className="text-sm">Future charts and analytics section</span>
            </p>
          </div>

          <div className="backdrop-blur-2xl bg-card/50 rounded-2xl p-6 border border-border min-h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground text-center">
              未來可在此處添加最近活動
              <br />
              <span className="text-sm">Future recent activity section</span>
            </p>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
