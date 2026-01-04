// 活動報名列表 API Route (僅管理員)
// GET: 獲取活動的所有報名記錄

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/services/auth/auth-server.service";
import prisma from "@/lib/prisma";
import type { ApiResponse, EventRegistrationWithUser } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/events/[id]/registrations - 獲取活動的報名列表（僅管理員）
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    // 使用統一的認證服務檢查管理員權限（帶快取）
    const adminResult = await requireAdmin(request);

    // 如果未登入或不是管理員，requireAdmin 會返回 NextResponse
    if (adminResult instanceof NextResponse) {
      return adminResult;
    }

    const { id: eventId } = await context.params;

    // 檢查活動是否存在
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "活動不存在",
        },
        { status: 404 }
      );
    }

    // 獲取報名列表
    const registrations = await prisma.eventRegistration.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 轉換為前端需要的格式
    const registrationsWithUser: EventRegistrationWithUser[] = registrations.map((reg) => ({
      ...reg,
      user: reg.user
        ? {
            id: reg.user.id,
            name: reg.user.name,
            email: reg.user.email,
            image: reg.user.image,
          }
        : null,
    }));

    return NextResponse.json<ApiResponse<EventRegistrationWithUser[]>>({
      success: true,
      data: registrationsWithUser,
    });
  } catch (error) {
    console.error("Failed to fetch event registrations:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "取得報名列表失敗",
      },
      { status: 500 }
    );
  }
}


