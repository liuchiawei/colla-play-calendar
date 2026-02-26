// 建立新專案頁面

import { DashboardShell } from "../../components/dashboard-shell.client";
import { PageHeader } from "../../components/page-header.client";
import { CreateProjectForm } from "./create-project-form.client";
import { CREATE_PROJECT_PAGE } from "@/lib/message";

export default function NewProjectPage() {
  return (
    <DashboardShell>
      <PageHeader
        title={CREATE_PROJECT_PAGE.pageTitle}
        description={CREATE_PROJECT_PAGE.pageDescription}
        iconName="FolderKanban"
      />

      <CreateProjectForm />
    </DashboardShell>
  );
}
