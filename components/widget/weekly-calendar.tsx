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
import { Calendar } from "@/components/ui/calendar";
import { EventCard } from "@/components/widget/event-card";
import { EventDetailDialog } from "@/components/widget/event-detail-dialog";
import {
  getWeekRange,
  getWeekDays,
  getNextWeek,
  getPreviousWeek,
  formatDayHeader,
  formatMonthYear,
  generateTimeSlots,
  isEventOnDay,
  calculateEventPosition,
  HOURS_IN_VIEW,
} from "@/lib/date-utils";
import type { EventWithCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

// コンポーネントのプロパティ型
interface WeeklyCalendarProps {
  className?: string;
}

export function WeeklyCalendar({ className }: WeeklyCalendarProps) {
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

  // 週の日付範囲と日付リスト
  const weekRange = getWeekRange(currentDate);
  const weekDays = getWeekDays(currentDate);
  const timeSlots = generateTimeSlots();

  // イベントデータを取得
  const fetchEvents = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        start: weekRange.start.toISOString(),
        end: weekRange.end.toISOString(),
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
  }, [weekRange.start.toISOString(), weekRange.end.toISOString()]);

  // 週が変更されたらイベントを再取得
  React.useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // 前の週へ移動
  const goToPreviousWeek = () => {
    setDirection(-1);
    setCurrentDate(getPreviousWeek(currentDate));
  };

  // 次の週へ移動
  const goToNextWeek = () => {
    setDirection(1);
    setCurrentDate(getNextWeek(currentDate));
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
        className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-card/50 backdrop-blur-sm"
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPreviousWeek}
            className="h-8 w-8 hover:bg-primary/10 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={goToNextWeek}
            className="h-8 w-8 hover:bg-primary/10 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="ml-2 hover:bg-primary/10"
              >
                <CalendarDays className="h-4 w-4 mr-1" />
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
        </div>
        <motion.h2
          key={formatMonthYear(currentDate)}
          initial={{ opacity: 0, x: direction * 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-lg font-semibold text-foreground"
        >
          {formatMonthYear(currentDate)}
        </motion.h2>
        <div className="w-[120px]" /> {/* スペーサー */}
      </motion.div>

      {/* カレンダーグリッド */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-[800px]">
          {/* 曜日ヘッダー */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur-sm z-10">
            <div className="p-2 border-r border-border/30" />{" "}
            {/* 時間列のスペーサー */}
            <AnimatePresence mode="popLayout">
              {weekDays.map((day, index) => (
                <motion.div
                  key={day.toISOString()}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ delay: index * 0.03 }}
                  className={cn(
                    "p-2 text-center border-r border-border/30 last:border-r-0",
                    isToday(day) && "bg-primary/10"
                  )}
                >
                  <div
                    className={cn(
                      "text-sm font-medium",
                      isToday(day) ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {formatDayHeader(day)}
                  </div>
                  {isToday(day) && (
                    <motion.div
                      layoutId="today-indicator"
                      className="mx-auto mt-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                    >
                      <span className="text-xs text-primary-foreground font-bold">
                        {day.getDate()}
                      </span>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* 時間グリッド */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)]">
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
            {weekDays.map((day, dayIndex) => (
              <div
                key={day.toISOString()}
                className={cn(
                  "relative border-r border-border/30 last:border-r-0",
                  isToday(day) && "bg-primary/5"
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
                            onClick={() => setSelectedEvent(event)}
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

      {/* イベント詳細ダイアログ */}
      <EventDetailDialog
        event={selectedEvent}
        open={!!selectedEvent}
        onOpenChange={(open) => !open && setSelectedEvent(null)}
      />
    </div>
  );
}
