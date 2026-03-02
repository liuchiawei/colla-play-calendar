// 專案詳情動態頁：Suspense + async 取數 + notFound

import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "../../components/dashboard-shell.client";
import { PageHeader } from "../../components/page-header.client";
import { getProjectById } from "@/lib/services/project/project.service";
import { getAdminContactOptions } from "@/lib/services/admin-contact.service";
import { PROJECT_DETAIL_PAGE } from "@/lib/message";
import { ProjectDetailContent } from "./project-detail-content.client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

function ProjectDetailSkeleton() {
  return (
    <div className="flex-1 p-6 flex flex-col gap-6">
      <div className="h-10 w-48 rounded-lg bg-muted animate-pulse" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-32 rounded-xl bg-muted animate-pulse" />
        <div className="h-32 rounded-xl bg-muted animate-pulse" />
      </div>
      <div className="h-64 rounded-xl bg-muted animate-pulse" />
    </div>
  );
}

async function ProjectDetail({ id }: { id: string }) {
  const [project, adminOptions] = await Promise.all([
    getProjectById(id),
    getAdminContactOptions(),
  ]);
  if (!project) {
    notFound();
  }
  return <ProjectDetailContent project={project} adminOptions={adminOptions} />;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <DashboardShell>
      <PageHeader
        title={PROJECT_DETAIL_PAGE.title}
        description={PROJECT_DETAIL_PAGE.description}
        iconName="FolderKanban"
      />

      <div className="flex-1 p-6 flex flex-col gap-6">
        <Link href="/dashboard-new/projects" className="self-start">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="size-4" />
            {PROJECT_DETAIL_PAGE.buttonBackToList}
          </Button>
        </Link>

        <Suspense fallback={<ProjectDetailSkeleton />}>
          <ProjectDetail id={id} />
        </Suspense>
      </div>
    </DashboardShell>
  );
}
