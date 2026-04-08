"use client";

// 週間活動列表元件
// 以「日」分組的列表版面顯示活動，取代時間格線

import * as React from "react";
import { ChevronLeft, ChevronRight, CalendarDays, ChevronDown, ChevronUp } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { EventListItem } from "@/components/features/events/event-list-item";
import { EventDetailDialog } from "@/components/features/events/event-detail-dialog";
import {
  getWeekRange,
  getWeekDays,
  getNextWeek,
  getPreviousWeek,
  getNextDay,
  getPreviousDay,
  formatDayHeader,
  formatMonth,
  formatYear,
  formatMonthEng,
  isEventOnDay,
} from "@/lib/date-utils";
import { startOfDay, addDays, endOfDay } from "date-fns";
import type { EventWithCategory } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/lib/hooks/use-mobile";

interface ListCalendarProps {
  className?: string;
  onEventSelect?: (event: EventWithCategory) => void;
  enableInternalDialog?: boolean;
}

export function ListCalendar({
  className,
  onEventSelect,
  enableInternalDialog = true,
}: ListCalendarProps) {
  const isMobile = useIsMobile();
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [events, setEvents] = React.useState<EventWithCategory[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedEvent, setSelectedEvent] =
    React.useState<EventWithCategory | null>(null);
  const [direction, setDirection] = React.useState(0);
  const [calendarOpen, setCalendarOpen] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const baseDay = startOfDay(currentDate);

  const displayDays = React.useMemo(() => {
    if (isMobile === true) {
      return [addDays(baseDay, -1), baseDay, addDays(baseDay, 1)];
    }
    return getWeekDays(currentDate);
  }, [isMobile, baseDay, currentDate]);

  const eventRange = React.useMemo(() => {
    if (isMobile) {
      const firstDay = displayDays[0];
      const lastDay = displayDays[displayDays.length - 1];
      return {
        start: startOfDay(firstDay),
        end: endOfDay(lastDay),
      };
    }
    return getWeekRange(currentDate);
  }, [isMobile, displayDays, currentDate]);

  const eventRangeStartIso = React.useMemo(
    () => eventRange.start.toISOString(),
    [eventRange.start],
  );

  const eventRangeEndIso = React.useMemo(
    () => eventRange.end.toISOString(),
    [eventRange.end],
  );

  const groupedByDay = React.useMemo(() => {
    const map = new Map<string, EventWithCategory[]>();
    for (const day of displayDays) {
      const dayKey = day.toISOString();
      const dayEvents = events
        .filter((e) => isEventOnDay(e, day))
        .sort(
          (a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );
      map.set(dayKey, dayEvents);
    }
    return map;
  }, [events, displayDays]);

  const fetchEvents = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        start: eventRangeStartIso,
        end: eventRangeEndIso,
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
  }, [eventRangeStartIso, eventRangeEndIso]);

  React.useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const goToPrevious = () => {
    setDirection(-1);
    setCurrentDate(
      isMobile ? getPreviousDay(currentDate) : getPreviousWeek(currentDate)
    );
  };

  const goToNext = () => {
    setDirection(1);
    setCurrentDate(
      isMobile ? getNextDay(currentDate) : getNextWeek(currentDate)
    );
  };

  // const goToToday = () => {
  //   setDirection(0);
  //   setCurrentDate(new Date());
  // };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const formatDateButton = (date: Date) => {
    if (isToday(date)) {
      return "今天";
    }
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const toggleCollapsed = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleEventClick = React.useCallback(
    (event: EventWithCategory) => {
      onEventSelect?.(event);
      if (enableInternalDialog) {
        setSelectedEvent(event);
      }
    },
    [onEventSelect, enableInternalDialog]
  );

  const hasAnyEvents = events.length > 0;

  return (
    <div className={cn("flex flex-col h-full p-6 pb-2", className)}>
      <Collapsible open={!isCollapsed} onOpenChange={toggleCollapsed}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex flex-col items-center justify-between gap-2 select-none"
        >
          <div className="flex items-center justify-between w-full">
            <motion.h2
              key={formatYear(currentDate)}
              initial={{ opacity: 0, x: direction * 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-lg md:text-2xl font-light tracking-wider"
            >
              {formatYear(currentDate)}
            </motion.h2>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={toggleCollapsed}
                aria-label={isCollapsed ? "展開" : "摺疊"}
              >
                {isCollapsed ? (
                  <ChevronDown className="size-4" aria-hidden />
                ) : (
                  <ChevronUp className="size-4" aria-hidden />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
          <div className="flex-1 flex flex-col md:flex-row items-center justify-between md:items-start gap-1 md:self-start">
            <motion.h1
              key={formatMonth(currentDate)}
              initial={{ opacity: 0, y: direction * 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl lg:text-8xl font-sans font-bold tracking-wide"
            >
              {formatMonth(currentDate)}
            </motion.h1>
            <motion.h2
              key={formatMonthEng(currentDate)}
              initial={{ opacity: 0, y: direction * 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:px-1 lg:px-2 text-primary text-lg lg:text-xl font-light md:[writing-mode:vertical-rl] tracking-wide"
            >
              {formatMonthEng(currentDate)}
            </motion.h2>
          </div>
        </motion.div>

        <CollapsibleContent className="space-y-2">
          <div className="w-full flex justify-between items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToPrevious}
                  className="size-8 rounded-full hover:bg-primary/10 hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-primary/50"
                  aria-label={isMobile ? "上一天" : "上一週"}
                >
                  <ChevronLeft className="size-4" aria-hidden />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isMobile ? "上一天" : "上一週"}</TooltipContent>
            </Tooltip>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2 hover:bg-primary/10 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                  <CalendarDays className="size-4 mr-1" aria-hidden />
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
                  className="size-8 rounded-full hover:bg-primary/10 hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-primary/50"
                  aria-label={isMobile ? "下一天" : "下一週"}
                >
                  <ChevronRight className="size-4" aria-hidden />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isMobile ? "下一天" : "下一週"}</TooltipContent>
            </Tooltip>
          </div>

          <div className="flex-1 w-full overflow-auto min-h-0">
            {isLoading ? (
              <div className="space-y-4 py-2" aria-busy="true" aria-live="polite">
                <p className="text-sm text-muted-foreground">Loading…</p>
                <ul className="space-y-3 list-none p-0 m-0">
                  {[1, 2, 3].map((i) => (
                    <li key={i}>
                      <Skeleton className="h-24 w-full rounded-lg" />
                    </li>
                  ))}
                </ul>
              </div>
            ) : !hasAnyEvents ? (
              <div
                className="flex flex-col items-center justify-center py-12 px-4 text-center"
                role="status"
              >
                <CalendarDays
                  className="size-12 text-muted-foreground/40 mb-4"
                  aria-hidden
                />
                <p className="text-lg font-medium text-muted-foreground mb-1">
                  此範圍無活動
                </p>
                <p className="text-sm text-muted-foreground">
                  切換日期或週次查看其他活動
                </p>
              </div>
            ) : (
              <ul className="space-y-6 list-none p-0 m-0">
                {displayDays.map((day) => {
                  const dayKey = day.toISOString();
                  const dayEvents = groupedByDay.get(dayKey) ?? [];
                  if (dayEvents.length === 0) {
                    return null;
                  }
                  return (
                    <li key={dayKey}>
                      <section
                        aria-labelledby={`day-heading-${dayKey}`}
                        className="space-y-3"
                      >
                        <h2
                          id={`day-heading-${dayKey}`}
                          className={cn(
                            "text-sm font-semibold tracking-wide sticky top-0 bg-background/95 backdrop-blur-sm py-1 z-10",
                            isToday(day)
                              ? "text-primary"
                              : "text-muted-foreground"
                          )}
                        >
                          {formatDayHeader(day)}
                        </h2>
                        <ul className="space-y-2 list-none p-0 m-0">
                          {dayEvents.map((event) => (
                            <li
                              key={event.id}
                              className="[content-visibility:auto] [contain-intrinsic-size:auto_6rem]"
                            >
                              <EventListItem
                                event={event}
                                onClick={() => handleEventClick(event)}
                              />
                            </li>
                          ))}
                        </ul>
                      </section>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

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
