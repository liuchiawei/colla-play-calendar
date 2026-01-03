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
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { EventWithCategory } from "@/lib/types";
import { cn } from "@/lib/utils";
import { EventDetailDialog } from "./event-detail-dialog";

interface EventCarouselClientProps {
  events: EventWithCategory[];
}

// 海報風格卡片組件
function EventPosterCard({
  event,
  onClick,
}: {
  event: EventWithCategory;
  onClick: () => void;
}) {
  const categoryColor = event.category?.color || "#6366f1";
  const imageUrl = event.imageBlobUrl || event.imageUrl;

  return (
    <Card
      className={cn(
        "group cursor-pointer rounded-sm shadow-lg transition-all hover:shadow-2xl hover:scale-105 origin-bottom",
        "h-full overflow-hidden select-none"
      )}
      onClick={onClick}
    >
      {/* 圖片區域 */}
      <div className="relative w-full aspect-[3/4] overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={event.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background: `linear-gradient(135deg, ${categoryColor}cc 0%, ${categoryColor}66 100%)`,
            }}
          />
        )}
        {/* 疊加層 - 從底部向上漸變 */}
        <div className="absolute inset-0 bg-gradient-to-bl from-black/20 to-transparent group-hover:from-black/80" />
        {/* 類別標籤 */}
        {event.category && (
          <div className="absolute top-3 left-3 z-10">
            <Badge
              style={{
                backgroundColor: categoryColor,
                color: "white",
                border: "none",
              }}
              className="shadow-lg"
            >
              {event.category.name}
            </Badge>
          </div>
        )}
        {/* 標題 - 疊加在圖片右上角 */}
        <div className="absolute top-3 right-3 z-10">
          <h3 className="text-sm md:text-base lg:text-xl leading-tight line-clamp-2 text-white tracking-widest [writing-mode:vertical-rl] text-shadow-lg">
            {event.title}
          </h3>
        </div>
      </div>
    </Card>
  );
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
