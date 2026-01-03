"use client";

// 週間カレンダーメインコンポーネント
// 時間グリッド式のレイアウトでイベントを表示

import * as React from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
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
  getWeekRange,
  getWeekDays,
  getNextWeek,
  getPreviousWeek,
  getNextDay,
  getPreviousDay,
  formatDayHeader,
  formatMonthYear,
  generateTimeSlots,
  isEventOnDay,
  calculateEventPosition,
} from "@/lib/date-utils";
import { startOfDay, addDays, isSameDay, endOfDay } from "date-fns";
import type { EventWithCategory } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/lib/hooks/use-mobile";

// コンポーネントのプロパティ型
interface WeeklyCalendarProps {
  className?: string;
  // イベント選択時のコールバック（外部で選択を処理する場合）
  onEventSelect?: (event: EventWithCategory) => void;
  // 内部ダイアログを有効にするか（デフォルト: true）
  enableInternalDialog?: boolean;
}

export function WeeklyCalendar({
  className,
  onEventSelect,
  enableInternalDialog = true,
}: WeeklyCalendarProps) {
  // モバイル判定
  const isMobile = useIsMobile();
  // 現在表示中の週の基準日
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

  // 表示する日付リストを計算（モバイル: 前日/当日/翌日、デスクトップ: 週全体）
  // 日期水平排列：左側時間軸，右側日期列（水平排列）
  const displayDays = React.useMemo(() => {
    // isMobile 為 undefined 時（初始渲染），預設為桌面版（7天）
    if (isMobile === true) {
      // モバイル: currentDate を中心に前後1日（合計3日，水平排列）
      return [addDays(baseDay, -1), baseDay, addDays(baseDay, 1)];
    } else {
      // デスクトップ: 週全体（7天，水平排列）
      return getWeekDays(currentDate);
    }
  }, [isMobile, baseDay, currentDate]);

  // イベント取得用の日付範囲を計算
  const eventRange = React.useMemo(() => {
    if (isMobile) {
      // モバイル: 表示する3日間の範囲（前日の開始から翌日の終了まで）
      const firstDay = displayDays[0];
      const lastDay = displayDays[displayDays.length - 1];
      return {
        start: startOfDay(firstDay),
        end: endOfDay(lastDay),
      };
    } else {
      // デスクトップ: 週全体
      return getWeekRange(currentDate);
    }
  }, [isMobile, displayDays, currentDate]);

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

  // 週が変更されたらイベントを再取得
  React.useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // 前へ移動（モバイル: 1日、デスクトップ: 1週間）
  const goToPrevious = () => {
    setDirection(-1);
    setCurrentDate(
      isMobile ? getPreviousDay(currentDate) : getPreviousWeek(currentDate)
    );
  };

  // 次へ移動（モバイル: 1日、デスクトップ: 1週間）
  const goToNext = () => {
    setDirection(1);
    setCurrentDate(
      isMobile ? getNextDay(currentDate) : getNextWeek(currentDate)
    );
  };

  // 今週へ移動
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

  // currentDate かどうかチェック（選択中の日付をハイライト）
  const isCurrentDay = (date: Date) => {
    return isSameDay(date, baseDay);
  };

  // 曜日ヘッダークリック時：選択中の日付（currentDay相当）をリセット
  const resetCurrentDay = React.useCallback((day: Date) => {
    setDirection(0);
    setCurrentDate(day);
  }, []);

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
            <TooltipContent>{isMobile ? "上一天" : "上一週"}</TooltipContent>
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
            <TooltipContent>{isMobile ? "下一天" : "下一週"}</TooltipContent>
          </Tooltip>
        </div>
      </motion.div>

      {/* カレンダーグリッド */}
      <div className="flex-1 overflow-auto">
        <div className={cn("w-full", "md:min-w-[800px]")}>
          {/* 曜日ヘッダー */}
          <div
            className="grid border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur-sm z-10"
            style={{
              gridTemplateColumns: `60px repeat(${displayDays.length}, 1fr)`,
            }}
          >
            <div className="p-2 border-r border-border/30" />{" "}
            {/* 時間列のスペーサー */}
            <AnimatePresence mode="popLayout">
              {displayDays.map((day, index) => (
                <motion.button
                  key={day.toISOString()}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ delay: index * 0.03 }}
                  type="button"
                  onClick={() => resetCurrentDay(day)}
                  aria-pressed={isCurrentDay(day)}
                  aria-label={`選擇日期 ${formatDayHeader(day)}`}
                  className={cn(
                    "p-2 text-center border-r border-border/30 last:border-r-0 cursor-pointer select-none hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-inset",
                    isToday(day) && "bg-primary/10",
                    isCurrentDay(day) && "ring-2 ring-primary/50 ring-inset"
                  )}
                >
                  <div
                    className={cn(
                      "text-sm font-medium",
                      isToday(day) || isCurrentDay(day)
                        ? "text-primary font-semibold"
                        : "text-muted-foreground"
                    )}
                  >
                    {formatDayHeader(day)}
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>

          {/* 時間グリッド */}
          <div
            className="grid"
            style={{
              gridTemplateColumns: `60px repeat(${displayDays.length}, 1fr)`,
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

            {/* 各曜日の列 */}
            {displayDays.map((day, dayIndex) => (
              <div
                key={day.toISOString()}
                className={cn(
                  "relative border-r border-border/30 last:border-r-0",
                  isToday(day) && "bg-primary/5",
                  isCurrentDay(day) &&
                    "bg-primary/5 ring-2 ring-primary/30 ring-inset"
                )}
              >
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
                      {dayIndex % 2 === 0 && (
                        <Skeleton className="h-12 w-full rounded" />
                      )}
                      {dayIndex % 3 === 0 && (
                        <Skeleton className="h-8 w-full rounded mt-20" />
                      )}
                    </div>
                  ) : (
                    // 実際のイベント
                    events
                      .filter((event) => isEventOnDay(event, day))
                      .map((event, eventIndex) => {
                        const position = calculateEventPosition(event, day);
                        return (
                          <EventCard
                            key={event.id}
                            event={event}
                            position={position}
                            index={eventIndex + dayIndex}
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
            ))}
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
