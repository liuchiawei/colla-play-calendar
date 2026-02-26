// Modern Admin Dashboard - Reports Page
// 現代化管理後台 - 報表下載頁面

import { DashboardShell } from "../components/dashboard-shell.client";
import { PageHeader } from "../components/page-header.client";
import { PlaceholderContent } from "@/components/features/admin-dashboard/placeholder-content";

export default function ReportsPage() {
  return (
    <DashboardShell>
      <PageHeader
        title="報表下載"
        description="產生與下載各類數據報表"
        iconName="FileDown"
      />

      <div className="flex-1 p-6">
        <PlaceholderContent
          iconName="FileDown"
          title="報表下載"
          description="報表產生與下載功能即將推出，您將能夠匯出各種格式的數據報表"
        />
      </div>
    </DashboardShell>
  );
}
