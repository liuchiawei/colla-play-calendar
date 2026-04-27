// Modern Admin Dashboard - Spaces Page
// 現代化管理後台 - 場域列表頁面

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { DashboardShell } from "../components/dashboard-shell.client";
import { PageHeader } from "../components/page-header.client";
import { SpacesTabs } from "./spaces-tabs.client";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { SPACES_PAGE } from "@/lib/message";
import { getProjectsForList } from "@/lib/services/project/project.service";
import {
  buildLoginUrlWithNext,
  buildPathWithSearch,
  type NextSearchParams,
} from "@/lib/utils/login-next";

interface PageProps {
  searchParams?: Promise<NextSearchParams>;
}

export default async function SpacesPage({ searchParams }: PageProps) {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  const sp = searchParams ? await searchParams : undefined;
  const nextPath = buildPathWithSearch("/dashboard/spaces", sp);

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
        title={SPACES_PAGE.title}
        description={SPACES_PAGE.description}
        iconName="Building2"
      />
      <SpacesTabs projects={projects} />
    </DashboardShell>
  );
}
