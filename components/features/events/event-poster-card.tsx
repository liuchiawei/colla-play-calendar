// 活動海報風格卡片組件
// 顯示單一活動的基本資訊，點擊時觸發回調

import type { EventWithCategory } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatTime } from "@/lib/date-utils";

export function EventPosterCard({
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
        <div className="absolute inset-0 p-3 grid grid-cols-2 bg-gradient-to-bl from-black/20 to-transparent group-hover:from-black/80 select-none pointer-events-none z-10">
          {/* 類別標籤 - 左上角 */}
          {event.category && (
            <Badge
              style={{
                backgroundColor: categoryColor,
                color: "white",
                border: "none",
              }}
              className="h-fit shadow-lg"
            >
              {event.category.name}
            </Badge>
          )}
          {/* 標題 - 右上角 */}
          <p className="row-span-2 text-md md:text-lg lg:text-2xl xl:text-3xl font-semibold leading-tight line-clamp-2 text-white tracking-widest [writing-mode:vertical-rl] text-shadow-lg">
            {event.title}
          </p>
          {/* 活動日期 - 左下角 */}
          <p className="self-end text-md md:text-lg  lg:text-xl xl:text-2xl 2xl:text-4xl font-light text-white tracking-wider">
            {formatDate(event.startTime).slice(5)}
          </p>
        </div>
      </div>
    </Card>
  );
}
