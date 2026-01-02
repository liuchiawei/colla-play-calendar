// 活動已報名使用者列表 API Route
// GET: 獲取活動的已報名使用者（僅登入使用者，公開端點）

import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import type { ApiResponse } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// 從資料庫獲取已報名使用者
async function fetchRegisteredUsersFromDB(
  eventId: string
): Promise<Array<{ id: string; name: string | null; image: string | null }>> {
  const registrations = await prisma.eventRegistration.findMany({
    where: {
      eventId,
      userId: { not: null }, // 只顯示登入使用者的報名
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc", // 最新報名的在前
    },
    take: 20, // 限制回傳數量，避免過多資料
  });

  // 過濾並轉換格式
  return registrations
    .filter((reg) => reg.user !== null)
    .map((reg) => ({
      id: reg.user!.id,
      name: reg.user!.name,
      image: reg.user!.image,
    }));
}

// GET /api/events/[id]/registered-users - 獲取活動的已報名使用者列表
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: eventId } = await context.params;

    // 檢查活動是否存在
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true },
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

    // 使用 unstable_cache 快取查詢結果
    // Next.js 16 語法：使用 cache key 和 tags
    const getCachedRegisteredUsers = unstable_cache(
      async () => fetchRegisteredUsersFromDB(eventId),
      [`event-registered-users-${eventId}`], // cache key
      {
        tags: [`event-registered-users-${eventId}`], // 快取標籤，用於 revalidateTag
        revalidate: 60, // 快取時間：60 秒
      }
    );

    // 使用快取查詢已報名使用者
    const users = await getCachedRegisteredUsers();

    // 計算總數（包含匿名報名）
    const totalCount = await prisma.eventRegistration.count({
      where: { eventId },
    });

    return NextResponse.json<
      ApiResponse<{
        users: Array<{
          id: string;
          name: string | null;
          image: string | null;
        }>;
        total: number;
      }>
    >({
      success: true,
      data: {
        users,
        total: totalCount,
      },
    });
  } catch (error) {
    console.error("Failed to fetch registered users:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "取得報名使用者列表失敗",
      },
      { status: 500 }
    );
  }
}

