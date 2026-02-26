// Modern Admin Dashboard - Projects Page
// 現代化管理後台 - 專案管理頁面

import { DashboardShell } from "../components/dashboard-shell.client";
import { PageHeader } from "../components/page-header.client";
import { ProjectsContent } from "./projects-content.client";
import { PROJECTS_PAGE } from "@/lib/message";
import { getProjectsForList } from "@/lib/services/project/project.service";

export default async function ProjectsPage() {
  const projects = await getProjectsForList();

  return (
    <DashboardShell>
      <PageHeader
        title={PROJECTS_PAGE.title}
        description={PROJECTS_PAGE.description}
        iconName="FolderKanban"
      />

      <ProjectsContent projects={projects} />
    </DashboardShell>
  );
}
