// Modern Admin Dashboard - Spaces Page
// 現代化管理後台 - 場域列表頁面

import { DashboardShell } from "../components/dashboard-shell.client";
import { PageHeader } from "../components/page-header.client";
import { PlaceholderContent } from "@/components/features/admin-dashboard/placeholder-content";

export default function SpacesPage() {
  return (
    <DashboardShell>
      <PageHeader
        title="場域列表"
        description="管理與檢視所有場域空間"
        iconName="Building2"
      />

      <div className="flex-1 p-6">
        <PlaceholderContent
          iconName="Building2"
          title="場域列表"
          description="場域管理功能即將推出，您將能夠新增、編輯和管理所有活動場域"
        />
      </div>
    </DashboardShell>
  );
}
