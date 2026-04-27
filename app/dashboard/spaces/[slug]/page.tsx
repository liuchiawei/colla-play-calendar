// 場域專案列表動態頁：Suspense + async 取數 + notFound
// 依 Vercel React 最佳實踐：server-cache-react、async-suspense-boundaries、server-serialization

import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { DashboardShell } from "../../components/dashboard-shell.client";
import { PageHeader } from "../../components/page-header.client";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getSpaceById } from "@/lib/config/config";
import { getProjectsBySpaceId } from "@/lib/services/project/project.service";
import { SPACE_DETAIL_PAGE } from "@/lib/message";
import { SpaceProjectsContent } from "./space-projects-content.client";
import {
  buildLoginUrlWithNext,
  buildPathWithSearch,
  type NextSearchParams,
} from "@/lib/utils/login-next";

function SpaceProjectsSkeleton() {
  return (
    <div className="flex-1 p-6 flex flex-col gap-6">
      <div className="h-9 w-32 rounded-lg bg-muted animate-pulse" />
      <div className="h-10 max-w-md rounded-lg bg-muted animate-pulse" />
      <div className="h-64 rounded-xl bg-muted animate-pulse" />
    </div>
  );
}

async function SpaceProjects({
  spaceId,
  spaceName,
}: {
  spaceId: string;
  spaceName: string;
}) {
  const projects = await getProjectsBySpaceId(spaceId);
  return <SpaceProjectsContent spaceName={spaceName} projects={projects} />;
}

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<NextSearchParams>;
}

/** 已廢除的場域 id（room1/room2）導向多功能教室 */
const DEPRECATED_SPACE_REDIRECT: Record<string, string> = {
  "4f-multipurpose-room-1": "4f-multipurpose-room",
  "4f-multipurpose-room-2": "4f-multipurpose-room",
};

export default async function SpaceDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;

  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  const sp = searchParams ? await searchParams : undefined;
  const nextPath = buildPathWithSearch(`/dashboard/spaces/${slug}`, sp);

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

  const redirectTarget = DEPRECATED_SPACE_REDIRECT[slug];
  if (redirectTarget) {
    redirect(`/dashboard/spaces/${redirectTarget}`);
  }

  const space = getSpaceById(slug);

  if (!space) {
    notFound();
  }

  return (
    <DashboardShell>
      <PageHeader
        title={space.name}
        description={SPACE_DETAIL_PAGE.description}
        iconName="Building2"
      />

      <Suspense fallback={<SpaceProjectsSkeleton />}>
        <SpaceProjects spaceId={slug} spaceName={space.name} />
      </Suspense>
    </DashboardShell>
  );
}
