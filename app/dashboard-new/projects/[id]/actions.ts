"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { updateProject as updateProjectService, deleteProject as deleteProjectService, updateProjectStatus as updateProjectStatusService } from "@/lib/services/project/project.service";
import type { UpdateProjectInput, ProjectWithRentals, ProjectStatus } from "@/lib/types/project";

export type UpdateProjectResult = { success: true; data: ProjectWithRentals } | { success: false; error: string };
export type DeleteProjectResult = { success: true } | { success: false; error: string };
export type UpdateProjectStatusResult = { success: true; data: ProjectWithRentals } | { success: false; error: string };

async function getSession() {
  const h = await headers();
  return auth.api.getSession({ headers: h });
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
