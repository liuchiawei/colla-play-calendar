"use client";

// 日間カレンダーメインコンポーネント
// 時間グリッド式のレイアウトで1日のイベントを表示

import * as React from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Calendar } from "@/components/ui/calendar";
import { EventCard } from "@/components/features/events/event-card";
import { EventDetailDialog } from "@/components/features/events/event-detail-dialog";
import {
  getNextDay,
  getPreviousDay,
  formatDayHeader,
  formatMonthYear,
  generateTimeSlots,
  isEventOnDay,
  calculateEventPosition,
} from "@/lib/date-utils";
import { startOfDay, isSameDay, endOfDay } from "date-fns";
import type { EventWithCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

// コンポーネントのプロパティ型
interface DailyCalendarProps {
  className?: string;
  // イベント選択時のコールバック（外部で選択を処理する場合）
  onEventSelect?: (event: EventWithCategory) => void;
  // 内部ダイアログを有効にするか（デフォルト: true）
  enableInternalDialog?: boolean;
}

export function DailyCalendar({
  className,
  onEventSelect,
  enableInternalDialog = true,
}: DailyCalendarProps) {
  // 現在表示中の日の基準日
  const [currentDate, setCurrentDate] = React.useState(new Date());
  // イベントデータ
  const [events, setEvents] = React.useState<EventWithCategory[]>([]);
  // ローディング状態
  const [isLoading, setIsLoading] = React.useState(true);
  // 選択されたイベント（詳細表示用）
  const [selectedEvent, setSelectedEvent] =
    React.useState<EventWithCategory | null>(null);
  // アニメーション方向（-1: 左へ、1: 右へ）
  const [direction, setDirection] = React.useState(0);
  // カレンダーポップオーバーの開閉状態
  const [calendarOpen, setCalendarOpen] = React.useState(false);

  // 基準日を取得（時間部分を無視）
  const baseDay = startOfDay(currentDate);

  // イベント取得用の日付範囲を計算（1日の範囲）
  const eventRange = React.useMemo(() => {
    return {
      start: startOfDay(baseDay),
      end: endOfDay(baseDay),
    };
  }, [baseDay]);

  const timeSlots = generateTimeSlots();

  // イベントデータを取得
  const fetchEvents = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        start: eventRange.start.toISOString(),
        end: eventRange.end.toISOString(),
      });
      const response = await fetch(`/api/events?${params}`);
      const data = await response.json();
      if (data.success) {
        setEvents(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setIsLoading(false);
    }
  }, [eventRange.start.toISOString(), eventRange.end.toISOString()]);

  // 日が変更されたらイベントを再取得
  React.useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // 前の日へ移動
  const goToPrevious = () => {
    setDirection(-1);
    setCurrentDate(getPreviousDay(currentDate));
  };

  // 次の日へ移動
  const goToNext = () => {
    setDirection(1);
    setCurrentDate(getNextDay(currentDate));
  };

  // 今日へ移動
  const goToToday = () => {
    setDirection(0);
    setCurrentDate(new Date());
  };

  // 今日かどうかチェック
  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // 日期を「幾月幾日」形式でフォーマット
  const formatDateButton = (date: Date) => {
    if (isToday(date)) {
      return "今天";
    }
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* ヘッダー：ナビゲーションと月表示 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-between gap-2 p-4 border-b border-border/50 bg-card/50 backdrop-blur-sm"
      >
        <motion.h2
          key={formatMonthYear(currentDate)}
          initial={{ opacity: 0, x: direction * 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-lg font-semibold text-foreground"
        >
          {formatMonthYear(currentDate)}
        </motion.h2>
        <div className="w-full flex justify-between items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={goToPrevious}
                className="size-8 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <ChevronLeft className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>上一天</TooltipContent>
          </Tooltip>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="ml-2 hover:bg-primary/10 hover:text-primary"
              >
                <CalendarDays className="size-4 mr-1" />
                {formatDateButton(currentDate)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={currentDate}
                onSelect={(date) => {
                  if (date) {
                    setCurrentDate(date);
                    setCalendarOpen(false);
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={goToNext}
                className="size-8 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <ChevronRight className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>下一天</TooltipContent>
          </Tooltip>
        </div>
      </motion.div>

      {/* カレンダーグリッド */}
      <div className="flex-1 overflow-auto">
        <div className={cn("w-full", "md:min-w-[600px]")}>
          {/* 時間グリッド */}
          <div
            className="grid"
            style={{
              gridTemplateColumns: `60px 1fr`,
            }}
          >
            {/* 時間ラベル列 */}
            <div className="border-r border-border/30">
              {timeSlots.map((slot, index) => (
                <motion.div
                  key={slot.hour}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="h-16 border-b border-border/20 pr-2 text-right"
                >
                  <span className="text-xs text-muted-foreground relative -top-2">
                    {slot.label}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* 日の列 */}
            <div className="relative">
              {/* 時間グリッドの背景線 */}
              {timeSlots.map((slot) => (
                <div
                  key={slot.hour}
                  className="h-16 border-b border-border/20"
                />
              ))}

              {/* イベントカード */}
              <div className="absolute inset-0 p-0.5">
                {isLoading ? (
                  // ローディングスケルトン
                  <div className="space-y-1 p-1">
                    <Skeleton className="h-12 w-full rounded" />
                    <Skeleton className="h-8 w-full rounded mt-20" />
                  </div>
                ) : (
                  // 実際のイベント
                  events
                    .filter((event) => isEventOnDay(event, baseDay))
                    .map((event, eventIndex) => {
                      const position = calculateEventPosition(event, baseDay);
                      return (
                        <EventCard
                          key={event.id}
                          event={event}
                          position={position}
                          index={eventIndex}
                          onClick={() => {
                            // 外部コールバックを常に呼び出す
                            onEventSelect?.(event);
                            // 内部ダイアログが有効な場合のみ内部状態を更新
                            if (enableInternalDialog) {
                              setSelectedEvent(event);
                            }
                          }}
                        />
                      );
                    })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* イベント詳細ダイアログ（内部ダイアログが有効な場合のみ表示） */}
      {enableInternalDialog && (
        <EventDetailDialog
          event={selectedEvent}
          open={!!selectedEvent}
          onOpenChange={(open) => !open && setSelectedEvent(null)}
        />
      )}
    </div>
  );
}
