"use client";

// イベント詳細ダイアログコンポーネント
// イベントの詳細情報を表示するモーダル

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
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatDate, formatTime } from "@/lib/date-utils";
import type { EventWithCategory } from "@/lib/types";

interface EventDetailDialogProps {
  event: EventWithCategory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EventDetailDialog({
  event,
  open,
  onOpenChange,
}: EventDetailDialogProps) {
  if (!event) return null;

  const categoryColor = event.category?.color || "#6366f1";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-card border-border/50">
        {/* ヘッダー画像またはカラーバナー */}
        <div className="relative h-32 overflow-hidden">
          {event.imageBlobUrl || event.imageUrl ? (
            <img
              src={event.imageBlobUrl || event.imageUrl || ""}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full"
              style={{
                background: `linear-gradient(135deg, ${categoryColor}cc 0%, ${categoryColor}66 100%)`,
              }}
            />
          )}
          {/* オーバーレイ */}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />

          {/* カテゴリバッジ */}
          {event.category && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-3 left-3"
            >
              <Badge
                style={{ backgroundColor: categoryColor }}
                className="text-white border-0"
              >
                {event.category.name}
              </Badge>
            </motion.div>
          )}
        </div>

        {/* コンテンツ */}
        <div className="px-6 pb-6">
          <DialogHeader className="-mt-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <DialogTitle className="text-xl font-bold text-foreground leading-tight">
                {event.title}
              </DialogTitle>
            </motion.div>
          </DialogHeader>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-4 space-y-4"
          >
            {/* 日時情報 */}
            <div className="flex items-start gap-3">
              <div
                className="p-2 rounded-full bg-primary/10 text-primary"
              >
                <Calendar
                  className="size-4"
                />
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">
                  {formatDate(event.startTime)}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTime(event.startTime)} - {formatTime(event.endTime)}
                </div>
              </div>
            </div>

            {/* 場所 */}
            {event.location && (
              <div className="flex items-start gap-3">
                <div
                  className="p-2 rounded-full bg-primary/10 text-primary"
                >
                  <MapPin
                    className="size-4"
                  />
                </div>
                <div className="text-sm text-foreground">{event.location}</div>
              </div>
            )}

            {/* 主催者 */}
            {event.organizer && (
              <div className="flex items-start gap-3">
                <div
                  className="p-2 rounded-full bg-primary/10 text-primary"
                >
                  <User className="size-4" />
                </div>
                <div className="text-sm text-foreground">{event.organizer}</div>
              </div>
            )}

            {/* 料金 */}
            {event.price && (
              <div className="flex items-start gap-3">
                <div
                  className="p-2 rounded-full bg-primary/10 text-primary"
                >
                  <Ticket className="size-4" />
                </div>
                <div className="text-sm text-foreground">{event.price}</div>
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
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="pt-2"
              >
                <Button
                  className="w-full"
                  variant="default"
                  onClick={() => window.open(event.registrationUrl!, "_blank")}
                >
                  <ExternalLink className="size-4 mr-2" />
                  立即報名
                </Button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

