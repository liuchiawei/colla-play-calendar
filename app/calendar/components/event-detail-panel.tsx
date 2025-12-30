"use client";

// 活動詳細資訊面板組件
// 在頁面下方顯示選中活動的詳細資訊（inline 顯示，非對話框）

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Tag,
  ExternalLink,
  Ticket,
  Maximize2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDate, formatTime } from "@/lib/date-utils";
import type { EventWithCategory } from "@/lib/types";

interface EventDetailPanelProps {
  event: EventWithCategory | null;
  onOpenDialog: () => void;
}

export function EventDetailPanel({
  event,
  onOpenDialog,
}: EventDetailPanelProps) {
  const categoryColor = event?.category?.color || "#6366f1";

  return (
    <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 shadow-xl flex flex-col h-full">
      <AnimatePresence mode="wait">
        {event ? (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full flex flex-col"
          >
            {/* ヘッダー：タイトルとダイアログボタン */}
            <div className="p-4 border-b border-border/50 bg-card/50 backdrop-blur-sm flex-shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-foreground leading-tight mb-2">
                    {event.title}
                  </h2>
                  {event.category && (
                    <Badge
                      style={{ backgroundColor: categoryColor }}
                      className="text-white border-0"
                    >
                      {event.category.name}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onOpenDialog}
                  className="shrink-0"
                  title="在新視窗中查看詳細資訊"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* コンテンツエリア（スクロール可能） */}
            <ScrollArea className="flex-1">
              <div className="p-6 space-y-4">
                {/* ヘッダー画像またはカラーバナー */}
                {((event as any).imageBlobUrl || event.imageUrl) && (
                  <div className="relative h-48 rounded-lg overflow-hidden mb-4">
                    <img
                      src={(event as any).imageBlobUrl || event.imageUrl || ""}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent" />
                  </div>
                )}

                {/* 日時情報 */}
                <div className="flex items-start gap-3">
                  <div
                    className="p-2 rounded-lg shrink-0"
                    style={{ backgroundColor: `${categoryColor}20` }}
                  >
                    <Calendar
                      className="h-4 w-4"
                      style={{ color: categoryColor }}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">
                      {formatDate(event.startTime)}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" />
                      {formatTime(event.startTime)} -{" "}
                      {formatTime(event.endTime)}
                    </div>
                  </div>
                </div>

                {/* 場所 */}
                {event.location && (
                  <div className="flex items-start gap-3">
                    <div
                      className="p-2 rounded-lg shrink-0"
                      style={{ backgroundColor: `${categoryColor}20` }}
                    >
                      <MapPin
                        className="h-4 w-4"
                        style={{ color: categoryColor }}
                      />
                    </div>
                    <div className="text-sm text-foreground flex-1">
                      {event.location}
                    </div>
                  </div>
                )}

                {/* 主催者 */}
                {event.organizer && (
                  <div className="flex items-start gap-3">
                    <div
                      className="p-2 rounded-lg shrink-0"
                      style={{ backgroundColor: `${categoryColor}20` }}
                    >
                      <User
                        className="h-4 w-4"
                        style={{ color: categoryColor }}
                      />
                    </div>
                    <div className="text-sm text-foreground flex-1">
                      {event.organizer}
                    </div>
                  </div>
                )}

                {/* 料金 */}
                {event.price && (
                  <div className="flex items-start gap-3">
                    <div
                      className="p-2 rounded-lg shrink-0"
                      style={{ backgroundColor: `${categoryColor}20` }}
                    >
                      <Ticket
                        className="h-4 w-4"
                        style={{ color: categoryColor }}
                      />
                    </div>
                    <div className="text-sm text-foreground flex-1">
                      {event.price}
                    </div>
                  </div>
                )}

                {/* 説明 */}
                {event.description && (
                  <>
                    <Separator className="my-4" />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Tag className="h-4 w-4" />
                        活動說明
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {event.description}
                      </p>
                    </div>
                  </>
                )}

                {/* 報名ボタン */}
                {event.registrationUrl && (
                  <div className="pt-2">
                    <Button
                      className="w-full"
                      style={{ backgroundColor: categoryColor }}
                      onClick={() =>
                        window.open(event.registrationUrl!, "_blank")
                      }
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      立即報名
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full flex items-center justify-center p-8"
          >
            <div className="text-center text-muted-foreground">
              <Calendar className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium mb-2">尚未選擇活動</p>
              <p className="text-sm">點擊上方行事曆中的活動卡片查看詳細資訊</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
