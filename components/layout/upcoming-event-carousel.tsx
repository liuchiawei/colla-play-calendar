// Event Carousel Component - Server Component
// 顯示未來的活動輪播（最多10個），採用海報貼牆設計風格

import { getUpcomingEvents } from "@/lib/services/events/upcoming-events.service";
import { EventCarouselClient } from "@/components/features/events/event-carousel-client";

// 主組件（Server Component）
export default async function UpcomingEventCarousel() {
  // 直接調用服務函數，無需通過 HTTP fetch
  const events = await getUpcomingEvents();

  return <EventCarouselClient events={events} />;
}
