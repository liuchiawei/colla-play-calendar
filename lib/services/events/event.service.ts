/**
 * 活動事件服務 (Event Service)
 *
 * 提供活動事件相關的業務邏輯處理，包括創建、獲取、審核等
 * 使用 Next.js unstable_cache 優化性能，減少資料庫查詢
 */

import { unstable_cache } from "next/cache";
import { revalidateTag } from "next/cache";
import prisma from "@/lib/prisma";
import type {
  EventWithCategory,
  EventInput,
  EventStatus,
  EventReviewInput,
} from "@/lib/types";

/**
 * 從資料庫創建活動（內部函數）
 *
 * @param userId 創建者 ID
 * @param data 活動資料
 * @returns Promise<EventWithCategory>
 */
async function createEventInDb(
  userId: string,
  data: EventInput
): Promise<EventWithCategory> {
  try {
    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);

    // 驗證日期
    if (endTime <= startTime) {
      throw new Error("結束時間必須晚於開始時間");
    }

    // 決定狀態：如果用戶指定了 status，使用該狀態；否則設為 pending
    const status: EventStatus = data.status || "pending";

    const event = await prisma.event.create({
      data: {
        title: data.title,
        description: data.description || null,
        startTime,
        endTime,
        location: data.location || null,
        organizer: data.organizer || null,
        imageUrl: data.imageUrl || null,
        imageBlobUrl: data.imageBlobUrl || null,
        imageBlobPathname: data.imageBlobPathname || null,
        registrationUrl: data.registrationUrl || null,
        price: data.price || null,
        categoryId: data.categoryId || null,
        status,
        createdBy: userId,
      },
      include: {
        category: true,
      },
    });

    return event as EventWithCategory;
  } catch (error) {
    console.error("[Event Service] Failed to create event in DB:", error);
    throw error;
  }
}

/**
 * 創建活動
 *
 * 創建後會自動清除相關快取
 *
 * @param userId 創建者 ID
 * @param data 活動資料
 * @returns Promise<EventWithCategory>
 */
export async function createEvent(
  userId: string,
  data: EventInput
): Promise<EventWithCategory> {
  if (!userId) {
    throw new Error("用戶 ID 為必填");
  }

  const event = await createEventInDb(userId, data);

  // 清除相關快取
  revalidateTag(`user-events-${userId}`, "max");
  revalidateTag("user-events", "max");
  revalidateTag("events", "max");
  revalidateTag(`events-status-${event.status}`, "max");

  return event;
}

/**
 * 從資料庫獲取用戶創建的活動（內部函數，用於快取）
 *
 * @param userId 用戶 ID
 * @returns Promise<EventWithCategory[]>
 */
async function fetchUserEventsFromDb(
  userId: string
): Promise<EventWithCategory[]> {
  try {
    const events = await prisma.event.findMany({
      where: {
        createdBy: userId,
      },
      include: {
        category: true,
        _count: {
          select: { registrations: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return events.map((event) => {
      const { _count, ...eventData } = event;
      return {
        ...eventData,
        registrationCount: _count.registrations,
      } as EventWithCategory;
    });
  } catch (error) {
    console.error(
      "[Event Service] Failed to fetch user events from DB:",
      error
    );
    return [];
  }
}

/**
 * 取得用戶創建的活動（帶快取）
 *
 * 使用 Next.js unstable_cache 快取查詢結果：
 * - 快取 key: `user-events-${userId}`
 * - 快取 tag: `user-events-${userId}`, `user-events`
 * - TTL: 60 秒
 *
 * @param userId 用戶 ID
 * @returns Promise<EventWithCategory[]>
 */
export async function getUserEvents(
  userId: string
): Promise<EventWithCategory[]> {
  if (!userId) {
    return [];
  }

  try {
    const cachedUserEvents = await unstable_cache(
      async () => fetchUserEventsFromDb(userId),
      [`user-events-${userId}`], // 快取 key
      {
        tags: [`user-events-${userId}`, "user-events"], // 快取標籤
        revalidate: 60, // 60 秒 TTL
      }
    )();

    return cachedUserEvents;
  } catch (error) {
    console.error("[Event Service] Failed to get user events:", error);
    return [];
  }
}

/**
 * 從資料庫獲取指定狀態的活動（內部函數，用於快取）
 *
 * @param status 活動狀態
 * @returns Promise<EventWithCategory[]>
 */
async function fetchEventsByStatusFromDb(
  status: EventStatus
): Promise<EventWithCategory[]> {
  try {
    const events = await prisma.event.findMany({
      where: {
        status,
      },
      include: {
        category: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        _count: {
          select: { registrations: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return events.map((event) => {
      const { _count, ...eventData } = event;
      return {
        ...eventData,
        registrationCount: _count.registrations,
      } as EventWithCategory;
    });
  } catch (error) {
    console.error(
      "[Event Service] Failed to fetch events by status from DB:",
      error
    );
    return [];
  }
}

/**
 * 根據狀態獲取活動列表（帶快取）
 *
 * 使用 Next.js unstable_cache 快取查詢結果：
 * - 快取 key: `events-status-${status}`
 * - 快取 tag: `events-status-${status}`, `events`
 * - TTL: 60 秒
 *
 * @param status 活動狀態
 * @returns Promise<EventWithCategory[]>
 */
export async function getEventsByStatus(
  status: EventStatus
): Promise<EventWithCategory[]> {
  try {
    const cachedEvents = await unstable_cache(
      async () => fetchEventsByStatusFromDb(status),
      [`events-status-${status}`], // 快取 key
      {
        tags: [`events-status-${status}`, "events"], // 快取標籤
        revalidate: 60, // 60 秒 TTL
      }
    )();

    return cachedEvents;
  } catch (error) {
    console.error("[Event Service] Failed to get events by status:", error);
    return [];
  }
}

/**
 * 審核活動（更新狀態）
 *
 * 審核後會自動清除相關快取
 *
 * @param eventId 活動 ID
 * @param status 新狀態
 * @param adminId 管理員 ID（用於記錄）
 * @returns Promise<EventWithCategory>
 */
export async function reviewEvent(
  eventId: string,
  status: EventStatus,
  adminId: string
): Promise<EventWithCategory> {
  if (!eventId || !status) {
    throw new Error("活動 ID 和狀態為必填");
  }

  // 驗證狀態（審核只能設為 published 或 rejected）
  if (status !== "published" && status !== "rejected") {
    throw new Error("審核狀態只能是 published 或 rejected");
  }

  try {
    // 檢查活動是否存在
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, status: true, createdBy: true },
    });

    if (!existingEvent) {
      throw new Error("活動不存在");
    }

    // 更新活動狀態
    const event = await prisma.event.update({
      where: { id: eventId },
      data: {
        status,
      },
      include: {
        category: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        _count: {
          select: { registrations: true },
        },
      },
    });

    const { _count, ...eventData } = event;
    const updatedEvent = {
      ...eventData,
      registrationCount: _count.registrations,
    } as EventWithCategory;

    // 清除相關快取
    revalidateTag(`events-status-${existingEvent.status}`, "max");
    revalidateTag(`events-status-${status}`, "max");
    revalidateTag("events", "max");
    if (existingEvent.createdBy) {
      revalidateTag(`user-events-${existingEvent.createdBy}`, "max");
      revalidateTag("user-events", "max");
    }

    return updatedEvent;
  } catch (error) {
    console.error("[Event Service] Failed to review event:", error);
    throw error;
  }
}
