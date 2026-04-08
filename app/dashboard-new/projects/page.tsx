// Modern Admin Dashboard - Projects Page
// 現代化管理後台 - 專案管理頁面

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { DashboardShell } from "../components/dashboard-shell.client";
import { PageHeader } from "../components/page-header.client";
import { ProjectsContent } from "./projects-content.client";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { PROJECTS_PAGE } from "@/lib/message";
import { getProjectsForList } from "@/lib/services/project/project.service";
import {
  buildLoginUrlWithNext,
  buildPathWithSearch,
  type NextSearchParams,
} from "@/lib/utils/login-next";

interface PageProps {
  searchParams?: Promise<NextSearchParams>;
}

export default async function ProjectsPage({ searchParams }: PageProps) {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  const sp = searchParams ? await searchParams : undefined;
  const nextPath = buildPathWithSearch("/dashboard-new/projects", sp);

  if (!session?.user) {
    redirect(buildLoginUrlWithNext(nextPath));
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  });
  if (!user?.isAdmin) {
    redirect("/");
  }

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
