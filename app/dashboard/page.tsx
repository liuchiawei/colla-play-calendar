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
import {
  buildLoginUrlWithNext,
  buildPathWithSearch,
  type NextSearchParams,
} from "@/lib/utils/login-next";
import {
  getOverviewStats,
  getRecentProjects,
  getRecentUpcomingProjects,
} from "@/lib/services/project/project.service";

const CREATED_WITHIN_DAYS = 14;
const UPCOMING_WINDOW_DAYS = 28;

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

  const [recentProjects, upcomingProjects, stats] = await Promise.all([
    getRecentProjects(CREATED_WITHIN_DAYS),
    getRecentUpcomingProjects(UPCOMING_WINDOW_DAYS, CREATED_WITHIN_DAYS),
    getOverviewStats(),
  ]);

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
          recentProjects={recentProjects}
          upcomingProjects={upcomingProjects}
        />
      </div>
    </DashboardShell>
  );
}
