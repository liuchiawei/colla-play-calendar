// 活動審核 API Route - PATCH（管理員審核活動狀態）
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/services/auth/auth-server.service";
import { reviewEvent } from "@/lib/services/events/event.service";
import type { ApiResponse, EventWithCategory, EventReviewInput } from "@/lib/types";
import { z } from "zod";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// 審核輸入驗證規則
const reviewEventSchema = z.object({
  status: z.enum(["published", "rejected"]),
});

// PATCH /api/events/[id]/review - 管理員審核活動（更新狀態）
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // 檢查管理員權限
    const adminResult = await requireAdmin(request);
    if (adminResult instanceof NextResponse) {
      return adminResult;
    }

    const { userId: adminId } = adminResult;
    const { id: eventId } = await context.params;

    // 解析請求體
    const body = await request.json();
    const validatedData = reviewEventSchema.parse(body);

    // 使用 event service 審核活動
    const event = await reviewEvent(eventId, validatedData.status, adminId);

    return NextResponse.json<ApiResponse<EventWithCategory>>({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error("Failed to review event:", error);
    
    // 處理驗證錯誤
    if (error instanceof z.ZodError) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "狀態必須是 published 或 rejected",
        },
        { status: 400 }
      );
    }

    const errorMessage =
      error instanceof Error ? error.message : "審核活動失敗";
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
