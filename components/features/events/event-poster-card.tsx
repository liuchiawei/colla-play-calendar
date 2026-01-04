// 活動海報風格卡片組件
// 顯示單一活動的基本資訊，點擊時觸發回調

import type { EventWithCategory } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
