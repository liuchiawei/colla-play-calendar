// Modern Admin Dashboard - Projects Page
// 現代化管理後台 - 專案管理頁面

import { DashboardShell } from "../components/dashboard-shell.client";
import { PageHeader } from "../components/page-header.client";
import { PlaceholderContent } from "@/components/features/admin-dashboard/placeholder-content";

export default function ProjectsPage() {
  return (
    <DashboardShell>
      <PageHeader
        title="專案管理"
        description="管理與追蹤所有專案進度"
        iconName="FolderKanban"
      />

      <div className="flex-1 p-6">
        <PlaceholderContent
          iconName="FolderKanban"
          title="專案管理"
          description="專案管理功能即將推出，您將能夠建立、追蹤和管理各項專案"
        />
      </div>
    </DashboardShell>
  );
}
