"use client";

// 我的活動標籤頁組件
// 顯示使用者創建的所有活動列表，包含活動日期、狀態等資訊

import * as React from "react";
import { useMemo, useState } from "react";
import { EventListItem } from "./event-list-item";
import { EventPosterCard } from "./event-poster-card";
import { EventDetailDialog } from "@/components/features/events/event-detail-dialog";
import { EventStatusBadge } from "./event-status-badge";
import { DisplayToggle } from "@/components/widget/display-toggle";
import { useMyEvents } from "@/lib/hooks/use-my-events";
import type { EventWithCategory, EventStatus } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Calendar, Plus } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/date-utils";

export function MyEventsTab() {
  // 使用 SWR hook 獲取活動資料
  const {
    data: events = [],
    isLoading,
    error: swrError,
    mutate,
  } = useMyEvents();
  const [selectedEvent, setSelectedEvent] = useState<EventWithCategory | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [displayMode, setDisplayMode] = useState<"list" | "card">("list");
  const [statusFilter, setStatusFilter] = useState<EventStatus | "all">("all");

  // 將 SWR 錯誤轉換為字串
  const error = swrError
    ? swrError instanceof Error
      ? swrError.message
      : "載入活動列表失敗"
    : null;

  // 過濾活動（根據狀態）
  const filteredEvents = useMemo(() => {
    if (statusFilter === "all") {
      return events;
    }
    return events.filter((event) => event.status === statusFilter);
  }, [events, statusFilter]);

  // 使用 useMemo 分類過去和未來的活動
  const { pastEvents, upcomingEvents } = useMemo(() => {
    const now = new Date();
    const past: EventWithCategory[] = [];
    const upcoming: EventWithCategory[] = [];

    filteredEvents.forEach((event) => {
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
  }, [filteredEvents]);

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
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">載入中...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
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
                mutate();
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
              您還沒有創建任何活動
            </p>
            <Button asChild>
              <Link href="/event/create">
                <Plus className="h-4 w-4 mr-2" />
                創建活動
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold">
          我的活動
        </h2>
        <div className="flex items-center gap-3">
          {/* 狀態過濾器 */}
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as EventStatus | "all")
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="篩選狀態" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部狀態</SelectItem>
              <SelectItem value="draft">草稿</SelectItem>
              <SelectItem value="pending">待審核</SelectItem>
              <SelectItem value="published">已發布</SelectItem>
              <SelectItem value="rejected">已拒絕</SelectItem>
              <SelectItem value="archived">已歸檔</SelectItem>
            </SelectContent>
          </Select>
          <DisplayToggle value={displayMode} onValueChange={setDisplayMode} />
        </div>
      </div>

      {/* 已報名的未來活動 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold mb-1">未來的活動</h2>
            <p className="text-xs md:text-sm text-muted-foreground">
              您創建但尚未開始的活動
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/events/create">
              <Plus className="h-4 w-4 mr-2" />
              創建活動
            </Link>
          </Button>
        </div>
        {upcomingEvents.length > 0 ? (
          displayMode === "list" ? (
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="relative">
                  <EventListItem
                    event={event}
                    onClick={() => handleEventClick(event)}
                  />
                  <div className="absolute top-3 right-3">
                    <EventStatusBadge status={event.status || "pending"} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="relative">
                  <EventPosterCard
                    event={event}
                    onClick={() => handleEventClick(event)}
                  />
                  <div className="absolute top-2 right-2">
                    <EventStatusBadge status={event.status || "pending"} />
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-6 text-muted-foreground">
                <p>目前沒有未來的活動</p>
                <Button asChild variant="link" className="mt-2">
                  <Link href="/events/create">創建活動</Link>
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
            <h2 className="text-lg font-semibold mb-1">過去的活動</h2>
            <p className="text-xs md:text-sm text-muted-foreground">
              您已經創建過的活動記錄
            </p>
          </div>
        </div>
        {pastEvents.length > 0 ? (
          displayMode === "list" ? (
            <div className="space-y-3">
              {pastEvents.map((event) => (
                <div key={event.id} className="relative">
                  <EventListItem
                    event={event}
                    onClick={() => handleEventClick(event)}
                  />
                  <div className="absolute top-3 right-3">
                    <EventStatusBadge status={event.status || "pending"} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {pastEvents.map((event) => (
                <div key={event.id} className="relative">
                  <EventPosterCard
                    event={event}
                    onClick={() => handleEventClick(event)}
                  />
                  <div className="absolute top-2 right-2">
                    <EventStatusBadge status={event.status || "pending"} />
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-6 text-muted-foreground">
                <p>目前沒有過去的活動記錄</p>
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
