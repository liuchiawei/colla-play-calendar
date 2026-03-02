// Modern Admin Dashboard - Spaces Page
// 現代化管理後台 - 場域列表頁面

import { DashboardShell } from "../components/dashboard-shell.client";
import { PageHeader } from "../components/page-header.client";
import { SpacesTabs } from "./spaces-tabs.client";
import { SPACES_PAGE } from "@/lib/message";
import { getProjectsForList } from "@/lib/services/project/project.service";

export default async function SpacesPage() {
  const projects = await getProjectsForList();
  return (
    <DashboardShell>
      <PageHeader
        title={SPACES_PAGE.title}
        description={SPACES_PAGE.description}
        iconName="Building2"
      />

      <SpacesTabs projects={projects} />
    </DashboardShell>
  );
}
