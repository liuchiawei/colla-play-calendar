"use client";

// Event Carousel Client Component
// 實現輪播功能和海報風格卡片設計

import { useRouter } from "next/navigation";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatTime } from "@/lib/date-utils";
import type { EventWithCategory } from "@/lib/types";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventCarouselClientProps {
  events: EventWithCategory[];
}

// 海報風格卡片組件
function EventPosterCard({ event }: { event: EventWithCategory }) {
  const router = useRouter();
  const categoryColor = event.category?.color || "#6366f1";
  const imageUrl = event.imageBlobUrl || event.imageUrl;

  const handleClick = () => {
    router.push(`/event/${event.id}`);
  };

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-2xl hover:scale-105",
        "h-full flex flex-col"
      )}
      onClick={handleClick}
    >
      {/* 圖片區域 */}
      <div className="relative w-full aspect-[4/3] overflow-hidden rounded-t-lg">
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
        {/* 疊加層 */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
        {/* 類別標籤 */}
        {event.category && (
          <div className="absolute top-3 right-3">
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
      </div>

      {/* 內容區域 */}
      <CardHeader className="flex-1 flex flex-col gap-3 pb-3">
        <h3 className="text-lg font-bold leading-tight line-clamp-2">
          {event.title}
        </h3>
        <div className="space-y-2 text-sm">
          {/* 日期時間 */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 shrink-0" />
            <span>{formatDate(event.startTime)}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 shrink-0" />
            <span>
              {formatTime(event.startTime)} - {formatTime(event.endTime)}
            </span>
          </div>
          {/* 地點 */}
          {event.location && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
          {/* 報名人數 */}
          {event.registrationCount !== undefined && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4 shrink-0" />
              <span>
                {event.registrationCount > 0
                  ? `${event.registrationCount} 人已報名`
                  : "尚未有人報名"}
              </span>
            </div>
          )}
        </div>
      </CardHeader>
    </Card>
  );
}

// 主 Client Component
export function EventCarouselClient({ events }: EventCarouselClientProps) {
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
    <div className="w-full overflow-x-hidden">
      <Carousel
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full overflow-x-hidden"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {events.map((event) => (
            <CarouselItem
              key={event.id}
              className="pl-4 md:pl-18 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
            >
              <div className="p-1">
                <EventPosterCard event={event} />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-0 md:-left-12" />
        <CarouselNext className="right-0 md:-right-12" />
      </Carousel>
    </div>
  );
}
