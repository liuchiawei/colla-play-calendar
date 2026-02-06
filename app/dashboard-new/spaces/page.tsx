// Modern Admin Dashboard - Spaces Page
// 現代化管理後台 - 場域列表頁面

import { DashboardShell } from "../components/dashboard-shell.client";
import { PageHeader } from "../components/page-header.client";
import { SpacesTabs } from "./spaces-tabs.client";

export default function SpacesPage() {
  return (
    <DashboardShell>
      <PageHeader
        title="場域列表"
        description="管理與檢視所有場域空間"
        iconName="Building2"
      />

      <SpacesTabs />
    </DashboardShell>
  );
}
