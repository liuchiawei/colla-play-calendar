"use client";

// 活動列表項目組件
// 顯示單一活動的基本資訊，點擊時觸發回調

import * as React from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatTime } from "@/lib/date-utils";
import type { EventWithCategory } from "@/lib/types";
import { Calendar, Clock, MapPin, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventListItemProps {
  event: EventWithCategory;
  onClick: () => void;
}

export const EventListItem = React.memo(function EventListItem({
  event,
  onClick,
}: EventListItemProps) {
  const categoryColor = event.category?.color || "#6366f1";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <Card
        className={cn(
          "cursor-pointer transition-all hover:shadow-md",
          "hover:border-primary/50"
        )}
        onClick={onClick}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2 min-w-0">
              <h3 className="text-base font-semibold leading-tight line-clamp-2">
                {event.title}
              </h3>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formatDate(event.startTime)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    {formatTime(event.startTime)} - {formatTime(event.endTime)}
                  </span>
                </div>
              </div>
            </div>
            {event.category && (
              <Badge
                className="shrink-0"
                style={{
                  backgroundColor: categoryColor,
                  color: "white",
                  border: "none",
                }}
              >
                {event.category.name}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {event.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="truncate">{event.location}</span>
              </div>
            )}
            {event.organizer && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4 shrink-0" />
                <span className="truncate">{event.organizer}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

