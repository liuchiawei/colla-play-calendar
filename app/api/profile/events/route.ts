// Profile Events API Route - GET
// 取得目前登入使用者的所有報名活動
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/services/auth/auth-server.service";
import { getUserEvents } from "@/lib/services/profile/profile.service";
import type { ApiResponse, EventWithCategory } from "@/lib/types";

// 使用者活動響應型別
export type UserEventsResponse = {
  events: EventWithCategory[];
};

// GET /api/profile/events - 取得目前登入使用者的所有報名活動
export async function GET(request: NextRequest) {
  try {
    // 使用統一的認證服務檢查登入狀態
    const authResult = await requireAuth(request);

    // 如果未登入，requireAuth 會返回 NextResponse
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { userId } = authResult;

    // 使用 profile service 取得使用者活動紀錄（含快取）
    const events = await getUserEvents(userId);

    return NextResponse.json<ApiResponse<UserEventsResponse>>({
      success: true,
      data: { events },
    });
  } catch (error) {
    console.error("Failed to fetch user events:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "取得活動記錄失敗",
      },
      { status: 500 }
    );
  }
}
