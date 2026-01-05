"use client";

// 活動紀錄標籤頁組件
// 顯示使用者參加過的活動和已報名的未來活動

import * as React from "react";
import { useMemo, useState } from "react";
import { EventListItem } from "./event-list-item";
import { EventsTabSkeleton } from "./events-tab-skeleton";
import { EventDetailDialog } from "@/components/features/events/event-detail-dialog";
import { EventPosterCard } from "./event-poster-card";
import { DisplayToggle } from "@/components/widget/display-toggle";
import { useProfileEvents } from "@/lib/hooks/use-profile";
import type { EventWithCategory } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Calendar } from "lucide-react";
import Link from "next/link";

export function EventsTab() {
  // 使用 SWR hook 獲取活動資料（自動快取與重新驗證）
  const { data: events = [], isLoading, error: swrError } = useProfileEvents();
  const [selectedEvent, setSelectedEvent] = useState<EventWithCategory | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [displayMode, setDisplayMode] = useState<"list" | "card">("list");

  // 將 SWR 錯誤轉換為字串
  const error = swrError
    ? swrError instanceof Error
      ? swrError.message
      : "載入活動記錄失敗"
    : null;

  // 使用 useMemo 分類過去和未來的活動
  const { pastEvents, upcomingEvents } = useMemo(() => {
    const now = new Date();
    const past: EventWithCategory[] = [];
    const upcoming: EventWithCategory[] = [];

    events.forEach((event) => {
      const endTime = new Date(event.endTime);
      if (endTime < now) {
        past.push(event);
      } else {
        upcoming.push(event);
      }
    });

    // 過去活動依結束時間降序排列（最近的在前）
    past.sort(
      (a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime()
    );

    // 未來活動依開始時間升序排列（最近的在前）
    upcoming.sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    return { pastEvents: past, upcomingEvents: upcoming };
  }, [events]);

  // 處理活動點擊
  const handleEventClick = (event: EventWithCategory) => {
    setSelectedEvent(event);
    setIsDialogOpen(true);
  };

  // 處理對話框關閉
  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setSelectedEvent(null);
    }
  };

  // 載入狀態
  if (isLoading) {
    return <EventsTabSkeleton />;
  }

  // 錯誤狀態
  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">載入失敗</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button
              variant="outline"
              onClick={() => {
                // SWR 會自動重新驗證
                window.location.reload();
              }}
            >
              重試
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 空狀態
  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">尚無活動記錄</h3>
            <p className="text-sm text-muted-foreground mb-6">
              您還沒有報名任何活動
            </p>
            <Button asChild>
              <Link href="/calendar">瀏覽活動</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold">
          報名活動列表
        </h2>
        <DisplayToggle value={displayMode} onValueChange={setDisplayMode} />
      </div>
      {/* 已報名的未來活動 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold mb-1">已報名的未來活動</h2>
            <p className="text-xs md:text-sm text-muted-foreground">
              您已報名但尚未開始的活動
            </p>
          </div>
        </div>
        {upcomingEvents.length > 0 ? (
          displayMode === "list" ? (
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <EventListItem
                  key={event.id}
                  event={event}
                  onClick={() => handleEventClick(event)}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {upcomingEvents.map((event) => (
                <EventPosterCard
                  key={event.id}
                  event={event}
                  onClick={() => handleEventClick(event)}
                />
              ))}
            </div>
          )
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-6 text-muted-foreground">
                <p>目前沒有已報名的未來活動</p>
                <Button asChild variant="link" className="mt-2">
                  <Link href="/calendar">瀏覽活動</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 已參加的活動 */}
      <div className="space-y-4">
        <div className="flex items-center">
          <div>
            <h2 className="text-lg font-semibold mb-1">已參加的活動</h2>
            <p className="text-xs md:text-sm text-muted-foreground">
              您已經參加過的活動記錄
            </p>
          </div>
        </div>
        {pastEvents.length > 0 ? (
          displayMode === "list" ? (
            <div className="space-y-3">
              {pastEvents.map((event) => (
                <EventListItem
                  key={event.id}
                  event={event}
                  onClick={() => handleEventClick(event)}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {pastEvents.map((event) => (
                <EventPosterCard
                  key={event.id}
                  event={event}
                  onClick={() => handleEventClick(event)}
                />
              ))}
            </div>
          )
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-6 text-muted-foreground">
                <p>目前沒有已參加的活動記錄</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 活動詳細彈窗 */}
      {selectedEvent && (
        <EventDetailDialog
          event={selectedEvent}
          open={isDialogOpen}
          onOpenChange={handleDialogClose}
        />
      )}
    </div>
  );
}
