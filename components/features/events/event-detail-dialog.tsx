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
  Users,
  CheckCircle2,
  Loader2,
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
import { useAuthStore } from "@/lib/stores/auth-store";

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

          {/* 活動基本資料 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-4 space-y-4"
          >
            {/* 日時情報 */}
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-primary/10 text-primary">
                <Calendar className="size-4" />
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
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  <MapPin className="size-4" />
                </div>
                <div className="text-sm text-foreground">{event.location}</div>
              </div>
            )}

            {/* 主催者 */}
            {event.organizer && (
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  <User className="size-4" />
                </div>
                <div className="text-sm text-foreground">{event.organizer}</div>
              </div>
            )}

            {/* 料金 */}
            {event.price && (
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  <Ticket className="size-4" />
                </div>
                <div className="text-sm text-foreground">{event.price}</div>
              </div>
            )}

            {/* 報名網址 */}
            {event.registrationUrl && (
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  <ExternalLink className="size-4" />
                </div>
                <div className="text-sm text-foreground">
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

            {/* 報名人數 */}
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-primary/10 text-primary">
                <Users className="size-4" />
              </div>
              <div className="text-sm text-foreground">
                {registrationCount > 0
                  ? `已有 ${registrationCount} 人報名`
                  : "尚未有人報名"}
              </div>
            </div>

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
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="pt-2 space-y-2"
            >
              {error && (
                <div className="text-sm text-destructive text-center">
                  {error}
                </div>
              )}
              <Button
                className="w-full"
                variant={isRegistered ? "outline" : "default"}
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
