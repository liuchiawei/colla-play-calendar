"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  updateProject as updateProjectService,
  deleteProject as deleteProjectService,
  updateProjectStatus as updateProjectStatusService,
  deleteProjectRental,
  updateProjectRental,
} from "@/lib/services/project/project.service";
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
    return { success: true, data };
  } catch (e) {
    const message = e instanceof Error ? e.message : "更新失敗";
    return { success: false, error: message };
  }
}
