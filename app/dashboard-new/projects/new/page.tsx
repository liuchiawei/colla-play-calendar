// 建立新專案頁面

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { DashboardShell } from "../../components/dashboard-shell.client";
import { PageHeader } from "../../components/page-header.client";
import { CreateProjectForm } from "./create-project-form.client";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { CREATE_PROJECT_PAGE } from "@/lib/message";
import { getAdminContactOptions } from "@/lib/services/admin-contact.service";
import {
  buildLoginUrlWithNext,
  buildPathWithSearch,
  type NextSearchParams,
} from "@/lib/utils/login-next";

interface PageProps {
  searchParams?: Promise<NextSearchParams>;
}

export default async function NewProjectPage({ searchParams }: PageProps) {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  const sp = searchParams ? await searchParams : undefined;
  const nextPath = buildPathWithSearch("/dashboard-new/projects/new", sp);

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

  const adminOptions = await getAdminContactOptions();
  return (
    <DashboardShell>
      <PageHeader
        title={CREATE_PROJECT_PAGE.pageTitle}
        description={CREATE_PROJECT_PAGE.pageDescription}
        iconName="FolderKanban"
      />

      <CreateProjectForm adminOptions={adminOptions} />
    </DashboardShell>
  );
}
