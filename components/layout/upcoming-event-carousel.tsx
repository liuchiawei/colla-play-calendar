// Event Carousel Component - Server Component
// 顯示未來的活動輪播（最多10個），採用海報貼牆設計風格

import { headers } from "next/headers";
import type { EventWithCategory } from "@/lib/types";
import { EventCarouselClient } from "@/components/features/events/event-carousel-client";

// 從 API 端點獲取未來活動資料
async function fetchUpcomingEvents(): Promise<EventWithCategory[]> {
  try {
    // 在 Server Component 中，使用絕對 URL 調用內部 API
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const headersList = await headers();
    const cookie = headersList.get("cookie") || "";

    const response = await fetch(`${baseUrl}/api/events/upcoming`, {
      headers: {
        cookie,
      },
      // 不使用 cache: "no-store"，讓 API 端點的快取邏輯生效
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      console.error("Failed to fetch upcoming events:", response.statusText);
      return [];
    }

    const data = await response.json();
    if (data.success && data.data) {
      return data.data;
    }

    return [];
  } catch (error) {
    console.error("Error fetching upcoming events:", error);
    return [];
  }
}

// 主組件（Server Component）
export default async function UpcomingEventCarousel() {
  const events = await fetchUpcomingEvents();

  return <EventCarouselClient events={events} />;
}
