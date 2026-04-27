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
import { getCachedProjectById } from "@/lib/services/project/project.service";
import type { ProjectFormValues } from "@/lib/config/project-form-config";
import { buildDuplicateProjectPrefill } from "@/lib/utils/project-duplicate";
import {
  buildLoginUrlWithNext,
  buildPathWithSearch,
  type NextSearchParams,
} from "@/lib/utils/login-next";

interface PageProps {
  searchParams?: Promise<NextSearchParams>;
}

function parseDuplicateFrom(sp: NextSearchParams | undefined): string | null {
  if (!sp) return null;
  const raw = sp.duplicateFrom;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed ? trimmed : null;
}

export default async function NewProjectPage({ searchParams }: PageProps) {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  const sp = searchParams ? await searchParams : undefined;
  const nextPath = buildPathWithSearch("/dashboard/projects/new", sp);

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
  const duplicateFrom = parseDuplicateFrom(sp);

  let prefill: Partial<ProjectFormValues> | undefined;
  if (duplicateFrom) {
    const src = await getCachedProjectById(duplicateFrom);
    if (src) {
      prefill = buildDuplicateProjectPrefill(src);
    }
  }
  return (
    <DashboardShell>
      <PageHeader
        title={CREATE_PROJECT_PAGE.pageTitle}
        description={CREATE_PROJECT_PAGE.pageDescription}
        iconName="FolderKanban"
      />

      <CreateProjectForm adminOptions={adminOptions} prefill={prefill} />
    </DashboardShell>
  );
}
