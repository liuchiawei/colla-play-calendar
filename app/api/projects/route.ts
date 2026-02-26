// POST /api/projects - 建立新專案（create-new-project）
// GET /api/projects - 專案列表
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/services/auth/auth-server.service";
import { createProject, getProjectsForList } from "@/lib/services/project/project.service";
import type { ApiResponse } from "@/lib/types";
import type { CreateProjectInput, ProjectWithRentals } from "@/lib/types/project";
import type { Project } from "@/lib/types/project";

function validateCreateProjectInput(
  body: unknown
): { ok: true; data: CreateProjectInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "請提供專案資料" };
  }
  const b = body as Record<string, unknown>;
  if (!b.contactName || typeof b.contactName !== "string" || !b.contactName.trim()) {
    return { ok: false, error: "聯絡人姓名為必填" };
  }
  if (!b.contactPhone || typeof b.contactPhone !== "string" || !b.contactPhone.trim()) {
    return { ok: false, error: "聯絡電話為必填" };
  }
  if (!b.eventOrVenueUse || typeof b.eventOrVenueUse !== "string" || !b.eventOrVenueUse.trim()) {
    return { ok: false, error: "活動或場地用途為必填" };
  }
  if (!b.collaPlayContactId || typeof b.collaPlayContactId !== "string" || !b.collaPlayContactId.trim()) {
    return { ok: false, error: "CollaPlay 窗口為必填" };
  }
  if (!Array.isArray(b.rentals) || b.rentals.length < 1) {
    return { ok: false, error: "至少需一筆租借項目" };
  }
  for (let i = 0; i < b.rentals.length; i++) {
    const r = b.rentals[i];
    if (!r || typeof r !== "object") {
      return { ok: false, error: `第 ${i + 1} 筆租借項目格式錯誤` };
    }
    const rental = r as Record<string, unknown>;
    if (!Array.isArray(rental.spaceIds) || rental.spaceIds.length < 1) {
      return { ok: false, error: `第 ${i + 1} 筆租借項目至少需選擇一個場域` };
    }
    const startTime = typeof rental.startTime === "string" ? rental.startTime : "";
    const endTime = typeof rental.endTime === "string" ? rental.endTime : "";
    if (!startTime || !endTime || endTime <= startTime) {
      return { ok: false, error: `第 ${i + 1} 筆租借項目：結束時間必須晚於開始時間` };
    }
  }
  const data = body as CreateProjectInput;
  return { ok: true, data };
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const projects = await getProjectsForList();

    return NextResponse.json<ApiResponse<Project[]>>(
      { success: true, data: projects },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    const message =
      error instanceof Error ? error.message : "專案列表取得失敗";
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body: unknown = await request.json();
    const validated = validateCreateProjectInput(body);
    if (!validated.ok) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: validated.error },
        { status: 400 }
      );
    }

    const project = await createProject(validated.data);

    return NextResponse.json<ApiResponse<ProjectWithRentals>>(
      { success: true, data: project },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create project:", error);
    const message =
      error instanceof Error ? error.message : "專案建立失敗";
    const isValidation =
      message.includes("至少需一筆") ||
      message.includes("至少需選擇一個場域") ||
      message.includes("結束時間必須晚於開始時間");
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: message },
      { status: isValidation ? 400 : 500 }
    );
  }
}
