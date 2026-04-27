// Modern Admin Dashboard - Overview Page
// 現代化管理後台 - 總覽頁面

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { DashboardShell } from "./components/dashboard-shell.client";
import { PageHeader } from "./components/page-header.client";
import { OverviewContent } from "./overview-content.client";
import { OverviewStats } from "@/components/features/admin-dashboard/overview-stats";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ALL_SPACES } from "@/lib/config/config";
import {
  buildLoginUrlWithNext,
  buildPathWithSearch,
  type NextSearchParams,
} from "@/lib/utils/login-next";
import {
  getOverviewStats,
  getRecentProjects,
} from "@/lib/services/project/project.service";

const PREVIEW_SPACES_COUNT = 6;

interface PageProps {
  searchParams?: Promise<NextSearchParams>;
}

export default async function DashboardNewPage({ searchParams }: PageProps) {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  const sp = searchParams ? await searchParams : undefined;
  const nextPath = buildPathWithSearch("/dashboard", sp);

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

  const [recentProjects, stats] = await Promise.all([
    getRecentProjects(PREVIEW_SPACES_COUNT),
    getOverviewStats(),
  ]);
  const previewSpaces = ALL_SPACES.slice(0, PREVIEW_SPACES_COUNT);

  return (
    <DashboardShell>
      <PageHeader
        title="總覽"
        description="管理後台概覽與數據統計"
        iconName="LayoutDashboard"
      />

      <div className="flex-1 p-6 space-y-6">
        <OverviewStats data={stats} />
        <OverviewContent
          previewSpaces={previewSpaces}
          recentProjects={recentProjects}
        />
      </div>
    </DashboardShell>
  );
}
