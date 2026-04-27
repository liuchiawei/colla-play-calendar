"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  ADMIN_PROJECTS_LIST_CACHE_TAG,
  updateProject as updateProjectService,
  deleteProject as deleteProjectService,
  updateProjectStatus as updateProjectStatusService,
  deleteProjectRental,
  updateProjectRental,
  getProjectById,
} from "@/lib/services/project/project.service";
import { getAdminContactOptions } from "@/lib/services/admin-contact.service";
import {
  buildProjectDetailCsv,
  getProjectDetailCsvFilename,
} from "@/lib/services/project/project-detail-csv.service";
import type {
  UpdateProjectInput,
  UpdateRentalInput,
  ProjectWithRentals,
  ProjectStatus,
} from "@/lib/types/project";

export type UpdateProjectResult = { success: true; data: ProjectWithRentals } | { success: false; error: string };
export type DeleteProjectResult = { success: true } | { success: false; error: string };
export type UpdateProjectStatusResult = { success: true; data: ProjectWithRentals } | { success: false; error: string };
export type DeleteRentalResult = { success: true } | { success: false; error: string };
export type UpdateRentalResult =
  | { success: true; data: ProjectWithRentals["rentals"][0] }
  | { success: false; error: string };
export type DownloadProjectDetailCsvResult =
  | { success: true; csv: string; filename: string }
  | { success: false; error: string };

async function getSession() {
  const h = await headers();
  return auth.api.getSession({ headers: h });
}

async function requireAdmin(): Promise<{ success: false; error: string } | null> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "需要登入" };
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  });
  if (!user?.isAdmin) {
    return { success: false, error: "無權限" };
  }
  return null;
}

export async function updateProject(id: string, input: UpdateProjectInput): Promise<UpdateProjectResult> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "需要登入" };
  }
  try {
    const data = await updateProjectService(id, input);
    revalidatePath("/dashboard-new/projects");
    revalidatePath(`/dashboard-new/projects/${id}`);
    revalidateTag(ADMIN_PROJECTS_LIST_CACHE_TAG, "max");
    return { success: true, data };
  } catch (e) {
    const message = e instanceof Error ? e.message : "更新失敗";
    return { success: false, error: message };
  }
}

export async function deleteProject(id: string): Promise<DeleteProjectResult> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "需要登入" };
  }
  try {
    await deleteProjectService(id);
    revalidatePath("/dashboard-new/projects");
    revalidateTag(ADMIN_PROJECTS_LIST_CACHE_TAG, "max");
    redirect("/dashboard-new/projects");
  } catch (e) {
    const message = e instanceof Error ? e.message : "刪除失敗";
    return { success: false, error: message };
  }
}

export async function deleteRental(rentalId: string): Promise<DeleteRentalResult> {
  const authError = await requireAdmin();
  if (authError) return authError;
  try {
    const { projectId } = await deleteProjectRental(rentalId);
    revalidatePath("/dashboard-new/projects");
    revalidatePath(`/dashboard-new/projects/${projectId}`);
    revalidateTag(ADMIN_PROJECTS_LIST_CACHE_TAG, "max");
    return { success: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "移除失敗";
    return { success: false, error: message };
  }
}

export async function updateRental(
  rentalId: string,
  input: UpdateRentalInput,
): Promise<UpdateRentalResult> {
  const authError = await requireAdmin();
  if (authError) return authError;
  try {
    const data = await updateProjectRental(rentalId, input);
    revalidatePath("/dashboard-new/projects");
    revalidatePath(`/dashboard-new/projects/${data.projectId}`);
    revalidateTag(ADMIN_PROJECTS_LIST_CACHE_TAG, "max");
    return { success: true, data };
  } catch (e) {
    const message = e instanceof Error ? e.message : "更新失敗";
    return { success: false, error: message };
  }
}

export async function updateProjectStatus(id: string, status: ProjectStatus): Promise<UpdateProjectStatusResult> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "需要登入" };
  }
  try {
    const data = await updateProjectStatusService(id, status);
    revalidatePath("/dashboard-new/projects");
    revalidatePath(`/dashboard-new/projects/${id}`);
    revalidateTag(ADMIN_PROJECTS_LIST_CACHE_TAG, "max");
    return { success: true, data };
  } catch (e) {
    const message = e instanceof Error ? e.message : "更新失敗";
    return { success: false, error: message };
  }
}

export async function downloadProjectDetailCsv(
  id: string,
): Promise<DownloadProjectDetailCsvResult> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "需要登入" };
  }
  try {
    const [project, adminOptions] = await Promise.all([
      getProjectById(id),
      getAdminContactOptions(),
    ]);
    if (!project) {
      return { success: false, error: "找不到此專案" };
    }
    const collaPlayContactDisplayName =
      adminOptions.find((o) => o.id === project.collaPlayContactId)?.name ??
      project.collaPlayContactId;
    const csv = buildProjectDetailCsv(project, collaPlayContactDisplayName);
    const filename = getProjectDetailCsvFilename(project);
    return { success: true, csv, filename };
  } catch (e) {
    const message = e instanceof Error ? e.message : "下載失敗";
    return { success: false, error: message };
  }
}
