// Upcoming Events API Route - GET
// 取得未來的活動列表（最多10個），用於輪播組件顯示
import { NextRequest, NextResponse } from "next/server";
import { getUpcomingEvents } from "@/lib/services/events/upcoming-events.service";
import type { ApiResponse, EventWithCategory } from "@/lib/types";

// GET /api/events/upcoming - 取得未來的活動列表（最多10個）
export async function GET(request: NextRequest) {
  try {
    // 使用共享服務函數獲取活動列表
    // 傳入 request.headers 以便服務函數獲取用戶 session
    const events = await getUpcomingEvents(request.headers);

    return NextResponse.json<ApiResponse<EventWithCategory[]>>({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error("Failed to fetch upcoming events:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "取得未來活動失敗",
      },
      { status: 500 }
    );
  }
}
