// Profile Events API Route - GET
// 取得目前登入使用者的所有報名活動
import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { requireAuth } from "@/lib/services/auth/auth-server.service";
import prisma from "@/lib/prisma";
import type { ApiResponse, EventWithCategory } from "@/lib/types";

// 使用者活動響應型別
export type UserEventsResponse = {
  events: EventWithCategory[];
};

// 內部查詢函數（不帶快取）
async function fetchUserEventsFromDB(
  userId: string
): Promise<EventWithCategory[]> {
  // 查詢使用者的所有報名記錄，包含活動和類別資訊
  // 一次查詢所有資料，避免 N+1 問題
  const registrations = await prisma.eventRegistration.findMany({
    where: {
      userId, // 只查詢登入使用者的報名記錄
    },
    include: {
      event: {
        include: {
          category: true,
          _count: {
            select: { registrations: true },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc", // 依報名時間降序排列
    },
  });

  // 轉換為 EventWithCategory 格式
  // 所有查詢到的活動都是使用者已報名的，所以 isRegistered 為 true
  return registrations.map((registration) => {
    const { event } = registration;
    const { _count, ...eventData } = event;
    return {
      ...eventData,
      category: event.category,
      registrationCount: _count.registrations,
      isRegistered: true, // 所有查詢到的活動都是已報名的
    };
  });
}

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

    // 為每個使用者創建獨立的快取函數
    // 使用 unstable_cache 包裝資料庫查詢，減少重複查詢
    // cache key 和 tags 都包含 userId 以確保使用者隔離
    const getCachedUserEvents = unstable_cache(
      async () => fetchUserEventsFromDB(userId),
      [`user-events-${userId}`], // cache key，包含 userId
      {
        tags: [`user-events-${userId}`], // 快取標籤，用於 revalidateTag
        revalidate: 60, // 快取時間：60 秒
      }
    );

    // 使用快取查詢使用者活動
    const events = await getCachedUserEvents();

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
