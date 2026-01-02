// 活動報名 API Route
// POST: 報名活動, DELETE: 取消報名, GET: 查詢報名狀態

import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getOrCreateAnonymousSessionId, getAnonymousSessionId } from "@/lib/utils/registration";
import type { ApiResponse } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// POST /api/events/[id]/register - 報名活動
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: eventId } = await context.params;

    // 取得登入狀態
    const session = await auth.api.getSession({ headers: request.headers });
    const userId = session?.user?.id || null;

    // 取得匿名 session ID（如果未登入）
    let anonymousSessionId: string | undefined;
    if (!userId) {
      anonymousSessionId = await getOrCreateAnonymousSessionId();
    }

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

    // 檢查是否已報名
    const existingRegistration = await prisma.eventRegistration.findFirst({
      where: {
        eventId,
        OR: [
          userId ? { userId } : { id: "" }, // 空字串永遠不會匹配
          anonymousSessionId ? { anonymousSessionId } : { id: "" },
        ],
      },
    });

    if (existingRegistration) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "您已經報名過此活動",
        },
        { status: 400 }
      );
    }

    // 創建報名記錄
    const registration = await prisma.eventRegistration.create({
      data: {
        eventId,
        userId: userId || null,
        anonymousSessionId: anonymousSessionId || null,
      },
    });

    // 如果有 userId，清除該使用者的活動快取
    // 使用 Next.js 16 語法：revalidateTag 的第二個參數為必須
    if (userId) {
      revalidateTag(`user-events-${userId}`, "max");
    }

    // 清除活動已報名使用者列表快取
    revalidateTag(`event-registered-users-${eventId}`, "max");

    return NextResponse.json<ApiResponse<{ id: string }>>(
      {
        success: true,
        data: { id: registration.id },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Failed to register event:", error);

    // 處理唯一約束違規（重複報名）
    if (error.code === "P2002") {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "您已經報名過此活動",
        },
        { status: 400 }
      );
    }

    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "報名失敗，請再試一次",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id]/register - 取消報名
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id: eventId } = await context.params;

    // 取得登入狀態
    const session = await auth.api.getSession({ headers: request.headers });
    const userId = session?.user?.id || null;

    // 取得匿名 session ID（如果未登入）
    let anonymousSessionId: string | undefined;
    if (!userId) {
      anonymousSessionId = await getAnonymousSessionId();
    }

    // 找到報名記錄
    const registration = await prisma.eventRegistration.findFirst({
      where: {
        eventId,
        OR: [
          userId ? { userId } : { id: "" },
          anonymousSessionId ? { anonymousSessionId } : { id: "" },
        ],
      },
    });

    if (!registration) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "您尚未報名此活動",
        },
        { status: 404 }
      );
    }

    // 刪除報名記錄
    await prisma.eventRegistration.delete({
      where: { id: registration.id },
    });

    // 如果有 userId，清除該使用者的活動快取
    // 使用 Next.js 16 語法：revalidateTag 的第二個參數為必須
    if (userId) {
      revalidateTag(`user-events-${userId}`, "max");
    }

    // 清除活動已報名使用者列表快取
    revalidateTag(`event-registered-users-${eventId}`, "max");

    return NextResponse.json<ApiResponse<{ id: string }>>({
      success: true,
      data: { id: registration.id },
    });
  } catch (error) {
    console.error("Failed to cancel registration:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "取消報名失敗，請再試一次",
      },
      { status: 500 }
    );
  }
}

// GET /api/events/[id]/register - 查詢報名狀態
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: eventId } = await context.params;

    // 取得登入狀態
    const session = await auth.api.getSession({ headers: request.headers });
    const userId = session?.user?.id || null;

    // 取得匿名 session ID（如果未登入）
    let anonymousSessionId: string | undefined;
    if (!userId) {
      anonymousSessionId = await getAnonymousSessionId();
    }

    // 查詢報名記錄
    const registration = await prisma.eventRegistration.findFirst({
      where: {
        eventId,
        OR: [
          userId ? { userId } : { id: "" },
          anonymousSessionId ? { anonymousSessionId } : { id: "" },
        ],
      },
    });

    return NextResponse.json<ApiResponse<{ isRegistered: boolean }>>({
      success: true,
      data: { isRegistered: !!registration },
    });
  } catch (error) {
    console.error("Failed to check registration status:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "查詢報名狀態失敗",
      },
      { status: 500 }
    );
  }
}


