"use client";

// Event Carousel Client Component
// 實現輪播功能和海報風格卡片設計

import * as React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import type { EventWithCategory } from "@/lib/types";
import { EventPosterCard } from "./event-poster-card";
import { EventDetailDialog } from "./event-detail-dialog";

interface EventCarouselClientProps {
  events: EventWithCategory[];
}



// 主 Client Component
export function EventCarouselClient({ events }: EventCarouselClientProps) {
  const [selectedEvent, setSelectedEvent] =
    React.useState<EventWithCategory | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  // 處理活動點擊
  const handleEventClick = React.useCallback((event: EventWithCategory) => {
    setSelectedEvent(event);
    setIsDialogOpen(true);
  }, []);

  // 處理對話框關閉
  const handleDialogClose = React.useCallback((open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setSelectedEvent(null);
    }
  }, []);

  // 如果沒有活動，顯示空狀態
  if (!events || events.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-center">
        <div className="text-muted-foreground">
          <p className="text-lg font-medium">目前沒有未來的活動</p>
          <p className="text-sm mt-2">請稍後再來查看</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full overflow-x-hidden">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {events.map((event) => (
              <CarouselItem
                key={event.id}
                className="pl-12 md:pl-21 lg:pl-27 basis-1/2 md:basis-1/3 lg:basis-1/4"
              >
                <div className="py-18 md:py-27 lg:py-36">
                  <EventPosterCard
                    event={event}
                    onClick={() => handleEventClick(event)}
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-4 hover:backdrop-blur-sm dark:shadow-white/20 hover:bg-accent/50 hover:text-accent-foreground dark:hover:bg-accent/50 hover:shadow-xl hover:scale-110 transition-all duration-300" />
          <CarouselNext className="right-4 hover:backdrop-blur-sm dark:shadow-white/20 hover:bg-accent/50 hover:text-accent-foreground dark:hover:bg-accent/50 hover:shadow-xl hover:scale-110 transition-all duration-300" />
        </Carousel>
      </div>
      {/* 活動詳情對話框 */}
      <EventDetailDialog
        event={selectedEvent}
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
      />
    </>
  );
}
