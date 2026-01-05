// Upcoming Events Service
// 取得未來的活動列表（最多10個），用於輪播組件顯示和 API 路由
import { unstable_cache } from "next/cache";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getAnonymousSessionId } from "@/lib/utils/registration";
import type { EventWithCategory, Category } from "@/lib/types";
import { headers } from "next/headers";

// 內部查詢函數（不帶快取）
// 查詢未來的活動列表（不包含用戶特定的註冊狀態）
async function fetchUpcomingEventsFromDB(): Promise<
  Array<{
    id: string;
    title: string;
    description: string | null;
    startTime: Date;
    endTime: Date;
    location: string | null;
    organizer: string | null;
    imageUrl: string | null;
    imageBlobUrl: string | null;
    imageBlobPathname: string | null;
    registrationUrl: string | null;
    price: string | null;
    categoryId: string | null;
    createdAt: Date;
    updatedAt: Date;
    category: Category | null;
    registrationCount: number;
  }>
> {
  const now = new Date();

  const events = await prisma.event.findMany({
    where: {
      startTime: {
        gte: now, // 只查詢未來的活動
      },
    },
    include: {
      category: true,
      _count: {
        select: { registrations: true },
      },
    },
    orderBy: {
      startTime: "asc", // 按開始時間升序排列（最近的在前）
    },
    take: 10, // 最多10個
  });

  // 轉換為前端格式（不包含用戶特定的 isRegistered）
  return events.map((event) => {
    const { _count, ...eventData } = event;
    return {
      ...eventData,
      registrationCount: _count.registrations,
    };
  });
}

/**
 * 獲取未來的活動列表（最多10個）
 * 包含用戶的註冊狀態（如果已登入或匿名）
 * 
 * @param requestHeaders - 可選的請求頭，用於 API 路由中獲取 session
 * @returns Promise<EventWithCategory[]>
 */
export async function getUpcomingEvents(
  requestHeaders?: Headers
): Promise<EventWithCategory[]> {
  try {
    // 取得當前用戶 ID（如果已登入）
    // 如果提供了 requestHeaders（API 路由），使用它；否則使用 headers()（Server Component）
    const session = requestHeaders
      ? await auth.api.getSession({ headers: requestHeaders })
      : await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id || null;

    // 取得匿名 session ID（如果未登入）
    let anonymousSessionId: string | undefined;
    if (!userId) {
      anonymousSessionId = await getAnonymousSessionId();
    }

    // 使用 unstable_cache 快取活動列表查詢結果
    // 所有用戶共享同一份活動列表快取（註冊狀態在後續添加）
    const getCachedUpcomingEvents = unstable_cache(
      async () => fetchUpcomingEventsFromDB(),
      ["upcoming-events"], // cache key
      {
        tags: ["upcoming-events"], // 快取標籤，用於 revalidateTag
        revalidate: 60, // 快取時間：60 秒
      }
    );

    // 獲取快取的活動列表
    const events = await getCachedUpcomingEvents();

    // 如果有用戶（登入或匿名），查詢註冊狀態
    // 這部分查詢較輕量，不需要快取
    let eventIdsWithRegistrations: Set<string> = new Set();
    if (userId || anonymousSessionId) {
      const registrations = await prisma.eventRegistration.findMany({
        where: {
          eventId: {
            in: events.map((e) => e.id),
          },
          OR: [
            userId ? { userId } : { id: "" },
            anonymousSessionId ? { anonymousSessionId } : { id: "" },
          ],
        },
        select: { eventId: true },
      });

      eventIdsWithRegistrations = new Set(
        registrations.map((reg) => reg.eventId)
      );
    }

    // 轉換為完整的 EventWithCategory 格式，添加註冊狀態
    const eventsWithCount: EventWithCategory[] = events.map((event) => {
      const { category, ...eventData } = event;
      return {
        ...eventData,
        category,
        isRegistered: eventIdsWithRegistrations.has(event.id),
      };
    });

    return eventsWithCount;
  } catch (error) {
    console.error("Failed to fetch upcoming events:", error);
    return [];
  }
}

