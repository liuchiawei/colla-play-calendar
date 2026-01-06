"use client";

// イベント詳細ダイアログコンポーネント
// イベントの詳細情報を表示するモーダル

import * as React from "react";
import { Suspense } from "react";
import { mutate } from "swr";
import { motion } from "motion/react";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { useAuthStore } from "@/lib/stores/auth-store";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Tag,
  ExternalLink,
  Ticket,
  Users,
  CheckCircle2,
  Loader2,
  Eye,
} from "lucide-react";
import { EventRegisteredUsersAvatars } from "@/components/features/events/event-registered-users-avatars";
import { EventRegisteredUsersAvatarsSkeleton } from "@/components/features/events/event-registered-users-avatars-skeleton";

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
  const { user } = useAuthStore();
  const [isRegistered, setIsRegistered] = React.useState(
    event?.isRegistered || false
  );
  const [registrationCount, setRegistrationCount] = React.useState(
    event?.registrationCount || 0
  );
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // 當 event 改變時更新狀態
  React.useEffect(() => {
    if (event) {
      setIsRegistered(event.isRegistered || false);
      setRegistrationCount(event.registrationCount || 0);
    }
  }, [event]);

  // 處理報名/取消報名
  const handleRegistration = async () => {
    if (!event) return;

    setIsLoading(true);
    setError(null);

    try {
      const method = isRegistered ? "DELETE" : "POST";
      const response = await fetch(`/api/events/${event.id}/register`, {
        method,
        credentials: "include",
      });

      const data = await response.json();

      if (data.success) {
        setIsRegistered(!isRegistered);
        // 更新報名人數
        if (isRegistered) {
          setRegistrationCount((prev) => Math.max(0, prev - 1));
        } else {
          setRegistrationCount((prev) => prev + 1);
        }
        // 使 SWR 快取失效，自動重新驗證活動紀錄
        // 服務端快取已在 API route 中清除
        mutate("/api/profile/events");
      } else {
        setError(data.error || "操作失敗");
      }
    } catch (err) {
      setError("操作失敗，請再試一次");
      console.error("Registration error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!event) return null;

  const categoryColor = event.category?.color || "#6366f1";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden bg-card border-border/50">
        {/* 卡片封面 */}
        <div className="relative w-full h-full min-h-36 overflow-hidden">
          {event.imageBlobUrl || event.imageUrl ? (
            // 封面圖片
            <img
              src={event.imageBlobUrl || event.imageUrl || ""}
              alt={event.title}
              className="absolute inset-0 z-0 object-cover border pointer-events-none"
            />
          ) : (
            // 分類背景色 (無圖片時)
            <div
              className="absolute inset-0 z-0"
              style={{
                background: `linear-gradient(135deg, ${categoryColor}cc 0%, ${categoryColor}66 100%)`,
              }}
            />
          )}
          {/* 疊加層 */}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent select-none pointer-events-none" />
          {/* 封面資訊區塊 (標題、分類標籤﹑日期) */}
          <div className="w-full h-full flex flex-col justify-between gap-4 p-6 z-10">
            {/* 分類標籤 */}
            {event.category && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="z-10"
              >
                <Badge
                  style={{ backgroundColor: categoryColor }}
                  className="text-white border-0 select-none"
                >
                  {event.category.name}
                </Badge>
              </motion.div>
            )}
            {/* 活動標題&日期 */}
            <DialogHeader className="gap-0 z-10">
              {/* 活動日期 */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h3 className="text-white text-sm md:text-base lg:text-lg font-light tracking-wide">
                  {formatDate(event.startTime)}
                </h3>
              </motion.div>
              {/* 活動標題 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <DialogTitle className="text-white text-2xl lg:text-3xl xl:text-4xl font-bold text-shadow-md leading-tight">
                  {event.title}
                </DialogTitle>
              </motion.div>
            </DialogHeader>
          </div>
        </div>

        {/* コンテンツ */}
        <div className="px-6 pb-6">
          {/* 活動基本資料 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-4 grid grid-cols-2 gap-4"
          >
            {/* 活動時間 */}
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-primary/10 text-primary">
                <Clock className="size-4" />
              </div>
              <div className="text-sm">
                {formatTime(event.startTime)} - {formatTime(event.endTime)}
              </div>
            </div>

            {/* 地點 */}
            {event.location && (
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  <MapPin className="size-4" />
                </div>
                <div className="text-sm ">{event.location}</div>
              </div>
            )}

            {/* 主辦單位 */}
            {event.organizer && (
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  <User className="size-4" />
                </div>
                <div className="text-sm ">{event.organizer}</div>
              </div>
            )}

            {/* 費用 */}
            {event.price && (
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  <Ticket className="size-4" />
                </div>
                <div className="text-sm ">{event.price}</div>
              </div>
            )}

            {/* 報名人數 */}
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-primary/10 text-primary flex-shrink-0">
                <Users className="size-4" />
              </div>
              <div className="flex-1">
                <div className="text-sm ">
                  {registrationCount > 0
                    ? `已有 ${registrationCount} 人報名`
                    : "尚未有人報名"}
                </div>
                {/* 已報名使用者頭像堆疊 */}
                {registrationCount > 0 && (
                  <div className="mt-2">
                    <Suspense
                      fallback={<EventRegisteredUsersAvatarsSkeleton />}
                    >
                      <EventRegisteredUsersAvatars eventId={event.id} />
                    </Suspense>
                  </div>
                )}
              </div>
            </div>

            {/* 報名網址 */}
            {event.registrationUrl && (
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  <ExternalLink className="size-4" />
                </div>
                <div className="text-sm overflow-hidden truncate whitespace-nowrap">
                  <a
                    href={event.registrationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {event.registrationUrl}
                  </a>
                </div>
              </div>
            )}

            {/* 説明 */}
            {event.description && (
              <div className="col-span-2 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium ">
                  <Tag className="h-4 w-4" />
                  活動說明
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            )}

            {/* 報名按鈕 */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="col-span-2 flex gap-2"
            >
              {error && (
                <div className="text-sm text-destructive text-center">
                  {error}
                </div>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full" asChild>
                    <Link href={`/event/${event.id}`}>
                      <Eye className="size-4" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>查看活動詳細</TooltipContent>
              </Tooltip>
              <Button
                className="flex-1 cursor-pointer"
                variant={isRegistered ? "secondary" : "default"}
                onClick={handleRegistration}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    報名中...
                  </>
                ) : isRegistered ? (
                  <>
                    <CheckCircle2 className="size-4 mr-2" />
                    已報名（點擊取消）
                  </>
                ) : (
                  <>
                    <Users className="size-4 mr-2" />
                    立即報名
                  </>
                )}
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
