// Modern Admin Dashboard - Projects Page
// 現代化管理後台 - 專案管理頁面

import { DashboardShell } from "../components/dashboard-shell.client";
import { PageHeader } from "../components/page-header.client";
import { ProjectsContent } from "./projects-content.client";
import { PROJECTS_PAGE } from "@/lib/message";
import { MOCK_PROJECTS } from "@/lib/types/project";

export default function ProjectsPage() {
  return (
    <DashboardShell>
      <PageHeader
        title={PROJECTS_PAGE.title}
        description={PROJECTS_PAGE.description}
        iconName="FolderKanban"
      />

      <ProjectsContent projects={MOCK_PROJECTS} />
    </DashboardShell>
  );
}
