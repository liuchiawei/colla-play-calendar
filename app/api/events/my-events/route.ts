// 我的活動 API Route - GET（獲取當前用戶創建的所有活動）
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/services/auth/auth-server.service";
import { getUserEvents } from "@/lib/services/events/event.service";
import type { ApiResponse, EventWithCategory } from "@/lib/types";

// GET /api/events/my-events - 獲取當前登入用戶創建的所有活動
export async function GET(request: NextRequest) {
  try {
    // 檢查登入狀態
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { userId } = authResult;

    // 使用 event service 獲取用戶創建的活動
    const events = await getUserEvents(userId);

    return NextResponse.json<ApiResponse<EventWithCategory[]>>({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error("Failed to fetch user events:", error);
    const errorMessage =
      error instanceof Error ? error.message : "獲取活動列表失敗";
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
